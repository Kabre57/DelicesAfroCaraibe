'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, Store, Truck, UtensilsCrossed } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getOrderSocket } from '@/lib/socket'
import { notificationAPI, orderAPI, restaurantAPI } from '@/lib/api'
import { Restaurant } from '@/types'

type DashboardOrder = {
  id: string
  status: string
  createdAt: string
  restaurantName: string | null
  client: { firstName: string; lastName: string; phone: string } | null
  notes?: string
  items: { id: string; quantity: number; menuItemName: string | null }[]
  delivery: { status: string; livreurName: string | null } | null
}

type RestaurateurDashboardResponse = {
  restaurants: Restaurant[]
  summary: {
    ordersToday: number
    revenueToday: number
    toPrepare: number
    deltaVsYesterdayPercent: number
  }
  activeOrders: DashboardOrder[]
  popularMenuItems: { menuItemId: string; menuItemName: string; quantity: number }[]
  delivery: {
    assigned: number
    waitingCourier: number
  }
}

const statusBadgeClass: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PREPARING: 'bg-violet-100 text-violet-800 border-violet-200',
  READY: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

export default function RestaurateurDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<RestaurateurDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null)

  const loadDashboard = async () => {
    try {
      const res = await restaurantAPI.get<RestaurateurDashboardResponse>('/restaurants/my/dashboard')
      setData(res.data)
      if (!selectedRestaurant && res.data.restaurants[0]) {
        setSelectedRestaurant(res.data.restaurants[0].id)
      }
    } catch (e) {
      console.error(e)
      setError('Impossible de charger le dashboard restaurateur.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'RESTAURATEUR') {
      router.push('/')
      return
    }
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  useEffect(() => {
    const socket = getOrderSocket()
    const onUpdate = () => {
      loadDashboard()
    }
    socket.on('order:update', onUpdate)
    return () => {
      socket.off('order:update', onUpdate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedRestaurantData = useMemo(() => {
    if (!data || !selectedRestaurant) return null
    return data.restaurants.find((restaurant) => restaurant.id === selectedRestaurant) || null
  }, [data, selectedRestaurant])

  const filteredOrders = useMemo(() => {
    if (!data) return []
    if (!selectedRestaurantData) return data.activeOrders
    return data.activeOrders.filter((order) => order.restaurantName === selectedRestaurantData.name)
  }, [data, selectedRestaurantData])

  const deliverySplit = useMemo(() => {
    const assigned = filteredOrders.filter((order) => Boolean(order.delivery?.livreurName))
    const waiting = filteredOrders.filter((order) => !order.delivery?.livreurName)
    return { assigned, waiting }
  }, [filteredOrders])

  const incomingOrders = useMemo(
    () => filteredOrders.filter((order) => ['PENDING', 'CONFIRMED'].includes(order.status)),
    [filteredOrders]
  )
  const preparingOrders = useMemo(
    () => filteredOrders.filter((order) => order.status === 'PREPARING'),
    [filteredOrders]
  )
  const readyOrders = useMemo(
    () => filteredOrders.filter((order) => order.status === 'READY'),
    [filteredOrders]
  )

  const handleOrderStatus = async (
    orderId: string,
    status: 'CONFIRMED' | 'PREPARING' | 'READY' | 'CANCELLED'
  ) => {
    try {
      setError('')
      setNotice('')
      await orderAPI.put(`/orders/${orderId}/status`, { status })
      setNotice(`Commande #${orderId.slice(0, 8)} mise a jour: ${status}.`)
      await loadDashboard()
    } catch (e) {
      console.error(e)
      setError('Impossible de mettre a jour le statut de la commande.')
    }
  }

  const reportIssue = async (order: DashboardOrder) => {
    try {
      setError('')
      setNotice('')
      const raw = localStorage.getItem('user')
      const parsed = raw ? JSON.parse(raw) : null
      if (!parsed?.id) return

      await notificationAPI.post('/notifications/send', {
        userId: parsed.id,
        type: 'SUPPORT',
        title: `Probleme commande ${order.id.slice(0, 8)}`,
        message: `Signalement restaurateur sur la commande ${order.id.slice(0, 8)}.`,
      })
      setNotice(`Signalement envoye pour la commande #${order.id.slice(0, 8)}.`)
    } catch (e) {
      console.error(e)
      setError("Impossible d'envoyer le signalement.")
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>
  if (error && !data) return <div className="p-6 text-red-600">{error}</div>
  if (!data) return <div className="p-6 text-red-600">Donnees indisponibles.</div>

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white shadow-2xl shadow-orange-200/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100">espace restaurateur</p>
            <h1 className="text-3xl font-black">{selectedRestaurantData?.name || 'Gestion du restaurant'}</h1>
            <p className="mt-1 text-sm text-amber-100">
              <span className="font-semibold">4.8</span> - {selectedRestaurantData?.isActive ? 'Ouvert' : 'Ferme'}
            </p>
          </div>
          <Store className="h-10 w-10 text-amber-100" />
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{notice}</div>}

      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
        <h2 className="mb-3 text-lg font-black text-slate-900">Apercu du jour</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="border-white/60 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black">{data.summary.ordersToday}</p>
            </CardContent>
          </Card>
          <Card className="border-white/60 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">CA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black">{data.summary.revenueToday.toFixed(2)} EUR</p>
            </CardContent>
          </Card>
          <Card className="border-white/60 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">A preparer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black">{data.summary.toPrepare}</p>
            </CardContent>
          </Card>
          <Card className="border-white/60 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Vs hier</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black">{data.summary.deltaVsYesterdayPercent}%</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900">Commandes a traiter ({incomingOrders.length})</h2>
        <div className="grid gap-3">
          {incomingOrders.map((order) => (
            <Card key={order.id} className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/40">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    #{order.id.slice(0, 8)} -{' '}
                    {new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    - {order.client ? `${order.client.firstName} ${order.client.lastName}` : 'Client'}
                  </CardTitle>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      statusBadgeClass[order.status] || 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.items.map((item) => (
                  <p key={item.id} className="text-sm text-slate-700">
                    {item.quantity}x {item.menuItemName || 'Plat'}
                  </p>
                ))}
                {order.notes && <p className="text-sm text-amber-700">Instructions: {order.notes}</p>}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button className="rounded-full" onClick={() => handleOrderStatus(order.id, 'CONFIRMED')}>
                    CONFIRMER
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => handleOrderStatus(order.id, 'PREPARING')}
                  >
                    EN PREPARATION
                  </Button>
                  {order.client?.phone && (
                    <a href={`tel:${order.client.phone}`}>
                      <Button variant="outline" className="rounded-full">
                        CONTACTER CLIENT
                      </Button>
                    </a>
                  )}
                  <Button variant="outline" className="rounded-full" onClick={() => reportIssue(order)}>
                    PROBLEME
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={() => handleOrderStatus(order.id, 'CANCELLED')}>
                    REFUSER
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {incomingOrders.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-slate-600">
              Aucune commande entrante.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-violet-200/80 bg-white/90 shadow-lg shadow-violet-100/40">
          <CardHeader>
            <CardTitle>En preparation ({preparingOrders.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {preparingOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="rounded-xl border border-violet-100 bg-violet-50/40 p-3">
                <p className="font-semibold">#{order.id.slice(0, 8)} - {order.client ? `${order.client.firstName} ${order.client.lastName}` : 'Client'}</p>
                <p className="text-sm text-slate-600">
                  {order.items.reduce((sum, i) => sum + i.quantity, 0)} article(s)
                </p>
                <div className="mt-2">
                  <Button size="sm" className="rounded-full" onClick={() => handleOrderStatus(order.id, 'READY')}>
                    MARQUER PRETE
                  </Button>
                </div>
              </div>
            ))}
            {preparingOrders.length === 0 && <p className="text-sm text-slate-600">Aucune commande en preparation.</p>}
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-white/90 shadow-lg shadow-emerald-100/40">
          <CardHeader>
            <CardTitle>Pretes a livrer ({readyOrders.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {readyOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                <p className="font-semibold">#{order.id.slice(0, 8)}</p>
                <p className="text-sm text-slate-600">
                  {order.delivery?.livreurName
                    ? `Livreur assigne: ${order.delivery.livreurName}`
                    : 'En attente de livreur'}
                </p>
              </div>
            ))}
            {readyOrders.length === 0 && <p className="text-sm text-slate-600">Aucune commande prete.</p>}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-orange-600" />
              Gestion du menu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            {data.popularMenuItems.length === 0 ? (
              <p>Aucune donnee menu aujourd'hui.</p>
            ) : (
              data.popularMenuItems.map((item) => (
                <p key={item.menuItemId}>
                  <Flame className="mr-2 inline h-4 w-4 text-orange-500" />
                  {item.menuItemName} ({item.quantity} cmd)
                </p>
              ))
            )}
            <div className="pt-2 flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => router.push('/restaurateur/menu')}>
                GERER LE MENU
              </Button>
              <Button className="rounded-full" onClick={() => router.push('/restaurateur/menu')}>
                AJOUTER UN PLAT
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-600" />
              Livraisons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p className="font-semibold">Livreur assigne:</p>
            {deliverySplit.assigned.length === 0 ? (
              <p className="text-slate-500">Aucune commande assignee.</p>
            ) : (
              deliverySplit.assigned.slice(0, 3).map((order) => (
                <p key={order.id}>
                  {order.delivery?.livreurName} - #{order.id.slice(0, 8)}
                </p>
              ))
            )}
            <Separator />
            <p className="font-semibold">En attente de livreur:</p>
            {deliverySplit.waiting.length === 0 ? (
              <p className="text-slate-500">Aucune commande en attente.</p>
            ) : (
              <p>{deliverySplit.waiting.map((order) => `#${order.id.slice(0, 8)}`).join(', ')}</p>
            )}
            <div className="pt-2">
              <Button variant="outline" className="rounded-full">
                VOIR TOUS LES LIVREURS
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900">Selection restaurant</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {data.restaurants.map((restaurant) => (
            <Card
              key={restaurant.id}
              className={`cursor-pointer border transition hover:-translate-y-0.5 hover:shadow-xl ${
                selectedRestaurant === restaurant.id
                  ? 'border-orange-300 bg-orange-50/70 shadow-orange-100'
                  : 'border-slate-200/80 bg-white/90 shadow-slate-200/50'
              }`}
              onClick={() => setSelectedRestaurant(restaurant.id)}
            >
              {restaurant.imageUrl && (
                <div className="h-28 w-full overflow-hidden rounded-t-xl">
                  <img src={restaurant.imageUrl} alt={restaurant.name} className="h-full w-full object-cover" />
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <span>{restaurant.name}</span>
                  <Badge variant={restaurant.isActive ? 'default' : 'outline'}>
                    {restaurant.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-slate-500">{restaurant.cuisineType}</p>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
