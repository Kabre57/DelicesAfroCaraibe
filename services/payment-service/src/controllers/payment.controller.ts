import { Request, Response } from 'express'
import prisma from '../prisma'

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

export const processPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, paymentMethod, transactionId } = req.body
    const normalizedMethod = paymentMethod === 'CARD' ? 'CARD' : 'CASH'
    const resolvedTransactionId =
      normalizedMethod === 'CARD'
        ? transactionId || `CARD-${Date.now()}`
        : transactionId || `CASH-${Date.now()}`

    const payment = await prisma.payment.findFirst({
      where: { orderId },
    })

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paymentMethod: normalizedMethod,
        transactionId: resolvedTransactionId,
      },
    })

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
      include: {
        client: { include: { user: true } },
        restaurant: { include: { restaurateur: { include: { user: true } } } },
      },
    })

    // notify client + restaurateur
    if (order) {
      await sendNotification({
        userId: order.client.userId,
        title: 'Paiement confirmé',
        message: `Commande ${order.id.slice(0, 8)} payée et confirmée.`,
        email: order.client.user.email,
      })
      await sendSMS(order.client.user.phone, 'Paiement confirmé, commande en préparation.')
      await sendNotification({
        userId: order.restaurant.restaurateur.userId,
        title: 'Nouvelle commande payée',
        message: `Commande ${order.id.slice(0, 8)} est payée, préparez-la.`,
        email: order.restaurant.restaurateur.user?.email,
      })
    }

    res.json(updatedPayment)
  } catch (error) {
    console.error('Process payment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getPaymentByOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params

    const payment = await prisma.payment.findFirst({
      where: { orderId },
      include: {
        order: true,
      },
    })

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    res.json(payment)
  } catch (error) {
    console.error('Get payment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const refundPayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params

    const payment = await prisma.payment.findFirst({
      where: { orderId },
    })

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
      },
    })

    res.json(updatedPayment)
  } catch (error) {
    console.error('Refund payment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
