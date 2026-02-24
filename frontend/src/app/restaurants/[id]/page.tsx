'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, Star } from 'lucide-react'
import { restaurantAPI } from '@/lib/api'
import { MenuItem, Restaurant } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/cart-store'
import { Separator } from '@/components/ui/separator'
import { ShoppingCartButton } from '@/components/cart/ShoppingCartButton'

export default function RestaurantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params?.id as string
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addItem, getItemCount } = useCartStore()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [r, m] = await Promise.all([
          restaurantAPI.get(`/restaurants/${restaurantId}`),
          restaurantAPI.get(`/restaurants/${restaurantId}/menu`),
        ])
        setRestaurant(r.data)
        setMenu(m.data)
      } catch (e) {
        console.error(e)
        setError('Impossible de charger le restaurant.')
      } finally {
        setLoading(false)
      }
    }
    if (restaurantId) fetchData()
  }, [restaurantId])

  const categories = useMemo(() => {
    return Array.from(new Set(menu.map((item) => item.category).filter(Boolean)))
  }, [menu])

  const handleAdd = (item: MenuItem) => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      restaurantId,
      restaurantName: restaurant?.name || '',
      id: item.id,
    })
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Chargement...</div>
  }

  if (error || !restaurant) {
    return <div className="flex min-h-screen items-center justify-center text-red-600">{error}</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            <p className="text-muted-foreground">
              {restaurant.cuisineType} - {restaurant.city}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/client/cart')}>
              Panier ({getItemCount()})
            </Button>
            <ShoppingCartButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-6 px-4 py-6">
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-muted-foreground">{restaurant.description || 'Restaurant partenaire Delices Afro-Caraibe.'}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-500" />
                {(restaurant.rating ?? 4.5).toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-orange-500" />
                {restaurant.address}, {restaurant.city}
              </span>
              <span>{restaurant.phone}</span>
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span key={c} className="rounded-full border px-3 py-1 text-xs text-slate-600">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Menu</h2>
            <span className="text-sm text-muted-foreground">{menu.length} plats</span>
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {menu.map((item) => (
              <Card key={item.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between gap-2">
                    <span>{item.name}</span>
                    <span className="text-base">{item.price.toFixed(2)} EUR</span>
                  </CardTitle>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {item.description || 'Plat afro-caraibe.'}
                  </p>
                </CardHeader>
                <CardContent className="mt-auto space-y-2">
                  <Button className="w-full" onClick={() => handleAdd(item)} disabled={!item.isAvailable}>
                    {item.isAvailable ? 'Ajouter au panier' : 'Indisponible'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => router.push('/client/cart')}>
                    Voir le panier
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
