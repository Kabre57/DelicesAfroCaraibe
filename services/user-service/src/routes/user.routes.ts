import { Router } from 'express'
import {
  getUserById,
  updateUser,
  updateClientProfile,
  updateLivreurProfile,
  getRestaurateurProfile,
  getLivreurProfile,
  addLivreurDocument,
  updateLivreurDocument,
  addRestaurateurDocument,
  getRestaurantSubAccounts,
  createRestaurantSubAccount,
  updateRestaurantSubAccount,
  updateRestaurantSubAccountPassword,
  deleteRestaurantSubAccount,
  approveRestaurateur,
  approveLivreur,
  listPendingRestaurateurs,
  listPendingLivreurs,
} from '../controllers/user.controller'
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.put('/client/:userId', updateClientProfile)
router.put('/livreur/:userId', updateLivreurProfile)
router.get('/livreur/:userId/profile', getLivreurProfile)
router.post('/livreur/:userId/documents', addLivreurDocument)
router.put('/livreur/:userId/documents/:documentId', updateLivreurDocument)

router.get('/restaurateur/:userId', getRestaurateurProfile)
router.post('/restaurateur/:userId/documents', addRestaurateurDocument)
router.get('/restaurateur/:userId/subaccounts', getRestaurantSubAccounts)
router.post('/restaurateur/:userId/subaccounts', createRestaurantSubAccount)
router.put('/restaurateur/:userId/subaccounts/:subAccountId', updateRestaurantSubAccount)
router.put('/restaurateur/:userId/subaccounts/:subAccountId/password', updateRestaurantSubAccountPassword)
router.delete('/restaurateur/:userId/subaccounts/:subAccountId', deleteRestaurantSubAccount)

router.put('/restaurateur/:userId/approve', authorizeRoles('ADMIN'), approveRestaurateur)
router.put('/livreur/:userId/approve', authorizeRoles('ADMIN'), approveLivreur)
router.get('/pending/restaurateurs', authorizeRoles('ADMIN'), listPendingRestaurateurs)
router.get('/pending/livreurs', authorizeRoles('ADMIN'), listPendingLivreurs)

router.get('/:id', getUserById)
router.put('/:id', updateUser)

export default router
