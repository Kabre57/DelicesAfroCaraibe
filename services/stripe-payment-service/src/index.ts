import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Stripe from 'stripe'
import stripeRoutes from './routes/stripe-payment.routes'

dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
})

const app = express()
const PORT = process.env.PORT || 3011

app.use(cors())
app.use('/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())

app.use('/api', stripeRoutes)

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']

  if (!sig) {
    return res.status(400).send('Missing stripe-signature header')
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log('PaymentIntent succeeded:', paymentIntent.id)
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object
        console.log('PaymentIntent failed:', failedPayment.id)
        break

      case 'customer.subscription.created':
        const subscription = event.data.object
        console.log('Subscription created:', subscription.id)
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object
        console.log('Subscription deleted:', deletedSubscription.id)
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    res.status(400).send(`Webhook Error: ${error.message}`)
  }
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'stripe-payment-service' })
})

app.listen(PORT, () => {
  console.log(`Stripe payment service running on port ${PORT}`)
})
