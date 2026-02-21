import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'

type UserRole = 'CLIENT' | 'RESTAURATEUR' | 'LIVREUR' | 'ADMIN'

interface AuthPayload extends JwtPayload {
  userId: string
  email: string
  role: UserRole
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    return res.status(500).json({ error: 'JWT_SECRET is not configured' })
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, secret) as AuthPayload
    req.user = decoded
    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    return next()
  }
}
