import { Router } from 'express'
import {
  createOrder,
  getOrdersByClient,
  getOrdersByRestaurant,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getMyOrders,
} from '../controllers/order.controller'
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

router.post('/', authenticate, authorizeRoles('CLIENT', 'ADMIN'), createOrder)
router.get('/me', authenticate, authorizeRoles('CLIENT', 'ADMIN'), getMyOrders)
router.get('/client/:clientId', getOrdersByClient)
router.get('/restaurant/:restaurantId', getOrdersByRestaurant)
router.get('/:id', getOrderById)
router.put('/:id/status', authenticate, authorizeRoles('RESTAURATEUR', 'LIVREUR', 'ADMIN'), updateOrderStatus)
router.put('/:id/cancel', authenticate, authorizeRoles('CLIENT', 'RESTAURATEUR', 'ADMIN'), cancelOrder)

export default router
