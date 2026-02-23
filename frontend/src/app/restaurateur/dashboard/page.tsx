'use client'

import { useEffect, useState } from 'react'
import { restaurantAPI, orderAPI } from '@/lib/api'
import { Restaurant, Order } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getOrderSocket } from '@/lib/socket'

export default function RestaurateurDashboardPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await restaurantAPI.get('/restaurants') // filtered côté backend par owner non, donc on filtre côté client
        setRestaurants(res.data)
      } catch (e) {
        console.error(e)
        setError('Impossible de charger les restaurants')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!selectedRestaurant) return
      try {
        const res = await orderAPI.get(`/orders/restaurant/${selectedRestaurant}`)
        setOrders(res.data)
      } catch (e) {
        console.error(e)
      }
    }
    fetchOrders()
    const socket = getOrderSocket()
    socket.on('order:update', ({ orderId, status }: any) => {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
    })
    return () => {
      socket.off('order:update')
    }
  }, [selectedRestaurant])

  if (loading) return <div className="p-6">Chargement...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold">Tableau de bord restaurateur</h1>

        <div className="grid md:grid-cols-3 gap-4">
          {restaurants.map((r) => (
            <Card
              key={r.id}
              className={`cursor-pointer ${selectedRestaurant === r.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedRestaurant(r.id)}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{r.name}</span>
                  <Badge variant={r.isActive ? 'default' : 'outline'}>
                    {r.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{r.cuisineType}</p>
                <p className="text-sm text-muted-foreground">
                  {r.address}, {r.city}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Separator />

        <h2 className="text-xl font-semibold">Commandes</h2>
        {selectedRestaurant ? (
          orders.length === 0 ? (
            <p className="text-muted-foreground">Aucune commande pour ce restaurant.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <Card key={o.id}>
                  <CardHeader className="flex justify-between">
                    <div>
                      <CardTitle>Commande #{o.id.slice(0, 8)}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {o.deliveryAddress}, {o.deliveryCity}
                      </p>
                    </div>
                    <Badge variant="outline">{o.status}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    {o.orderItems?.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>
                          {item.menuItem?.name} x {item.quantity}
                        </span>
                        <span>{(item.price * item.quantity).toFixed(2)} €</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <p className="text-muted-foreground">Sélectionnez un restaurant pour voir ses commandes.</p>
        )}
      </div>
    </div>
  )
}
