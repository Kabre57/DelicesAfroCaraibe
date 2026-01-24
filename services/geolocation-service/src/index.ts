import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import geolocationRoutes from './routes/geolocation.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3008

app.use(cors())
app.use(express.json())

app.use('/api', geolocationRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'geolocation-service' })
})

app.listen(PORT, () => {
  console.log(`Geolocation service running on port ${PORT}`)
})
