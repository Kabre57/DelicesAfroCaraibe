import { Request, Response } from 'express'
import { GeolocationService } from '../services/geolocation.service'

const geolocationService = new GeolocationService()

export class GeolocationController {
  async geocode(req: Request, res: Response) {
    try {
      const { address } = req.body

      if (!address) {
        return res.status(400).json({ error: 'Address is required' })
      }

      const result = await geolocationService.geocode(address)

      if (!result) {
        return res.status(404).json({ error: 'Address not found' })
      }

      res.json({ coordinates: result })
    } catch (error: any) {
      console.error('Geocoding error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async calculateDistance(req: Request, res: Response) {
    try {
      const { origin, destination } = req.body

      if (!origin || !destination) {
        return res.status(400).json({ error: 'Origin and destination are required' })
      }

      const result = await geolocationService.calculateDistance(origin, destination)

      if (!result) {
        return res.status(404).json({ error: 'Route not found' })
      }

      res.json(result)
    } catch (error: any) {
      console.error('Distance calculation error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async calculateRoute(req: Request, res: Response) {
    try {
      const { origin, destination, waypoints = [] } = req.body

      if (!origin || !destination) {
        return res.status(400).json({ error: 'Origin and destination are required' })
      }

      const result = await geolocationService.calculateRoute(origin, destination, waypoints)

      if (!result) {
        return res.status(404).json({ error: 'No route found' })
      }

      res.json(result)
    } catch (error: any) {
      console.error('Route calculation error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async findNearby(req: Request, res: Response) {
    try {
      const { location, radius = 5000, type = 'restaurant' } = req.body

      if (!location) {
        return res.status(400).json({ error: 'Location is required' })
      }

      const result = await geolocationService.findNearby(location, radius, type)

      res.json({ places: result })
    } catch (error: any) {
      console.error('Nearby search error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async reverseGeocode(req: Request, res: Response) {
    try {
      const { lat, lng } = req.body

      if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' })
      }

      const result = await geolocationService.reverseGeocode(lat, lng)

      if (!result) {
        return res.status(404).json({ error: 'Address not found' })
      }

      res.json({ address: result })
    } catch (error: any) {
      console.error('Reverse geocoding error:', error)
      res.status(500).json({ error: error.message })
    }
  }
}
