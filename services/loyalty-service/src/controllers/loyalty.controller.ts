import { Request, Response } from 'express'
import { LoyaltyService } from '../services/loyalty.service'

const loyaltyService = new LoyaltyService()

export class LoyaltyController {
  async createLoyaltyAccount(req: Request, res: Response) {
    try {
      const { userId } = req.body

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
      }

      const account = await loyaltyService.createLoyaltyAccount(userId)

      res.json({ account })
    } catch (error: any) {
      console.error('Create loyalty account error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async getLoyaltyAccount(req: Request, res: Response) {
    try {
      const { userId } = req.params

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
      }

      const account = await loyaltyService.getLoyaltyAccount(userId)

      if (!account) {
        return res.status(404).json({ error: 'Loyalty account not found' })
      }

      res.json(account)
    } catch (error: any) {
      console.error('Get loyalty account error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async addPoints(req: Request, res: Response) {
    try {
      const { userId, orderAmount, orderId } = req.body

      if (!userId || !orderAmount) {
        return res.status(400).json({ error: 'User ID and order amount are required' })
      }

      const result = await loyaltyService.addPoints(userId, orderAmount, orderId)

      res.json(result)
    } catch (error: any) {
      console.error('Add points error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async getRewards(req: Request, res: Response) {
    try {
      const rewards = await loyaltyService.getRewards()

      res.json({ rewards })
    } catch (error: any) {
      console.error('Get rewards error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async redeemReward(req: Request, res: Response) {
    try {
      const { userId, rewardId } = req.body

      if (!userId || !rewardId) {
        return res.status(400).json({ error: 'User ID and reward ID are required' })
      }

      const result = await loyaltyService.redeemReward(userId, rewardId)

      res.json(result)
    } catch (error: any) {
      console.error('Redeem reward error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async getSubscriptionPlans(req: Request, res: Response) {
    try {
      const plans = await loyaltyService.getSubscriptionPlans()

      res.json({ plans })
    } catch (error: any) {
      console.error('Get subscription plans error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async subscribe(req: Request, res: Response) {
    try {
      const { userId, plan } = req.body

      if (!userId || !plan) {
        return res.status(400).json({ error: 'User ID and plan are required' })
      }

      const subscription = await loyaltyService.subscribe(userId, plan)

      res.json({ subscription })
    } catch (error: any) {
      console.error('Subscribe error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async cancelSubscription(req: Request, res: Response) {
    try {
      const { userId } = req.body

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
      }

      const result = await loyaltyService.cancelSubscription(userId)

      res.json(result)
    } catch (error: any) {
      console.error('Cancel subscription error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async getReferralCode(req: Request, res: Response) {
    try {
      const { userId } = req.params

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
      }

      const result = await loyaltyService.getReferralCode(userId)

      res.json(result)
    } catch (error: any) {
      console.error('Get referral code error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async applyReferral(req: Request, res: Response) {
    try {
      const { userId, referralCode } = req.body

      if (!userId || !referralCode) {
        return res.status(400).json({ error: 'User ID and referral code are required' })
      }

      const result = await loyaltyService.applyReferral(userId, referralCode)

      res.json(result)
    } catch (error: any) {
      console.error('Apply referral error:', error)
      res.status(500).json({ error: error.message })
    }
  }
}
