import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import chatRoutes from './routes/chat.routes'
import { ChatService } from './services/chat.service'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 3009
const chatService = new ChatService()

app.use(cors())
app.use(express.json())

app.use('/api', chatRoutes)

interface Message {
  id: string
  orderId: string
  senderId: string
  senderRole: 'CLIENT' | 'LIVREUR' | 'RESTAURATEUR'
  message: string
  timestamp: string
  read: boolean
}

const activeRooms = new Map<string, { orderId: string; participants: string[] }>()

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  socket.on('join-chat', async ({ orderId, userId, role }) => {
    const roomId = `order-${orderId}`
    socket.join(roomId)
    
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, { orderId, participants: [userId] })
    } else {
      const room = activeRooms.get(roomId)!
      if (!room.participants.includes(userId)) {
        room.participants.push(userId)
      }
    }

    const history = await chatService.getChatHistory(orderId)
    
    socket.emit('chat-history', history)
    
    io.to(roomId).emit('user-joined', {
      userId,
      role,
      participants: activeRooms.get(roomId)!.participants
    })
  })

  socket.on('send-message', async (data: {
    orderId: string
    senderId: string
    senderRole: string
    message: string
  }) => {
    const roomId = `order-${data.orderId}`
    
    const messageData: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId: data.orderId,
      senderId: data.senderId,
      senderRole: data.senderRole as any,
      message: data.message,
      timestamp: new Date().toISOString(),
      read: false
    }

    await chatService.saveMessage(messageData)

    io.to(roomId).emit('new-message', messageData)
  })

  socket.on('typing', (data: { orderId: string; userId: string; isTyping: boolean }) => {
    const roomId = `order-${data.orderId}`
    socket.to(roomId).emit('user-typing', {
      userId: data.userId,
      isTyping: data.isTyping
    })
  })

  socket.on('mark-read', async (data: { orderId: string; messageId: string }) => {
    const roomId = `order-${data.orderId}`
    
    io.to(roomId).emit('message-read', {
      messageId: data.messageId
    })
  })

  socket.on('leave-chat', ({ orderId, userId }) => {
    const roomId = `order-${orderId}`
    socket.leave(roomId)
    
    const room = activeRooms.get(roomId)
    if (room) {
      room.participants = room.participants.filter(id => id !== userId)
      if (room.participants.length === 0) {
        activeRooms.delete(roomId)
      }
    }

    io.to(roomId).emit('user-left', { userId })
  })

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'chat-service' })
})

httpServer.listen(PORT, () => {
  console.log(`Chat service running on port ${PORT}`)
})
