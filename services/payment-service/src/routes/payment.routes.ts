import { Router } from 'express'
import { processPayment, getPaymentByOrder, refundPayment } from '../controllers/payment.controller'

const router = Router()

router.post('/process', processPayment)
router.get('/order/:orderId', getPaymentByOrder)
router.post('/refund/:orderId', refundPayment)

export default router
