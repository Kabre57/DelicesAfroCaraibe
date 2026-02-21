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

      // Si les infos restaurant sont fournies à l'inscription, on crée le restaurant immédiatement
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
    } else if (role === 'LIVREUR') {
      await prisma.livreur.create({
        data: {
          userId: user.id,
          vehicleType: additionalData?.vehicleType || 'scooter',
          licensePlate: additionalData?.licensePlate || null,
          coverageZones: additionalData?.coverageZones || [],
        },
      })
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
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.json({
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

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    res.json({
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
