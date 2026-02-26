'use client'

import { useEffect, useMemo, useState } from 'react'
import { ListFilter, Phone, Search, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { orderAPI, restaurantAPI } from '@/lib/api'
import { Restaurant } from '@/types'

type DashboardResponse = {
  restaurants: Restaurant[]
}

type RestaurantOrder = {
  id: string
  status: string
  totalAmount: number
  createdAt: string
  delivery?: { status: string } | null
  client?: { user?: { firstName: string; lastName: string } } | null
  orderItems?: { id: string; quantity: number }[]
}

type OrderDetail = {
  id: string
  status: string
  totalAmount: number
  deliveryAddress: string
  deliveryCity: string
  deliveryPostalCode: string
  notes?: string
  createdAt: string
  orderItems: { id: string; quantity: number; price: number; menuItem?: { name: string } | null }[]
  client?: { user?: { firstName: string; lastName: string; phone?: string; email?: string } } | null
  delivery?: {
    status: string
    livreur?: { user?: { firstName: string; lastName: string; phone?: string } } | null
  } | null
}

const statuses = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'IN_DELIVERY', 'DELIVERED', 'CANCELLED'] as const

export default function RestaurateurOrdersPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('')
  const [orders, setOrders] = useState<RestaurantOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>('ALL')
  const [search, setSearch] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)

  const loadRestaurants = async () => {
    const res = await restaurantAPI.get<DashboardResponse>('/restaurants/my/dashboard')
    setRestaurants(res.data.restaurants)
    const firstId = res.data.restaurants[0]?.id || ''
    setSelectedRestaurantId((prev) => prev || firstId)
    return firstId
  }

  const loadOrders = async (restaurantId: string, status: string) => {
    if (!restaurantId) return
    const query = status !== 'ALL' ? `?status=${status}` : ''
    const res = await orderAPI.get<RestaurantOrder[]>(`/orders/restaurant/${restaurantId}${query}`)
    setOrders(res.data)
  }

  useEffect(() => {
    const init = async () => {
      try {
        setError('')
        const firstId = await loadRestaurants()
        await loadOrders(firstId, statusFilter)
      } catch (e) {
        console.error(e)
        setError('Impossible de charger les commandes.')
      } finally {
        setLoading(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedRestaurantId) return
    loadOrders(selectedRestaurantId, statusFilter).catch((e) => {
      console.error(e)
      setError('Impossible de filtrer les commandes.')
    })
  }, [selectedRestaurantId, statusFilter])

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return orders
    return orders.filter((order) => {
      const fullName = `${order.client?.user?.firstName || ''} ${order.client?.user?.lastName || ''}`.toLowerCase()
      return order.id.toLowerCase().includes(q) || fullName.includes(q)
    })
  }, [orders, search])

  const counts = useMemo(() => {
    return {
      pending: orders.filter((o) => ['PENDING', 'CONFIRMED'].includes(o.status)).length,
      preparing: orders.filter((o) => o.status === 'PREPARING').length,
      ready: orders.filter((o) => o.status === 'READY').length,
      delivered: orders.filter((o) => o.status === 'DELIVERED').length,
    }
  }, [orders])

  const toPrepare = filteredOrders.filter((o) => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status))
  const history = filteredOrders.filter((o) => ['DELIVERED', 'CANCELLED'].includes(o.status))

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await orderAPI.put(`/orders/${orderId}/status`, { status })
      await loadOrders(selectedRestaurantId, statusFilter)
    } catch (e) {
      console.error(e)
      setError('Action commande impossible.')
    }
  }

  const openOrderDetail = async (orderId: string) => {
    try {
      const res = await orderAPI.get<OrderDetail>(`/orders/${orderId}`)
      setSelectedOrder(res.data)
      setDetailOpen(true)
    } catch (e) {
      console.error(e)
      setError('Impossible de charger le detail de la commande.')
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-slate-900">Gestion des commandes</h1>
          <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
            <SelectTrigger className="w-[260px] rounded-xl">
              <SelectValue placeholder="Restaurant" />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map((restaurant) => (
                <SelectItem key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <Card className="border-slate-200/70 bg-white/90">
        <CardContent className="pt-5">
          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as (typeof statuses)[number])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher commande ou client"
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/70 bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-amber-600" />
            Repartition
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">En attente: <strong>{counts.pending}</strong></div>
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm">En prepa: <strong>{counts.preparing}</strong></div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">Pretes: <strong>{counts.ready}</strong></div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">Livrees: <strong>{counts.delivered}</strong></div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-slate-900">En attente de confirmation ({toPrepare.length})</h2>
        <div className="grid gap-3">
          {toPrepare.map((order) => (
            <Card key={order.id} className="border-slate-200/80 bg-white/90">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    #{order.id.slice(0, 8)} - {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <Badge variant="outline">{order.status}</Badge>
                </div>
                <p className="text-sm text-slate-600">
                  {order.orderItems?.length || 0} plats - {order.totalAmount.toFixed(2)} EUR -{' '}
                  {order.client?.user ? `${order.client.user.firstName} ${order.client.user.lastName}` : 'Client'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => openOrderDetail(order.id)}>
                    VOIR
                  </Button>
                  <Button size="sm" className="rounded-full" onClick={() => updateStatus(order.id, 'CONFIRMED')}>
                    CONFIRMER
                  </Button>
                  <Button size="sm" variant="secondary" className="rounded-full" onClick={() => updateStatus(order.id, 'PREPARING')}>
                    EN PREPARATION
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => updateStatus(order.id, 'CANCELLED')}>
                    REFUSER
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {toPrepare.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-600">
              Aucune commande a traiter.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-slate-900">Historique du jour</h2>
        <div className="grid gap-2">
          {history.slice(0, 10).map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <p>
                #{order.id.slice(0, 8)} -{' '}
                {order.client?.user ? `${order.client.user.firstName} ${order.client.user.lastName}` : 'Client'} -{' '}
                {order.totalAmount.toFixed(2)} EUR
              </p>
              <Badge variant="outline">{order.status}</Badge>
            </div>
          ))}
          {history.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-600">
              Aucun historique pour le moment.
            </p>
          )}
        </div>
      </section>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Commande #{selectedOrder?.id.slice(0, 8) || '-'}
            </DialogTitle>
            <DialogDescription>
              Detail complet et actions de suivi.
            </DialogDescription>
          </DialogHeader>

          {!selectedOrder ? (
            <p className="text-sm text-slate-600">Chargement...</p>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge>{selectedOrder.status}</Badge>
                <span className="text-slate-500">
                  {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <p className="font-semibold">Client</p>
                <p>
                  {selectedOrder.client?.user
                    ? `${selectedOrder.client.user.firstName} ${selectedOrder.client.user.lastName}`
                    : 'Client'}
                </p>
                <p className="text-slate-600">
                  {selectedOrder.deliveryAddress}, {selectedOrder.deliveryCity} {selectedOrder.deliveryPostalCode}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 font-semibold">Lignes commande</p>
                <div className="space-y-1">
                  {selectedOrder.orderItems.map((item) => (
                    <p key={item.id}>
                      {item.quantity}x {item.menuItem?.name || 'Plat'} - {(item.price * item.quantity).toFixed(2)} EUR
                    </p>
                  ))}
                </div>
                {selectedOrder.notes && (
                  <p className="mt-2 text-amber-700">Instructions: {selectedOrder.notes}</p>
                )}
                <p className="mt-2 font-semibold">Total: {selectedOrder.totalAmount.toFixed(2)} EUR</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <p className="font-semibold">Livraison</p>
                <p>
                  {selectedOrder.delivery?.livreur?.user
                    ? `${selectedOrder.delivery.livreur.user.firstName} ${selectedOrder.delivery.livreur.user.lastName}`
                    : 'Livreur non assigne'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedOrder?.client?.user?.phone && (
              <a href={`tel:${selectedOrder.client.user.phone}`}>
                <Button variant="outline">
                  <Phone className="mr-2 h-4 w-4" />
                  Contacter client
                </Button>
              </a>
            )}
            {selectedOrder?.delivery?.livreur?.user?.phone && (
              <a href={`tel:${selectedOrder.delivery.livreur.user.phone}`}>
                <Button variant="outline">
                  <Truck className="mr-2 h-4 w-4" />
                  Contacter livreur
                </Button>
              </a>
            )}
            {selectedOrder && (
              <Button onClick={() => updateStatus(selectedOrder.id, 'READY')}>Marquer prete</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
