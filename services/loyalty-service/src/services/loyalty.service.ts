enum TierLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP',
}

interface LoyaltyAccount {
  userId: string
  points: number
  tier: TierLevel
  lifetimeSpent: number
  lastOrderDate: string
  joinDate: string
}

interface Subscription {
  userId: string
  plan: SubscriptionPlan
  startDate: string
  endDate: string
  autoRenew: boolean
  benefits: string[]
}

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  type: 'discount' | 'free_delivery' | 'free_item' | 'cashback'
  value: number
  expiryDays: number
}

const rewards: Reward[] = [
  {
    id: 'r1',
    name: '5€ de réduction',
    description: 'Réduction de 5€ sur votre prochaine commande',
    pointsCost: 500,
    type: 'discount',
    value: 5,
    expiryDays: 30
  },
  {
    id: 'r2',
    name: 'Livraison gratuite',
    description: 'Une livraison offerte',
    pointsCost: 300,
    type: 'free_delivery',
    value: 2.5,
    expiryDays: 14
  },
  {
    id: 'r3',
    name: '10€ de réduction',
    description: 'Réduction de 10€ sur une commande de 40€ minimum',
    pointsCost: 1000,
    type: 'discount',
    value: 10,
    expiryDays: 30
  },
  {
    id: 'r4',
    name: 'Dessert offert',
    description: 'Un dessert au choix offert',
    pointsCost: 200,
    type: 'free_item',
    value: 5,
    expiryDays: 7
  },
]

const subscriptionPlans = {
  FREE: {
    price: 0,
    benefits: ['Commandes standard', 'Support email'],
  },
  BASIC: {
    price: 4.99,
    benefits: [
      'Livraison gratuite sur commandes > 20€',
      'Support prioritaire',
      '100 points bonus par mois',
    ],
  },
  PREMIUM: {
    price: 9.99,
    benefits: [
      'Livraison gratuite illimitée',
      'Support prioritaire 24/7',
      '250 points bonus par mois',
      '5% de cashback',
      'Accès anticipé aux promotions',
    ],
  },
  VIP: {
    price: 19.99,
    benefits: [
      'Livraison gratuite illimitée express',
      'Support VIP dédié',
      '500 points bonus par mois',
      '10% de cashback',
      'Accès exclusif aux événements',
      'Réservation de tables prioritaire',
      'Menu personnalisé',
    ],
  },
}

export class LoyaltyService {
  private calculatePoints(orderAmount: number, tier: TierLevel): number {
    const basePoints = Math.floor(orderAmount)
    
    const multipliers = {
      [TierLevel.BRONZE]: 1,
      [TierLevel.SILVER]: 1.25,
      [TierLevel.GOLD]: 1.5,
      [TierLevel.PLATINUM]: 2,
    }
    
    return Math.floor(basePoints * multipliers[tier])
  }

  private determineTier(lifetimeSpent: number): TierLevel {
    if (lifetimeSpent >= 1000) return TierLevel.PLATINUM
    if (lifetimeSpent >= 500) return TierLevel.GOLD
    if (lifetimeSpent >= 200) return TierLevel.SILVER
    return TierLevel.BRONZE
  }

  async createLoyaltyAccount(userId: string): Promise<LoyaltyAccount> {
    const account: LoyaltyAccount = {
      userId,
      points: 0,
      tier: TierLevel.BRONZE,
      lifetimeSpent: 0,
      lastOrderDate: new Date().toISOString(),
      joinDate: new Date().toISOString(),
    }
    
    return account
  }

  async getLoyaltyAccount(userId: string): Promise<LoyaltyAccount | null> {
    return null
  }

  async addPoints(userId: string, orderAmount: number, orderId?: string) {
    const pointsEarned = this.calculatePoints(orderAmount, TierLevel.BRONZE)
    
    return {
      userId,
      orderId,
      pointsEarned,
      newBalance: pointsEarned,
    }
  }

  async getRewards(): Promise<Reward[]> {
    return rewards
  }

  async redeemReward(userId: string, rewardId: string) {
    const reward = rewards.find(r => r.id === rewardId)
    if (!reward) {
      throw new Error('Reward not found')
    }
    
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + reward.expiryDays)
    
    return {
      userId,
      reward,
      code: `REWARD-${Date.now()}`,
      expiryDate: expiryDate.toISOString(),
    }
  }

  async getSubscriptionPlans() {
    return subscriptionPlans
  }

  async subscribe(userId: string, plan: string): Promise<Subscription> {
    if (!(plan in subscriptionPlans)) {
      throw new Error('Invalid subscription plan')
    }
    
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)
    
    const subscription: Subscription = {
      userId,
      plan: plan as SubscriptionPlan,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: true,
      benefits: subscriptionPlans[plan as keyof typeof subscriptionPlans].benefits,
    }
    
    return subscription
  }

  async cancelSubscription(userId: string) {
    return {
      userId,
      message: 'Subscription cancelled successfully',
      effectiveDate: new Date().toISOString(),
    }
  }

  async getReferralCode(userId: string) {
    const referralCode = `REF${userId.substring(0, 6).toUpperCase()}`
    
    return {
      userId,
      referralCode,
      bonus: 10,
      friendBonus: 10,
    }
  }

  async applyReferral(userId: string, referralCode: string) {
    return {
      userId,
      referralCode,
      bonusEarned: 10,
      message: 'Referral bonus applied successfully',
    }
  }
}
