import { Router } from 'express'
import {
  createOrder,
  getOrdersByClient,
  getOrdersByRestaurant,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getMyOrders,
  getMyClientSummary,
  getAdminOverview,
  getAdminTransactions,
  getAdminConfig,
  updateAdminConfig,
  createSupportTicket,
  getSupportTickets,
  updateSupportTicket,
  createAuditLog,
  getAuditLogs,
} from '../controllers/order.controller'
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

router.post('/', authenticate, authorizeRoles('CLIENT', 'ADMIN'), createOrder)
router.get('/me', authenticate, authorizeRoles('CLIENT', 'ADMIN'), getMyOrders)
router.get('/client/me/summary', authenticate, authorizeRoles('CLIENT', 'ADMIN'), getMyClientSummary)
router.get('/admin/overview', authenticate, authorizeRoles('ADMIN'), getAdminOverview)
router.get('/admin/transactions', authenticate, authorizeRoles('ADMIN'), getAdminTransactions)
router.get('/admin/config', authenticate, authorizeRoles('ADMIN'), getAdminConfig)
router.put('/admin/config', authenticate, authorizeRoles('ADMIN'), updateAdminConfig)
router.post('/admin/support/tickets', authenticate, createSupportTicket)
router.get('/admin/support/tickets', authenticate, authorizeRoles('ADMIN'), getSupportTickets)
router.put('/admin/support/tickets/:id', authenticate, authorizeRoles('ADMIN'), updateSupportTicket)
router.post('/admin/audit-logs', authenticate, authorizeRoles('ADMIN'), createAuditLog)
router.get('/admin/audit-logs', authenticate, authorizeRoles('ADMIN'), getAuditLogs)
router.get('/client/:clientId', getOrdersByClient)
router.get('/restaurant/:restaurantId', getOrdersByRestaurant)
router.get('/:id', getOrderById)
router.put('/:id/status', authenticate, authorizeRoles('RESTAURATEUR', 'LIVREUR', 'ADMIN'), updateOrderStatus)
router.put('/:id/cancel', authenticate, authorizeRoles('CLIENT', 'RESTAURATEUR', 'ADMIN'), cancelOrder)

export default router
