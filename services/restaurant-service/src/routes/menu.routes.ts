import { Router } from 'express'
import {
  getMenuItemsByRestaurant,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menu.controller'
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

router.get('/restaurant/:restaurantId', getMenuItemsByRestaurant)
router.get('/:id', getMenuItemById)
router.post('/', authenticate, authorizeRoles('RESTAURATEUR', 'ADMIN'), createMenuItem)
router.put('/:id', authenticate, authorizeRoles('RESTAURATEUR', 'ADMIN'), updateMenuItem)
router.delete('/:id', authenticate, authorizeRoles('RESTAURATEUR', 'ADMIN'), deleteMenuItem)

export default router
