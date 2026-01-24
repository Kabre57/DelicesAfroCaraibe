import { Router } from 'express'
import { GeolocationController } from '../controllers/geolocation.controller'

const router = Router()
const controller = new GeolocationController()

router.post('/geocode', controller.geocode.bind(controller))
router.post('/reverse-geocode', controller.reverseGeocode.bind(controller))
router.post('/distance', controller.calculateDistance.bind(controller))
router.post('/route', controller.calculateRoute.bind(controller))
router.post('/nearby', controller.findNearby.bind(controller))

export default router
