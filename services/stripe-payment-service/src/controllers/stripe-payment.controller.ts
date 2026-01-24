import { Request, Response } from 'express'
import { StripePaymentService } from '../services/stripe-payment.service'

const stripeService = new StripePaymentService()

export class StripePaymentController {
  async createPaymentIntent(req: Request, res: Response) {
    try {
      const { amount, currency = 'eur', orderId, customerId } = req.body

      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' })
      }

      const result = await stripeService.createPaymentIntent(amount, currency, orderId, customerId)

      res.json(result)
    } catch (error: any) {
      console.error('Create payment intent error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async createCustomer(req: Request, res: Response) {
    try {
      const { email, name, phone } = req.body

      if (!email) {
        return res.status(400).json({ error: 'Email is required' })
      }

      const customer = await stripeService.createCustomer(email, name, phone)

      res.json({ customerId: customer.id })
    } catch (error: any) {
      console.error('Create customer error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async createSetupIntent(req: Request, res: Response) {
    try {
      const { customerId } = req.body

      if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' })
      }

      const result = await stripeService.createSetupIntent(customerId)

      res.json(result)
    } catch (error: any) {
      console.error('Create setup intent error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async getPaymentMethods(req: Request, res: Response) {
    try {
      const { customerId } = req.params

      if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' })
      }

      const methods = await stripeService.getPaymentMethods(customerId)

      res.json({ paymentMethods: methods })
    } catch (error: any) {
      console.error('Get payment methods error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async deletePaymentMethod(req: Request, res: Response) {
    try {
      const { paymentMethodId } = req.params

      if (!paymentMethodId) {
        return res.status(400).json({ error: 'Payment method ID is required' })
      }

      await stripeService.deletePaymentMethod(paymentMethodId)

      res.json({ message: 'Payment method deleted successfully' })
    } catch (error: any) {
      console.error('Delete payment method error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async createRefund(req: Request, res: Response) {
    try {
      const { paymentIntentId, amount, reason } = req.body

      if (!paymentIntentId) {
        return res.status(400).json({ error: 'Payment intent ID is required' })
      }

      const result = await stripeService.createRefund(paymentIntentId, amount, reason)

      res.json(result)
    } catch (error: any) {
      console.error('Create refund error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async createSubscription(req: Request, res: Response) {
    try {
      const { customerId, priceId, trialDays = 0 } = req.body

      if (!customerId || !priceId) {
        return res.status(400).json({ error: 'Customer ID and price ID are required' })
      }

      const result = await stripeService.createSubscription(customerId, priceId, trialDays)

      res.json(result)
    } catch (error: any) {
      console.error('Create subscription error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async cancelSubscription(req: Request, res: Response) {
    try {
      const { subscriptionId } = req.params

      if (!subscriptionId) {
        return res.status(400).json({ error: 'Subscription ID is required' })
      }

      const result = await stripeService.cancelSubscription(subscriptionId)

      res.json(result)
    } catch (error: any) {
      console.error('Cancel subscription error:', error)
      res.status(500).json({ error: error.message })
    }
  }
}
