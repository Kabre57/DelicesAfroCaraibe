import { Router } from 'express'
import { ChatController } from '../controllers/chat.controller'

const router = Router()
const controller = new ChatController()

router.get('/chat/:orderId/history', controller.getChatHistory.bind(controller))
router.delete('/chat/:orderId', controller.deleteChatHistory.bind(controller))
router.post('/chat/:orderId/read', controller.markMessagesAsRead.bind(controller))
router.get('/chat/:orderId/unread/:userId', controller.getUnreadCount.bind(controller))

export default router
