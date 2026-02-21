import { Router } from 'express'
import { SMSController } from '../controllers/sms.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()
const controller = new SMSController()

router.use(authenticate)

router.post('/sms/send', controller.sendSMS.bind(controller))
router.post('/sms/send-template', controller.sendTemplate.bind(controller))
router.post('/sms/verify-phone', controller.verifyPhone.bind(controller))
router.post('/sms/verify-code', controller.verifyCode.bind(controller))
router.post('/sms/bulk-send', controller.bulkSend.bind(controller))
router.get('/sms/status/:messageId', controller.getSMSStatus.bind(controller))

export default router
