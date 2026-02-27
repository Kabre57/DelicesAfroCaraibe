'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Bell,
  Bike,
  ClipboardList,
  Flame,
  Gift,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { notificationAPI, orderAPI, restaurantAPI, userAPI } from '@/lib/api'
import { ShoppingCartButton } from '@/components/cart/ShoppingCartButton'
import { getDeliverySocket, getOrderSocket } from '@/lib/socket'

type ClientSummaryResponse = {
  totalOrders: number
  inProgress: number
  delivered: number
  totalSpent: number
}

type DiscoveryHomeResponse = {
  city?: string | null
  promo: {
    code: string
    title: string
  }
  categories: { name: string; restaurantCount: number; imageUrl?: string | null }[]
  popular: {
    id: string
    name: string
    city: string
    cuisineType: string
    imageUrl?: string | null
    averageRating: number
    reviewCount: number
    startingPrice: number | null
  }[]
  popularDishes: {
    id: string
    name: string
    category: string
    imageUrl?: string | null
    price: number
    orderCount: number
    restaurant: { id: string; name: string; city: string }
  }[]
  newcomers: {
    id: string
    name: string
    city: string
    cuisineType: string
    averageRating: number
    reviewCount: number
  }[]
}

type UserResponse = {
  id: string
  client?: {
    address: string
    city: string
    postalCode: string
  } | null
}

type NotificationItem = {
  id: string
  title: string
  message?: string
  isRead: boolean
  sentAt?: string
}

const categoryCode: Record<string, string> = {
  TIEP: 'TP',
  YASSA: 'YS',
  MAFE: 'MF',
  RIZ: 'RZ',
  SALADE: 'SL',
  BOISSON: 'BS',
  DESSERT: 'DS',
}

const estimatedDeliveryText = (index: number) => {
  const start = 20 + index * 5
  const end = start + 10
  return `${start}-${end} min`
}

const initialsFrom = (text: string) =>
  text
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase() || '')
    .join('')

const resolveImage = (url?: string | null) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const normalized = url.startsWith('/') ? url : `/${url}`
  return `http://localhost:3110${normalized}`
}

export default function ClientDashboard() {
  const router = useRouter()
  const [summary, setSummary] = useState<ClientSummaryResponse | null>(null)
  const [discovery, setDiscovery] = useState<DiscoveryHomeResponse | null>(null)
  const [addressLabel, setAddressLabel] = useState('Adresse de livraison non renseignee')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadOffers, setUnreadOffers] = useState(0)
  const [search, setSearch] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const rawUser = localStorage.getItem('user')
        if (!rawUser) {
          router.push('/auth/login')
          return
        }
        const parsedUser = JSON.parse(rawUser) as { id: string; role: string }
        if (parsedUser.role !== 'CLIENT') {
          router.push('/')
          return
        }
        setCurrentUserId(parsedUser.id)

        const [summaryRes, discoveryRes, userRes] = await Promise.all([
          orderAPI.get<ClientSummaryResponse>('/orders/client/me/summary'),
          restaurantAPI.get<DiscoveryHomeResponse>('/restaurants/discover/home'),
          userAPI.get<UserResponse>(`/users/${parsedUser.id}`),
        ])

        setSummary(summaryRes.data)
        setDiscovery(discoveryRes.data)

        if (userRes.data.client?.address) {
          setAddressLabel(
            `${userRes.data.client.address}, ${userRes.data.client.city} ${userRes.data.client.postalCode}`
          )
        }

        try {
          const notifRes = await notificationAPI.get<NotificationItem[]>(`/notifications/user/${parsedUser.id}`)
          const rows = Array.isArray(notifRes.data) ? notifRes.data : []
          setNotifications(rows.slice(0, 6))
          setUnreadOffers(rows.filter((n) => !n.isRead).length)
        } catch (notifErr) {
          console.error('Notification load error:', notifErr)
          setNotifications([])
          setUnreadOffers(0)
        }
      } catch (error) {
        console.error('Client dashboard load error:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const filtered = useMemo(() => {
    if (!discovery) {
      return { categories: [], popular: [], popularDishes: [], newcomers: [] }
    }
    const q = search.trim().toLowerCase()
    if (!q) return discovery

    return {
      ...discovery,
      categories: discovery.categories.filter((c) => c.name.toLowerCase().includes(q)),
      popular: discovery.popular.filter(
        (r) => r.name.toLowerCase().includes(q) || r.cuisineType.toLowerCase().includes(q)
      ),
      newcomers: discovery.newcomers.filter(
        (r) => r.name.toLowerCase().includes(q) || r.cuisineType.toLowerCase().includes(q)
      ),
    }
  }, [discovery, search])

  const fastDelivery = useMemo(() => filtered.popular.slice(0, 3), [filtered.popular])
  const partners = useMemo(() => filtered.popular.slice(0, 8), [filtered.popular])
  const popularDishes = useMemo(() => filtered.popularDishes?.slice(0, 8) || [], [filtered])

  useEffect(() => {
    if (!currentUserId) return

    const refreshClientRealtimeData = async () => {
      try {
        const [summaryRes, notifRes] = await Promise.all([
          orderAPI.get<ClientSummaryResponse>('/orders/client/me/summary'),
          notificationAPI.get<NotificationItem[]>(`/notifications/user/${currentUserId}`),
        ])
        setSummary(summaryRes.data)
        const rows = Array.isArray(notifRes.data) ? notifRes.data : []
        setNotifications(rows.slice(0, 6))
        setUnreadOffers(rows.filter((n) => !n.isRead).length)
      } catch (error) {
        console.error('Realtime refresh error:', error)
      }
    }

    const orderSocket = getOrderSocket()
    const deliverySocket = getDeliverySocket()
    const onOrderUpdate = () => {
      refreshClientRealtimeData()
    }

    orderSocket.on('order:update', onOrderUpdate)
    deliverySocket.on('order:update', onOrderUpdate)

    return () => {
      orderSocket.off('order:update', onOrderUpdate)
      deliverySocket.off('order:update', onOrderUpdate)
    }
  }, [currentUserId])

  if (loading) return <div className="flex items-center justify-center py-20">Chargement...</div>
  if (!summary || !discovery) return <div className="py-10 text-center text-slate-600">Donnees indisponibles.</div>

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-fuchsia-100 bg-white/90 p-4 shadow-lg shadow-fuchsia-100/40">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Badge className="rounded-full bg-emerald-600">Statut: Connecte</Badge>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 rounded-full border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-50"
              onClick={() => router.push('/client/notifications')}
            >
              <Bell className="h-4 w-4" />
              Notifications
              <Badge className="bg-fuchsia-600 text-white">{unreadOffers}</Badge>
            </Button>
            <ShoppingCartButton />
          </div>
        </div>

        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <MapPin className="mr-1 inline h-4 w-4 text-fuchsia-600" />
          Livrer a: {addressLabel}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Rechercher un plat, un restaurant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200/70 bg-white/95">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Total commandes</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className="text-3xl font-black text-slate-900">{summary.totalOrders}</p>
            <ClipboardList className="h-5 w-5 text-fuchsia-600" />
          </CardContent>
        </Card>
        <Card className="border-slate-200/70 bg-white/95">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">En cours</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className="text-3xl font-black text-slate-900">{summary.inProgress}</p>
            <TrendingUp className="h-5 w-5 text-pink-500" />
          </CardContent>
        </Card>
        <Card className="border-slate-200/70 bg-white/95">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Livrees</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className="text-3xl font-black text-slate-900">{summary.delivered}</p>
            <Bike className="h-5 w-5 text-emerald-600" />
          </CardContent>
        </Card>
        <Card className="border-slate-200/70 bg-white/95">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Depenses totales</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className="text-3xl font-black text-slate-900">{summary.totalSpent.toFixed(2)} EUR</p>
            <Gift className="h-5 w-5 text-fuchsia-500" />
          </CardContent>
        </Card>
      </section>

      <section className="rounded-2xl border border-fuchsia-100 bg-gradient-to-r from-fuchsia-600 to-pink-500 p-5 text-white shadow-lg">
        <p className="mb-1 flex items-center gap-2 text-sm uppercase tracking-wider text-fuchsia-100">
          <Gift className="h-4 w-4" /> Bon plan
        </p>
        <h3 className="text-xl font-black">{discovery.promo.title}</h3>
        <p className="text-sm text-fuchsia-100">Code: {discovery.promo.code}</p>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
        <h2 className="mb-4 text-2xl font-black text-slate-900">Partenaires populaires</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {partners.map((partner) => (
            <button
              key={partner.id}
              onClick={() => router.push(`/restaurants/${partner.id}`)}
              className="flex flex-col items-center rounded-2xl p-3 transition hover:bg-slate-50"
            >
              <div className="h-24 w-24 overflow-hidden rounded-full border border-fuchsia-100 bg-fuchsia-50 sm:h-28 sm:w-28">
                {partner.imageUrl ? (
                  <img
                    src={resolveImage(partner.imageUrl)}
                    alt={partner.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-black text-fuchsia-700">
                    {initialsFrom(partner.name)}
                  </div>
                )}
              </div>
              <span className="mt-2 rounded-xl bg-[#f3e9df] px-3 py-1 text-center text-sm font-black text-[#8a6516]">
                {partner.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
        <h2 className="mb-4 text-2xl font-black text-slate-900">Categories</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {filtered.categories.map((category) => (
            <button
              key={category.name}
              onClick={() => router.push('/restaurants')}
              className="rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow"
            >
              <div className="mb-2 h-20 w-full overflow-hidden rounded-xl bg-slate-100">
                {category.imageUrl ? (
                  <img
                    src={resolveImage(category.imageUrl)}
                    alt={category.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-black text-fuchsia-700">
                    {(categoryCode[category.name.toUpperCase()] || 'CT') + ' '}
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900">{category.name}</p>
              <p className="text-xs text-slate-500">{category.restaurantCount} restaurants</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
        <h2 className="mb-4 text-2xl font-black text-slate-900">Plats populaires</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {popularDishes.map((dish) => (
            <button
              key={dish.id}
              onClick={() => router.push(`/restaurants/${dish.restaurant.id}`)}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:shadow"
            >
              <div className="h-32 w-full overflow-hidden bg-slate-100">
                {dish.imageUrl ? (
                  <img
                    src={resolveImage(dish.imageUrl)}
                    alt={dish.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-black text-fuchsia-700">
                    {initialsFrom(dish.name)}
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="line-clamp-1 font-semibold text-slate-900">{dish.name}</p>
                <p className="line-clamp-1 text-sm text-slate-500">{dish.restaurant.name}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-fuchsia-700">{dish.price.toFixed(2)} EUR</span>
                  <span className="text-slate-500">{dish.orderCount} cmd</span>
                </div>
              </div>
            </button>
          ))}
          {popularDishes.length === 0 && (
            <p className="text-sm text-slate-500">Aucun plat populaire pour le moment.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
        <div className="mb-5 flex items-center gap-2">
          <Flame className="h-5 w-5 text-fuchsia-600" />
          <h2 className="text-2xl font-black text-slate-900">Les plus populaires</h2>
        </div>
        <div className="grid gap-3">
          {filtered.popular.map((restaurant, index) => (
            <Card
              key={restaurant.id}
              className="cursor-pointer border-slate-200/80 bg-white/95 shadow-sm"
              onClick={() => router.push(`/restaurants/${restaurant.id}`)}
            >
              <CardContent className="py-4">
                <p className="font-bold text-slate-900">{restaurant.name}</p>
                <p className="text-sm text-slate-600">
                  Note {Number(restaurant.averageRating || 0).toFixed(1)} ({restaurant.reviewCount} avis) • Livraison {estimatedDeliveryText(index)} • {restaurant.cuisineType}
                </p>
                <p className="text-sm text-slate-600">
                  A partir de {restaurant.startingPrice !== null ? `${restaurant.startingPrice.toFixed(2)} EUR` : 'N/A'}
                </p>
                <Button
                  size="sm"
                  className="mt-3 rounded-full bg-fuchsia-600 hover:bg-fuchsia-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/restaurants/${restaurant.id}`)
                  }}
                >
                  Commander <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {filtered.popular.length === 0 && <p className="text-sm text-slate-500">Aucun restaurant trouve.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
        <div className="mb-5 flex items-center gap-2">
          <Bike className="h-5 w-5 text-sky-500" />
          <h2 className="text-2xl font-black text-slate-900">Livraison rapide</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {fastDelivery.map((restaurant, index) => (
            <Card
              key={restaurant.id}
              className="cursor-pointer border-slate-200/80 bg-white/95 shadow-sm"
              onClick={() => router.push(`/restaurants/${restaurant.id}`)}
            >
              <CardContent className="py-4">
                <p className="font-bold text-slate-900">{restaurant.name}</p>
                <p className="text-sm text-slate-600">
                  Temps estime: {estimatedDeliveryText(Math.max(index - 1, 0))} • {restaurant.city}
                </p>
              </CardContent>
            </Card>
          ))}
          {fastDelivery.length === 0 && <p className="text-sm text-slate-500">Aucune option rapide pour le moment.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
        <div className="mb-5 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-500" />
          <h2 className="text-2xl font-black text-slate-900">Notifications recentes</h2>
        </div>
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{n.title || 'Notification'}</p>
                <Badge className={n.isRead ? 'bg-slate-500' : 'bg-fuchsia-600'}>{n.isRead ? 'Lue' : 'Nouvelle'}</Badge>
              </div>
              {n.message && <p className="text-sm text-slate-600">{n.message}</p>}
              {n.sentAt && <p className="mt-1 text-xs text-slate-500">{new Date(n.sentAt).toLocaleString()}</p>}
            </div>
          ))}
          {notifications.length === 0 && <p className="text-sm text-slate-500">Aucune notification pour le moment.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
        <h2 className="mb-4 text-2xl font-black text-slate-900">Actions rapides</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="justify-start" onClick={() => router.push('/restaurants')}>
            Rechercher un plat
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => router.push('/client/orders')}>
            Suivre mes commandes
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => router.push('/client/favorites')}>
            Voir mes favoris
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => router.push('/client/profile')}>
            Gerer mon profil
          </Button>
        </div>
      </section>
    </div>
  )
}
