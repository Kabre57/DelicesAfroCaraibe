import { Request, Response } from 'express'
import { ChatService } from '../services/chat.service'

const chatService = new ChatService()

export class ChatController {
  async getChatHistory(req: Request, res: Response) {
    try {
      const { orderId } = req.params

      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' })
      }

      const messages = await chatService.getChatHistory(orderId)

      res.json({ messages })
    } catch (error: any) {
      console.error('Get chat history error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async deleteChatHistory(req: Request, res: Response) {
    try {
      const { orderId } = req.params

      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' })
      }

      await chatService.deleteChatHistory(orderId)

      res.json({ message: 'Chat history deleted successfully' })
    } catch (error: any) {
      console.error('Delete chat history error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async markMessagesAsRead(req: Request, res: Response) {
    try {
      const { orderId } = req.params
      const { userId } = req.body

      if (!orderId || !userId) {
        return res.status(400).json({ error: 'Order ID and User ID are required' })
      }

      await chatService.markMessagesAsRead(orderId, userId)

      res.json({ message: 'Messages marked as read' })
    } catch (error: any) {
      console.error('Mark messages as read error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async getUnreadCount(req: Request, res: Response) {
    try {
      const { orderId, userId } = req.params

      if (!orderId || !userId) {
        return res.status(400).json({ error: 'Order ID and User ID are required' })
      }

      const count = await chatService.getUnreadCount(orderId, userId)

      res.json({ unreadCount: count })
    } catch (error: any) {
      console.error('Get unread count error:', error)
      res.status(500).json({ error: error.message })
    }
  }
}
