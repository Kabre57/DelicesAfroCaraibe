import { Request, Response } from 'express'
import prisma from '../prisma'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'

export const getAllRestaurants = async (req: Request, res: Response) => {
  try {
    const { city, cuisineType, isActive } = req.query

    const where: any = {}
    if (city) where.city = city
    if (cuisineType) where.cuisineType = cuisineType
    if (isActive !== undefined) where.isActive = isActive === 'true'

    const restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        restaurateur: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    res.json(restaurants)
  } catch (error) {
    console.error('Get restaurants error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getRestaurantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        menuItems: true,
        restaurateur: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' })
    }

    res.json(restaurant)
  } catch (error) {
    console.error('Get restaurant error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const createRestaurant = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      description,
      address,
      city,
      postalCode,
      phone,
      cuisineType,
      openingHours,
      imageUrl,
    } = req.body

    // Restaurateur from JWT
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    const restaurateur = await prisma.restaurateur.findUnique({
      where: { userId: req.user.userId },
    })
    if (!restaurateur) {
      return res.status(403).json({ error: 'Only restaurateurs can create restaurants' })
    }
    if (!restaurateur.isApproved) {
      return res.status(403).json({ error: 'Compte restaurateur en attente de validation admin' })
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        restaurateurId: restaurateur.id,
        name,
        description,
        address,
        city,
        postalCode,
        phone,
        cuisineType,
        openingHours,
        imageUrl,
      },
    })

    res.status(201).json(restaurant)
  } catch (error) {
    console.error('Create restaurant error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateRestaurant = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // If not admin, ensure ownership
    if (req.user?.role !== 'ADMIN') {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id },
        include: { restaurateur: true },
      })
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' })
      const restaurateur = await prisma.restaurateur.findUnique({
        where: { id: restaurant.restaurateurId },
      })
      if (!restaurateur || restaurateur.userId !== req.user?.userId) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
    })

    res.json(restaurant)
  } catch (error) {
    console.error('Update restaurant error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteRestaurant = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    if (req.user?.role !== 'ADMIN') {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id },
        include: { restaurateur: true },
      })
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' })
      const restaurateur = await prisma.restaurateur.findUnique({
        where: { id: restaurant.restaurateurId },
      })
      if (!restaurateur || restaurateur.userId !== req.user?.userId) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    }

    await prisma.restaurant.delete({
      where: { id },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete restaurant error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
