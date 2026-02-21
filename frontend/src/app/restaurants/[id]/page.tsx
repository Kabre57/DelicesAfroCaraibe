'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { restaurantAPI } from '@/lib/api'
import { MenuItem, Restaurant } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/cart-store'
import { Separator } from '@/components/ui/separator'
import { ShoppingCartButton } from '@/components/cart/ShoppingCartButton'

export default function RestaurantDetailPage() {
  const params = useParams()
  const restaurantId = params?.id as string
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addItem } = useCartStore()

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
        setError('Impossible de charger le restaurant')
      } finally {
        setLoading(false)
      }
    }
    if (restaurantId) fetchData()
  }, [restaurantId])

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
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  }

  if (error || !restaurant) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            <p className="text-muted-foreground">
              {restaurant.cuisineType} • {restaurant.address}, {restaurant.city}
            </p>
          </div>
          <ShoppingCartButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground">{restaurant.description}</p>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Menu</h2>
            <span className="text-sm text-muted-foreground">{menu.length} plats</span>
          </div>
          <Separator />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menu.map((item) => (
              <Card key={item.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{item.name}</span>
                    <span className="text-base">{item.price.toFixed(2)} €</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button className="w-full" onClick={() => handleAdd(item)} disabled={!item.isAvailable}>
                    {item.isAvailable ? 'Ajouter au panier' : 'Indisponible'}
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
