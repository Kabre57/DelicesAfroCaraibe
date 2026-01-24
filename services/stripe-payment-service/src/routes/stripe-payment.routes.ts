import { Router } from 'express'
import { StripePaymentController } from '../controllers/stripe-payment.controller'

const router = Router()
const controller = new StripePaymentController()

router.post('/payment/create-intent', controller.createPaymentIntent.bind(controller))
router.post('/payment/create-customer', controller.createCustomer.bind(controller))
router.post('/payment/create-setup-intent', controller.createSetupIntent.bind(controller))
router.get('/payment/methods/:customerId', controller.getPaymentMethods.bind(controller))
router.delete('/payment/methods/:paymentMethodId', controller.deletePaymentMethod.bind(controller))
router.post('/payment/refund', controller.createRefund.bind(controller))
router.post('/payment/create-subscription', controller.createSubscription.bind(controller))
router.post('/payment/cancel-subscription/:subscriptionId', controller.cancelSubscription.bind(controller))

export default router
