'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Search, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { fetchAdminBundle, AdminOverview, PendingLivreur } from '@/lib/admin'
import { userAPI } from '@/lib/api'

export default function AdminLivreursPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [pendingLivreurs, setPendingLivreurs] = useState<PendingLivreur[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const data = await fetchAdminBundle()
      setOverview(data.overview)
      setPendingLivreurs(data.pendingLivreurs)
    } catch (e) {
      console.error(e)
      setError('Impossible de charger les livreurs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const approve = async (userId: string) => {
    try {
      await userAPI.put(`/users/livreur/${userId}/approve`)
      await load()
    } catch (e) {
      console.error(e)
      setError("Impossible d'approuver ce livreur.")
    }
  }

  const filteredPending = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return pendingLivreurs
    return pendingLivreurs.filter((entry) => {
      return (
        `${entry.user.firstName} ${entry.user.lastName}`.toLowerCase().includes(q) ||
        entry.user.email.toLowerCase().includes(q) ||
        entry.vehicleType.toLowerCase().includes(q) ||
        entry.coverageZones.join(' ').toLowerCase().includes(q)
      )
    })
  }, [pendingLivreurs, search])

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Gestion des livreurs</h1>
        <p className="text-sm text-slate-600">Validation et monitoring livreurs.</p>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <Card className="border-slate-200/70 bg-white/90">
        <CardContent className="pt-5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher livreur, zone, vehicule" className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Livreurs actifs</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{overview?.kpis.livreursActive ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">En attente</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{pendingLivreurs.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Nouveaux 24h</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{overview?.users.newLivreurs24h ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Note moyenne</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{overview?.kpis.averageRating ?? 0}</p></CardContent></Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Livreurs a valider</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {filteredPending.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{entry.user.firstName} {entry.user.lastName}</p>
                <Badge>{entry.user.email}</Badge>
              </div>
              <p className="text-sm text-slate-600">{entry.user.phone}</p>
              <p className="mt-1 text-sm">Vehicule: <strong>{entry.vehicleType}</strong></p>
              {entry.coverageZones?.length > 0 && (
                <p className="text-sm">Zones: {entry.coverageZones.join(', ')}</p>
              )}
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="rounded-full" onClick={() => approve(entry.user.id)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Valider
                </Button>
                <Button size="sm" variant="outline" className="rounded-full">
                  Suspendre
                </Button>
              </div>
            </div>
          ))}
          {filteredPending.length === 0 && <p className="text-sm text-slate-600">Aucune demande en attente.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Carte des activites</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            <p className="mb-2 flex items-center gap-2"><Truck className="h-4 w-4" /> Carte livreurs activee (placeholder UI)</p>
            <p>En ligne: {overview?.kpis.livreursActive ?? 0}</p>
            <p>En attente validation: {pendingLivreurs.length}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

