import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import orderRoutes from './routes/order.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3004

app.use(cors())
app.use(express.json())

app.use('/api/orders', orderRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'order-service' })
})

app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`)
})
