import { Client } from '@googlemaps/google-maps-services-js'

export class GeolocationService {
  private client: Client

  constructor() {
    this.client = new Client({})
  }

  async geocode(address: string) {
    try {
      const response = await this.client.geocode({
        params: {
          address,
          key: process.env.GOOGLE_MAPS_API_KEY || '',
        },
      })

      if (response.data.results.length === 0) {
        return null
      }

      return response.data.results[0].geometry.location
    } catch (error) {
      console.error('Geocode error:', error)
      throw error
    }
  }

  async reverseGeocode(lat: number, lng: number) {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: process.env.GOOGLE_MAPS_API_KEY || '',
        },
      })

      if (response.data.results.length === 0) {
        return null
      }

      return response.data.results[0].formatted_address
    } catch (error) {
      console.error('Reverse geocode error:', error)
      throw error
    }
  }

  async calculateDistance(origin: string, destination: string) {
    try {
      const response = await this.client.distancematrix({
        params: {
          origins: [origin],
          destinations: [destination],
          key: process.env.GOOGLE_MAPS_API_KEY || '',
        },
      })

      const element = response.data.rows[0].elements[0]

      if (element.status !== 'OK') {
        return null
      }

      return {
        distance: element.distance,
        duration: element.duration,
      }
    } catch (error) {
      console.error('Calculate distance error:', error)
      throw error
    }
  }

  async calculateRoute(origin: string, destination: string, waypoints: string[] = []) {
    try {
      const response = await this.client.directions({
        params: {
          origin,
          destination,
          waypoints,
          key: process.env.GOOGLE_MAPS_API_KEY || '',
        },
      })

      if (response.data.routes.length === 0) {
        return null
      }

      const route = response.data.routes[0]
      
      return {
        distance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0),
        duration: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0),
        polyline: route.overview_polyline.points,
        steps: route.legs[0].steps,
      }
    } catch (error) {
      console.error('Calculate route error:', error)
      throw error
    }
  }

  async findNearby(location: { lat: number; lng: number }, radius: number, type: string) {
    try {
      const response = await this.client.placesNearby({
        params: {
          location,
          radius,
          type,
          key: process.env.GOOGLE_MAPS_API_KEY || '',
        },
      })

      return response.data.results
    } catch (error) {
      console.error('Find nearby error:', error)
      throw error
    }
  }
}
