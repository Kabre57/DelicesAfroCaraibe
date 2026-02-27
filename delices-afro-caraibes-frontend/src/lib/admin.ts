import { orderAPI, userAPI } from '@/lib/api'

export interface PendingResto {
  id: string
  user: { id: string; email: string; firstName: string; lastName: string; phone: string }
  restaurants: { id: string; name: string; city: string }[]
}

export interface PendingLivreur {
  id: string
  user: { id: string; email: string; firstName: string; lastName: string; phone: string }
  vehicleType: string
  licensePlate?: string
  coverageZones: string[]
}

export type AdminOverview = {
  kpis: {
    ordersToday: number
    restaurantsActive: number
    livreursActive: number
    averageRating: number
    revenueToday: number
    deltaVsYesterdayPercent: number
    usersTotal: number
  }
  charts: {
    ordersByHour: { hour: number; orders: number; revenue: number }[]
  }
  alerts: { type: string; level: string; count: number; message: string }[]
  topRestaurants: {
    restaurantId: string
    name: string
    orders: number
    revenue: number
    averageRating: number
  }[]
  users: {
    recent: {
      id: string
      email: string
      role: string
      firstName: string
      lastName: string
      createdAt: string
    }[]
    newClients24h: number
    newRestaurateurs24h: number
    newLivreurs24h: number
    pendingRestaurateurs: number
    pendingLivreurs: number
  }
  finance: {
    monthlyRevenue: number
    monthlyGoal: number
    monthlyProgressPercent: number
    pendingPaymentsAmount: number
    commissionAveragePercent: number
  }
}

export async function fetchAdminBundle() {
  const [overviewRes, pendingRestosRes, pendingLivreursRes] = await Promise.all([
    orderAPI.get<AdminOverview>('/orders/admin/overview'),
    userAPI.get<PendingResto[]>('/users/pending/restaurateurs'),
    userAPI.get<PendingLivreur[]>('/users/pending/livreurs'),
  ])

  return {
    overview: overviewRes.data,
    pendingRestos: pendingRestosRes.data,
    pendingLivreurs: pendingLivreursRes.data,
  }
}

export type AdminConfig = {
  platformName: string
  supportEmail: string
  supportPhone: string
  currency: string
  defaultCommissionPercent: number
  courierBaseFee: number
  courierVariableRate: number
  courierPlatformCommissionRate: number
  courierMinWithdrawalAmount: number
  twoFactorRequired: boolean
  dailyReportEnabled: boolean
}

export type AdminSupportTicket = {
  id: string
  title: string
  sentAt: string
  isRead: boolean
  userId: string
  message?: string
  category?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status?: 'OPEN' | 'IN_PROGRESS' | 'CLOSED'
  relatedUserId?: string | null
  assignedTo?: string | null
  resolution?: string | null
  updatedAt?: string
}

export type AdminTransactionsResponse = {
  page: number
  pageSize: number
  total: number
  totals: {
    transactions: number
    amount: number
  }
  byStatus: {
    status: string
    count: number
    amount: number
  }[]
  data: {
    id: string
    amount: number
    status: string
    paymentMethod: string
    transactionId?: string
    createdAt: string
    order?: {
      id: string
      status: string
      totalAmount: number
      restaurant?: { id: string; name: string; city: string }
      client?: { id: string; firstName: string; lastName: string; email: string; phone: string }
      delivery?: {
        id: string
        status: string
        livreur?: { id: string; firstName: string; lastName: string; phone: string } | null
      } | null
    } | null
  }[]
}

export type AdminAuditLog = {
  id: string
  actorUserId: string
  action: string
  sentAt: string
  entityType?: string
  entityId?: string | null
  details?: Record<string, unknown>
}

export async function fetchAdminConfig() {
  const res = await orderAPI.get<AdminConfig>('/orders/admin/config')
  return res.data
}

export async function updateAdminConfig(config: Partial<AdminConfig>) {
  const res = await orderAPI.put('/orders/admin/config', { config })
  return res.data
}

export async function createAdminSupportTicket(payload: {
  subject: string
  message: string
  category?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  relatedUserId?: string
}) {
  const res = await orderAPI.post('/orders/admin/support/tickets', payload)
  return res.data
}

export async function fetchAdminSupportTickets(filters?: {
  status?: string
  priority?: string
}) {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.priority) params.set('priority', filters.priority)
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await orderAPI.get<AdminSupportTicket[]>(`/orders/admin/support/tickets${query}`)
  return res.data
}

export async function updateAdminSupportTicket(
  id: string,
  payload: { status?: string; resolution?: string; assignedTo?: string }
) {
  const res = await orderAPI.put(`/orders/admin/support/tickets/${id}`, payload)
  return res.data
}

export async function fetchAdminTransactions(filters?: {
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}) {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters?.dateTo) params.set('dateTo', filters.dateTo)
  if (filters?.page) params.set('page', String(filters.page))
  if (filters?.pageSize) params.set('pageSize', String(filters.pageSize))
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await orderAPI.get<AdminTransactionsResponse>(`/orders/admin/transactions${query}`)
  return res.data
}

export async function fetchAdminAuditLogs(filters?: {
  action?: string
  actorUserId?: string
}) {
  const params = new URLSearchParams()
  if (filters?.action) params.set('action', filters.action)
  if (filters?.actorUserId) params.set('actorUserId', filters.actorUserId)
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await orderAPI.get<AdminAuditLog[]>(`/orders/admin/audit-logs${query}`)
  return res.data
}
