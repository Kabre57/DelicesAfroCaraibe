import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost'

export const authAPI = axios.create({
  baseURL: `${API_BASE_URL}:3001/api`,
})

export const userAPI = axios.create({
  baseURL: `${API_BASE_URL}:3002/api`,
})

export const restaurantAPI = axios.create({
  baseURL: `${API_BASE_URL}:3003/api`,
})

export const orderAPI = axios.create({
  baseURL: `${API_BASE_URL}:3004/api`,
})

export const deliveryAPI = axios.create({
  baseURL: `${API_BASE_URL}:3005/api`,
})

export const paymentAPI = axios.create({
  baseURL: `${API_BASE_URL}:3006/api`,
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
