'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, MapPin, Phone, Star, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { restaurantAPI } from '@/lib/api'
import { Restaurant, MenuItem } from '@/types'
import { useCartStore } from '@/lib/cart-store'
import { ShoppingCartButton } from '@/components/cart/ShoppingCartButton'
import toast from 'react-hot-toast'

export default function RestaurantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const addItem = useCartStore(state => state.addItem)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [restaurantRes, menuRes] = await Promise.all([
          restaurantAPI.get(`/restaurants/${params.id}`),
          restaurantAPI.get(`/restaurants/${params.id}/menu`)
        ])
        setRestaurant(restaurantRes.data)
        setMenuItems(menuRes.data)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Erreur lors du chargement du restaurant')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const handleAddToCart = (menuItem: MenuItem) => {
    if (!restaurant) return
    
    addItem({
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      imageUrl: menuItem.imageUrl,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      id: menuItem.id
    })
    
    toast.success(`${menuItem.name} ajouté au panier`)
  }

  const toggleFavorite = (menuItemId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(menuItemId)) {
        newFavorites.delete(menuItemId)
        toast.success('Retiré des favoris')
      } else {
        newFavorites.add(menuItemId)
        toast.success('Ajouté aux favoris')
      }
      return newFavorites
    })
  }

  const categories = ['all', ...new Set(menuItems.map(item => item.category).filter(Boolean))]
  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Restaurant non trouvé</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour
          </Button>
          <ShoppingCartButton />
        </div>
      </header>

      <div className="relative h-64 md:h-96 overflow-hidden">
        {restaurant.imageUrl ? (
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="container mx-auto">
            <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">{restaurant.cuisineType}</Badge>
              {restaurant.isOpen && (
                <Badge variant="success">Ouvert</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>4.5 (120 avis)</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>30-45 min</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{restaurant.city}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>À propos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{restaurant.description}</p>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{restaurant.address}, {restaurant.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{restaurant.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-2xl font-bold mb-4">Menu</h2>
              
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
                <TabsList className="w-full justify-start overflow-x-auto">
                  {categories.map(category => (
                    <TabsTrigger key={category} value={category} className="capitalize">
                      {category === 'all' ? 'Tout' : category}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="grid gap-4">
                {filteredMenuItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="flex gap-4 p-4">
                        {item.imageUrl && (
                          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
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
                              <h3 className="font-semibold text-lg">{item.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFavorite(item.id)}
                              className="flex-shrink-0"
                            >
                              <Heart
                                className={`h-5 w-5 ${
                                  favorites.has(item.id)
                                    ? 'fill-red-500 text-red-500'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            </Button>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <span className="text-xl font-bold">{item.price.toFixed(2)} €</span>
                            <Button
                              onClick={() => handleAddToCart(item)}
                              disabled={!item.available}
                            >
                              {item.available ? 'Ajouter' : 'Indisponible'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {filteredMenuItems.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Aucun plat dans cette catégorie</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Informations de livraison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Temps de livraison</p>
                  <p className="font-semibold">30-45 min</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Frais de livraison</p>
                  <p className="font-semibold">2.50 €</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Commande minimum</p>
                  <p className="font-semibold">15.00 €</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
