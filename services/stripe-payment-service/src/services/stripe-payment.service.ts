import Stripe from 'stripe'

export class StripePaymentService {
  private stripe: Stripe

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-04-10',
    })
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'eur',
    orderId?: string,
    customerId?: string
  ) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        customer: customerId,
        metadata: {
          orderId: orderId || '',
          customerId: customerId || '',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }
    } catch (error) {
      console.error('Create payment intent error:', error)
      throw error
    }
  }

  async createCustomer(email: string, name?: string, phone?: string) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        phone,
      })

      return customer
    } catch (error) {
      console.error('Create customer error:', error)
      throw error
    }
  }

  async createSetupIntent(customerId: string) {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      })

      return {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
      }
    } catch (error) {
      console.error('Create setup intent error:', error)
      throw error
    }
  }

  async getPaymentMethods(customerId: string) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      })

      return paymentMethods.data
    } catch (error) {
      console.error('Get payment methods error:', error)
      throw error
    }
  }

  async deletePaymentMethod(paymentMethodId: string) {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId)
    } catch (error) {
      console.error('Delete payment method error:', error)
      throw error
    }
  }

  async createRefund(paymentIntentId: string, amount?: number, reason?: string) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: (reason as any) || 'requested_by_customer',
      })

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
      }
    } catch (error) {
      console.error('Create refund error:', error)
      throw error
    }
  }

  async createSubscription(customerId: string, priceId: string, trialDays: number = 0) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialDays > 0 ? trialDays : undefined,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      })

      return {
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      }
    } catch (error) {
      console.error('Create subscription error:', error)
      throw error
    }
  }

  async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId)

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
      }
    } catch (error) {
      console.error('Cancel subscription error:', error)
      throw error
    }
  }
}
