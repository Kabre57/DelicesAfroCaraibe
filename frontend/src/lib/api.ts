import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost'

// Resolve service URL: prefer explicit env (NEXT_PUBLIC_*_API), otherwise default to
// localhost with the host-mapped port used in docker-compose (3101..3112).
const resolveServiceUrl = (serviceEnv: string | undefined, defaultPort: number) => {
  if (serviceEnv) {
    return serviceEnv
  }
  return `${API_BASE_URL}:${defaultPort}`
}

export const authAPI = axios.create({
  baseURL: `${resolveServiceUrl(process.env.NEXT_PUBLIC_AUTH_API, 3101)}/api`,
})

export const userAPI = axios.create({
  baseURL: `${resolveServiceUrl(process.env.NEXT_PUBLIC_USER_API, 3102)}/api`,
})

export const restaurantAPI = axios.create({
  baseURL: `${resolveServiceUrl(process.env.NEXT_PUBLIC_RESTAURANT_API, 3103)}/api`,
})

export const orderAPI = axios.create({
  baseURL: `${resolveServiceUrl(process.env.NEXT_PUBLIC_ORDER_API, 3104)}/api`,
})

export const deliveryAPI = axios.create({
  baseURL: `${resolveServiceUrl(process.env.NEXT_PUBLIC_DELIVERY_API, 3105)}/api`,
})

export const paymentAPI = axios.create({
  baseURL: `${resolveServiceUrl(process.env.NEXT_PUBLIC_PAYMENT_API, 3106)}/api`,
})

const apis = [authAPI, userAPI, restaurantAPI, orderAPI, deliveryAPI, paymentAPI]

apis.forEach(api => {
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/auth/login'
      }
      return Promise.reject(error)
    }
  )
})
