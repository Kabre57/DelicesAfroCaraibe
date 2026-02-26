'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { orderAPI, paymentAPI } from '@/lib/api'
import { Order, Payment } from '@/types'

function ClientPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<Order | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [cardExpiry, setCardExpiry] = useState('12/30')
  const [cardCvv, setCardCvv] = useState('123')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!orderId) {
        setError('orderId manquant.')
        setLoading(false)
        return
      }
      try {
        const [orderRes, paymentRes] = await Promise.all([
          orderAPI.get<Order>(`/orders/${orderId}`),
          paymentAPI.get<Payment>(`/payments/order/${orderId}`),
        ])
        setOrder(orderRes.data)
        setPayment(paymentRes.data)
        if (paymentRes.data?.paymentMethod) {
          setPaymentMethod(paymentRes.data.paymentMethod)
        }
      } catch (e: any) {
        console.error('Payment page load error:', e)
        setError(e?.response?.data?.error || 'Impossible de charger le paiement.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId])

  const amount = useMemo(() => payment?.amount ?? order?.totalAmount ?? 0, [payment, order])

  const processPayment = async () => {
    if (!orderId) return
    if (paymentMethod === 'CARD' && (!cardNumber || !cardExpiry || !cardCvv)) {
      setError('Informations carte incompletes.')
      return
    }

    setError('')
    setProcessing(true)
    try {
      const txId = paymentMethod === 'CARD' ? `TX-${Date.now()}` : undefined
      const res = await paymentAPI.post<Payment>('/payments/process', {
        orderId,
        paymentMethod,
        transactionId: txId,
      })
      setPayment(res.data)
      router.push(`/client/orders/${orderId}`)
    } catch (e: any) {
      console.error('Process payment error:', e)
      setError(e?.response?.data?.error || 'Paiement impossible.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>
  if (!order) return <div className="p-6 text-red-700">{error || 'Commande introuvable.'}</div>

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Paiement</h1>
        <p className="text-sm text-slate-600">Commande #{order.id.slice(0, 8)}</p>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Recapitulatif commande</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-slate-600">{order.restaurant?.name || 'Restaurant'}</p>
          {order.orderItems?.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span>
                {item.menuItem?.name || 'Article'} x {item.quantity}
              </span>
              <span>{(item.price * item.quantity).toFixed(2)} EUR</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-2 text-lg font-black">
            <span>Total</span>
            <span>{amount.toFixed(2)} EUR</span>
          </div>
          {payment && (
            <div className="pt-1">
              <Badge variant={payment.status === 'COMPLETED' ? 'default' : 'secondary'}>{payment.status}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {payment?.status === 'COMPLETED' ? (
        <Card>
          <CardContent className="space-y-3 py-6">
            <p className="font-semibold text-emerald-700">Paiement deja confirme.</p>
            <Button onClick={() => router.push(`/client/orders/${order.id}`)}>Aller au suivi</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Methode de paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Methode</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Especes</SelectItem>
                  <SelectItem value="CARD">Carte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentMethod === 'CARD' && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="cardNumber">Numero carte</Label>
                  <Input id="cardNumber" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="expiry">Expiration</Label>
                    <Input id="expiry" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} />
                  </div>
                </div>
              </>
            )}
            <Button className="w-full" size="lg" disabled={processing} onClick={processPayment}>
              {processing
                ? 'Paiement en cours...'
                : paymentMethod === 'CASH'
                  ? 'Confirmer paiement en especes'
                  : `Payer ${amount.toFixed(2)} EUR`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ClientPaymentPage() {
  return (
    <Suspense fallback={<div className="p-6">Chargement...</div>}>
      <ClientPaymentContent />
    </Suspense>
  )
}
