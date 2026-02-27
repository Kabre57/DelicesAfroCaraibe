'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getDeliverySocket, getOrderSocket } from '@/lib/socket'
import { orderAPI } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Order } from '@/types'

const orderSteps = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'IN_DELIVERY', 'DELIVERED'] as const

const labelMap: Record<string, string> = {
  PENDING: 'Commande recue',
  CONFIRMED: 'Commande confirmee',
  PREPARING: 'En preparation',
  READY: 'Prete a etre livree',
  IN_DELIVERY: 'En livraison',
  DELIVERED: 'Livree',
  CANCELLED: 'Annulee',
}

export default function ClientOrderTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params?.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchOrder = useCallback(async () => {
    if (!orderId) return
    try {
      const res = await orderAPI.get<Order>(`/orders/${orderId}`)
      setOrder(res.data)
      setError('')
    } catch (e: any) {
      console.error('Load order tracking error:', e)
      setError(e?.response?.data?.error || 'Impossible de charger la commande.')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  useEffect(() => {
    const socket = getOrderSocket()
    const deliverySocket = getDeliverySocket()
    const onUpdate = ({ orderId: updatedId }: { orderId: string; status: string }) => {
      if (updatedId === orderId) fetchOrder()
    }
    socket.on('order:update', onUpdate)
    deliverySocket.on('order:update', onUpdate)
    return () => {
      socket.off('order:update', onUpdate)
      deliverySocket.off('order:update', onUpdate)
    }
  }, [fetchOrder, orderId])

  const currentStepIndex = useMemo(() => {
    if (!order) return -1
    const i = orderSteps.indexOf(order.status as (typeof orderSteps)[number])
    return i
  }, [order])

  if (loading) return <div className="p-6">Chargement...</div>
  if (!order) return <div className="p-6 text-red-700">{error || 'Commande introuvable.'}</div>

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Suivi commande #{order.id.slice(0, 8)}</h1>
        <p className="text-sm text-slate-600">
          {order.restaurant?.name} - {order.deliveryAddress}, {order.deliveryCity}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Statut en direct</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'}>{labelMap[order.status] || order.status}</Badge>
          <div className="space-y-2 pt-2">
            {orderSteps.map((step, idx) => {
              const active = idx <= currentStepIndex
              return (
                <div key={step} className="flex items-center gap-2 text-sm">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      active ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                  <span className={active ? 'text-slate-900 font-medium' : 'text-slate-500'}>{labelMap[step]}</span>
                </div>
              )
            })}
            {order.status === 'CANCELLED' && <p className="text-sm font-semibold text-red-700">Commande annulee.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.orderItems?.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span>
                {item.menuItem?.name || 'Article'} x {item.quantity}
              </span>
              <span>{(item.price * item.quantity).toFixed(2)} EUR</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span>{order.totalAmount.toFixed(2)} EUR</span>
          </div>
          {order.payment && (
            <div className="flex items-center justify-between text-sm">
              <span>Paiement</span>
              <Badge variant={order.payment.status === 'COMPLETED' ? 'default' : 'secondary'}>
                {order.payment.status}
              </Badge>
            </div>
          )}
          {order.delivery && (
            <div className="flex items-center justify-between text-sm">
              <span>Livraison</span>
              <Badge variant="outline">{order.delivery.status}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={fetchOrder}>
          Rafraichir
        </Button>
        <Button onClick={() => router.push('/client/orders')}>Retour a mes commandes</Button>
      </div>
    </div>
  )
}
