import { Router } from 'express'
import {
  getAvailableDeliveries,
  getDeliveriesByLivreur,
  getMyDeliveries,
  getMyCourierMetrics,
  acceptDelivery,
  reportDeliveryIssue,
  updateDeliveryStatus,
  getDeliveryById,
} from '../controllers/delivery.controller'
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

router.get('/available', authenticate, authorizeRoles('LIVREUR', 'ADMIN'), getAvailableDeliveries)
router.get('/livreur/me', authenticate, authorizeRoles('LIVREUR', 'ADMIN'), getMyDeliveries)
router.get('/livreur/me/metrics', authenticate, authorizeRoles('LIVREUR', 'ADMIN'), getMyCourierMetrics)
router.get('/livreur/:livreurId', authenticate, authorizeRoles('LIVREUR', 'ADMIN'), getDeliveriesByLivreur)
router.get('/:id', authenticate, authorizeRoles('LIVREUR', 'ADMIN'), getDeliveryById)
router.put('/:id/accept', authenticate, authorizeRoles('LIVREUR', 'ADMIN'), acceptDelivery)
router.put('/:id/status', authenticate, authorizeRoles('LIVREUR', 'ADMIN'), updateDeliveryStatus)
router.post('/support/report', authenticate, authorizeRoles('LIVREUR', 'ADMIN'), reportDeliveryIssue)

export default router
