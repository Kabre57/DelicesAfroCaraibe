import { Request, Response } from 'express'
import prisma from '../prisma'
import bcrypt from 'bcryptjs'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        client: true,
        restaurateur: {
          include: {
            restaurants: true,
          },
        },
        livreur: true,
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { firstName, lastName, phone, password } = req.body

    const updateData: any = {}
    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (phone) updateData.phone = phone
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateClientProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { address, city, postalCode } = req.body

    const client = await prisma.client.update({
      where: { userId },
      data: {
        address,
        city,
        postalCode,
      },
    })

    res.json(client)
  } catch (error) {
    console.error('Update client profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateLivreurProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { vehicleType, licensePlate, coverageZones, isAvailable } = req.body

    const updateData: any = {}
    if (vehicleType) updateData.vehicleType = vehicleType
    if (licensePlate) updateData.licensePlate = licensePlate
    if (coverageZones) updateData.coverageZones = coverageZones
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable

    const livreur = await prisma.livreur.update({
      where: { userId },
      data: updateData,
    })

    res.json(livreur)
  } catch (error) {
    console.error('Update livreur profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getRestaurateurProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    const restaurateur = await prisma.restaurateur.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        restaurants: true,
      },
    })

    if (!restaurateur) {
      return res.status(404).json({ error: 'Restaurateur not found' })
    }

    res.json(restaurateur)
  } catch (error) {
    console.error('Get restaurateur profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const listPendingRestaurateurs = async (req: Request, res: Response) => {
  try {
    const items = await prisma.restaurateur.findMany({
      where: { isApproved: false },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, phone: true },
        },
        restaurants: true,
      },
    })
    res.json(items)
  } catch (error) {
    console.error('List pending restaurateurs error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const listPendingLivreurs = async (req: Request, res: Response) => {
  try {
    const items = await prisma.livreur.findMany({
      where: { isApproved: false },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, phone: true },
        },
      },
    })
    res.json(items)
  } catch (error) {
    console.error('List pending livreurs error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const approveRestaurateur = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params
    const restaurateur = await prisma.restaurateur.update({
      where: { userId },
      data: { isApproved: true, approvedAt: new Date() },
    })
    res.json(restaurateur)
  } catch (error) {
    console.error('Approve restaurateur error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const approveLivreur = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params
    const livreur = await prisma.livreur.update({
      where: { userId },
      data: { isApproved: true, approvedAt: new Date() },
    })
    res.json(livreur)
  } catch (error) {
    console.error('Approve livreur error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
