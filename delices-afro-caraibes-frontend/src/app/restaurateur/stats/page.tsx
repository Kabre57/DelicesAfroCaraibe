'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  orderItems?: { menuItem?: { name?: string; category?: string }; quantity: number }[]
}

export default function RestaurateurStatsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('')
  const [orders, setOrders] = useState<RestaurantOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (restaurantIdOverride?: string) => {
    try {
      setError('')
      const dash = await restaurantAPI.get<DashboardResponse>('/restaurants/my/dashboard')
      setRestaurants(dash.data.restaurants)
      const restaurantId = restaurantIdOverride || selectedRestaurantId || dash.data.restaurants[0]?.id || ''
      setSelectedRestaurantId(restaurantId)
      if (restaurantId) {
        const allOrders = await orderAPI.get<RestaurantOrder[]>(`/orders/restaurant/${restaurantId}`)
        setOrders(allOrders.data)
      }
    } catch (e) {
      console.error(e)
      setError('Impossible de charger les statistiques.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedRestaurantId) return
    orderAPI
      .get<RestaurantOrder[]>(`/orders/restaurant/${selectedRestaurantId}`)
      .then((res) => setOrders(res.data))
      .catch((e) => {
        console.error(e)
        setError('Impossible de filtrer les statistiques.')
      })
  }, [selectedRestaurantId])

  const deliveredOrders = useMemo(() => orders.filter((order) => order.status === 'DELIVERED'), [orders])
  const revenue = useMemo(() => deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0), [deliveredOrders])
  const avgBasket = deliveredOrders.length === 0 ? 0 : revenue / deliveredOrders.length

  const salesByDay = useMemo(() => {
    const buckets = new Map<string, number>()
    deliveredOrders.forEach((order) => {
      const day = new Date(order.createdAt).toISOString().slice(0, 10)
      buckets.set(day, (buckets.get(day) || 0) + order.totalAmount)
    })
    return Array.from(buckets.entries())
      .map(([day, total]) => ({ day, total }))
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-10)
  }, [deliveredOrders])

  const topDishes = useMemo(() => {
    const map = new Map<string, number>()
    deliveredOrders.forEach((order) => {
      order.orderItems?.forEach((item) => {
        const name = item.menuItem?.name || 'Plat'
        map.set(name, (map.get(name) || 0) + (item.quantity || 0))
      })
    })
    return Array.from(map.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [deliveredOrders])

  const categoryShare = useMemo(() => {
    const map = new Map<string, number>()
    deliveredOrders.forEach((order) => {
      order.orderItems?.forEach((item) => {
        const category = item.menuItem?.category || 'Autre'
        map.set(category, (map.get(category) || 0) + item.quantity)
      })
    })
    const total = Array.from(map.values()).reduce((sum, qty) => sum + qty, 0)
    return Array.from(map.entries())
      .map(([category, qty]) => ({
        category,
        pct: total === 0 ? 0 : Math.round((qty / total) * 100),
      }))
      .sort((a, b) => b.pct - a.pct)
  }, [deliveredOrders])

  const exportCsv = () => {
    const rows = [
      ['order_id', 'status', 'total_amount', 'created_at'],
      ...orders.map((order) => [order.id, order.status, String(order.totalAmount), order.createdAt]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport_restaurateur_${selectedRestaurantId || 'restaurant'}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-slate-900">Statistiques</h1>
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">CA total</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{revenue.toFixed(2)} EUR</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Commandes livrees</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{deliveredOrders.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Panier moyen</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{avgBasket.toFixed(2)} EUR</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Restaurant actif</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{selectedRestaurantId ? 'Oui' : 'Non'}</p></CardContent></Card>
      </section>

      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Evolution des ventes (10 derniers jours)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {salesByDay.map((row) => (
            <div key={row.day} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{row.day}</span>
                <span>{row.total.toFixed(2)} EUR</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (row.total / Math.max(1, ...salesByDay.map((x) => x.total))) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
          {salesByDay.length === 0 && <p className="text-sm text-slate-600">Pas encore de ventes livrees.</p>}
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200/80 bg-white/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              Top plats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topDishes.map((dish, index) => (
              <p key={dish.name} className="text-sm">
                {index + 1}. {dish.name} - <strong>{dish.qty}</strong> ventes
              </p>
            ))}
            {topDishes.length === 0 && <p className="text-sm text-slate-600">Aucune donnee.</p>}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/90">
          <CardHeader>
            <CardTitle>Repartition categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categoryShare.map((row) => (
              <p key={row.category} className="text-sm">
                {row.category}: <strong>{row.pct}%</strong>
              </p>
            ))}
            {categoryShare.length === 0 && <p className="text-sm text-slate-600">Aucune donnee.</p>}
          </CardContent>
        </Card>
      </section>

      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader>
          <CardTitle>Export rapports</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={exportCsv}>Exporter en CSV</Button>
          <Button variant="outline" onClick={() => window.print()}>
            Exporter en PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
