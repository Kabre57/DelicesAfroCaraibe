'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { orderAPI } from '@/lib/api'

type FavoriteRestaurant = {
  restaurantId: string
  name: string
  count: number
}

type ClientSummaryResponse = {
  favorites: FavoriteRestaurant[]
}

export default function ClientFavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await orderAPI.get<ClientSummaryResponse>('/orders/client/me/summary')
        setFavorites(response.data.favorites || [])
      } catch (error) {
        console.error('Favorites load error:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-900">Mes favoris</h1>
      {favorites.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-600">
          Aucun favori pour le moment.
        </p>
      ) : (
        <div className="grid gap-3">
          {favorites.map((item) => (
            <Card key={item.restaurantId} className="cursor-pointer" onClick={() => router.push(`/restaurants/${item.restaurantId}`)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500" />
                  {item.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{item.count} commande(s)</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
