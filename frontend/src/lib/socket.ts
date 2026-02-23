'use client'

import { io, Socket } from 'socket.io-client'

let orderSocket: Socket | null = null
let deliverySocket: Socket | null = null

const ORDER_WS = process.env.NEXT_PUBLIC_ORDER_WS ?? 'http://localhost:3104'
const DELIVERY_WS = process.env.NEXT_PUBLIC_DELIVERY_WS ?? 'http://localhost:3105'

export function getOrderSocket() {
  if (!orderSocket) {
    orderSocket = io(ORDER_WS, { transports: ['websocket'] })
  }
  return orderSocket
}

export function getDeliverySocket() {
  if (!deliverySocket) {
    deliverySocket = io(DELIVERY_WS, { transports: ['websocket'] })
  }
  return deliverySocket
}
