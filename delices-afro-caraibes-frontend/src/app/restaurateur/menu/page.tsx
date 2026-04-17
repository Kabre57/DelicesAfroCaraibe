'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ImagePlus, Plus, Search, Settings2 } from 'lucide-react'
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
import { resolveMediaUrl } from '@/lib/media'
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
  galleryImageUrls: string[]
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
  galleryImageUrls: [],
}

const getApiErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.error || error?.message || fallback

const normalizePriceInput = (value: string) =>
  value
    .replace(',', '.')
    .replace(/[^0-9.]/g, '')
    .replace(/(\..*)\./g, '$1')

const toNumericPrice = (value: string) => Number(normalizePriceInput(value))

const getMenuGalleryUrls = (item?: Partial<MenuItem> | null) => {
  if (!item) return []
  const gallery = Array.isArray(item.galleryImages)
    ? item.galleryImages.map((image) => image.imageUrl).filter(Boolean)
    : []

  if (item.imageUrl && !gallery.includes(item.imageUrl)) {
    return [item.imageUrl, ...gallery]
  }

  return gallery
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

  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) || null,
    [restaurants, selectedRestaurantId]
  )

  const restaurantGallery = useMemo(() => {
    if (!selectedRestaurant) return []

    const images = selectedRestaurant.galleryImages || []
    if (selectedRestaurant.imageUrl && !images.some((image) => image.imageUrl === selectedRestaurant.imageUrl)) {
      return [
        {
          id: 'cover-image',
          restaurantId: selectedRestaurant.id,
          imageUrl: selectedRestaurant.imageUrl,
          altText: selectedRestaurant.name,
          sortOrder: -1,
          createdAt: selectedRestaurant.createdAt,
          updatedAt: selectedRestaurant.updatedAt,
        },
        ...images,
      ]
    }

    return images
  }, [selectedRestaurant])

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
      galleryImageUrls: getMenuGalleryUrls(item),
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

  const onImagesSelected = async (files?: FileList | null) => {
    if (!files?.length) return
    try {
      setUploadingImage(true)
      setError('')
      const uploadedUrls: string[] = []
      for (const file of Array.from(files)) {
        uploadedUrls.push(await uploadImage(file))
      }
      setForm((prev) => ({
        ...prev,
        galleryImageUrls: Array.from(new Set([...prev.galleryImageUrls, ...uploadedUrls])),
      }))
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
    const normalizedCategory = form.category.trim()
    const normalizedPrice = toNumericPrice(form.price)
    const payload = {
      restaurantId: selectedRestaurantId,
      name: form.name.trim(),
      description: form.description.trim(),
      price: normalizedPrice,
      category: normalizedCategory,
      imageUrl: form.galleryImageUrls[0] || undefined,
      galleryImageUrls: form.galleryImageUrls,
      isAvailable: true,
    }
    if (!payload.name || !Number.isFinite(payload.price) || payload.price <= 0 || !payload.category) {
      setError('Nom, categorie et prix valides sont obligatoires. Exemple prix: 24,50')
      return
    }

    try {
      setError('')
      const categoryExists = categoriesCatalog.some(
        (category) => category.name.trim().toLowerCase() === payload.category.trim().toLowerCase()
      )
      if (!categoryExists) {
        await restaurantAPI.post('/restaurants/categories', {
          name: payload.category,
          isActive: true,
        })
        await loadCategories()
      }
      if (form.id) {
        await restaurantAPI.put(`/menu/${form.id}`, payload)
      } else {
        await restaurantAPI.post(`/restaurants/${selectedRestaurantId}/menu`, payload)
      }
      setDialogOpen(false)
      setForm(initialForm)
      await loadMenu(selectedRestaurantId)
    } catch (e) {
      console.error(e)
      setError(getApiErrorMessage(e, 'Enregistrement du plat impossible.'))
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
      await restaurantAPI.post(`/restaurants/${item.restaurantId}/menu`, {
        restaurantId: item.restaurantId,
        name: `${item.name} (Copie)`,
        description: item.description,
        price: item.price,
        category: item.category,
        imageUrl: item.imageUrl,
        galleryImageUrls: getMenuGalleryUrls(item),
        isAvailable: item.isAvailable,
      })
      await loadMenu(selectedRestaurantId)
    } catch (e) {
      console.error(e)
      setError(getApiErrorMessage(e, 'Duplication impossible.'))
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
          <div>
            <h1 className="text-2xl font-black text-slate-900">Gestion du menu</h1>
            <p className="text-sm text-slate-600">
              Ajout des plats, categories et images pour {selectedRestaurant?.name || 'votre restaurant'}.
            </p>
          </div>
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

            <Link href="/restaurateur/reglages">
              <Button variant="outline" className="rounded-full">
                <ImagePlus className="mr-2 h-4 w-4" />
                Image du restaurant
              </Button>
            </Link>

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
                      multiple
                      onChange={(e) => onImagesSelected(e.target.files)}
                    />
                    {uploadingImage && <p className="text-xs text-slate-500">Upload images...</p>}
                    <p className="text-xs text-slate-500">
                      La premiere image sera la couverture du plat cote client.
                    </p>
                    {form.galleryImageUrls.length > 0 && (
                      <div className="mt-3 space-y-3">
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                          <img
                            src={resolveMediaUrl(form.galleryImageUrls[0])}
                            alt="Couverture du plat"
                            className="h-32 w-full object-cover"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {form.galleryImageUrls.map((url, index) => (
                            <div key={`${url}-${index}`} className="rounded-lg border border-slate-200 p-2">
                              <div className="mb-2 h-20 overflow-hidden rounded-md bg-slate-100">
                                <img src={resolveMediaUrl(url)} alt={`Image plat ${index + 1}`} className="h-full w-full object-cover" />
                              </div>
                              <div className="flex flex-wrap gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full"
                                  onClick={() =>
                                    setForm((prev) => {
                                      const next = [...prev.galleryImageUrls]
                                      const [selected] = next.splice(index, 1)
                                      next.unshift(selected)
                                      return { ...prev, galleryImageUrls: next }
                                    })
                                  }
                                  disabled={index === 0}
                                >
                                  Couverture
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full"
                                  onClick={() =>
                                    setForm((prev) => {
                                      const next = [...prev.galleryImageUrls]
                                      if (index === 0) return prev
                                      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                                      return { ...prev, galleryImageUrls: next }
                                    })
                                  }
                                  disabled={index === 0}
                                >
                                  Monter
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full"
                                  onClick={() =>
                                    setForm((prev) => {
                                      const next = prev.galleryImageUrls.filter((_, imageIndex) => imageIndex !== index)
                                      return { ...prev, galleryImageUrls: next }
                                    })
                                  }
                                >
                                  Supprimer
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
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
                        inputMode="decimal"
                        placeholder="Ex: 24,50"
                        value={form.price}
                        onChange={(e) => setForm((prev) => ({ ...prev, price: normalizePriceInput(e.target.value) }))}
                      />
                      <p className="text-xs text-slate-500">Vous pouvez saisir `24,50` ou `24.50`.</p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="category">Categorie</Label>
                      <Input
                        id="category"
                        placeholder="Ex: Grillades"
                        value={form.category}
                        onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                      />
                      <div className="flex flex-wrap gap-2 pt-1">
                        {categories
                          .filter((value) => value !== 'ALL')
                          .slice(0, 8)
                          .map((value) => (
                            <Button
                              key={value}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => setForm((prev) => ({ ...prev, category: value }))}
                            >
                              {value}
                            </Button>
                          ))}
                      </div>
                      <p className="text-xs text-slate-500">
                        Si la categorie n&apos;existe pas encore, elle sera creee automatiquement.
                      </p>
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

      {selectedRestaurant && (
        <Card className="border-slate-200/80 bg-white/90">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
              <span>Galerie vitrine du restaurant</span>
              <Link href="/restaurateur/reglages">
                <Button variant="outline" size="sm" className="rounded-full">
                  Gerer la galerie
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Cette galerie est visible cote client sur la fiche publique du restaurant. Utilisez-la pour presenter la salle, la facade et vos meilleurs plats.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {restaurantGallery.slice(0, 4).map((image) => (
                <div key={image.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <img
                    src={resolveMediaUrl(image.imageUrl)}
                    alt={image.altText || selectedRestaurant.name}
                    className="h-32 w-full object-cover"
                  />
                </div>
              ))}
              {restaurantGallery.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Aucune image de galerie pour le moment. Ajoutez-en depuis Reglages pour enrichir l&apos;experience client.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
            {getMenuGalleryUrls(item)[0] && (
              <div className="h-40 w-full overflow-hidden rounded-t-xl">
                <img src={resolveMediaUrl(getMenuGalleryUrls(item)[0] || item.imageUrl)} alt={item.name} className="h-full w-full object-cover" />
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
              {getMenuGalleryUrls(item).length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {getMenuGalleryUrls(item)
                    .slice(0, 4)
                    .map((imageUrl, index) => (
                      <div key={`${item.id}-gallery-${index}`} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        <img src={resolveMediaUrl(imageUrl)} alt={`${item.name} ${index + 1}`} className="h-12 w-full object-cover" />
                      </div>
                    ))}
                </div>
              )}
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

      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-slate-700" />
            Visuel du restaurant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 overflow-hidden rounded-xl bg-slate-100">
              {selectedRestaurant?.imageUrl ? (
                <img
                  src={resolveMediaUrl(selectedRestaurant.imageUrl)}
                  alt={selectedRestaurant.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{selectedRestaurant?.name || 'Restaurant'}</p>
              <p className="text-sm text-slate-600">
                Ajoutez ou modifiez la photo de couverture dans les reglages du restaurant.
              </p>
            </div>
          </div>
          <Link href="/restaurateur/reglages">
            <Button variant="outline" className="rounded-full">
              Gerer l&apos;image du restaurant
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
