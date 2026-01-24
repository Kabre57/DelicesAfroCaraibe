import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cron from 'node-cron'
import loyaltyRoutes from './routes/loyalty.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3014

app.use(cors())
app.use(express.json())

app.use('/api', loyaltyRoutes)

cron.schedule('0 0 * * *', () => {
  console.log('Running daily loyalty points expiry check...')
})

cron.schedule('0 0 1 * *', () => {
  console.log('Running monthly subscription renewal...')
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'loyalty-service' })
})

app.listen(PORT, () => {
  console.log(`Loyalty service running on port ${PORT}`)
})
