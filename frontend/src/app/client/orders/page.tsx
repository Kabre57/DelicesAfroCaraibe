'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOrderSocket } from '@/lib/socket'
import { orderAPI } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Order } from '@/types'

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PREPARING: 'bg-violet-100 text-violet-800 border-violet-200',
  READY: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  IN_DELIVERY: 'bg-orange-100 text-orange-800 border-orange-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
}

export default function ClientOrdersPage() {
  const router = useRouter()
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
    const socket = getOrderSocket()
    const onUpdate = ({ orderId, status }: { orderId: string; status: string }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: status as Order['status'] } : o))
      )
    }
    socket.on('order:update', onUpdate)
    return () => {
      socket.off('order:update', onUpdate)
    }
  }, [])

  const totalSpent = useMemo(() => orders.reduce((sum, order) => sum + order.totalAmount, 0), [orders])

  if (loading) return <div className="p-6">Chargement...</div>
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-orange-100 bg-white/90 p-5 shadow-lg shadow-orange-100/40">
        <h1 className="text-2xl font-black text-slate-900">Historique des commandes</h1>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total</p>
            <p className="text-2xl font-black text-slate-900">{orders.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">En cours</p>
            <p className="text-2xl font-black text-slate-900">
              {orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Depense</p>
            <p className="text-2xl font-black text-slate-900">{totalSpent.toFixed(2)} EUR</p>
          </div>
        </div>
      </section>

      {orders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-600">
          Aucune commande pour le moment.
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/40">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>Commande #{order.id.slice(0, 8)}</CardTitle>
                  <p className="text-sm text-slate-500">
                    {order.restaurant?.name} - {order.deliveryAddress}, {order.deliveryCity}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[order.status] ?? 'bg-slate-100 text-slate-800'}`}>
                  {order.status}
                </span>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1 text-sm text-slate-600">
                  {order.orderItems?.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.menuItem?.name} x {item.quantity}
                      </span>
                      <span>{(item.price * item.quantity).toFixed(2)} EUR</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{order.totalAmount.toFixed(2)} EUR</span>
                </div>
                {order.payment && (
                  <div className="flex justify-between items-center text-sm">
                    <span>Paiement</span>
                    <Badge variant={order.payment.status === 'COMPLETED' ? 'default' : 'destructive'}>
                      {order.payment.status}
                    </Badge>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => router.push(`/client/orders/${order.id}`)}>
                    Suivre
                  </Button>
                  {order.payment?.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                    <Button size="sm" onClick={() => router.push(`/client/payment?orderId=${order.id}`)}>
                      Payer maintenant
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
