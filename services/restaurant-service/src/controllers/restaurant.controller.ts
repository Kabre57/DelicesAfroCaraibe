import { Request, Response } from 'express'
import prisma from '../prisma'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'

export const getAllRestaurants = async (req: Request, res: Response) => {
  try {
    const { city, cuisineType, isActive } = req.query

    const where: any = {}
    if (city) where.city = city
    if (cuisineType) where.cuisineType = cuisineType
    if (isActive !== undefined) where.isActive = isActive === 'true'

    const restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        restaurateur: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    res.json(restaurants)
  } catch (error) {
    console.error('Get restaurants error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getRestaurantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        menuItems: true,
        restaurateur: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' })
    }

    res.json(restaurant)
  } catch (error) {
    console.error('Get restaurant error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const createRestaurant = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      description,
      address,
      city,
      postalCode,
      phone,
      cuisineType,
      openingHours,
      imageUrl,
    } = req.body

    // Restaurateur from JWT
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    const restaurateur = await prisma.restaurateur.findUnique({
      where: { userId: req.user.userId },
    })
    if (!restaurateur) {
      return res.status(403).json({ error: 'Only restaurateurs can create restaurants' })
    }
    if (!restaurateur.isApproved) {
      return res.status(403).json({ error: 'Compte restaurateur en attente de validation admin' })
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        restaurateurId: restaurateur.id,
        name,
        description,
        address,
        city,
        postalCode,
        phone,
        cuisineType,
        openingHours,
        imageUrl,
      },
    })

    res.status(201).json(restaurant)
  } catch (error) {
    console.error('Create restaurant error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateRestaurant = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // If not admin, ensure ownership
    if (req.user?.role !== 'ADMIN') {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id },
        include: { restaurateur: true },
      })
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' })
      const restaurateur = await prisma.restaurateur.findUnique({
        where: { id: restaurant.restaurateurId },
      })
      if (!restaurateur || restaurateur.userId !== req.user?.userId) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
    })

    res.json(restaurant)
  } catch (error) {
    console.error('Update restaurant error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteRestaurant = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    if (req.user?.role !== 'ADMIN') {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id },
        include: { restaurateur: true },
      })
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' })
      const restaurateur = await prisma.restaurateur.findUnique({
        where: { id: restaurant.restaurateurId },
      })
      if (!restaurateur || restaurateur.userId !== req.user?.userId) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    }

    await prisma.restaurant.delete({
      where: { id },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete restaurant error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getDiscoveryHome = async (req: Request, res: Response) => {
  try {
    const city = typeof req.query.city === 'string' ? req.query.city : undefined
    const limit = Number(req.query.limit || 6)

    const restaurantWhere: any = { isActive: true }
    if (city) restaurantWhere.city = city

    const categoriesRaw = await prisma.restaurant.groupBy({
      by: ['cuisineType'],
      where: restaurantWhere,
      _count: { id: true },
      orderBy: { _count: { cuisineType: 'desc' } },
      take: 12,
    })
    const categoryNames = categoriesRaw.map((x) => x.cuisineType)
    const configuredCategories = await prisma.category.findMany({
      where: { name: { in: categoryNames } },
      select: {
        name: true,
        imageUrl: true,
        isActive: true,
      },
    })
    const configuredCategoryMap = new Map(
      configuredCategories.map((c) => [c.name, c])
    )
    const categoryImageRows = await prisma.restaurant.findMany({
      where: {
        ...restaurantWhere,
        cuisineType: { in: categoryNames },
        imageUrl: { not: null },
      },
      select: {
        cuisineType: true,
        imageUrl: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    const categoryImageByCuisine = new Map<string, string>()
    for (const row of categoryImageRows) {
      if (!row.imageUrl) continue
      if (!categoryImageByCuisine.has(row.cuisineType)) {
        categoryImageByCuisine.set(row.cuisineType, row.imageUrl)
      }
    }

    const popularByOrders = await prisma.order.groupBy({
      by: ['restaurantId'],
      _count: { restaurantId: true },
      _sum: { totalAmount: true },
      orderBy: { _count: { restaurantId: 'desc' } },
      take: Math.max(limit * 2, 10),
    })

    const popularIds = popularByOrders.map((x) => x.restaurantId)
    const popularRestaurants = await prisma.restaurant.findMany({
      where: { id: { in: popularIds }, ...(city ? { city } : {}) },
      include: {
        reviews: { select: { rating: true } },
      },
    })
    const popularMinPrices = await prisma.menuItem.groupBy({
      by: ['restaurantId'],
      where: { restaurantId: { in: popularIds } },
      _min: { price: true },
    })

    const popular = popularByOrders
      .map((entry) => {
        const restaurant = popularRestaurants.find((r) => r.id === entry.restaurantId)
        if (!restaurant) return null
        const reviewCount = restaurant.reviews.length
        const avgRating =
          reviewCount === 0
            ? 0
            : restaurant.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
        const minPrice =
          popularMinPrices.find((x) => x.restaurantId === restaurant.id)?._min.price ?? null
        return {
          id: restaurant.id,
          name: restaurant.name,
          city: restaurant.city,
          cuisineType: restaurant.cuisineType,
          imageUrl: restaurant.imageUrl,
          orderCount: entry._count.restaurantId,
          averageRating: Number(avgRating.toFixed(1)),
          reviewCount,
          startingPrice: minPrice === null ? null : Number(minPrice.toFixed(2)),
        }
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .slice(0, limit)

    const popularDishRows = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      _count: { menuItemId: true },
      orderBy: { _count: { menuItemId: 'desc' } },
      take: Math.max(limit * 2, 12),
    })
    const popularDishIds = popularDishRows.map((x) => x.menuItemId)
    const popularDishItems = await prisma.menuItem.findMany({
      where: {
        id: { in: popularDishIds },
        isAvailable: true,
        ...(city ? { restaurant: { city, isActive: true } } : { restaurant: { isActive: true } }),
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    })
    let popularDishes = popularDishRows
      .map((row) => {
        const dish = popularDishItems.find((m) => m.id === row.menuItemId)
        if (!dish) return null
        return {
          id: dish.id,
          name: dish.name,
          category: dish.category,
          imageUrl: dish.imageUrl,
          price: Number(dish.price.toFixed(2)),
          orderCount: row._count.menuItemId,
          restaurant: dish.restaurant,
        }
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .slice(0, limit)

    if (popularDishes.length < limit) {
      const fallback = await prisma.menuItem.findMany({
        where: {
          isAvailable: true,
          ...(city ? { restaurant: { city, isActive: true } } : { restaurant: { isActive: true } }),
        },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      const existing = new Set(popularDishes.map((d) => d.id))
      for (const dish of fallback) {
        if (existing.has(dish.id)) continue
        popularDishes.push({
          id: dish.id,
          name: dish.name,
          category: dish.category,
          imageUrl: dish.imageUrl,
          price: Number(dish.price.toFixed(2)),
          orderCount: 0,
          restaurant: dish.restaurant,
        })
        if (popularDishes.length >= limit) break
      }
    }

    const newestRestaurants = await prisma.restaurant.findMany({
      where: restaurantWhere,
      include: {
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const newcomers = newestRestaurants.map((restaurant) => {
      const reviewCount = restaurant.reviews.length
      const avgRating =
        reviewCount === 0
          ? 0
          : restaurant.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
      return {
        id: restaurant.id,
        name: restaurant.name,
        city: restaurant.city,
        cuisineType: restaurant.cuisineType,
        imageUrl: restaurant.imageUrl,
        createdAt: restaurant.createdAt,
        averageRating: Number(avgRating.toFixed(1)),
        reviewCount,
      }
    })

    const categoryCountByName = new Map(categoriesRaw.map((item) => [item.cuisineType, item._count.id]))
    const categoryNameSet = new Set<string>([
      ...categoriesRaw.map((item) => item.cuisineType),
      ...configuredCategories.filter((c) => c.isActive).map((c) => c.name),
    ])
    const mergedCategories = Array.from(categoryNameSet)
      .map((name) => ({
        name,
        restaurantCount: categoryCountByName.get(name) || 0,
        imageUrl: configuredCategoryMap.get(name)?.imageUrl || categoryImageByCuisine.get(name) || null,
        isActive: configuredCategoryMap.get(name)?.isActive ?? true,
      }))
      .filter((item) => item.isActive)
      .sort((a, b) => b.restaurantCount - a.restaurantCount || a.name.localeCompare(b.name))
      .slice(0, 12)

    res.json({
      city: city || null,
      promo: {
        code: 'BIENVENUE',
        title: '-50% sur votre premiere commande',
      },
      categories: mergedCategories,
      popular,
      popularDishes,
      newcomers,
    })
  } catch (error) {
    console.error('Get discovery home error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getDiscoveryServices = async (req: Request, res: Response) => {
  try {
    const city = typeof req.query.city === 'string' ? req.query.city : undefined
    const limit = Number(req.query.limit || 6)
    const where: any = { isActive: true }
    if (city) where.city = city

    const rows = await prisma.restaurant.findMany({
      where,
      select: {
        id: true,
        name: true,
        city: true,
        cuisineType: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.max(limit * 4, 30),
    })

    const pickByType = (matcher: (type: string) => boolean) =>
      rows.filter((r) => matcher(r.cuisineType)).slice(0, limit)

    const isCourses = (type: string) => {
      const t = type.toLowerCase()
      return (
        t.includes('super') ||
        t.includes('epicer') ||
        t.includes('course') ||
        t.includes('market')
      )
    }

    const isPharmacy = (type: string) => {
      const t = type.toLowerCase()
      return t.includes('pharma') || t.includes('parapharma')
    }

    const isFlowers = (type: string) => {
      const t = type.toLowerCase()
      return t.includes('fleur') || t.includes('cadeau')
    }

    const services = [
      {
        key: 'COURSES',
        title: 'Courses',
        items: pickByType(isCourses),
      },
      {
        key: 'PHARMACY',
        title: 'Pharmacie',
        items: pickByType(isPharmacy),
      },
      {
        key: 'FLOWERS',
        title: 'Fleurs et cadeaux',
        items: pickByType(isFlowers),
      },
    ].filter((service) => service.items.length > 0)

    return res.json({
      city: city || null,
      services,
    })
  } catch (error) {
    console.error('Get discovery services error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const getMyRestaurateurDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

    const restaurateur = await prisma.restaurateur.findUnique({
      where: { userId: req.user.userId },
      include: {
        restaurants: true,
      },
    })
    if (!restaurateur) return res.status(404).json({ error: 'Restaurateur not found' })
    if (!restaurateur.isApproved) {
      return res.status(403).json({ error: 'Compte restaurateur en attente de validation admin' })
    }

    const restaurantIds = restaurateur.restaurants.map((r) => r.id)
    if (restaurantIds.length === 0) {
      return res.json({
        restaurants: restaurateur.restaurants,
        summary: {
          ordersToday: 0,
          revenueToday: 0,
          toPrepare: 0,
          deltaVsYesterdayPercent: 0,
        },
        activeOrders: [],
        popularMenuItems: [],
        delivery: {
          assigned: 0,
          waitingCourier: 0,
        },
      })
    }

    const now = new Date()
    const startToday = new Date(now)
    startToday.setHours(0, 0, 0, 0)
    const startTomorrow = new Date(startToday)
    startTomorrow.setDate(startTomorrow.getDate() + 1)

    const startYesterday = new Date(startToday)
    startYesterday.setDate(startYesterday.getDate() - 1)

    const [ordersToday, ordersYesterday, activeOrders, deliveries, topItems] = await Promise.all([
      prisma.order.findMany({
        where: {
          restaurantId: { in: restaurantIds },
          createdAt: { gte: startToday, lt: startTomorrow },
        },
      }),
      prisma.order.findMany({
        where: {
          restaurantId: { in: restaurantIds },
          createdAt: { gte: startYesterday, lt: startToday },
        },
      }),
      prisma.order.findMany({
        where: {
          restaurantId: { in: restaurantIds },
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
        },
        include: {
          client: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
          orderItems: { include: { menuItem: true } },
          restaurant: { select: { name: true } },
          delivery: {
            include: {
              livreur: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 20,
      }),
      prisma.delivery.findMany({
        where: {
          order: { restaurantId: { in: restaurantIds } },
        },
        include: { livreur: true },
      }),
      prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: {
          order: {
            restaurantId: { in: restaurantIds },
            createdAt: { gte: startToday, lt: startTomorrow },
          },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ])

    const menuItemIds = topItems.map((x) => x.menuItemId)
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true },
    })

    const ordersTodayCount = ordersToday.length
    const revenueToday = ordersToday.reduce((sum, o) => sum + o.totalAmount, 0)
    const yesterdayRevenue = ordersYesterday.reduce((sum, o) => sum + o.totalAmount, 0)
    const deltaVsYesterdayPercent =
      yesterdayRevenue === 0 ? (revenueToday > 0 ? 100 : 0) : ((revenueToday - yesterdayRevenue) / yesterdayRevenue) * 100

    const toPrepare = activeOrders.filter((o) => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)).length
    const assigned = deliveries.filter((d) => Boolean(d.livreurId)).length
    const waitingCourier = deliveries.filter((d) => !d.livreurId).length

    res.json({
      restaurants: restaurateur.restaurants,
      summary: {
        ordersToday: ordersTodayCount,
        revenueToday: Number(revenueToday.toFixed(2)),
        toPrepare,
        deltaVsYesterdayPercent: Number(deltaVsYesterdayPercent.toFixed(1)),
      },
      activeOrders: activeOrders.map((o) => ({
        id: o.id,
        status: o.status,
        createdAt: o.createdAt,
        restaurantName: o.restaurant?.name,
        client: o.client?.user
          ? {
              firstName: o.client.user.firstName,
              lastName: o.client.user.lastName,
              phone: o.client.user.phone,
            }
          : null,
        notes: o.notes,
        delivery: o.delivery
          ? {
              status: o.delivery.status,
              livreurName: o.delivery.livreur?.user
                ? `${o.delivery.livreur.user.firstName} ${o.delivery.livreur.user.lastName}`
                : null,
            }
          : null,
        items: o.orderItems.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          menuItemName: i.menuItem?.name || null,
        })),
      })),
      popularMenuItems: topItems.map((item) => ({
        menuItemId: item.menuItemId,
        menuItemName: menuItems.find((m) => m.id === item.menuItemId)?.name || 'Unknown',
        quantity: item._sum.quantity || 0,
      })),
      delivery: {
        assigned,
        waitingCourier,
      },
    })
  } catch (error) {
    console.error('Get restaurateur dashboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
