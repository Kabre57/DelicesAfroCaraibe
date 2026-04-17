'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ImagePlus, Search, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { RestaurantMediaManager } from '@/components/restaurant/restaurant-media-manager'
import { fetchAdminBundle, AdminOverview, PendingResto } from '@/lib/admin'
import { restaurantAPI, userAPI } from '@/lib/api'
import { resolveMediaUrl } from '@/lib/media'
import { Restaurant } from '@/types'

export default function AdminRestosPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [pendingRestos, setPendingRestos] = useState<PendingResto[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)

  const load = async () => {
    try {
      setError('')
      const [data, restaurantsRes] = await Promise.all([
        fetchAdminBundle(),
        restaurantAPI.get<Restaurant[]>('/restaurants'),
      ])
      setOverview(data.overview)
      setPendingRestos(data.pendingRestos)
      setRestaurants(Array.isArray(restaurantsRes.data) ? restaurantsRes.data : [])
    } catch (e) {
      console.error(e)
      setError('Impossible de charger les restaurants.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const approve = async (userId: string) => {
    try {
      await userAPI.put(`/users/restaurateur/${userId}/approve`)
      await load()
    } catch (e) {
      console.error(e)
      setError("Impossible d'approuver ce restaurateur.")
    }
  }

  const filteredPending = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return pendingRestos
    return pendingRestos.filter((entry) => {
      const restNames = entry.restaurants.map((r) => r.name).join(' ').toLowerCase()
      return (
        `${entry.user.firstName} ${entry.user.lastName}`.toLowerCase().includes(q) ||
        entry.user.email.toLowerCase().includes(q) ||
        restNames.includes(q)
      )
    })
  }, [pendingRestos, search])

  const filteredRestaurants = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return restaurants
    return restaurants.filter((restaurant) => {
      return (
        restaurant.name.toLowerCase().includes(q) ||
        restaurant.city.toLowerCase().includes(q) ||
        restaurant.cuisineType.toLowerCase().includes(q)
      )
    })
  }, [restaurants, search])

  const openRestaurant = async (restaurantId: string) => {
    try {
      setError('')
      const res = await restaurantAPI.get<Restaurant>(`/restaurants/${restaurantId}`)
      setSelectedRestaurant(res.data)
      setDetailOpen(true)
    } catch (e) {
      console.error(e)
      setError('Impossible de charger le detail du restaurant.')
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Gestion des restaurants</h1>
        <p className="text-sm text-slate-600">Validation et supervision des restaurants.</p>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <Card className="border-slate-200/70 bg-white/90">
        <CardContent className="pt-5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher restaurant ou proprietaire" className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Actifs</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{overview?.kpis.restaurantsActive ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">En attente</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{pendingRestos.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Top restos</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{overview?.topRestaurants.length ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">CA jour</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{overview?.kpis.revenueToday.toFixed(2) ?? '0.00'} EUR</p></CardContent></Card>
      </section>

      <Card>
        <CardHeader><CardTitle>En attente de validation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {filteredPending.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{entry.user.firstName} {entry.user.lastName}</p>
                <Badge>{entry.user.email}</Badge>
              </div>
              <p className="text-sm text-slate-500">{entry.user.phone}</p>
              <div className="mt-2 space-y-1">
                {entry.restaurants.map((restaurant) => (
                  <p key={restaurant.id} className="text-sm">
                    {restaurant.name} - {restaurant.city}
                  </p>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="rounded-full" onClick={() => approve(entry.user.id)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Valider
                </Button>
                <Button size="sm" variant="outline" className="rounded-full">
                  <XCircle className="mr-2 h-4 w-4" />
                  Refuser
                </Button>
              </div>
            </div>
          ))}
          {filteredPending.length === 0 && <p className="text-sm text-slate-600">Aucune demande en attente.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top performances restaurants</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {overview?.topRestaurants.map((restaurant, index) => (
            <div key={restaurant.restaurantId} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <p>{index + 1}. {restaurant.name}</p>
              <p><strong>{restaurant.orders}</strong> cmd - <strong>{restaurant.revenue.toFixed(2)} EUR</strong></p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue restaurants</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {filteredRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-20 w-20 overflow-hidden rounded-xl bg-slate-100">
                    {restaurant.imageUrl ? (
                      <img
                        src={resolveMediaUrl(restaurant.imageUrl)}
                        alt={restaurant.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-semibold">{restaurant.name}</p>
                    <p className="text-sm text-slate-500">
                      {restaurant.city} - {restaurant.cuisineType}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant={restaurant.isActive ? 'default' : 'outline'}>
                        {restaurant.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                      <Badge variant="outline">
                        Galerie: {restaurant.galleryImages?.length || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => openRestaurant(restaurant.id)}>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Editer medias
                </Button>
              </div>
            </div>
          ))}
          {filteredRestaurants.length === 0 && (
            <p className="text-sm text-slate-600">Aucun restaurant ne correspond a la recherche.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Gestion des medias restaurant</DialogTitle>
            <DialogDescription>
              Modifiez l&apos;image principale et la galerie du restaurant selectionne.
            </DialogDescription>
          </DialogHeader>
          {selectedRestaurant ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">{selectedRestaurant.name}</p>
                <p className="text-slate-500">
                  {selectedRestaurant.city} - {selectedRestaurant.cuisineType}
                </p>
              </div>
              <RestaurantMediaManager
                restaurant={selectedRestaurant}
                onRestaurantChange={(updatedRestaurant) => {
                  setSelectedRestaurant(updatedRestaurant)
                  setRestaurants((prev) =>
                    prev.map((restaurant) => (restaurant.id === updatedRestaurant.id ? updatedRestaurant : restaurant))
                  )
                }}
              />
            </div>
          ) : (
            <p className="text-sm text-slate-600">Chargement...</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
