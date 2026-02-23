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
