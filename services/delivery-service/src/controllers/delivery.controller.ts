import { Request, Response } from 'express'
import prisma from '../prisma'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'
import { Server } from 'socket.io'

const NOTIF_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3007/api/notifications/send'
const SMS_URL = process.env.SMS_SERVICE_URL || 'http://sms-service:3012/sms/send'

const COURIER_RULE_DEFAULTS = {
  baseFee: 1.5,
  variableRate: 0.12,
  platformCommissionRate: 0.02,
  minWithdrawalAmount: 10,
}

type CourierRules = typeof COURIER_RULE_DEFAULTS

const safeJsonParse = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const getCourierRulesFromAdminConfig = async (): Promise<CourierRules> => {
  const configRows = await prisma.notification.findMany({
    where: {
      type: 'ADMIN_CONFIG',
      title: {
        in: [
          'courierBaseFee',
          'courierVariableRate',
          'courierPlatformCommissionRate',
          'courierMinWithdrawalAmount',
        ],
      },
    },
    orderBy: { sentAt: 'desc' },
    take: 100,
  })

  const latestByKey = new Map<string, number>()
  for (const row of configRows) {
    if (latestByKey.has(row.title)) continue
    const parsed = safeJsonParse<{ value?: unknown }>(row.message, {})
    const raw = Number(parsed.value)
    if (!Number.isNaN(raw)) {
      latestByKey.set(row.title, raw)
    }
  }

  return {
    baseFee: latestByKey.get('courierBaseFee') ?? COURIER_RULE_DEFAULTS.baseFee,
    variableRate: latestByKey.get('courierVariableRate') ?? COURIER_RULE_DEFAULTS.variableRate,
    platformCommissionRate:
      latestByKey.get('courierPlatformCommissionRate') ?? COURIER_RULE_DEFAULTS.platformCommissionRate,
    minWithdrawalAmount:
      latestByKey.get('courierMinWithdrawalAmount') ?? COURIER_RULE_DEFAULTS.minWithdrawalAmount,
  }
}

async function sendNotification(payload: {
  userId: string
  type?: string
  title: string
  message: string
  email?: string
}) {
  try {
    if (!payload.userId) return
    const body = {
      ...payload,
      type: payload.type || 'SYSTEM',
    }
    await fetch(NOTIF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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

export const getAvailableDeliveries = async (req: Request, res: Response) => {
  try {
    const deliveries = await prisma.delivery.findMany({
      where: {
        status: 'WAITING',
        livreurId: null,
      },
      include: {
        order: {
          include: {
            restaurant: true,
            client: { include: { user: true } },
          },
        },
      },
    })

    res.json(deliveries)
  } catch (error) {
    console.error('Get available deliveries error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getDeliveriesByLivreur = async (req: Request, res: Response) => {
  try {
    const { livreurId } = req.params
    const { status } = req.query

    const where: any = { livreurId }
    if (status) where.status = status

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            restaurant: true,
            client: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(deliveries)
  } catch (error) {
    console.error('Get deliveries by livreur error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getMyDeliveries = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    const livreur = await prisma.livreur.findUnique({ where: { userId: req.user.userId } })
    if (!livreur) return res.status(400).json({ error: 'Livreur profile not found' })
    if (!livreur.isApproved) return res.status(403).json({ error: 'Compte livreur non validé par admin' })

    const deliveries = await prisma.delivery.findMany({
      where: { livreurId: livreur.id },
      include: {
        order: {
          include: {
            restaurant: true,
            client: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(deliveries)
  } catch (error) {
    console.error('Get my deliveries error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const acceptDelivery = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

    const livreur = await prisma.livreur.findUnique({ where: { userId: req.user.userId } })
    if (!livreur) return res.status(400).json({ error: 'Livreur profile not found' })
    if (!livreur.isApproved) return res.status(403).json({ error: 'Compte livreur non validé par admin' })

    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        livreurId: livreur.id,
        status: 'ACCEPTED',
      },
      include: { order: true },
    })

    await prisma.order.update({
      where: { id: delivery.orderId },
      data: { status: 'IN_DELIVERY' },
    })

    const order = await prisma.order.findUnique({
      where: { id: delivery.orderId },
      include: {
        client: { include: { user: true } },
        restaurant: { include: { restaurateur: { include: { user: true } } } },
      },
    })
    if (order) {
      await sendNotification({
        userId: order.client.userId,
        title: 'Votre commande est en livraison',
        message: `Commande ${order.id.slice(0, 8)} prise par un livreur`,
        email: order.client.user.email,
      })
      await sendSMS(order.client.user.phone, 'Votre commande est en livraison.')
    }

    const io = req.app.get('io') as Server | undefined
    io?.emit('delivery:update', { deliveryId: delivery.id, status: 'ACCEPTED' })
    io?.emit('order:update', { orderId: delivery.orderId, status: 'IN_DELIVERY' })

    res.json(delivery)
  } catch (error) {
    console.error('Accept delivery error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateDeliveryStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

    const livreur = await prisma.livreur.findUnique({ where: { userId: req.user.userId } })
    if (!livreur) return res.status(400).json({ error: 'Livreur profile not found' })
    if (!livreur.isApproved) return res.status(403).json({ error: 'Compte livreur non validé par admin' })

    const updateData: any = { status }
    if (status === 'DELIVERED') {
      updateData.completedAt = new Date()
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
      include: { order: true },
    })

    if (status === 'DELIVERED') {
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'DELIVERED' },
      })

      const full = await prisma.order.findUnique({
        where: { id: delivery.orderId },
        include: {
          client: { include: { user: true } },
          restaurant: { include: { restaurateur: { include: { user: true } } } },
        },
      })
      if (full) {
        await sendNotification({
          userId: full.client.userId,
          title: 'Commande livrée',
          message: `Commande ${full.id.slice(0, 8)} livrée.`,
          email: full.client.user.email,
        })
        await sendSMS(full.client.user.phone, 'Commande livrée. Bon appétit !')
        await sendNotification({
          userId: full.restaurant.restaurateur.userId,
          title: 'Commande livrée',
          message: `Commande ${full.id.slice(0, 8)} livrée au client.`,
          email: full.restaurant.restaurateur.user?.email,
        })
      }
    }

    const io = req.app.get('io') as Server | undefined
    io?.emit('delivery:update', { deliveryId: delivery.id, status })
    io?.emit('order:update', { orderId: delivery.orderId, status: status === 'DELIVERED' ? 'DELIVERED' : 'IN_DELIVERY' })

    res.json(delivery)
  } catch (error) {
    console.error('Update delivery status error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getDeliveryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            restaurant: true,
            client: { include: { user: true } },
            orderItems: { include: { menuItem: true } },
          },
        },
        livreur: { include: { user: true } },
      },
    })

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' })
    }

    res.json(delivery)
  } catch (error) {
    console.error('Get delivery error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getMyCourierMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

    const livreur = await prisma.livreur.findUnique({ where: { userId: req.user.userId } })
    if (!livreur) return res.status(400).json({ error: 'Livreur profile not found' })
    if (!livreur.isApproved) return res.status(403).json({ error: 'Compte livreur non validé par admin' })

    const deliveries = await prisma.delivery.findMany({
      where: { livreurId: livreur.id },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    })

    const delivered = deliveries.filter((d) => d.status === 'DELIVERED')
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const rules = await getCourierRulesFromAdminConfig()
    const baseFee = Number(rules.baseFee)
    const variableRate = Number(rules.variableRate)
    const platformCommissionRate = Number(rules.platformCommissionRate)

    const incomeFor = (delivery: (typeof delivered)[number]) => {
      const amount = delivery.order?.totalAmount || 0
      const gross = baseFee + amount * variableRate
      const platformCommission = gross * platformCommissionRate
      const net = Math.max(0, gross - platformCommission)
      return { amount, gross, platformCommission, net }
    }

    const deliveredToday = delivered.filter((d) => d.updatedAt.toDateString() === now.toDateString())
    const deliveredWeek = delivered.filter((d) => d.updatedAt >= weekStart)

    const sumNet = (list: typeof delivered) => list.reduce((sum, d) => sum + incomeFor(d).net, 0)
    const todayEarnings = sumNet(deliveredToday)
    const weekEarnings = sumNet(deliveredWeek)
    const totalEarnings = sumNet(delivered)

    const withdrawRows = await prisma.notification.findMany({
      where: {
        type: 'COURIER_WITHDRAW_REQUEST',
        userId: req.user.userId,
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    })
    const withdrawRequests = withdrawRows.map((row) => ({
      id: row.id,
      title: row.title,
      sentAt: row.sentAt,
      ...safeJsonParse<{
        amount?: number
        status?: string
        method?: string
        accountRef?: string
        notes?: string
      }>(row.message, {}),
    }))
    const pendingWithdrawAmount = withdrawRequests
      .filter((r) => (r.status || 'PENDING') === 'PENDING')
      .reduce((sum, r) => sum + Number(r.amount || 0), 0)
    const paidWithdrawAmount = withdrawRequests
      .filter((r) => (r.status || '') === 'PAID')
      .reduce((sum, r) => sum + Number(r.amount || 0), 0)
    const availableBalance = Math.max(0, totalEarnings - pendingWithdrawAmount - paidWithdrawAmount)

    const totalOffers = deliveries.length
    const acceptedDeliveries = deliveries.filter((d) => d.status !== 'WAITING').length
    const cancelledDeliveries = deliveries.filter((d) => d.status === 'WAITING').length
    const averageWaitMinutes =
      deliveries.length === 0
        ? 0
        : Math.round(
            deliveries.reduce((sum, d) => sum + (d.estimatedTime || 15), 0) /
              deliveries.length
          )

    const lastPayouts = delivered.slice(0, 10).map((d) => {
      const details = incomeFor(d)
      return {
        deliveryId: d.id,
        orderId: d.orderId,
        deliveredAt: d.completedAt || d.updatedAt,
        orderTotal: details.amount,
        gross: Number(details.gross.toFixed(2)),
        platformCommission: Number(details.platformCommission.toFixed(2)),
        net: Number(details.net.toFixed(2)),
      }
    })

    return res.json({
      earnings: {
        today: Number(todayEarnings.toFixed(2)),
        week: Number(weekEarnings.toFixed(2)),
        total: Number(totalEarnings.toFixed(2)),
        availableBalance: Number(availableBalance.toFixed(2)),
        pendingWithdrawAmount: Number(pendingWithdrawAmount.toFixed(2)),
        paidWithdrawAmount: Number(paidWithdrawAmount.toFixed(2)),
        formula: {
          baseFee,
          variableRate,
          platformCommissionRate,
          minWithdrawalAmount: Number(rules.minWithdrawalAmount),
        },
      },
      stats: {
        deliveriesCount: delivered.length,
        acceptanceRate: totalOffers === 0 ? 100 : Math.round((acceptedDeliveries / totalOffers) * 100),
        cancellationRate: totalOffers === 0 ? 0 : Math.round((cancelledDeliveries / totalOffers) * 100),
        averageWaitMinutes,
      },
      payouts: lastPayouts,
      withdrawRequests: withdrawRequests.map((r) => ({
        id: r.id,
        title: r.title,
        sentAt: r.sentAt,
        amount: Number(r.amount || 0),
        status: r.status || 'PENDING',
        method: r.method || 'BANK_TRANSFER',
        accountRef: r.accountRef || '',
        notes: r.notes || '',
      })),
    })
  } catch (error) {
    console.error('Get courier metrics error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const reportDeliveryIssue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    const { type, message, deliveryId } = req.body as {
      type?: string
      message?: string
      deliveryId?: string
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true },
    })

    await Promise.all(
      admins.map((admin) =>
        sendNotification({
          userId: admin.id,
          type: 'SUPPORT',
          title: `Signalement livreur${type ? ` - ${type}` : ''}`,
          message: `Livreur ${req.user?.userId}${deliveryId ? ` | delivery ${deliveryId}` : ''}: ${message}`,
          email: admin.email,
        })
      )
    )

    return res.status(201).json({
      success: true,
      notifiedAdmins: admins.length,
    })
  } catch (error) {
    console.error('Report delivery issue error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const createWithdrawRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

    const livreur = await prisma.livreur.findUnique({ where: { userId: req.user.userId } })
    if (!livreur) return res.status(400).json({ error: 'Livreur profile not found' })
    if (!livreur.isApproved) return res.status(403).json({ error: 'Compte livreur non valide par admin' })

    const { amount, method, accountRef } = req.body || {}
    const requestedAmount = Number(amount)
    if (Number.isNaN(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' })
    }

    const rules = await getCourierRulesFromAdminConfig()
    if (requestedAmount < rules.minWithdrawalAmount) {
      return res
        .status(400)
        .json({ error: `Minimum withdrawal amount is ${Number(rules.minWithdrawalAmount).toFixed(2)} EUR` })
    }

    const deliveries = await prisma.delivery.findMany({
      where: { livreurId: livreur.id, status: 'DELIVERED' },
      include: { order: true },
    })

    const totalNet = deliveries.reduce((sum, delivery) => {
      const orderTotal = delivery.order?.totalAmount || 0
      const gross = Number(rules.baseFee) + orderTotal * Number(rules.variableRate)
      const commission = gross * Number(rules.platformCommissionRate)
      return sum + Math.max(0, gross - commission)
    }, 0)

    const existing = await prisma.notification.findMany({
      where: {
        type: 'COURIER_WITHDRAW_REQUEST',
        userId: req.user.userId,
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    })
    const parsed = existing.map((row) =>
      safeJsonParse<{ amount?: number; status?: string }>(row.message, {})
    )
    const pendingAmount = parsed
      .filter((item) => (item.status || 'PENDING') === 'PENDING')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const paidAmount = parsed
      .filter((item) => (item.status || '') === 'PAID')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const availableBalance = Math.max(0, totalNet - pendingAmount - paidAmount)

    if (requestedAmount > availableBalance) {
      return res.status(400).json({ error: 'Requested amount exceeds available balance' })
    }

    const request = await prisma.notification.create({
      data: {
        userId: req.user.userId,
        type: 'COURIER_WITHDRAW_REQUEST',
        title: 'Demande de retrait',
        message: JSON.stringify({
          amount: Number(requestedAmount.toFixed(2)),
          status: 'PENDING',
          method: method || 'BANK_TRANSFER',
          accountRef: accountRef || '',
          requestedAt: new Date().toISOString(),
        }),
      },
    })

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true },
    })
    await Promise.all(
      admins.map((admin) =>
        sendNotification({
          userId: admin.id,
          type: 'SYSTEM',
          title: 'Nouvelle demande de retrait livreur',
          message: `Livreur ${req.user?.userId} a demande ${requestedAmount.toFixed(2)} EUR.`,
          email: admin.email,
        })
      )
    )

    return res.status(201).json(request)
  } catch (error) {
    console.error('Create withdraw request error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const getWithdrawRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    const statusFilter = typeof req.query.status === 'string' ? req.query.status : undefined

    const where: any = { type: 'COURIER_WITHDRAW_REQUEST' }
    if (req.user.role === 'LIVREUR') {
      where.userId = req.user.userId
    }
    const rows = await prisma.notification.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: 300,
    })
    const mapped = rows
      .map((row) => ({
        id: row.id,
        userId: row.userId,
        title: row.title,
        sentAt: row.sentAt,
        ...safeJsonParse<{
          amount?: number
          status?: string
          method?: string
          accountRef?: string
          notes?: string
          reviewedAt?: string
        }>(row.message, {}),
      }))
      .filter((item) => (statusFilter ? (item.status || 'PENDING') === statusFilter : true))
    return res.json(mapped)
  } catch (error) {
    console.error('Get withdraw requests error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateWithdrawRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    const { id } = req.params
    const { status, notes } = req.body || {}
    const allowed = ['PENDING', 'APPROVED', 'REJECTED', 'PAID']
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const current = await prisma.notification.findUnique({ where: { id } })
    if (!current || current.type !== 'COURIER_WITHDRAW_REQUEST') {
      return res.status(404).json({ error: 'Withdraw request not found' })
    }
    const payload = safeJsonParse<Record<string, unknown>>(current.message, {})
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: status === 'PAID',
        message: JSON.stringify({
          ...payload,
          status,
          notes: notes || payload.notes || '',
          reviewedBy: req.user.userId,
          reviewedAt: new Date().toISOString(),
        }),
      },
    })

    await sendNotification({
      userId: current.userId,
      type: 'SYSTEM',
      title: 'Mise a jour de votre retrait',
      message: `Votre demande de retrait est maintenant: ${status}.`,
    })

    return res.json(updated)
  } catch (error) {
    console.error('Update withdraw request error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
