import { Request, Response } from 'express'
import prisma from '../prisma'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'

const parsePrice = (value: unknown) => {
  if (value === undefined || value === null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const normalized = String(value).trim().replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeOptionalString = (value: unknown) => {
  if (value === undefined) return undefined
  const normalized = String(value ?? '').trim()
  return normalized || null
}

const normalizeRequiredString = (value: unknown) => String(value ?? '').trim()

const normalizeGalleryImageUrls = (value: unknown, fallbackImageUrl?: string | null) => {
  const gallery =
    Array.isArray(value)
      ? value
          .map((entry) => String(entry ?? '').trim())
          .filter(Boolean)
      : []

  const uniqueGallery = Array.from(new Set(gallery))
  const normalizedFallback = fallbackImageUrl ? String(fallbackImageUrl).trim() : ''

  if (normalizedFallback && !uniqueGallery.includes(normalizedFallback)) {
    uniqueGallery.unshift(normalizedFallback)
  }

  return uniqueGallery
}

export const getMenuItemsByRestaurant = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params
    const { category, isAvailable } = req.query

    const where: any = { restaurantId }
    if (category) where.category = category
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true'

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        galleryImages: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        restaurant: true,
      },
    })

    res.json(menuItems)
  } catch (error) {
    console.error('Get menu items error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getMenuItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        galleryImages: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        restaurant: true,
      },
    })

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' })
    }

    res.json(menuItem)
  } catch (error) {
    console.error('Get menu item error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const createMenuItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { restaurantId, isAvailable } = req.body
    const name = normalizeRequiredString(req.body?.name)
    const category = normalizeRequiredString(req.body?.category)
    const description = normalizeOptionalString(req.body?.description)
    const imageUrl = normalizeOptionalString(req.body?.imageUrl)
    const galleryImageUrls = normalizeGalleryImageUrls(req.body?.galleryImageUrls, imageUrl)
    const primaryImageUrl = galleryImageUrls[0] || imageUrl || null
    const price = parsePrice(req.body?.price)

    if (!restaurantId) return res.status(400).json({ error: 'Restaurant is required' })
    if (!name) return res.status(400).json({ error: 'Le nom du plat est obligatoire' })
    if (!category) return res.status(400).json({ error: 'La categorie du plat est obligatoire' })
    if (price === null || price <= 0) {
      return res.status(400).json({ error: 'Le prix du plat doit etre superieur a 0' })
    }

    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    if (req.user.role !== 'ADMIN') {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        include: { restaurateur: true },
      })
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' })
      const owner = await prisma.restaurateur.findUnique({ where: { id: restaurant.restaurateurId } })
      if (!owner || owner.userId !== req.user.userId) {
        return res.status(403).json({ error: 'Forbidden' })
      }
      if (!owner.isApproved) {
        return res.status(403).json({ error: 'Compte restaurateur en attente de validation admin' })
      }
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        restaurantId,
        name,
        description,
        price,
        category,
        imageUrl: primaryImageUrl,
        isAvailable,
        galleryImages: galleryImageUrls.length
          ? {
              create: galleryImageUrls.map((url, index) => ({
                imageUrl: url,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        galleryImages: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    })

    res.status(201).json(menuItem)
  } catch (error) {
    console.error('Create menu item error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateMenuItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const updateData: Record<string, unknown> = {}

    if (req.body?.name !== undefined) {
      const name = normalizeRequiredString(req.body.name)
      if (!name) return res.status(400).json({ error: 'Le nom du plat est obligatoire' })
      updateData.name = name
    }

    if (req.body?.category !== undefined) {
      const category = normalizeRequiredString(req.body.category)
      if (!category) return res.status(400).json({ error: 'La categorie du plat est obligatoire' })
      updateData.category = category
    }

    if (req.body?.description !== undefined) {
      updateData.description = normalizeOptionalString(req.body.description)
    }

    if (req.body?.imageUrl !== undefined) {
      updateData.imageUrl = normalizeOptionalString(req.body.imageUrl)
    }

    let galleryImageUrls: string[] | undefined
    if (req.body?.galleryImageUrls !== undefined) {
      const currentMenuItem = await prisma.menuItem.findUnique({
        where: { id },
        select: { imageUrl: true },
      })
      galleryImageUrls = normalizeGalleryImageUrls(req.body.galleryImageUrls, updateData.imageUrl as string | null | undefined || currentMenuItem?.imageUrl)
      updateData.imageUrl = galleryImageUrls[0] || null
    }

    if (req.body?.price !== undefined) {
      const price = parsePrice(req.body.price)
      if (price === null || price <= 0) {
        return res.status(400).json({ error: 'Le prix du plat doit etre superieur a 0' })
      }
      updateData.price = price
    }

    if (req.body?.isAvailable !== undefined) {
      updateData.isAvailable = Boolean(req.body.isAvailable)
    }

    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    if (req.user.role !== 'ADMIN') {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id },
        include: { restaurant: { include: { restaurateur: true } } },
      })
      if (!menuItem) return res.status(404).json({ error: 'Menu item not found' })
      const owner = await prisma.restaurateur.findUnique({
        where: { id: menuItem.restaurant.restaurateurId },
      })
      if (!owner || owner.userId !== req.user.userId) {
        return res.status(403).json({ error: 'Forbidden' })
      }
      if (!owner.isApproved) {
        return res.status(403).json({ error: 'Compte restaurateur en attente de validation admin' })
      }
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        ...updateData,
        galleryImages:
          galleryImageUrls !== undefined
            ? {
                deleteMany: {},
                create: galleryImageUrls.map((url, index) => ({
                  imageUrl: url,
                  sortOrder: index,
                })),
              }
            : undefined,
      },
      include: {
        galleryImages: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    })

    res.json(menuItem)
  } catch (error) {
    console.error('Update menu item error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteMenuItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    if (req.user.role !== 'ADMIN') {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id },
        include: { restaurant: { include: { restaurateur: true } } },
      })
      if (!menuItem) return res.status(404).json({ error: 'Menu item not found' })
      const owner = await prisma.restaurateur.findUnique({
        where: { id: menuItem.restaurant.restaurateurId },
      })
      if (!owner || owner.userId !== req.user.userId) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    }

    await prisma.menuItem.delete({
      where: { id },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete menu item error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
