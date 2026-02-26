'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchAdminBundle, AdminOverview, PendingLivreur, PendingResto } from '@/lib/admin'

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [pendingRestos, setPendingRestos] = useState<PendingResto[]>([])
  const [pendingLivreurs, setPendingLivreurs] = useState<PendingLivreur[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(new Date())

  const load = async () => {
    try {
      setError('')
      const data = await fetchAdminBundle()
      setOverview(data.overview)
      setPendingRestos(data.pendingRestos)
      setPendingLivreurs(data.pendingLivreurs)
    } catch (e) {
      console.error(e)
      setError('Impossible de charger le dashboard admin.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30)
    return () => clearInterval(timer)
  }, [])

  const criticalAlerts = overview?.alerts.filter((a) => a.level === 'error') || []
  const warningAlerts = overview?.alerts.filter((a) => a.level === 'warning') || []
  const infoAlerts = overview?.alerts.filter((a) => !['error', 'warning'].includes(a.level)) || []

  if (loading) return <div className="p-6">Chargement...</div>
  if (!overview) return <div className="p-6 text-red-700">Donnees indisponibles.</div>

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-2xl shadow-blue-200/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-100">admin dashboard</p>
            <h1 className="text-3xl font-black">Supervision plateforme</h1>
            <p className="mt-2 text-sm text-blue-100">Vue temps reel de Delices Afro-Caraibe.</p>
          </div>
          <ShieldCheck className="h-9 w-9 text-blue-100" />
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Commandes</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{overview.kpis.ordersToday}</p><p className="text-xs text-slate-500">Vs hier: {overview.kpis.deltaVsYesterdayPercent}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Restaurants</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{overview.kpis.restaurantsActive}</p><p className="text-xs text-slate-500">En attente: {overview.users.pendingRestaurateurs}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Livreurs actifs</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{overview.kpis.livreursActive}</p><p className="text-xs text-slate-500">En attente: {overview.users.pendingLivreurs}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">CA du jour</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{overview.kpis.revenueToday.toFixed(2)} EUR</p><p className="text-xs text-slate-500">Objectif mensuel: {overview.finance.monthlyProgressPercent}%</p></CardContent></Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Alertes critiques</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm font-semibold text-red-700">Critiques: {criticalAlerts.length}</p>
            {criticalAlerts.map((alert) => (
              <div key={alert.type} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
                <p className="flex items-center gap-2 font-semibold text-red-900"><AlertTriangle className="h-4 w-4" />{alert.message}</p>
              </div>
            ))}
            <p className="text-sm font-semibold text-amber-700">Importantes: {warningAlerts.length}</p>
            {warningAlerts.map((alert) => (
              <div key={alert.type} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                <p className="flex items-center gap-2 font-semibold text-amber-900"><AlertTriangle className="h-4 w-4" />{alert.message}</p>
              </div>
            ))}
            <p className="text-sm font-semibold text-blue-700">Infos: {infoAlerts.length}</p>
            {infoAlerts.map((alert) => (
              <div key={alert.type} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
                <p className="flex items-center gap-2 font-semibold text-blue-900"><AlertTriangle className="h-4 w-4" />{alert.message}</p>
              </div>
            ))}
            {overview.alerts.length === 0 && <p className="text-sm text-slate-600">Aucune alerte.</p>}
            <div className="pt-2">
              <Link href="/admin/support">
                <Button variant="outline" className="rounded-full">Voir toutes les alertes</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top restaurants</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overview.topRestaurants.map((restaurant) => (
              <div key={restaurant.restaurantId} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <div>
                  <p className="font-semibold">{restaurant.name}</p>
                  <p className="text-xs text-slate-500">{restaurant.orders} cmd</p>
                </div>
                <strong>{restaurant.revenue.toFixed(2)} EUR</strong>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Validation en attente</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Restaurateurs: <strong>{pendingRestos.length}</strong></p>
            <p>Livreurs: <strong>{pendingLivreurs.length}</strong></p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href="/admin/restos"><Button variant="outline" className="rounded-full">Gerer restos</Button></Link>
              <Link href="/admin/livreurs"><Button variant="outline" className="rounded-full">Gerer livreurs</Button></Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Utilisateurs</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Total: <strong>{overview.kpis.usersTotal}</strong></p>
            <p>Nouveaux clients 24h: <strong>{overview.users.newClients24h}</strong></p>
            <p>Nouveaux restos 24h: <strong>{overview.users.newRestaurateurs24h}</strong></p>
            <p>Nouveaux livreurs 24h: <strong>{overview.users.newLivreurs24h}</strong></p>
            <Link href="/admin/users"><Button variant="outline" className="rounded-full mt-2">Voir users</Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Finance rapide</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>CA mensuel: <strong>{overview.finance.monthlyRevenue.toFixed(2)} EUR</strong></p>
            <p>Progression: <strong>{overview.finance.monthlyProgressPercent}%</strong></p>
            <p>Commissions: <strong>{overview.finance.commissionAveragePercent}%</strong></p>
            <Link href="/admin/finances"><Button variant="outline" className="rounded-full mt-2">Voir finances</Button></Link>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/admin/users"><Button variant="outline" className="rounded-full">Ajouter admin</Button></Link>
          <Link href="/admin/support"><Button variant="outline" className="rounded-full">Envoyer notification</Button></Link>
          <Link href="/admin/finances"><Button variant="outline" className="rounded-full">Exporter rapport</Button></Link>
          <Link href="/admin/config"><Button variant="outline" className="rounded-full">Configurer alertes</Button></Link>
        </CardContent>
      </Card>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Activite horaire</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {overview.charts.ordersByHour
              .filter((point) => point.orders > 0)
              .map((point) => (
                <div key={point.hour} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <p className="font-semibold">{String(point.hour).padStart(2, '0')}h</p>
                  <p>{point.orders} cmd</p>
                  <p>{point.revenue.toFixed(2)} EUR</p>
                </div>
              ))}
          </CardContent>
        </Card>
      </section>

      <div className="text-right text-xs text-slate-500">
        {now.toLocaleTimeString('fr-FR')} - {now.toLocaleDateString('fr-FR')} - Derniere mise a jour: il y a 0-2 min
      </div>
    </div>
  )
}
