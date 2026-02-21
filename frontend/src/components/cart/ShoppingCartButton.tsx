'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useCartStore } from '@/lib/cart-store'
import { orderAPI } from '@/lib/api'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useRouter } from 'next/navigation'

export function ShoppingCartButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const {
    items,
    updateQuantity,
    removeItem,
    getTotal,
    getItemCount,
    clearCart,
    getRestaurantId,
  } = useCartStore()
  const itemCount = getItemCount()
  const total = getTotal()
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCheckout = async () => {
    setError('')
    if (!address || !city || !postalCode) {
      setError('Adresse de livraison requise')
      return
    }
    if (items.length === 0) return
    const restaurantId = getRestaurantId()
    const sameRestaurant = items.every((i) => i.restaurantId === restaurantId)
    if (!sameRestaurant) {
      setError('Panier limité à un seul restaurant par commande.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        restaurantId,
        deliveryAddress: address,
        deliveryCity: city,
        deliveryPostalCode: postalCode,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
      }
      await orderAPI.post('/orders', payload)
      clearCart()
      setOpen(false)
      router.push('/client/orders')
    } catch (e: any) {
      console.error(e)
      setError(e?.response?.data?.error || 'Erreur lors de la commande')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Panier ({itemCount} articles)</SheetTitle>
          <SheetDescription>Vérifiez vos articles avant de commander</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full space-y-3">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Votre panier est vide</p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 text-red-600 px-3 py-2 rounded text-sm">{error}</div>
              )}

              <div className="flex-1 overflow-auto py-4">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item.menuItemId}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="mb-4"
                    >
                      <Card className="p-4">
                        <div className="flex gap-4">
                          {item.imageUrl && (
                            <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium truncate">{item.name}</h4>
                                <p className="text-sm text-muted-foreground">{item.restaurantName}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.menuItemId)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                                  className="h-8 w-8"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                                  className="h-8 w-8"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="font-semibold">{(item.price * item.quantity).toFixed(2)} €</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Adresse de livraison"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Ville" value={city} onChange={(e) => setCity(e.target.value)} />
                    <Input
                      placeholder="Code postal"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>{total.toFixed(2)} €</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Button className="w-full" size="lg" disabled={loading} onClick={handleCheckout}>
                    {loading ? 'Commande en cours...' : 'Commander'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={clearCart}>
                    Vider le panier
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
