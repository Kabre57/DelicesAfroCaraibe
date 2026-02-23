import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import deliveryRoutes from './routes/delivery.routes'
import http from 'http'
import { Server } from 'socket.io'

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

const PORT = process.env.PORT || 3005

app.use(cors())
app.use(express.json())

app.set('io', io)

app.use('/api/deliveries', deliveryRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'delivery-service' })
})

io.on('connection', (socket) => {
  console.log('Delivery socket connected', socket.id)
})

server.listen(PORT, () => {
  console.log(`Delivery service running on port ${PORT}`)
})
