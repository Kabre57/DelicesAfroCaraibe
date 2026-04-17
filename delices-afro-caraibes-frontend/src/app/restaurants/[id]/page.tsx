'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, Star } from 'lucide-react'
import { restaurantAPI } from '@/lib/api'
import { MenuItem, Restaurant } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/cart-store'
import { resolveMediaUrl } from '@/lib/media'
import { Separator } from '@/components/ui/separator'
import { ShoppingCartButton } from '@/components/cart/ShoppingCartButton'
import { getDeliverySocket, getOrderSocket } from '@/lib/socket'

const getMenuGallery = (item: MenuItem) => {
  const gallery = Array.isArray(item.galleryImages) ? item.galleryImages.map((image) => image.imageUrl).filter(Boolean) : []
  if (item.imageUrl && !gallery.includes(item.imageUrl)) {
    return [item.imageUrl, ...gallery]
  }
  return gallery
}

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

  useEffect(() => {
    if (!restaurantId) return
    const orderSocket = getOrderSocket()
    const deliverySocket = getDeliverySocket()
    const refresh = () => {
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
        }
      }
      fetchData()
    }
    orderSocket.on('order:update', refresh)
    deliverySocket.on('order:update', refresh)
    return () => {
      orderSocket.off('order:update', refresh)
      deliverySocket.off('order:update', refresh)
    }
  }, [restaurantId])

  const categories = useMemo(() => {
    return Array.from(new Set(menu.map((item) => item.category).filter(Boolean)))
  }, [menu])

  const gallery = useMemo(() => {
    if (!restaurant) return []
    const images = restaurant.galleryImages || []
    if (restaurant.imageUrl) {
      const alreadyCovered = images.some((image) => image.imageUrl === restaurant.imageUrl)
      if (!alreadyCovered) {
        return [
          {
            id: 'cover-image',
            restaurantId: restaurant.id,
            imageUrl: restaurant.imageUrl,
            altText: restaurant.name,
            sortOrder: -1,
            createdAt: restaurant.createdAt,
            updatedAt: restaurant.updatedAt,
          },
          ...images,
        ]
      }
    }
    return images
  }, [restaurant])

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
        {gallery.length > 0 && (
          <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
              <img
                src={resolveMediaUrl(gallery[0].imageUrl)}
                alt={gallery[0].altText || restaurant.name}
                className="h-[320px] w-full object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {gallery.slice(1, 5).map((image) => (
                <div key={image.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                  <img
                    src={resolveMediaUrl(image.imageUrl)}
                    alt={image.altText || restaurant.name}
                    className="h-36 w-full object-cover"
                  />
                </div>
              ))}
              {gallery.length === 1 && (
                <div className="col-span-2 flex min-h-[144px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                  Ajoutez d&apos;autres photos pour mettre en valeur ce restaurant.
                </div>
              )}
            </div>
          </section>
        )}

        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-muted-foreground">{restaurant.description || 'Restaurant partenaire Delices Afro-Caraibe.'}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-500" />
                {(restaurant.rating ?? 4.5).toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-fuchsia-600" />
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
            {gallery.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">Galerie du restaurant</h2>
                  <span className="text-xs text-slate-500">{gallery.length} image{gallery.length > 1 ? 's' : ''}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {gallery.map((image) => (
                    <div key={image.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <img
                        src={resolveMediaUrl(image.imageUrl)}
                        alt={image.altText || restaurant.name}
                        className="h-24 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
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
                <div className="h-40 w-full overflow-hidden bg-slate-100">
                  {getMenuGallery(item)[0] ? (
                    <img
                      src={resolveMediaUrl(getMenuGallery(item)[0])}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-black text-fuchsia-700">
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
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
                  {getMenuGallery(item).length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {getMenuGallery(item)
                        .slice(0, 4)
                        .map((imageUrl, index) => (
                          <div key={`${item.id}-${index}`} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                            <img
                              src={resolveMediaUrl(imageUrl)}
                              alt={`${item.name} ${index + 1}`}
                              className="h-14 w-full object-cover"
                            />
                          </div>
                        ))}
                    </div>
                  )}
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
