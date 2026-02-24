import { Request, Response } from 'express'
import prisma from '../prisma'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'
import { Server } from 'socket.io'

const NOTIF_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3007/api/notifications/send'
const SMS_URL = process.env.SMS_SERVICE_URL || 'http://sms-service:3012/sms/send'

async function sendNotification(payload: {
  userId: string
  title: string
  message: string
  email?: string
}) {
  try {
    await fetch(NOTIF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.error('Notification error', e)
  }
}

async function sendSMS(to: string | undefined, message: string) {
  if (!to) return
  try {
    await fetch(SMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message }),
    })
  } catch (e) {
    console.error('SMS error', e)
  }
}

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      restaurantId,
      items,
      deliveryAddress,
      deliveryCity,
      deliveryPostalCode,
      notes,
    } = req.body

    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

    // clientId from token
    const client = await prisma.client.findUnique({ where: { userId: req.user.userId } })
    if (!client) return res.status(400).json({ error: 'Client profile not found' })

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map((item: any) => item.menuItemId) } },
    })
    const menuItemsById = new Map(menuItems.map((menuItem) => [menuItem.id, menuItem]))

    let totalAmount = 0
    const normalizedItems = items.map((item: any) => {
      const menuItem = menuItemsById.get(item.menuItemId)
      if (!menuItem) {
        throw new Error(`Menu item not found: ${item.menuItemId}`)
      }

      const price = menuItem.price
      totalAmount += price * item.quantity

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price,
      }
    })

    const order = await prisma.order.create({
      data: {
        clientId: client.id,
        restaurantId,
        totalAmount,
        deliveryAddress,
        deliveryCity,
        deliveryPostalCode,
        notes,
        status: 'PENDING',
        orderItems: {
          create: normalizedItems,
        },
      },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        restaurant: true,
      },
    })

    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: totalAmount,
        status: 'PENDING',
        paymentMethod: 'CARD',
      },
    })

    await prisma.delivery.create({
      data: {
        orderId: order.id,
        status: 'WAITING',
        pickupAddress: `${order.restaurant.address}, ${order.restaurant.city}`,
        deliveryAddress: `${deliveryAddress}, ${deliveryCity}`,
      },
    })

    // notify client and restaurateur
    const clientUser = await prisma.user.findUnique({ where: { id: req.user.userId } })
    const resto = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { restaurateur: { include: { user: true } } },
    })
    await sendNotification({
      userId: req.user.userId,
      title: 'Commande passée',
      message: `Votre commande ${order.id.slice(0, 8)} est en attente de confirmation.`,
      email: clientUser?.email,
    })
    await sendNotification({
      userId: resto?.restaurateur.userId || '',
      title: 'Nouvelle commande',
      message: `Nouvelle commande à préparer (${order.id.slice(0, 8)}).`,
      email: resto?.restaurateur.user?.email,
    })
    await sendSMS(clientUser?.phone, 'Commande reçue, en attente de confirmation.')
    await sendSMS(resto?.restaurateur.user?.phone, 'Nouvelle commande à préparer.')

    const io = req.app.get('io') as Server | undefined
    io?.emit('order:update', { orderId: order.id, status: order.status })

    res.status(201).json(order)
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getOrdersByClient = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params

    const orders = await prisma.order.findMany({
      where: { clientId },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        restaurant: true,
        payment: true,
        delivery: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json(orders)
  } catch (error) {
    console.error('Get orders by client error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getOrdersByRestaurant = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params
    const { status } = req.query

    const where: any = { restaurantId }
    if (status) where.status = status

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        client: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        delivery: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json(orders)
  } catch (error) {
    console.error('Get orders by restaurant error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        restaurant: true,
        client: {
          include: {
            user: true,
          },
        },
        payment: true,
        delivery: {
          include: {
            livreur: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    res.json(order)
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        restaurant: true,
        delivery: true,
        client: true,
      },
    })

    // notify client on status change
    const clientProfile = await prisma.client.findUnique({
      where: { id: order.clientId },
      include: { user: true },
    })
    const clientUser = clientProfile?.user
    await sendNotification({
      userId: clientUser?.id || '',
      title: 'Statut commande mis à jour',
      message: `Commande ${order.id.slice(0, 8)} : ${status}`,
      email: clientUser?.email,
    })
    await sendSMS(clientUser?.phone, `Commande ${order.id.slice(0, 8)} : ${status}`)

    const io = req.app.get('io') as Server | undefined
    io?.emit('order:update', { orderId: order.id, status })

    res.json(order)
  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getMyOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    const client = await prisma.client.findUnique({ where: { userId: req.user.userId } })
    if (!client) return res.status(400).json({ error: 'Client profile not found' })

    const orders = await prisma.order.findMany({
      where: { clientId: client.id },
      include: {
        orderItems: { include: { menuItem: true } },
        restaurant: true,
        payment: true,
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(orders)
  } catch (error) {
    console.error('Get my orders error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const cancelOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    const order = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    res.json(order)
  } catch (error) {
    console.error('Cancel order error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

const ADMIN_CONFIG_DEFAULTS = {
  platformName: 'Delices Afro-Caraibe',
  supportEmail: 'support@delices-afro.com',
  supportPhone: '+33 1 23 45 67 89',
  currency: 'EUR',
  defaultCommissionPercent: 22,
  twoFactorRequired: true,
  dailyReportEnabled: true,
  homeLocationLabel: '',
  homeSearchPlaceholder: 'Restaurants, plats, cuisines...',
  homePromoTitle: '',
  homePromoCode: '',
  homeServicesCoursesTitle: 'Courses',
  homeServicesPharmacyTitle: 'Pharmacie',
  homeServicesFlowersTitle: 'Fleurs et cadeaux',
}

const safeJsonParse = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const addAuditLog = async (params: {
  actorUserId: string
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, unknown>
}) => {
  await prisma.notification.create({
    data: {
      userId: params.actorUserId,
      type: 'ADMIN_AUDIT',
      title: params.action,
      message: JSON.stringify({
        entityType: params.entityType,
        entityId: params.entityId || null,
        details: params.details || {},
      }),
    },
  })
}

export const getMyClientSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    const client = await prisma.client.findUnique({ where: { userId: req.user.userId } })
    if (!client) return res.status(400).json({ error: 'Client profile not found' })

    const orders = await prisma.order.findMany({
      where: { clientId: client.id },
      include: {
        restaurant: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalOrders = orders.length
    const inProgress = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length
    const delivered = orders.filter((o) => o.status === 'DELIVERED').length
    const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0)

    const favoriteMap = new Map<string, { restaurantId: string; name: string; count: number }>()
    orders.forEach((order) => {
      if (!order.restaurant) return
      const existing = favoriteMap.get(order.restaurantId)
      if (existing) {
        existing.count += 1
      } else {
        favoriteMap.set(order.restaurantId, {
          restaurantId: order.restaurantId,
          name: order.restaurant.name,
          count: 1,
        })
      }
    })

    const favorites = Array.from(favoriteMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return res.json({
      totalOrders,
      inProgress,
      delivered,
      totalSpent: Number(totalSpent.toFixed(2)),
      favorites,
      latestOrders: orders.slice(0, 10),
    })
  } catch (error) {
    console.error('Get client summary error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getAdminOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date()
    const startToday = new Date(now)
    startToday.setHours(0, 0, 0, 0)
    const startTomorrow = new Date(startToday)
    startTomorrow.setDate(startTomorrow.getDate() + 1)

    const startYesterday = new Date(startToday)
    startYesterday.setDate(startYesterday.getDate() - 1)

    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const [
      ordersToday,
      ordersYesterday,
      activeRestaurants,
      activeLivreurs,
      usersTotal,
      todayOrdersList,
      monthOrders,
      monthPaymentsPending,
      topRestaurantsRaw,
      failedPaymentsToday,
      longPendingOrders,
      longWaitingDeliveries,
      recentUsers,
      newRestaurateursToday,
      newLivreursToday,
      newClientsToday,
      pendingRestaurateurs,
      pendingLivreurs,
    ] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: startToday, lt: startTomorrow } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: startYesterday, lt: startToday } },
      }),
      prisma.restaurant.count({ where: { isActive: true } }),
      prisma.livreur.count({ where: { isAvailable: true } }),
      prisma.user.count(),
      prisma.order.findMany({
        where: { createdAt: { gte: startToday, lt: startTomorrow } },
        select: { createdAt: true, totalAmount: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startMonth, lt: nextMonth } },
        select: { totalAmount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      prisma.order.groupBy({
        by: ['restaurantId'],
        where: {
          createdAt: { gte: startToday, lt: startTomorrow },
        },
        _count: { _all: true },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 5,
      }),
      prisma.payment.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: startToday, lt: startTomorrow },
        },
      }),
      prisma.order.findMany({
        where: {
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
          createdAt: { lt: new Date(now.getTime() - 45 * 60 * 1000) },
        },
        select: { id: true, restaurantId: true, createdAt: true },
        take: 10,
      }),
      prisma.delivery.findMany({
        where: {
          status: 'WAITING',
          createdAt: { lt: new Date(now.getTime() - 60 * 60 * 1000) },
        },
        select: { id: true, orderId: true, createdAt: true },
        take: 10,
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      }),
      prisma.user.count({
        where: { role: 'RESTAURATEUR', createdAt: { gte: startToday, lt: startTomorrow } },
      }),
      prisma.user.count({
        where: { role: 'LIVREUR', createdAt: { gte: startToday, lt: startTomorrow } },
      }),
      prisma.user.count({
        where: { role: 'CLIENT', createdAt: { gte: startToday, lt: startTomorrow } },
      }),
      prisma.restaurateur.count({ where: { isApproved: false } }),
      prisma.livreur.count({ where: { isApproved: false } }),
    ])

    const revenueToday = todayOrdersList.reduce((sum, x) => sum + x.totalAmount, 0)
    const revenueYesterday = await prisma.order.aggregate({
      where: { createdAt: { gte: startYesterday, lt: startToday } },
      _sum: { totalAmount: true },
    })
    const yesterdayTotal = revenueYesterday._sum.totalAmount || 0
    const deltaVsYesterday =
      yesterdayTotal === 0 ? (revenueToday > 0 ? 100 : 0) : ((revenueToday - yesterdayTotal) / yesterdayTotal) * 100

    const monthRevenue = monthOrders.reduce((sum, x) => sum + x.totalAmount, 0)
    const monthGoal = Number(process.env.ADMIN_MONTHLY_GOAL || 500000)
    const progress = monthGoal === 0 ? 0 : (monthRevenue / monthGoal) * 100

    const hourlyMap = new Map<number, { orders: number; revenue: number }>()
    for (let hour = 0; hour < 24; hour += 1) {
      hourlyMap.set(hour, { orders: 0, revenue: 0 })
    }
    todayOrdersList.forEach((order) => {
      const hour = order.createdAt.getHours()
      const existing = hourlyMap.get(hour)
      if (!existing) return
      existing.orders += 1
      existing.revenue += order.totalAmount
    })

    const topRestaurantIds = topRestaurantsRaw.map((x) => x.restaurantId)
    const topRestaurantDetails = await prisma.restaurant.findMany({
      where: { id: { in: topRestaurantIds } },
      include: { reviews: { select: { rating: true } } },
    })

    const topRestaurants = topRestaurantsRaw.map((entry) => {
      const restaurant = topRestaurantDetails.find((r) => r.id === entry.restaurantId)
      const ratings = restaurant?.reviews || []
      const averageRating =
        ratings.length === 0
          ? 0
          : ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      return {
        restaurantId: entry.restaurantId,
        name: restaurant?.name || 'Unknown',
        orders: entry._count._all,
        revenue: Number((entry._sum.totalAmount || 0).toFixed(2)),
        averageRating: Number(averageRating.toFixed(1)),
      }
    })

    return res.json({
      kpis: {
        ordersToday,
        restaurantsActive: activeRestaurants,
        livreursActive: activeLivreurs,
        averageRating: topRestaurants.length
          ? Number(
              (
                topRestaurants.reduce((sum, r) => sum + r.averageRating, 0) /
                topRestaurants.length
              ).toFixed(1)
            )
          : 0,
        revenueToday: Number(revenueToday.toFixed(2)),
        deltaVsYesterdayPercent: Number(deltaVsYesterday.toFixed(1)),
        usersTotal,
      },
      charts: {
        ordersByHour: Array.from(hourlyMap.entries()).map(([hour, values]) => ({
          hour,
          orders: values.orders,
          revenue: Number(values.revenue.toFixed(2)),
        })),
      },
      alerts: [
        ...(longPendingOrders.length > 0
          ? [
              {
                type: 'RESTAURANT_DELAY',
                level: 'warning',
                count: longPendingOrders.length,
                message: `${longPendingOrders.length} commande(s) avec retard potentiel (>45 min).`,
              },
            ]
          : []),
        ...(longWaitingDeliveries.length > 0
          ? [
              {
                type: 'COURIER_INACTIVE',
                level: 'warning',
                count: longWaitingDeliveries.length,
                message: `${longWaitingDeliveries.length} livraison(s) sans livreur depuis >1h.`,
              },
            ]
          : []),
        ...(failedPaymentsToday > 0
          ? [
              {
                type: 'PAYMENT_FAILED',
                level: 'error',
                count: failedPaymentsToday,
                message: `${failedPaymentsToday} paiement(s) echoue(s) aujourd'hui.`,
              },
            ]
          : []),
      ],
      topRestaurants,
      users: {
        recent: recentUsers,
        newClients24h: newClientsToday,
        newRestaurateurs24h: newRestaurateursToday,
        newLivreurs24h: newLivreursToday,
        pendingRestaurateurs,
        pendingLivreurs,
      },
      finance: {
        monthlyRevenue: Number(monthRevenue.toFixed(2)),
        monthlyGoal: monthGoal,
        monthlyProgressPercent: Number(progress.toFixed(1)),
        pendingPaymentsAmount: Number((monthPaymentsPending._sum.amount || 0).toFixed(2)),
        commissionAveragePercent: Number(process.env.ADMIN_AVG_COMMISSION_PERCENT || 22),
      },
    })
  } catch (error) {
    console.error('Get admin overview error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getAdminTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1))
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)))
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const dateFrom = typeof req.query.dateFrom === 'string' ? new Date(req.query.dateFrom) : undefined
    const dateTo = typeof req.query.dateTo === 'string' ? new Date(req.query.dateTo) : undefined

    const where: any = {}
    if (status) where.status = status
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom && !Number.isNaN(dateFrom.getTime())) where.createdAt.gte = dateFrom
      if (dateTo && !Number.isNaN(dateTo.getTime())) where.createdAt.lte = dateTo
    }

    const [total, payments, aggregate] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: {
          order: {
            include: {
              restaurant: { select: { id: true, name: true, city: true } },
              client: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } },
              delivery: {
                include: {
                  livreur: {
                    include: {
                      user: { select: { id: true, firstName: true, lastName: true, phone: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.payment.aggregate({
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ])

    const byStatus = await prisma.payment.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
      _sum: { amount: true },
    })

    return res.json({
      page,
      pageSize,
      total,
      totals: {
        transactions: aggregate._count._all,
        amount: Number((aggregate._sum.amount || 0).toFixed(2)),
      },
      byStatus: byStatus.map((entry) => ({
        status: entry.status,
        count: entry._count._all,
        amount: Number((entry._sum.amount || 0).toFixed(2)),
      })),
      data: payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        order: payment.order
          ? {
              id: payment.order.id,
              status: payment.order.status,
              totalAmount: payment.order.totalAmount,
              restaurant: payment.order.restaurant,
              client: payment.order.client?.user
                ? {
                    id: payment.order.client.user.id,
                    firstName: payment.order.client.user.firstName,
                    lastName: payment.order.client.user.lastName,
                    email: payment.order.client.user.email,
                    phone: payment.order.client.user.phone,
                  }
                : null,
              delivery: payment.order.delivery
                ? {
                    id: payment.order.delivery.id,
                    status: payment.order.delivery.status,
                    livreur: payment.order.delivery.livreur?.user
                      ? {
                          id: payment.order.delivery.livreur.user.id,
                          firstName: payment.order.delivery.livreur.user.firstName,
                          lastName: payment.order.delivery.livreur.user.lastName,
                          phone: payment.order.delivery.livreur.user.phone,
                        }
                      : null,
                  }
                : null,
            }
          : null,
      })),
    })
  } catch (error) {
    console.error('Get admin transactions error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const getAdminConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const entries = await prisma.notification.findMany({
      where: { type: 'ADMIN_CONFIG' },
      orderBy: { sentAt: 'desc' },
      take: 100,
    })

    const latestByKey = new Map<string, any>()
    for (const entry of entries) {
      if (latestByKey.has(entry.title)) continue
      latestByKey.set(entry.title, safeJsonParse<{ value: unknown }>(entry.message, { value: null }).value)
    }

    return res.json({
      ...ADMIN_CONFIG_DEFAULTS,
      ...Object.fromEntries(latestByKey.entries()),
    })
  } catch (error) {
    console.error('Get admin config error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateAdminConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

    const payload = req.body?.config || req.body || {}
    const allowedKeys = Object.keys(ADMIN_CONFIG_DEFAULTS)
    const updates = Object.entries(payload).filter(([key]) => allowedKeys.includes(key))

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid config keys provided' })
    }

    await Promise.all(
      updates.map(([key, value]) =>
        prisma.notification.create({
          data: {
            userId: req.user!.userId,
            type: 'ADMIN_CONFIG',
            title: key,
            message: JSON.stringify({ value }),
          },
        })
      )
    )

    await addAuditLog({
      actorUserId: req.user.userId,
      action: 'ADMIN_CONFIG_UPDATED',
      entityType: 'ADMIN_CONFIG',
      details: Object.fromEntries(updates),
    })

    return res.json({
      success: true,
      updatedKeys: updates.map(([key]) => key),
    })
  } catch (error) {
    console.error('Update admin config error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const createSupportTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    const { subject, message, category, priority, relatedUserId } = req.body || {}

    if (!subject || !message) {
      return res.status(400).json({ error: 'subject and message are required' })
    }

    const ticket = await prisma.notification.create({
      data: {
        userId: req.user.userId,
        type: 'SUPPORT_TICKET',
        title: subject,
        message: JSON.stringify({
          message,
          category: category || 'GENERAL',
          priority: priority || 'MEDIUM',
          status: 'OPEN',
          relatedUserId: relatedUserId || null,
          createdByRole: req.user.role,
          createdByUserId: req.user.userId,
        }),
      },
    })

    await addAuditLog({
      actorUserId: req.user.userId,
      action: 'SUPPORT_TICKET_CREATED',
      entityType: 'SUPPORT_TICKET',
      entityId: ticket.id,
      details: { subject, category: category || 'GENERAL', priority: priority || 'MEDIUM' },
    })

    return res.status(201).json(ticket)
  } catch (error) {
    console.error('Create support ticket error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const getSupportTickets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const priority = typeof req.query.priority === 'string' ? req.query.priority : undefined

    const raw = await prisma.notification.findMany({
      where: { type: 'SUPPORT_TICKET' },
      orderBy: { sentAt: 'desc' },
      take: 200,
    })

    const mapped = raw
      .map((ticket) => ({
        id: ticket.id,
        title: ticket.title,
        sentAt: ticket.sentAt,
        isRead: ticket.isRead,
        userId: ticket.userId,
        ...safeJsonParse<Record<string, unknown>>(ticket.message, {}),
      }))
      .filter((ticket) => {
        if (status && ticket.status !== status) return false
        if (priority && ticket.priority !== priority) return false
        return true
      })

    return res.json(mapped)
  } catch (error) {
    console.error('Get support tickets error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateSupportTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    const { id } = req.params
    const { status, resolution, assignedTo } = req.body || {}

    const current = await prisma.notification.findUnique({
      where: { id },
    })
    if (!current || current.type !== 'SUPPORT_TICKET') {
      return res.status(404).json({ error: 'Support ticket not found' })
    }

    const currentPayload = safeJsonParse<Record<string, unknown>>(current.message, {})
    const nextPayload = {
      ...currentPayload,
      status: status || currentPayload.status || 'OPEN',
      resolution: resolution || currentPayload.resolution || null,
      assignedTo: assignedTo || currentPayload.assignedTo || null,
      updatedBy: req.user.userId,
      updatedAt: new Date().toISOString(),
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        message: JSON.stringify(nextPayload),
        isRead: status === 'CLOSED' ? true : current.isRead,
      },
    })

    await addAuditLog({
      actorUserId: req.user.userId,
      action: 'SUPPORT_TICKET_UPDATED',
      entityType: 'SUPPORT_TICKET',
      entityId: id,
      details: { status, assignedTo },
    })

    return res.json(updated)
  } catch (error) {
    console.error('Update support ticket error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const createAuditLog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    const { action, entityType, entityId, details } = req.body || {}
    if (!action || !entityType) {
      return res.status(400).json({ error: 'action and entityType are required' })
    }

    await addAuditLog({
      actorUserId: req.user.userId,
      action,
      entityType,
      entityId,
      details: details || {},
    })

    return res.status(201).json({ success: true })
  } catch (error) {
    console.error('Create audit log error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const action = typeof req.query.action === 'string' ? req.query.action : undefined
    const actorUserId = typeof req.query.actorUserId === 'string' ? req.query.actorUserId : undefined

    const logs = await prisma.notification.findMany({
      where: {
        type: 'ADMIN_AUDIT',
        ...(action ? { title: action } : {}),
        ...(actorUserId ? { userId: actorUserId } : {}),
      },
      orderBy: { sentAt: 'desc' },
      take: 300,
    })

    return res.json(
      logs.map((log) => ({
        id: log.id,
        actorUserId: log.userId,
        action: log.title,
        sentAt: log.sentAt,
        ...safeJsonParse<Record<string, unknown>>(log.message, {}),
      }))
    )
  } catch (error) {
    console.error('Get audit logs error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
