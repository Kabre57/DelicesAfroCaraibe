'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { restaurantAPI, uploadAPI } from '@/lib/api'
import { MenuItem, Restaurant } from '@/types'

type DashboardResponse = {
  restaurants: Restaurant[]
}

type MenuForm = {
  id?: string
  name: string
  description: string
  price: string
  category: string
  imageUrl: string
}

type CategoryItem = {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  isActive: boolean
}

const initialForm: MenuForm = {
  name: '',
  description: '',
  price: '',
  category: 'Plats',
  imageUrl: '',
}

export default function RestaurateurMenuPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<MenuForm>(initialForm)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [categoriesCatalog, setCategoriesCatalog] = useState<CategoryItem[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryImageUrl, setNewCategoryImageUrl] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)

  const categories = useMemo(() => {
    const set = new Set([
      ...categoriesCatalog.filter((c) => c.isActive).map((c) => c.name),
      ...menuItems.map((item) => item.category).filter(Boolean),
    ])
    return ['ALL', ...Array.from(set)]
  }, [menuItems, categoriesCatalog])

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const byCategory = categoryFilter === 'ALL' || item.category === categoryFilter
      const q = search.trim().toLowerCase()
      const bySearch = !q || item.name.toLowerCase().includes(q)
      return byCategory && bySearch
    })
  }, [menuItems, categoryFilter, search])

  const loadRestaurants = async () => {
    const res = await restaurantAPI.get<DashboardResponse>('/restaurants/my/dashboard')
    setRestaurants(res.data.restaurants)
    const first = res.data.restaurants[0]?.id || ''
    setSelectedRestaurantId((prev) => prev || first)
    return first
  }

  const loadMenu = async (restaurantId: string) => {
    if (!restaurantId) return
    const res = await restaurantAPI.get<MenuItem[]>(`/menu/restaurant/${restaurantId}`)
    setMenuItems(res.data)
  }

  const loadCategories = async () => {
    const res = await restaurantAPI.get<CategoryItem[]>('/restaurants/categories')
    setCategoriesCatalog(Array.isArray(res.data) ? res.data : [])
  }

  useEffect(() => {
    const init = async () => {
      try {
        const first = await loadRestaurants()
        await Promise.all([loadMenu(first), loadCategories()])
      } catch (e) {
        console.error(e)
        setError('Impossible de charger le menu.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedRestaurantId) return
    loadMenu(selectedRestaurantId).catch((e) => {
      console.error(e)
      setError('Impossible de charger ce menu.')
    })
  }, [selectedRestaurantId])

  const openCreate = () => {
    setForm((prev) => ({ ...initialForm, category: categories[1] || 'Plats' }))
    setDialogOpen(true)
  }

  const openEdit = (item: MenuItem) => {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      category: item.category || categories[1] || 'Plats',
      imageUrl: item.imageUrl || '',
    })
    setDialogOpen(true)
  }

  const uploadImage = async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    const res = await uploadAPI.post<{ url: string }>('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.url
  }

  const onImageSelected = async (file?: File) => {
    if (!file) return
    try {
      setUploadingImage(true)
      setError('')
      const url = await uploadImage(file)
      setForm((prev) => ({ ...prev, imageUrl: url }))
    } catch (e) {
      console.error(e)
      setError("Upload d'image impossible.")
    } finally {
      setUploadingImage(false)
    }
  }

  const onNewCategoryImageSelected = async (file?: File) => {
    if (!file) return
    try {
      setSavingCategory(true)
      setError('')
      const url = await uploadImage(file)
      setNewCategoryImageUrl(url)
    } catch (e) {
      console.error(e)
      setError("Upload d'image categorie impossible.")
    } finally {
      setSavingCategory(false)
    }
  }

  const submitForm = async () => {
    if (!selectedRestaurantId) return
    const payload = {
      restaurantId: selectedRestaurantId,
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      imageUrl: form.imageUrl || undefined,
      isAvailable: true,
    }
    if (!payload.name || !Number.isFinite(payload.price) || !payload.category) {
      setError('Nom, categorie et prix valides sont obligatoires.')
      return
    }

    try {
      setError('')
      if (form.id) {
        await restaurantAPI.put(`/menu/${form.id}`, payload)
      } else {
        await restaurantAPI.post('/menu', payload)
      }
      setDialogOpen(false)
      setForm(initialForm)
      await loadMenu(selectedRestaurantId)
    } catch (e) {
      console.error(e)
      setError('Enregistrement du plat impossible.')
    }
  }

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await restaurantAPI.put(`/menu/${item.id}`, { isAvailable: !item.isAvailable })
      await loadMenu(selectedRestaurantId)
    } catch (e) {
      console.error(e)
      setError('Mise a jour du statut indisponible.')
    }
  }

  const duplicateItem = async (item: MenuItem) => {
    try {
      await restaurantAPI.post('/menu', {
        restaurantId: item.restaurantId,
        name: `${item.name} (Copie)`,
        description: item.description,
        price: item.price,
        category: item.category,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
      })
      await loadMenu(selectedRestaurantId)
    } catch (e) {
      console.error(e)
      setError('Duplication impossible.')
    }
  }

  const deleteItem = async (item: MenuItem) => {
    try {
      await restaurantAPI.delete(`/menu/${item.id}`)
      await loadMenu(selectedRestaurantId)
    } catch (e) {
      console.error(e)
      setError('Suppression impossible.')
    }
  }

  const createCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) {
      setError('Nom de categorie requis.')
      return
    }
    try {
      setSavingCategory(true)
      setError('')
      await restaurantAPI.post('/restaurants/categories', {
        name,
        imageUrl: newCategoryImageUrl || undefined,
        isActive: true,
      })
      setNewCategoryName('')
      setNewCategoryImageUrl('')
      await loadCategories()
    } catch (e) {
      console.error(e)
      setError('Creation categorie impossible.')
    } finally {
      setSavingCategory(false)
    }
  }

  const updateCategoryImage = async (categoryId: string, file?: File) => {
    if (!file) return
    try {
      setSavingCategory(true)
      setError('')
      const url = await uploadImage(file)
      await restaurantAPI.put(`/restaurants/categories/${categoryId}`, { imageUrl: url })
      await loadCategories()
    } catch (e) {
      console.error(e)
      setError('Mise a jour image categorie impossible.')
    } finally {
      setSavingCategory(false)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    try {
      setSavingCategory(true)
      setError('')
      await restaurantAPI.delete(`/restaurants/categories/${categoryId}`)
      await loadCategories()
    } catch (e) {
      console.error(e)
      setError('Suppression categorie impossible.')
    } finally {
      setSavingCategory(false)
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-slate-900">Gestion du menu</h1>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
              <SelectTrigger className="w-[260px] rounded-xl">
                <SelectValue placeholder="Restaurant" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un plat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{form.id ? 'Modifier le plat' : 'Ajouter un plat'}</DialogTitle>
                  <DialogDescription>
                    Completez les informations du plat et enregistrez.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="image">Image du plat</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => onImageSelected(e.target.files?.[0])}
                    />
                    {uploadingImage && <p className="text-xs text-slate-500">Upload image...</p>}
                    {form.imageUrl && (
                      <img src={form.imageUrl} alt="Apercu plat" className="mt-2 h-28 w-full rounded-lg object-cover" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="name">Nom</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="price">Prix</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Categorie</Label>
                      <Select value={form.category} onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .filter((value) => value !== 'ALL')
                            .map((value) => (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={submitForm}>Enregistrer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full">
                  Gerer categories
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Categories</DialogTitle>
                  <DialogDescription>
                    Ajoutez des categories avec image et mettez a jour les images existantes.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="mb-2 text-sm font-semibold">Nouvelle categorie</p>
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nom categorie"
                      />
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={(e) => onNewCategoryImageSelected(e.target.files?.[0])}
                      />
                      <Button onClick={createCategory} disabled={savingCategory}>
                        Ajouter
                      </Button>
                    </div>
                    {newCategoryImageUrl && (
                      <img src={newCategoryImageUrl} alt="Apercu categorie" className="mt-2 h-20 w-20 rounded-lg object-cover" />
                    )}
                  </div>

                  <div className="grid max-h-[45vh] gap-3 overflow-auto pr-1">
                    {categoriesCatalog.map((category) => (
                      <div key={category.id} className="grid items-center gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[80px_1fr_auto_auto]">
                        <div className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100">
                          {category.imageUrl ? (
                            <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-semibold">{category.name}</p>
                          <p className="text-xs text-slate-500">{category.slug}</p>
                        </div>
                        <Input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(e) => updateCategoryImage(category.id, e.target.files?.[0])}
                        />
                        <Button variant="outline" onClick={() => deleteCategory(category.id)} disabled={savingCategory}>
                          Supprimer
                        </Button>
                      </div>
                    ))}
                    {categoriesCatalog.length === 0 && (
                      <p className="text-sm text-slate-500">Aucune categorie configuree.</p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <Card className="border-slate-200/70 bg-white/90">
        <CardContent className="pt-5">
          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un plat" className="pl-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-3">
        {filteredItems.map((item) => (
          <Card key={item.id} className="border-slate-200/80 bg-white/90">
            {item.imageUrl && (
              <div className="h-40 w-full overflow-hidden rounded-t-xl">
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                <span>
                  {item.name} - {item.price.toFixed(2)} EUR
                </span>
                <Badge variant={item.isAvailable ? 'default' : 'outline'}>
                  {item.isAvailable ? 'Actif' : 'Indisponible'}
                </Badge>
              </CardTitle>
              <p className="text-sm text-slate-500">{item.category}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-700">{item.description || 'Sans description'}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => openEdit(item)}>
                  Modifier
                </Button>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => toggleAvailability(item)}>
                  {item.isAvailable ? 'Desactiver' : 'Activer'}
                </Button>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => duplicateItem(item)}>
                  Dupliquer
                </Button>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => deleteItem(item)}>
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredItems.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-600">
            Aucun plat trouve.
          </p>
        )}
      </section>
    </div>
  )
}
