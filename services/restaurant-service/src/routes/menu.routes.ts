import { Router } from 'express'
import {
  getMenuItemsByRestaurant,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menu.controller'

const router = Router()

router.get('/restaurant/:restaurantId', getMenuItemsByRestaurant)
router.get('/:id', getMenuItemById)
router.post('/', createMenuItem)
router.put('/:id', updateMenuItem)
router.delete('/:id', deleteMenuItem)

export default router
