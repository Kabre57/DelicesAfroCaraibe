import { Request, Response } from 'express'
import prisma from '../prisma'

export const processPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, paymentMethod, transactionId } = req.body

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
        paymentMethod,
        transactionId,
      },
    })

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    })

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
