'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Search, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { fetchAdminBundle, AdminOverview, PendingResto } from '@/lib/admin'
import { userAPI } from '@/lib/api'

export default function AdminRestosPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [pendingRestos, setPendingRestos] = useState<PendingResto[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setError('')
      const data = await fetchAdminBundle()
      setOverview(data.overview)
      setPendingRestos(data.pendingRestos)
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
    </div>
  )
}

