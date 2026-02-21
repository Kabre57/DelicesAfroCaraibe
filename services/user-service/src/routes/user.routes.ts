import { Router } from 'express'
import {
  getUserById,
  updateUser,
  updateClientProfile,
  updateLivreurProfile,
  getRestaurateurProfile,
} from '../controllers/user.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/:id', getUserById)
router.put('/:id', updateUser)
router.put('/client/:userId', updateClientProfile)
router.put('/livreur/:userId', updateLivreurProfile)
router.get('/restaurateur/:userId', getRestaurateurProfile)

export default router
