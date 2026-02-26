import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prisma'

const JWT_EXPIRES_IN = '7d'

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }
  return secret
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role, firstName, lastName, phone, additionalData } = req.body

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        firstName,
        lastName,
        phone,
      },
    })

    if (role === 'CLIENT') {
      await prisma.client.create({
        data: {
          userId: user.id,
          address: additionalData?.address || '',
          city: additionalData?.city || '',
          postalCode: additionalData?.postalCode || '',
        },
      })
    } else if (role === 'RESTAURATEUR') {
      const restaurateur = await prisma.restaurateur.create({
        data: {
          userId: user.id,
        },
      })

      if (additionalData?.restaurant) {
        const r = additionalData.restaurant
        await prisma.restaurant.create({
          data: {
            restaurateurId: restaurateur.id,
            name: r.name || 'Restaurant sans nom',
            description: r.description || null,
            address: r.address || '',
            city: r.city || '',
            postalCode: r.postalCode || '',
            phone: r.phone || phone || '',
            cuisineType: r.cuisineType || 'Cuisine',
            openingHours: r.openingHours || { monday: '09:00-18:00' },
            imageUrl: r.imageUrl || null,
          },
        })
      }

      const restaurateurDocuments = Array.isArray(additionalData?.documents)
        ? additionalData.documents.filter((d: any) => d?.type && d?.fileUrl)
        : []
      if (restaurateurDocuments.length > 0) {
        await prisma.restaurateurDocument.createMany({
          data: restaurateurDocuments.map((d: any) => ({
            restaurateurId: restaurateur.id,
            type: String(d.type),
            fileUrl: String(d.fileUrl),
            status: 'PENDING',
            expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
          })),
        })
      }
    } else if (role === 'LIVREUR') {
      const livreur = await prisma.livreur.create({
        data: {
          userId: user.id,
          vehicleType: additionalData?.vehicleType || 'scooter',
          licensePlate: additionalData?.licensePlate || null,
          coverageZones: additionalData?.coverageZones || [],
        },
      })

      const livreurDocuments = Array.isArray(additionalData?.documents)
        ? additionalData.documents.filter((d: any) => d?.type && d?.fileUrl)
        : []
      if (livreurDocuments.length > 0) {
        await prisma.livreurDocument.createMany({
          data: livreurDocuments.map((d: any) => ({
            livreurId: livreur.id,
            type: String(d.type),
            fileUrl: String(d.fileUrl),
            status: 'PENDING',
            expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
          })),
        })
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        getJwtSecret(),
        { expiresIn: JWT_EXPIRES_IN }
      )

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        },
      })
    }

    const subAccount = await prisma.restaurantSubAccount.findUnique({
      where: { email },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            restaurateur: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    })
    if (!subAccount || !subAccount.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const subPasswordValid = await bcrypt.compare(password, subAccount.passwordHash)
    if (!subPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      {
        userId: subAccount.restaurant.restaurateur.userId,
        ownerUserId: subAccount.restaurant.restaurateur.userId,
        subAccountId: subAccount.id,
        restaurantId: subAccount.restaurantId,
        email: subAccount.email,
        role: 'RESTAURATEUR',
        isSubAccount: true,
        subAccountRole: subAccount.role,
        mustChangePassword: subAccount.mustChangePassword,
      },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    )

    return res.json({
      token,
      user: {
        id: subAccount.id,
        ownerUserId: subAccount.restaurant.restaurateur.userId,
        email: subAccount.email,
        role: 'RESTAURATEUR',
        firstName: subAccount.firstName,
        lastName: subAccount.lastName,
        phone: subAccount.phone,
        isSubAccount: true,
        subAccountRole: subAccount.role,
        restaurantId: subAccount.restaurantId,
        mustChangePassword: subAccount.mustChangePassword,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, getJwtSecret()) as any

    if (decoded?.isSubAccount && decoded?.subAccountId) {
      const subAccount = await prisma.restaurantSubAccount.findUnique({
        where: { id: decoded.subAccountId },
        include: {
          restaurant: {
            select: {
              restaurateur: {
                select: { userId: true },
              },
            },
          },
        },
      })
      if (!subAccount || !subAccount.isActive) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      return res.json({
        user: {
          id: subAccount.id,
          ownerUserId: subAccount.restaurant.restaurateur.userId,
          email: subAccount.email,
          role: 'RESTAURATEUR',
          firstName: subAccount.firstName,
          lastName: subAccount.lastName,
          phone: subAccount.phone,
          isSubAccount: true,
          subAccountRole: subAccount.role,
          restaurantId: subAccount.restaurantId,
          mustChangePassword: subAccount.mustChangePassword,
        },
      })
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) return res.status(401).json({ error: 'Invalid token' })

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
    })
  } catch (error) {
    console.error('Verify token error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
}
