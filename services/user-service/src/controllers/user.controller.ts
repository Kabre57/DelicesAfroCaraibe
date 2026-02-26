import { Request, Response } from 'express'
import prisma from '../prisma'
import bcrypt from 'bcryptjs'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'

const canAccessUser = (req: AuthenticatedRequest, userId: string) =>
  req.user?.role === 'ADMIN' || req.user?.userId === userId

const subAccountPublicSelect = {
  id: true,
  restaurantId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  mustChangePassword: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
}

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
            documents: true,
          },
        },
        livreur: {
          include: {
            documents: true,
          },
        },
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
    if (licensePlate !== undefined) updateData.licensePlate = licensePlate
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
        restaurants: {
          include: {
            subAccounts: true,
          },
        },
        documents: true,
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

export const getLivreurProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params
    if (!canAccessUser(req, userId)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const livreur = await prisma.livreur.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        deliveries: {
          select: {
            id: true,
            status: true,
            estimatedTime: true,
            completedAt: true,
            updatedAt: true,
          },
        },
      },
    })

    if (!livreur) return res.status(404).json({ error: 'Livreur not found' })

    const deliveriesCount = livreur.deliveries.length
    const acceptedCount = livreur.deliveries.filter((d) => d.status !== 'WAITING').length
    const cancelledCount = livreur.deliveries.filter((d) => d.status === 'WAITING').length
    const acceptanceRate = deliveriesCount === 0 ? 0 : Math.round((acceptedCount / deliveriesCount) * 100)
    const cancellationRate = deliveriesCount === 0 ? 0 : Math.round((cancelledCount / deliveriesCount) * 100)
    const averageWaitMinutes =
      deliveriesCount === 0
        ? 0
        : Math.round(
            livreur.deliveries.reduce((sum, d) => sum + (d.estimatedTime || 15), 0) / deliveriesCount
          )

    return res.json({
      id: livreur.id,
      user: livreur.user,
      vehicleType: livreur.vehicleType,
      licensePlate: livreur.licensePlate,
      coverageZones: livreur.coverageZones,
      isAvailable: livreur.isAvailable,
      isApproved: livreur.isApproved,
      approvedAt: livreur.approvedAt,
      averageRating: livreur.averageRating,
      stats: {
        deliveriesCount,
        acceptanceRate,
        cancellationRate,
        averageWaitMinutes,
      },
      documents: livreur.documents,
    })
  } catch (error) {
    console.error('Get livreur profile error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const addLivreurDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params
    if (!canAccessUser(req, userId)) return res.status(403).json({ error: 'Forbidden' })

    const livreur = await prisma.livreur.findUnique({ where: { userId } })
    if (!livreur) return res.status(404).json({ error: 'Livreur not found' })

    const { type, fileUrl, expiresAt, status } = req.body || {}
    if (!type || !fileUrl) return res.status(400).json({ error: 'type and fileUrl are required' })

    const doc = await prisma.livreurDocument.create({
      data: {
        livreurId: livreur.id,
        type: String(type),
        fileUrl: String(fileUrl),
        status: status || 'PENDING',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })
    return res.status(201).json(doc)
  } catch (error) {
    console.error('Add livreur document error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateLivreurDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, documentId } = req.params
    if (!canAccessUser(req, userId)) return res.status(403).json({ error: 'Forbidden' })

    const livreur = await prisma.livreur.findUnique({ where: { userId } })
    if (!livreur) return res.status(404).json({ error: 'Livreur not found' })

    const current = await prisma.livreurDocument.findUnique({ where: { id: documentId } })
    if (!current || current.livreurId !== livreur.id) {
      return res.status(404).json({ error: 'Document not found' })
    }

    const { type, fileUrl, status, expiresAt, verifiedAt } = req.body || {}
    const doc = await prisma.livreurDocument.update({
      where: { id: documentId },
      data: {
        ...(type !== undefined ? { type: String(type) } : {}),
        ...(fileUrl !== undefined ? { fileUrl: String(fileUrl) } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
        ...(verifiedAt !== undefined ? { verifiedAt: verifiedAt ? new Date(verifiedAt) : null } : {}),
      },
    })
    return res.json(doc)
  } catch (error) {
    console.error('Update livreur document error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const addRestaurateurDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params
    if (!canAccessUser(req, userId)) return res.status(403).json({ error: 'Forbidden' })

    const restaurateur = await prisma.restaurateur.findUnique({ where: { userId } })
    if (!restaurateur) return res.status(404).json({ error: 'Restaurateur not found' })

    const { type, fileUrl, expiresAt, status } = req.body || {}
    if (!type || !fileUrl) return res.status(400).json({ error: 'type and fileUrl are required' })

    const doc = await prisma.restaurateurDocument.create({
      data: {
        restaurateurId: restaurateur.id,
        type: String(type),
        fileUrl: String(fileUrl),
        status: status || 'PENDING',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })
    return res.status(201).json(doc)
  } catch (error) {
    console.error('Add restaurateur document error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const getRestaurantSubAccounts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params
    if (!canAccessUser(req, userId)) return res.status(403).json({ error: 'Forbidden' })

    const restaurateur = await prisma.restaurateur.findUnique({
      where: { userId },
      include: { restaurants: true },
    })
    if (!restaurateur) return res.status(404).json({ error: 'Restaurateur not found' })

    const restaurantIds = restaurateur.restaurants.map((r) => r.id)
    const subs = await prisma.restaurantSubAccount.findMany({
      where: { restaurantId: { in: restaurantIds } },
      select: subAccountPublicSelect,
      orderBy: { createdAt: 'desc' },
    })
    return res.json(subs)
  } catch (error) {
    console.error('Get sub accounts error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const createRestaurantSubAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params
    if (!canAccessUser(req, userId)) return res.status(403).json({ error: 'Forbidden' })

    const restaurateur = await prisma.restaurateur.findUnique({
      where: { userId },
      include: { restaurants: true },
    })
    if (!restaurateur) return res.status(404).json({ error: 'Restaurateur not found' })

    const { restaurantId, firstName, lastName, email, phone, role, password } = req.body || {}
    if (!restaurantId || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'restaurantId, firstName, lastName, email, password are required' })
    }
    if (String(password).length < 8) return res.status(400).json({ error: 'Password must contain at least 8 characters' })

    const owned = restaurateur.restaurants.some((r) => r.id === restaurantId)
    if (!owned) return res.status(403).json({ error: 'Restaurant does not belong to restaurateur' })

    const existing = await prisma.restaurantSubAccount.findUnique({
      where: { email: String(email) },
      select: { id: true },
    })
    if (existing) return res.status(409).json({ error: 'Sub account email already exists' })

    const passwordHash = await bcrypt.hash(String(password), 10)

    const created = await prisma.restaurantSubAccount.create({
      data: {
        restaurantId,
        firstName: String(firstName),
        lastName: String(lastName),
        email: String(email),
        passwordHash,
        phone: phone ? String(phone) : null,
        role: role ? String(role) : 'STAFF',
      },
      select: subAccountPublicSelect,
    })
    return res.status(201).json(created)
  } catch (error) {
    console.error('Create sub account error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateRestaurantSubAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, subAccountId } = req.params
    if (!canAccessUser(req, userId)) return res.status(403).json({ error: 'Forbidden' })

    const restaurateur = await prisma.restaurateur.findUnique({
      where: { userId },
      include: { restaurants: true },
    })
    if (!restaurateur) return res.status(404).json({ error: 'Restaurateur not found' })

    const current = await prisma.restaurantSubAccount.findUnique({ where: { id: subAccountId } })
    if (!current) return res.status(404).json({ error: 'Sub account not found' })

    const owned = restaurateur.restaurants.some((r) => r.id === current.restaurantId)
    if (!owned) return res.status(403).json({ error: 'Sub account not linked to restaurateur restaurants' })

    const { firstName, lastName, email, phone, role, isActive } = req.body || {}
    const updated = await prisma.restaurantSubAccount.update({
      where: { id: subAccountId },
      data: {
        ...(firstName !== undefined ? { firstName: String(firstName) } : {}),
        ...(lastName !== undefined ? { lastName: String(lastName) } : {}),
        ...(email !== undefined ? { email: String(email) } : {}),
        ...(phone !== undefined ? { phone: phone ? String(phone) : null } : {}),
        ...(role !== undefined ? { role: String(role) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
      select: subAccountPublicSelect,
    })
    return res.json(updated)
  } catch (error) {
    console.error('Update sub account error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateRestaurantSubAccountPassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, subAccountId } = req.params
    if (!canAccessUser(req, userId)) return res.status(403).json({ error: 'Forbidden' })

    const restaurateur = await prisma.restaurateur.findUnique({
      where: { userId },
      include: { restaurants: true },
    })
    if (!restaurateur) return res.status(404).json({ error: 'Restaurateur not found' })

    const current = await prisma.restaurantSubAccount.findUnique({ where: { id: subAccountId } })
    if (!current) return res.status(404).json({ error: 'Sub account not found' })

    const owned = restaurateur.restaurants.some((r) => r.id === current.restaurantId)
    if (!owned) return res.status(403).json({ error: 'Sub account not linked to restaurateur restaurants' })

    const { password, mustChangePassword } = req.body || {}
    if (!password || String(password).length < 8) {
      return res.status(400).json({ error: 'Password must contain at least 8 characters' })
    }

    const passwordHash = await bcrypt.hash(String(password), 10)
    const updated = await prisma.restaurantSubAccount.update({
      where: { id: subAccountId },
      data: {
        passwordHash,
        ...(mustChangePassword !== undefined ? { mustChangePassword: Boolean(mustChangePassword) } : {}),
      },
      select: subAccountPublicSelect,
    })
    return res.json(updated)
  } catch (error) {
    console.error('Update sub account password error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteRestaurantSubAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, subAccountId } = req.params
    if (!canAccessUser(req, userId)) return res.status(403).json({ error: 'Forbidden' })

    const restaurateur = await prisma.restaurateur.findUnique({
      where: { userId },
      include: { restaurants: true },
    })
    if (!restaurateur) return res.status(404).json({ error: 'Restaurateur not found' })

    const current = await prisma.restaurantSubAccount.findUnique({ where: { id: subAccountId } })
    if (!current) return res.status(404).json({ error: 'Sub account not found' })

    const owned = restaurateur.restaurants.some((r) => r.id === current.restaurantId)
    if (!owned) return res.status(403).json({ error: 'Sub account not linked to restaurateur restaurants' })

    await prisma.restaurantSubAccount.delete({ where: { id: subAccountId } })
    return res.status(204).send()
  } catch (error) {
    console.error('Delete sub account error:', error)
    return res.status(500).json({ error: 'Internal server error' })
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
