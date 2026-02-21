import { Router } from 'express'
import {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from '../controllers/restaurant.controller'
import {
  getMenuItemsByRestaurant,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menu.controller'
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', getAllRestaurants)
router.get('/:id', getRestaurantById)
router.get('/:restaurantId/menu', (req, res, next) =>
  getMenuItemsByRestaurant(req, res).catch(next)
)
router.get('/menu/item/:id', (req, res, next) => getMenuItemById(req, res).catch(next))

router.post('/', authenticate, authorizeRoles('RESTAURATEUR', 'ADMIN'), createRestaurant)
router.put('/:id', authenticate, authorizeRoles('RESTAURATEUR', 'ADMIN'), updateRestaurant)
router.delete('/:id', authenticate, authorizeRoles('RESTAURATEUR', 'ADMIN'), deleteRestaurant)
router.post(
  '/:restaurantId/menu',
  authenticate,
  authorizeRoles('RESTAURATEUR', 'ADMIN'),
  (req, res, next) => {
    req.body.restaurantId = req.params.restaurantId
    return createMenuItem(req, res).catch(next)
  }
)
router.put(
  '/menu/:id',
  authenticate,
  authorizeRoles('RESTAURATEUR', 'ADMIN'),
  (req, res, next) => updateMenuItem(req, res).catch(next)
)
router.delete(
  '/menu/:id',
  authenticate,
  authorizeRoles('RESTAURATEUR', 'ADMIN'),
  (req, res, next) => deleteMenuItem(req, res).catch(next)
)

export default router
