import { Router } from 'express'
import { processPayment, getPaymentByOrder, refundPayment } from '../controllers/payment.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.post('/process', processPayment)
router.get('/order/:orderId', getPaymentByOrder)
router.post('/refund/:orderId', refundPayment)

export default router
