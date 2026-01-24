import { createClient, RedisClientType } from 'redis'

interface Message {
  id: string
  orderId: string
  senderId: string
  senderRole: 'CLIENT' | 'LIVREUR' | 'RESTAURATEUR'
  message: string
  timestamp: string
  read: boolean
}

export class ChatService {
  private redisClient: RedisClientType

  constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })
    this.redisClient.connect().catch(console.error)
  }

  async getChatHistory(orderId: string): Promise<Message[]> {
    try {
      const history = await this.redisClient.lRange(`chat:${orderId}`, 0, -1)
      return history.map(msg => JSON.parse(msg))
    } catch (error) {
      console.error('Get chat history error:', error)
      throw error
    }
  }

  async saveMessage(message: Message): Promise<void> {
    try {
      await this.redisClient.rPush(`chat:${message.orderId}`, JSON.stringify(message))
      await this.redisClient.expire(`chat:${message.orderId}`, 7 * 24 * 60 * 60) // 7 days
    } catch (error) {
      console.error('Save message error:', error)
      throw error
    }
  }

  async deleteChatHistory(orderId: string): Promise<void> {
    try {
      await this.redisClient.del(`chat:${orderId}`)
    } catch (error) {
      console.error('Delete chat history error:', error)
      throw error
    }
  }

  async markMessagesAsRead(orderId: string, userId: string): Promise<void> {
    try {
      const messages = await this.getChatHistory(orderId)
      const updatedMessages = messages.map(msg => 
        msg.senderId !== userId ? { ...msg, read: true } : msg
      )
      
      await this.redisClient.del(`chat:${orderId}`)
      
      for (const msg of updatedMessages) {
        await this.redisClient.rPush(`chat:${orderId}`, JSON.stringify(msg))
      }
    } catch (error) {
      console.error('Mark messages as read error:', error)
      throw error
    }
  }

  async getUnreadCount(orderId: string, userId: string): Promise<number> {
    try {
      const messages = await this.getChatHistory(orderId)
      return messages.filter(msg => msg.senderId !== userId && !msg.read).length
    } catch (error) {
      console.error('Get unread count error:', error)
      throw error
    }
  }
}
