import { Router } from 'express'
import { AIRecommendationController } from '../controllers/ai-recommendation.controller'

const router = Router()
const controller = new AIRecommendationController()

router.post('/recommendations/restaurants', controller.getRestaurantRecommendations.bind(controller))
router.post('/recommendations/dishes', controller.getDishRecommendations.bind(controller))
router.post('/ai/chat', controller.chatWithAI.bind(controller))
router.post('/ai/menu-suggestions', controller.getMenuSuggestions.bind(controller))
router.post('/ai/sentiment-analysis', controller.analyzeSentiment.bind(controller))
router.post('/ai/delivery-time-prediction', controller.predictDeliveryTime.bind(controller))
router.post('/ai/fraud-detection', controller.detectFraud.bind(controller))

export default router
