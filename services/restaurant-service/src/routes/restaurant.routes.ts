import { Router } from 'express'
import {
  getAllRestaurants,
  getRestaurantById,
  getDiscoveryHome,
  getDiscoveryServices,
  getMyRestaurateurDashboard,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantGallery,
  addRestaurantGalleryImage,
  deleteRestaurantGalleryImage,
  reorderRestaurantGallery,
} from '../controllers/restaurant.controller'
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller'
import {
  getMenuItemsByRestaurant,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menu.controller'
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

router.get('/discover/home', getDiscoveryHome)
router.get('/discover/services', getDiscoveryServices)
router.get('/categories', listCategories)
router.get('/my/dashboard', authenticate, authorizeRoles('RESTAURATEUR', 'ADMIN'), getMyRestaurateurDashboard)
router.get('/:id/gallery', getRestaurantGallery)
router.get('/', getAllRestaurants)
router.get('/:id', getRestaurantById)
router.get('/:restaurantId/menu', (req, res, next) =>
  getMenuItemsByRestaurant(req, res).catch(next)
)
router.get('/menu/item/:id', (req, res, next) => getMenuItemById(req, res).catch(next))

router.post('/', authenticate, authorizeRoles('RESTAURATEUR', 'ADMIN'), createRestaurant)
router.post('/:id/gallery', authenticate, authorizeRoles('RESTAURATEUR', 'ADMIN'), addRestaurantGalleryImage)
router.put('/:id/gallery/reorder', authenticate, authorizeRoles('RESTAURATEUR', 'ADMIN'), reorderRestaurantGallery)
router.post('/categories', authenticate, authorizeRoles('RESTAURATEUR', 'ADMIN'), createCategory)
router.delete('/:id/gallery/:imageId', authenticate, authorizeRoles('RESTAURATEUR', 'ADMIN'), deleteRestaurantGalleryImage)
router.put('/categories/:id', authenticate, authorizeRoles('RESTAURATEUR', 'ADMIN'), updateCategory)
router.delete('/categories/:id', authenticate, authorizeRoles('RESTAURATEUR', 'ADMIN'), deleteCategory)
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
