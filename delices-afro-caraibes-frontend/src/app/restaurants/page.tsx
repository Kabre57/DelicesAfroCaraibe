'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, Star, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { restaurantAPI } from '@/lib/api'
import { Restaurant } from '@/types'
import { ShoppingCartButton } from '@/components/cart/ShoppingCartButton'

interface Filters {
  search: string
  cuisineTypes: string[]
  priceRange: number[]
  rating: number
  openNow: boolean
  sortBy: string
}

export default function RestaurantsSearchPage() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    cuisineTypes: [],
    priceRange: [0, 50],
    rating: 0,
    openNow: false,
    sortBy: 'rating'
  })

  const cuisineTypeOptions = [
    'Africain',
<<<<<<< HEAD:delices-afro-caraibes-frontend/src/app/restaurants/page.tsx
    'Caribeen',
    'Antillais',
    'Creole',
    'Senegalais',
=======
    'CaribÃ©en',
    'Antillais',
    'CrÃ©ole',
    'SÃ©nÃ©galais',
>>>>>>> 12a3b4bbbba165b93be40e8b5063089f718ff32c:frontend/src/app/restaurants/page.tsx
    'Ivoirien',
    'Camerounais',
    'Togolais',
  ]

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await restaurantAPI.get('/restaurants')
        setRestaurants(response.data)
        setFilteredRestaurants(response.data)
      } catch (error) {
        console.error('Error fetching restaurants:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [])

  useEffect(() => {
    let result = [...restaurants]

    if (filters.search) {
      result = result.filter(r =>
        r.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.cuisineType.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.cuisineTypes.length > 0) {
      result = result.filter(r => filters.cuisineTypes.includes(r.cuisineType))
    }

    if (filters.openNow) {
      result = result.filter(r => r.isOpen)
    }

    switch (filters.sortBy) {
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'distance':
        break
      case 'deliveryTime':
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    setFilteredRestaurants(result)
  }, [filters, restaurants])

  const handleCuisineTypeToggle = (cuisineType: string) => {
    setFilters(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(cuisineType)
        ? prev.cuisineTypes.filter(c => c !== cuisineType)
        : [...prev.cuisineTypes, cuisineType]
    }))
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      cuisineTypes: [],
      priceRange: [0, 50],
      rating: 0,
      openNow: false,
      sortBy: 'rating'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
<<<<<<< HEAD:delices-afro-caraibes-frontend/src/app/restaurants/page.tsx
            <h1 className="text-2xl font-bold">DELICES AFRO-CARAIBE</h1>
=======
            <h1 className="text-2xl font-bold">DÃ‰LICES AFRO-CARAÃBE</h1>
>>>>>>> 12a3b4bbbba165b93be40e8b5063089f718ff32c:frontend/src/app/restaurants/page.tsx
            <ShoppingCartButton />
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un restaurant, un plat..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                  <SheetDescription>
                    Affinez votre recherche
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-6">
                  <div>
                    <Label className="text-base font-semibold mb-4 block">Type de cuisine</Label>
                    <div className="space-y-2">
                      {cuisineTypeOptions.map(cuisine => (
                        <div key={cuisine} className="flex items-center space-x-2">
                          <Checkbox
                            id={cuisine}
                            checked={filters.cuisineTypes.includes(cuisine)}
                            onCheckedChange={() => handleCuisineTypeToggle(cuisine)}
                          />
                          <Label htmlFor={cuisine} className="font-normal cursor-pointer">
                            {cuisine}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-semibold mb-4 block">
<<<<<<< HEAD:delices-afro-caraibes-frontend/src/app/restaurants/page.tsx
                      Prix moyen: {filters.priceRange[0]} EUR - {filters.priceRange[1]} EUR
=======
                      Prix moyen: {filters.priceRange[0]}â‚¬ - {filters.priceRange[1]}â‚¬
>>>>>>> 12a3b4bbbba165b93be40e8b5063089f718ff32c:frontend/src/app/restaurants/page.tsx
                    </Label>
                    <Slider
                      min={0}
                      max={50}
                      step={5}
                      value={filters.priceRange}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}
                      className="mt-2"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="openNow"
                      checked={filters.openNow}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, openNow: checked as boolean }))
                      }
                    />
                    <Label htmlFor="openNow" className="font-normal cursor-pointer">
                      Ouvert maintenant
                    </Label>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-semibold mb-4 block">Trier par</Label>
                    <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rating">Note</SelectItem>
                        <SelectItem value="distance">Distance</SelectItem>
                        <SelectItem value="deliveryTime">Temps de livraison</SelectItem>
                        <SelectItem value="name">Nom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={resetFilters} variant="outline" className="w-full">
<<<<<<< HEAD:delices-afro-caraibes-frontend/src/app/restaurants/page.tsx
                    Reinitialiser les filtres
=======
                    RÃ©initialiser les filtres
>>>>>>> 12a3b4bbbba165b93be40e8b5063089f718ff32c:frontend/src/app/restaurants/page.tsx
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-muted-foreground">
<<<<<<< HEAD:delices-afro-caraibes-frontend/src/app/restaurants/page.tsx
            {filteredRestaurants.length} restaurant{filteredRestaurants.length > 1 ? 's' : ''} trouve{filteredRestaurants.length > 1 ? 's' : ''}
=======
            {filteredRestaurants.length} restaurant{filteredRestaurants.length > 1 ? 's' : ''} trouvÃ©{filteredRestaurants.length > 1 ? 's' : ''}
>>>>>>> 12a3b4bbbba165b93be40e8b5063089f718ff32c:frontend/src/app/restaurants/page.tsx
          </p>
          {filters.cuisineTypes.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {filters.cuisineTypes.map(cuisine => (
                <Badge key={cuisine} variant="secondary">
                  {cuisine}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {filteredRestaurants.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
<<<<<<< HEAD:delices-afro-caraibes-frontend/src/app/restaurants/page.tsx
              Aucun restaurant ne correspond a vos criteres
            </p>
            <Button onClick={resetFilters} variant="outline" className="mt-4">
              Reinitialiser les filtres
=======
              Aucun restaurant ne correspond Ã  vos critÃ¨res
            </p>
            <Button onClick={resetFilters} variant="outline" className="mt-4">
              RÃ©initialiser les filtres
>>>>>>> 12a3b4bbbba165b93be40e8b5063089f718ff32c:frontend/src/app/restaurants/page.tsx
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group"
                onClick={() => router.push(`/restaurants/${restaurant.id}`)}
              >
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  {restaurant.imageUrl && !brokenImageIds.has(restaurant.id) ? (
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={() =>
                        setBrokenImageIds((prev) => {
                          const next = new Set(prev)
                          next.add(restaurant.id)
                          return next
                        })
                      }
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-fuchsia-500 to-pink-500" />
                  )}
                  {restaurant.isOpen && (
                    <Badge className="absolute top-2 right-2 bg-emerald-500 text-white" variant="secondary">
                      Ouvert
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{restaurant.name}</span>
                  </CardTitle>
                  <Badge variant="outline" className="w-fit">{restaurant.cuisineType}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {restaurant.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">4.5</span>
                      <span className="text-muted-foreground">(120)</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>30-45 min</span>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <p className="text-sm text-muted-foreground">
                    {restaurant.address}, {restaurant.city}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
