import { Request, Response } from 'express'
import prisma from '../prisma'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'

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
            client: {
              include: {
                user: true,
              },
            },
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
            client: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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

    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        livreurId: livreur.id,
        status: 'ACCEPTED',
      },
      include: {
        order: true,
      },
    })

    await prisma.order.update({
      where: { id: delivery.orderId },
      data: { status: 'IN_DELIVERY' },
    })

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

    const updateData: any = { status }
    if (status === 'DELIVERED') {
      updateData.completedAt = new Date()
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
      include: {
        order: true,
      },
    })

    if (status === 'DELIVERED') {
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'DELIVERED' },
      })
    }

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
            client: {
              include: {
                user: true,
              },
            },
            orderItems: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        livreur: {
          include: {
            user: true,
          },
        },
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
