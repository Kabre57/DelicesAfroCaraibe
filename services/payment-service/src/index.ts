import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import paymentRoutes from './routes/payment.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3006

app.use(cors())
app.use(express.json())

app.use('/api/payments', paymentRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'payment-service' })
})

app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`)
})
