import { Router } from 'express'
import {
  createOrder,
  getOrdersByClient,
  getOrdersByRestaurant,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} from '../controllers/order.controller'

const router = Router()

router.post('/', createOrder)
router.get('/client/:clientId', getOrdersByClient)
router.get('/restaurant/:restaurantId', getOrdersByRestaurant)
router.get('/:id', getOrderById)
router.put('/:id/status', updateOrderStatus)
router.put('/:id/cancel', cancelOrder)

export default router
