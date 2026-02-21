'use client'

import { useEffect, useState } from 'react'
import { orderAPI } from '@/lib/api'
import { Order } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function ClientOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderAPI.get('/orders/me')
        setOrders(res.data)
      } catch (e) {
        console.error(e)
        setError('Impossible de charger vos commandes')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  if (loading) return <div className="p-6">Chargement...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold">Mes commandes</h1>
        {orders.length === 0 ? (
          <p className="text-muted-foreground">Aucune commande pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Commande #{order.id.slice(0, 8)}</CardTitle>
                  <Badge variant="outline">{order.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {order.restaurant?.name} — {order.deliveryAddress}, {order.deliveryCity}
                  </div>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    {order.orderItems?.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>
                          {item.menuItem?.name} x {item.quantity}
                        </span>
                        <span>{(item.price * item.quantity).toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{order.totalAmount.toFixed(2)} €</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
