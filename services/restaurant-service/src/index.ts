import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import restaurantRoutes from './routes/restaurant.routes'
import menuRoutes from './routes/menu.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3003

app.use(cors())
app.use(express.json())

app.use('/api/restaurants', restaurantRoutes)
app.use('/api/menu', menuRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'restaurant-service' })
})

app.listen(PORT, () => {
  console.log(`Restaurant service running on port ${PORT}`)
})
