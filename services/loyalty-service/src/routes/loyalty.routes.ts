import { Router } from 'express'
import { LoyaltyController } from '../controllers/loyalty.controller'

const router = Router()
const controller = new LoyaltyController()

router.post('/loyalty/account', controller.createLoyaltyAccount.bind(controller))
router.get('/loyalty/account/:userId', controller.getLoyaltyAccount.bind(controller))
router.post('/loyalty/points/add', controller.addPoints.bind(controller))
router.get('/loyalty/rewards', controller.getRewards.bind(controller))
router.post('/loyalty/rewards/redeem', controller.redeemReward.bind(controller))
router.get('/subscription/plans', controller.getSubscriptionPlans.bind(controller))
router.post('/subscription/subscribe', controller.subscribe.bind(controller))
router.post('/subscription/cancel', controller.cancelSubscription.bind(controller))
router.get('/referral/code/:userId', controller.getReferralCode.bind(controller))
router.post('/referral/apply', controller.applyReferral.bind(controller))

export default router
