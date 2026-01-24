import OpenAI from 'openai'
import natural from 'natural'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface UserPreferences {
  cuisineTypes: string[]
  priceRange: [number, number]
  favoriteRestaurants: string[]
  favoriteDishes: string[]
  orderHistory: Array<{
    restaurantId: string
    items: string[]
    rating?: number
  }>
}

export class AIRecommendationService {
  private calculateUserVector(preferences: UserPreferences): number[] {
    const vector: number[] = []
    
    const cuisineMap: { [key: string]: number } = {
      'Africain': 0, 'Caribéen': 1, 'Antillais': 2, 'Créole': 3,
      'Sénégalais': 4, 'Ivoirien': 5, 'Camerounais': 6, 'Togolais': 7
    }
    
    const cuisineVector = new Array(8).fill(0)
    preferences.cuisineTypes.forEach(cuisine => {
      const index = cuisineMap[cuisine]
      if (index !== undefined) cuisineVector[index] = 1
    })
    
    vector.push(...cuisineVector)
    vector.push(preferences.priceRange[0] / 50)
    vector.push(preferences.priceRange[1] / 50)
    vector.push(preferences.favoriteRestaurants.length / 10)
    vector.push(preferences.favoriteDishes.length / 20)
    vector.push(preferences.orderHistory.length / 50)
    
    const avgRating = preferences.orderHistory.reduce((sum, order) => 
      sum + (order.rating || 0), 0) / (preferences.orderHistory.length || 1)
    vector.push(avgRating / 5)
    
    return vector
  }

  async getRestaurantRecommendations(userId: string, preferences: UserPreferences, limit: number = 10) {
    try {
      const userVector = this.calculateUserVector(preferences)
      
      return []
    } catch (error) {
      console.error('Restaurant recommendations error:', error)
      throw error
    }
  }

  async getDishRecommendations(userId: string, restaurantId: string, preferences: any) {
    try {
      return []
    } catch (error) {
      console.error('Dish recommendations error:', error)
      throw error
    }
  }

  async chatWithAI(message: string, context?: any) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant culinaire spécialisé dans la cuisine afro-caribéenne. 
            Tu aides les utilisateurs à découvrir de délicieux plats, à choisir des restaurants, 
            et à répondre à leurs questions sur la cuisine africaine et caribéenne.
            Sois chaleureux, enthousiaste et informatif.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      })
      
      const response = completion.choices[0].message.content
      
      return {
        response,
        model: completion.model,
        tokens: completion.usage?.total_tokens
      }
    } catch (error) {
      console.error('AI chat error:', error)
      throw error
    }
  }

  async getMenuSuggestions(cuisineType: string, dietaryRestrictions: string[], occasion: string) {
    try {
      const prompt = `En tant que chef spécialisé en cuisine ${cuisineType}, 
      suggère un menu complet (entrée, plat principal, dessert) pour ${occasion}.
      Restrictions alimentaires: ${dietaryRestrictions.join(', ') || 'aucune'}.
      Format: JSON avec nom, description, ingrédients pour chaque plat.`
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Tu es un chef expert en cuisine afro-caribéenne.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.8,
      })
      
      const suggestions = completion.choices[0].message.content
      
      try {
        return JSON.parse(suggestions || '{}')
      } catch {
        return { rawSuggestions: suggestions }
      }
    } catch (error) {
      console.error('Menu suggestions error:', error)
      throw error
    }
  }

  async analyzeSentiment(review: string) {
    try {
      const tokenizer = new natural.WordTokenizer()
      const analyzer = new natural.SentimentAnalyzer('French', natural.PorterStemmer, 'afinn')
      
      const tokens = tokenizer.tokenize(review.toLowerCase())
      const sentiment = analyzer.getSentiment(tokens)
      
      const classification = sentiment > 0.2 ? 'positive' : 
                            sentiment < -0.2 ? 'negative' : 'neutral'
      
      return {
        review,
        sentiment: classification,
        score: sentiment,
        confidence: Math.abs(sentiment)
      }
    } catch (error) {
      console.error('Sentiment analysis error:', error)
      throw error
    }
  }

  async predictDeliveryTime(
    restaurantId: string,
    deliveryAddress: string,
    orderSize: number,
    timeOfDay: number,
    dayOfWeek: number
  ) {
    try {
      const baseTime = 30
      const orderSizeMultiplier = 1 + (orderSize / 10) * 0.1
      const rushHourMultiplier = (timeOfDay >= 12 && timeOfDay <= 14) || 
                                 (timeOfDay >= 19 && timeOfDay <= 21) ? 1.3 : 1
      const weekendMultiplier = dayOfWeek >= 5 ? 1.2 : 1
      
      const predictedTime = Math.round(
        baseTime * orderSizeMultiplier * rushHourMultiplier * weekendMultiplier
      )
      
      return {
        restaurantId,
        predictedDeliveryTime: predictedTime,
        estimatedRange: [predictedTime - 5, predictedTime + 10],
        confidence: 0.85,
        factors: {
          baseTime,
          orderSize: orderSizeMultiplier,
          rushHour: rushHourMultiplier,
          weekend: weekendMultiplier
        }
      }
    } catch (error) {
      console.error('Delivery time prediction error:', error)
      throw error
    }
  }

  async detectFraud(
    userId: string,
    orderAmount: number,
    orderFrequency: number,
    deliveryAddress: string,
    paymentMethod: string
  ) {
    try {
      let riskScore = 0
      const flags: string[] = []
      
      if (orderAmount > 200) {
        riskScore += 30
        flags.push('High order amount')
      }
      
      if (orderFrequency > 10) {
        riskScore += 20
        flags.push('Unusual order frequency')
      }
      
      const riskLevel = riskScore > 60 ? 'high' : 
                       riskScore > 30 ? 'medium' : 'low'
      
      return {
        userId,
        riskLevel,
        riskScore,
        flags,
        recommendation: riskLevel === 'high' ? 'manual_review' : 'approve',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Fraud detection error:', error)
      throw error
    }
  }
}
