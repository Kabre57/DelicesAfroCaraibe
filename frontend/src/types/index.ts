export enum UserRole {
  CLIENT = 'CLIENT',
  RESTAURATEUR = 'RESTAURATEUR',
  LIVREUR = 'LIVREUR',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  IN_DELIVERY = 'IN_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum DeliveryStatus {
  WAITING = 'WAITING',
  ACCEPTED = 'ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  ON_ROUTE = 'ON_ROUTE',
  DELIVERED = 'DELIVERED',
}

export interface User {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  phone: string
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  userId: string
  address: string
  city: string
  postalCode: string
}

export interface Restaurant {
  id: string
  restaurateurId: string
  name: string
  description?: string
  address: string
  city: string
  postalCode: string
  phone: string
  cuisineType: string
  openingHours: any
  imageUrl?: string
  isActive: boolean
  isOpen?: boolean
  rating?: number
  createdAt: string
  updatedAt: string
}

export interface MenuItem {
  id: string
  restaurantId: string
  name: string
  description?: string
  price: number
  category: string
  imageUrl?: string
  isAvailable: boolean
  available?: boolean
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  clientId: string
  restaurantId: string
  status: OrderStatus
  totalAmount: number
  deliveryAddress: string
  deliveryCity: string
  deliveryPostalCode: string
  notes?: string
  createdAt: string
  updatedAt: string
  orderItems?: OrderItem[]
  restaurant?: Restaurant
  payment?: Payment
  delivery?: Delivery
}

export interface OrderItem {
  id: string
  orderId: string
  menuItemId: string
  quantity: number
  price: number
  menuItem?: MenuItem
}

export interface Payment {
  id: string
  orderId: string
  amount: number
  status: PaymentStatus
  paymentMethod: string
  transactionId?: string
  createdAt: string
  updatedAt: string
}

export interface Livreur {
  id: string
  userId: string
  vehicleType: string
  licensePlate?: string
  coverageZones: string[]
  isAvailable: boolean
}

export interface Delivery {
  id: string
  orderId: string
  livreurId?: string
  status: DeliveryStatus
  pickupAddress: string
  deliveryAddress: string
  estimatedTime?: number
  actualTime?: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  order?: Order
  livreur?: Livreur
}

export interface CourierPayout {
  deliveryId: string
  orderId: string
  deliveredAt: string
  orderTotal: number
  gross: number
  platformCommission: number
  net: number
}

export interface CourierMetrics {
  earnings: {
    today: number
    week: number
    total: number
    formula: {
      baseFee: number
      variableRate: number
      platformCommissionRate: number
    }
  }
  stats: {
    deliveriesCount: number
    acceptanceRate: number
    cancellationRate: number
    averageWaitMinutes: number
  }
  payouts: CourierPayout[]
}

export interface Review {
  id: string
  orderId: string
  clientId: string
  restaurantId: string
  rating: number
  comment?: string
  createdAt: string
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
}
