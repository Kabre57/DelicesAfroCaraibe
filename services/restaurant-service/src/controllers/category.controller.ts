import { Request, Response } from 'express'
import prisma from '../prisma'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'

const toSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

async function ensureRestaurateurApproved(req: AuthenticatedRequest) {
  if (!req.user) return { ok: false as const, code: 401, error: 'Unauthorized' }
  if (req.user.role === 'ADMIN') return { ok: true as const }
  const restaurateur = await prisma.restaurateur.findUnique({
    where: { userId: req.user.userId },
  })
  if (!restaurateur) return { ok: false as const, code: 403, error: 'Only restaurateurs can manage categories' }
  if (!restaurateur.isApproved) {
    return { ok: false as const, code: 403, error: 'Compte restaurateur en attente de validation admin' }
  }
  return { ok: true as const }
}

export const listCategories = async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.active === 'true'
    const categories = await prisma.category.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ name: 'asc' }],
    })
    return res.json(categories)
  } catch (error) {
    console.error('List categories error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const createCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const guard = await ensureRestaurateurApproved(req)
    if (!guard.ok) return res.status(guard.code).json({ error: guard.error })

    const { name, description, imageUrl, isActive } = req.body || {}
    const normalizedName = String(name || '').trim()
    if (!normalizedName) return res.status(400).json({ error: 'Category name is required' })

    const baseSlug = toSlug(normalizedName)
    if (!baseSlug) return res.status(400).json({ error: 'Category name is invalid' })

    let slug = baseSlug
    let i = 1
    while (await prisma.category.findUnique({ where: { slug } })) {
      i += 1
      slug = `${baseSlug}-${i}`
    }

    const category = await prisma.category.create({
      data: {
        name: normalizedName,
        slug,
        description: description ? String(description).trim() : null,
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        isActive: isActive === undefined ? true : Boolean(isActive),
      },
    })
    return res.status(201).json(category)
  } catch (error) {
    console.error('Create category error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const guard = await ensureRestaurateurApproved(req)
    if (!guard.ok) return res.status(guard.code).json({ error: guard.error })

    const { id } = req.params
    const current = await prisma.category.findUnique({ where: { id } })
    if (!current) return res.status(404).json({ error: 'Category not found' })

    const body = req.body || {}
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) {
      const normalizedName = String(body.name).trim()
      if (!normalizedName) return res.status(400).json({ error: 'Category name is invalid' })
      updateData.name = normalizedName
      const baseSlug = toSlug(normalizedName)
      if (!baseSlug) return res.status(400).json({ error: 'Category name is invalid' })
      let slug = baseSlug
      let i = 1
      while (true) {
        const existing = await prisma.category.findUnique({ where: { slug } })
        if (!existing || existing.id === id) break
        i += 1
        slug = `${baseSlug}-${i}`
      }
      updateData.slug = slug
    }
    if (body.description !== undefined) updateData.description = body.description ? String(body.description).trim() : null
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive)

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    })
    return res.json(category)
  } catch (error) {
    console.error('Update category error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const guard = await ensureRestaurateurApproved(req)
    if (!guard.ok) return res.status(guard.code).json({ error: guard.error })

    const { id } = req.params
    const current = await prisma.category.findUnique({ where: { id } })
    if (!current) return res.status(404).json({ error: 'Category not found' })

    await prisma.category.delete({ where: { id } })
    return res.status(204).send()
  } catch (error) {
    console.error('Delete category error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
