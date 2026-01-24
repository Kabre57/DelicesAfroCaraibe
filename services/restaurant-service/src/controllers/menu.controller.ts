import { Request, Response } from 'express'
import prisma from '../prisma'

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

export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const { restaurantId, name, description, price, category, imageUrl, isAvailable } = req.body

    const menuItem = await prisma.menuItem.create({
      data: {
        restaurantId,
        name,
        description,
        price,
        category,
        imageUrl,
        isAvailable,
      },
    })

    res.status(201).json(menuItem)
  } catch (error) {
    console.error('Create menu item error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: updateData,
    })

    res.json(menuItem)
  } catch (error) {
    console.error('Update menu item error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await prisma.menuItem.delete({
      where: { id },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete menu item error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
