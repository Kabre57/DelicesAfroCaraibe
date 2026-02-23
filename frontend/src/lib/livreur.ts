import { chatAPI, deliveryAPI } from '@/lib/api'
import { CourierMetrics, Delivery } from '@/types'

export type ChatMessage = {
  id: string
  orderId: string
  senderId: string
  senderRole: 'CLIENT' | 'LIVREUR' | 'RESTAURATEUR'
  message: string
  timestamp: string
  read: boolean
}

export async function fetchCourierDeliveries() {
  const [availableRes, mineRes] = await Promise.all([
    deliveryAPI.get<Delivery[]>('/deliveries/available'),
    deliveryAPI.get<Delivery[]>('/deliveries/livreur/me'),
  ])
  return {
    available: availableRes.data,
    mine: mineRes.data,
  }
}

export async function fetchCourierMetrics() {
  const response = await deliveryAPI.get<CourierMetrics>('/deliveries/livreur/me/metrics')
  return response.data
}

export async function reportCourierIssue(payload: {
  type: 'SAFETY' | 'CUSTOMER' | 'RESTAURANT' | 'VEHICLE' | 'OTHER'
  message: string
  deliveryId?: string
}) {
  const response = await deliveryAPI.post('/deliveries/support/report', payload)
  return response.data
}

export async function fetchChatHistory(orderId: string) {
  const response = await chatAPI.get<{ messages: ChatMessage[] }>(`/chat/${orderId}/history`)
  return response.data.messages
}
