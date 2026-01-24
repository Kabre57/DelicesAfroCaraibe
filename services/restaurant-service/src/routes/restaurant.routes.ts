import { Router } from 'express'
import {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from '../controllers/restaurant.controller'

const router = Router()

router.get('/', getAllRestaurants)
router.get('/:id', getRestaurantById)
router.post('/', createRestaurant)
router.put('/:id', updateRestaurant)
router.delete('/:id', deleteRestaurant)

export default router
