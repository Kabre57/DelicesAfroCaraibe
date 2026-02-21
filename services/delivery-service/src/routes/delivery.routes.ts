import { Router } from 'express'
import {
  getAvailableDeliveries,
  getDeliveriesByLivreur,
  getMyDeliveries,
  acceptDelivery,
  updateDeliveryStatus,
  getDeliveryById,
} from '../controllers/delivery.controller'
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

router.get('/available', authenticate, authorizeRoles('LIVREUR', 'ADMIN'), getAvailableDeliveries)
router.get('/livreur/:livreurId', authenticate, authorizeRoles('LIVREUR', 'ADMIN'), getDeliveriesByLivreur)
router.get('/livreur/me', authenticate, authorizeRoles('LIVREUR', 'ADMIN'), getMyDeliveries)
router.get('/:id', authenticate, authorizeRoles('LIVREUR', 'ADMIN'), getDeliveryById)
router.put('/:id/accept', authenticate, authorizeRoles('LIVREUR', 'ADMIN'), acceptDelivery)
router.put('/:id/status', authenticate, authorizeRoles('LIVREUR', 'ADMIN'), updateDeliveryStatus)

export default router
