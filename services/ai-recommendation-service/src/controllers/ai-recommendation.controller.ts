import { Request, Response } from 'express'
import { AIRecommendationService } from '../services/ai-recommendation.service'

const aiService = new AIRecommendationService()

export class AIRecommendationController {
  async getRestaurantRecommendations(req: Request, res: Response) {
    try {
      const { userId, preferences, limit = 10 } = req.body

      if (!userId || !preferences) {
        return res.status(400).json({ error: 'User ID and preferences are required' })
      }

      const recommendations = await aiService.getRestaurantRecommendations(userId, preferences, limit)

      res.json({
        userId,
        recommendations,
        algorithm: 'collaborative-filtering',
        timestamp: new Date().toISOString()
      })
    } catch (error: any) {
      console.error('Restaurant recommendations error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async getDishRecommendations(req: Request, res: Response) {
    try {
      const { userId, restaurantId, preferences } = req.body

      if (!userId || !restaurantId) {
        return res.status(400).json({ error: 'User ID and restaurant ID are required' })
      }

      const recommendations = await aiService.getDishRecommendations(userId, restaurantId, preferences)

      res.json({
        userId,
        restaurantId,
        recommendedDishes: recommendations,
        timestamp: new Date().toISOString()
      })
    } catch (error: any) {
      console.error('Dish recommendations error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async chatWithAI(req: Request, res: Response) {
    try {
      const { message, context } = req.body

      if (!message) {
        return res.status(400).json({ error: 'Message is required' })
      }

      const response = await aiService.chatWithAI(message, context)

      res.json(response)
    } catch (error: any) {
      console.error('AI chat error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async getMenuSuggestions(req: Request, res: Response) {
    try {
      const { cuisineType, dietaryRestrictions = [], occasion = 'dîner' } = req.body

      if (!cuisineType) {
        return res.status(400).json({ error: 'Cuisine type is required' })
      }

      const suggestions = await aiService.getMenuSuggestions(cuisineType, dietaryRestrictions, occasion)

      res.json({
        cuisineType,
        occasion,
        suggestions
      })
    } catch (error: any) {
      console.error('Menu suggestions error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async analyzeSentiment(req: Request, res: Response) {
    try {
      const { review } = req.body

      if (!review) {
        return res.status(400).json({ error: 'Review is required' })
      }

      const result = await aiService.analyzeSentiment(review)

      res.json(result)
    } catch (error: any) {
      console.error('Sentiment analysis error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async predictDeliveryTime(req: Request, res: Response) {
    try {
      const { restaurantId, deliveryAddress, orderSize, timeOfDay, dayOfWeek } = req.body

      if (!restaurantId || !deliveryAddress) {
        return res.status(400).json({ error: 'Restaurant ID and delivery address are required' })
      }

      const prediction = await aiService.predictDeliveryTime(
        restaurantId,
        deliveryAddress,
        orderSize,
        timeOfDay,
        dayOfWeek
      )

      res.json(prediction)
    } catch (error: any) {
      console.error('Delivery time prediction error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async detectFraud(req: Request, res: Response) {
    try {
      const { userId, orderAmount, orderFrequency, deliveryAddress, paymentMethod } = req.body

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
      }

      const result = await aiService.detectFraud(
        userId,
        orderAmount,
        orderFrequency,
        deliveryAddress,
        paymentMethod
      )

      res.json(result)
    } catch (error: any) {
      console.error('Fraud detection error:', error)
      res.status(500).json({ error: error.message })
    }
  }
}
