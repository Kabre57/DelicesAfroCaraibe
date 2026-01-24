import { Router } from 'express'
import {
  getAvailableDeliveries,
  getDeliveriesByLivreur,
  acceptDelivery,
  updateDeliveryStatus,
  getDeliveryById,
} from '../controllers/delivery.controller'

const router = Router()

router.get('/available', getAvailableDeliveries)
router.get('/livreur/:livreurId', getDeliveriesByLivreur)
router.get('/:id', getDeliveryById)
router.put('/:id/accept', acceptDelivery)
router.put('/:id/status', updateDeliveryStatus)

export default router
