import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import deliveryRoutes from './routes/delivery.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3005

app.use(cors())
app.use(express.json())

app.use('/api/deliveries', deliveryRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'delivery-service' })
})

app.listen(PORT, () => {
  console.log(`Delivery service running on port ${PORT}`)
})
