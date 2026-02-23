import { Router } from 'express'
import {
  getUserById,
  updateUser,
  updateClientProfile,
  updateLivreurProfile,
  getRestaurateurProfile,
  approveRestaurateur,
  approveLivreur,
  listPendingRestaurateurs,
  listPendingLivreurs,
} from '../controllers/user.controller'
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/:id', getUserById)
router.put('/:id', updateUser)
router.put('/client/:userId', updateClientProfile)
router.put('/livreur/:userId', updateLivreurProfile)
router.get('/restaurateur/:userId', getRestaurateurProfile)
router.put('/restaurateur/:userId/approve', authorizeRoles('ADMIN'), approveRestaurateur)
router.put('/livreur/:userId/approve', authorizeRoles('ADMIN'), approveLivreur)
router.get('/pending/restaurateurs', authorizeRoles('ADMIN'), listPendingRestaurateurs)
router.get('/pending/livreurs', authorizeRoles('ADMIN'), listPendingLivreurs)

export default router
