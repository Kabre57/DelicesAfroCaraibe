import { Request, Response } from 'express'
import prisma from '../prisma'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'

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
      },
    })

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
