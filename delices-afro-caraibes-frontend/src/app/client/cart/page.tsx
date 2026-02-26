'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { orderAPI, userAPI } from '@/lib/api'
import { useCartStore } from '@/lib/cart-store'

type UserResponse = {
  id: string
  client?: {
    address: string
    city: string
    postalCode: string
  } | null
}

export default function ClientCartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, clearCart, getTotal, getRestaurantId } = useCartStore()
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryCity, setDeliveryCity] = useState('')
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfileAddress = async () => {
      try {
        const rawUser = localStorage.getItem('user')
        if (!rawUser) return
        const parsed = JSON.parse(rawUser) as { id: string }
        const res = await userAPI.get<UserResponse>(`/users/${parsed.id}`)
        if (res.data.client) {
          setDeliveryAddress(res.data.client.address || '')
          setDeliveryCity(res.data.client.city || '')
          setDeliveryPostalCode(res.data.client.postalCode || '')
        }
      } catch (e) {
        console.error('Load profile address error:', e)
      }
    }
    loadProfileAddress()
  }, [])

  const total = useMemo(() => getTotal(), [getTotal, items])

  const createOrderAndGoPayment = async () => {
    setError('')
    if (items.length === 0) {
      setError('Votre panier est vide.')
      return
    }
    if (!deliveryAddress || !deliveryCity || !deliveryPostalCode) {
      setError('Adresse de livraison incomplete.')
      return
    }

    const restaurantId = getRestaurantId()
    if (!restaurantId) {
      setError('Restaurant invalide.')
      return
    }

    const sameRestaurant = items.every((i) => i.restaurantId === restaurantId)
    if (!sameRestaurant) {
      setError('Panier limite a un seul restaurant par commande.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        restaurantId,
        deliveryAddress,
        deliveryCity,
        deliveryPostalCode,
        notes: notes.trim() || undefined,
        paymentMethod,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
      }

      const orderRes = await orderAPI.post('/orders', payload)
      const orderId = orderRes.data?.id as string
      clearCart()
      router.push(`/client/payment?orderId=${orderId}`)
    } catch (e: any) {
      console.error('Create order error:', e)
      setError(e?.response?.data?.error || 'Impossible de creer la commande.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Mon panier</h1>
        <p className="text-sm text-slate-600">Verifiez vos articles et confirmez votre adresse.</p>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      {items.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-8 text-center">
            <p className="text-slate-600">Votre panier est vide.</p>
            <Button onClick={() => router.push('/restaurants')}>Voir les restaurants</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Articles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.menuItemId} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-slate-600">{item.restaurantName}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.menuItemId)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="font-semibold">{(item.price * item.quantity).toFixed(2)} EUR</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <Button variant="outline" onClick={clearCart}>
                  Vider le panier
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Livraison</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="15 Avenue de la Republique"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" value={deliveryCity} onChange={(e) => setDeliveryCity(e.target.value)} placeholder="Paris" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  value={deliveryPostalCode}
                  onChange={(e) => setDeliveryPostalCode(e.target.value)}
                  placeholder="75011"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="notes">Instructions</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Code porte, etage, etc."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Label>Methode de paiement</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'CASH' | 'CARD')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Especes a la livraison</SelectItem>
                  <SelectItem value="CARD">Carte</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 py-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-600">Sous-total</p>
                <p>{total.toFixed(2)} EUR</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-slate-600">Frais livraison</p>
                <p>2.00 EUR</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-lg font-black">
                <p>Total</p>
                <p>{(total + 2).toFixed(2)} EUR</p>
              </div>
              <Button className="w-full" size="lg" disabled={loading} onClick={createOrderAndGoPayment}>
                {loading ? 'Creation de la commande...' : 'Continuer vers confirmation paiement'}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
