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

type ClientSummaryResponse = {
  totalOrders: number
  inProgress: number
  delivered: number
  totalSpent: number
}

type DiscoveryHomeResponse = {
  promo: {
    code: string
    title: string
  }
  categories: { name: string; restaurantCount: number }[]
  popular: {
    id: string
    name: string
    city: string
    cuisineType: string
    averageRating: number
    reviewCount: number
    startingPrice: number | null
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

const categoryEmoji: Record<string, string> = {
  TIEP: '🍛',
  YASSA: '🍗',
  MAFE: '🥘',
  RIZ: '🍚',
  SALADE: '🥗',
  BOISSON: '🧃',
  DESSERT: '🍰',
}

const estimatedDeliveryText = (index: number) => {
  const start = 20 + index * 5
  const end = start + 10
  return `${start}-${end} min`
}

export default function ClientDashboard() {
  const router = useRouter()
  const [summary, setSummary] = useState<ClientSummaryResponse | null>(null)
  const [discovery, setDiscovery] = useState<DiscoveryHomeResponse | null>(null)
  const [addressLabel, setAddressLabel] = useState('Adresse de livraison non renseignee')
  const [unreadOffers, setUnreadOffers] = useState(0)
  const [search, setSearch] = useState('')
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

        const [summaryRes, discoveryRes, userRes, notificationsRes] = await Promise.all([
          orderAPI.get<ClientSummaryResponse>('/orders/client/me/summary'),
          restaurantAPI.get<DiscoveryHomeResponse>('/restaurants/discover/home'),
          userAPI.get<UserResponse>(`/users/${parsedUser.id}`),
          notificationAPI.get(`/notifications/user/${parsedUser.id}?isRead=false`),
        ])

        setSummary(summaryRes.data)
        setDiscovery(discoveryRes.data)

        if (userRes.data.client?.address) {
          setAddressLabel(
            `${userRes.data.client.address}, ${userRes.data.client.city} ${userRes.data.client.postalCode}`
          )
        }

        setUnreadOffers(Array.isArray(notificationsRes.data) ? notificationsRes.data.length : 0)
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
      return { categories: [], popular: [], newcomers: [] }
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

  if (loading) return <div className="flex items-center justify-center py-20">Chargement...</div>
  if (!summary || !discovery) return <div className="py-10 text-center text-slate-600">Donnees indisponibles.</div>

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-lg shadow-orange-100/40">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Badge className="rounded-full bg-emerald-600">Statut: Connecte</Badge>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 rounded-full">
              <Bell className="h-4 w-4" />
              Nouv. offres
              <Badge variant="secondary">{unreadOffers}</Badge>
            </Button>
            <ShoppingCartButton />
          </div>
        </div>

        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <MapPin className="mr-1 inline h-4 w-4 text-orange-500" />
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
            <ClipboardList className="h-5 w-5 text-orange-500" />
          </CardContent>
        </Card>
        <Card className="border-slate-200/70 bg-white/95">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">En cours</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className="text-3xl font-black text-slate-900">{summary.inProgress}</p>
            <TrendingUp className="h-5 w-5 text-amber-500" />
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
            <Gift className="h-5 w-5 text-rose-500" />
          </CardContent>
        </Card>
      </section>

      <section className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-500 to-red-500 p-5 text-white shadow-lg">
        <p className="mb-1 flex items-center gap-2 text-sm uppercase tracking-wider text-orange-100">
          <Gift className="h-4 w-4" /> Bon plan
        </p>
        <h3 className="text-xl font-black">{discovery.promo.title}</h3>
        <p className="text-sm text-orange-100">Code: {discovery.promo.code}</p>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
        <h2 className="mb-4 text-2xl font-black text-slate-900">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {filtered.categories.map((category) => (
            <Button
              key={category.name}
              variant="outline"
              className="rounded-full"
              onClick={() => router.push('/restaurants')}
            >
              {(categoryEmoji[category.name.toUpperCase()] || '🍽️') + ' '}
              {category.name}
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
        <div className="mb-5 flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
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
                  ⭐ {restaurant.averageRating || 'N/A'} ({restaurant.reviewCount} avis) • 🚚 {estimatedDeliveryText(index)} •{' '}
                  {restaurant.cuisineType}
                </p>
                <p className="text-sm text-slate-600">
                  A partir de{' '}
                  {restaurant.startingPrice !== null ? `${restaurant.startingPrice.toFixed(2)} EUR` : 'N/A'}
                </p>
                <Button
                  size="sm"
                  className="mt-3 rounded-full bg-orange-600 hover:bg-orange-700"
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
          <h2 className="text-2xl font-black text-slate-900">Nouveautes Afro</h2>
        </div>
        <div className="grid gap-3">
          {filtered.newcomers.map((restaurant, index) => (
            <Card
              key={restaurant.id}
              className="cursor-pointer border-slate-200/80 bg-white/95 shadow-sm"
              onClick={() => router.push(`/restaurants/${restaurant.id}`)}
            >
              <CardHeader className="pb-2">
                <CardTitle>{restaurant.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-slate-600">
                  ⭐ {restaurant.averageRating || 'N/A'} ({restaurant.reviewCount} avis) • 🚚{' '}
                  {estimatedDeliveryText(index + 2)} • {restaurant.cuisineType}
                </p>
                <Badge className="mt-2 bg-emerald-600">Livraison gratuite</Badge>
              </CardContent>
            </Card>
          ))}
          {filtered.newcomers.length === 0 && <p className="text-sm text-slate-500">Aucune nouveaute.</p>}
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
