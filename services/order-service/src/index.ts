import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import orderRoutes from './routes/order.routes'
import http from 'http'
import { Server } from 'socket.io'

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
  },
})

const PORT = process.env.PORT || 3004

app.use(cors())
app.use(express.json())

app.set('io', io)

app.use('/api/orders', orderRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'order-service' })
})

io.on('connection', (socket) => {
  console.log('Order socket connected', socket.id)
})

server.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`)
})
