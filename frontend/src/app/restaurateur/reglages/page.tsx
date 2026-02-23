'use client'

import { useEffect, useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { restaurantAPI, uploadAPI } from '@/lib/api'
import { Restaurant } from '@/types'

type DashboardResponse = {
  restaurants: Restaurant[]
}

type FormState = {
  name: string
  description: string
  address: string
  city: string
  postalCode: string
  phone: string
  cuisineType: string
  openingHours: string
  isActive: boolean
  imageUrl: string
}

const emptyForm: FormState = {
  name: '',
  description: '',
  address: '',
  city: '',
  postalCode: '',
  phone: '',
  cuisineType: '',
  openingHours: '',
  isActive: true,
  imageUrl: '',
}

export default function RestaurateurSettingsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) || null,
    [restaurants, selectedRestaurantId]
  )

  const hydrateForm = (restaurant: Restaurant | null) => {
    if (!restaurant) {
      setForm(emptyForm)
      return
    }
    setForm({
      name: restaurant.name || '',
      description: restaurant.description || '',
      address: restaurant.address || '',
      city: restaurant.city || '',
      postalCode: restaurant.postalCode || '',
      phone: restaurant.phone || '',
      cuisineType: restaurant.cuisineType || '',
      openingHours:
        typeof restaurant.openingHours === 'string'
          ? restaurant.openingHours
          : JSON.stringify(restaurant.openingHours || {}, null, 2),
      isActive: Boolean(restaurant.isActive),
      imageUrl: restaurant.imageUrl || '',
    })
  }

  useEffect(() => {
    const init = async () => {
      try {
        const res = await restaurantAPI.get<DashboardResponse>('/restaurants/my/dashboard')
        setRestaurants(res.data.restaurants)
        const first = res.data.restaurants[0]?.id || ''
        setSelectedRestaurantId(first)
        const firstRestaurant = res.data.restaurants.find((r) => r.id === first) || null
        hydrateForm(firstRestaurant)
      } catch (e) {
        console.error(e)
        setError('Impossible de charger les reglages.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    hydrateForm(selectedRestaurant)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurantId])

  const save = async () => {
    if (!selectedRestaurantId) return
    try {
      setSaving(true)
      setError('')
      setNotice('')
      let parsedOpeningHours: unknown = form.openingHours
      try {
        parsedOpeningHours = JSON.parse(form.openingHours)
      } catch {
        parsedOpeningHours = form.openingHours
      }

      await restaurantAPI.put(`/restaurants/${selectedRestaurantId}`, {
        name: form.name.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        phone: form.phone.trim(),
        cuisineType: form.cuisineType.trim(),
        openingHours: parsedOpeningHours,
        isActive: form.isActive,
        imageUrl: form.imageUrl || undefined,
      })

      const refreshed = await restaurantAPI.get<DashboardResponse>('/restaurants/my/dashboard')
      setRestaurants(refreshed.data.restaurants)
      setNotice('Reglages enregistres avec succes.')
    } catch (e) {
      console.error(e)
      setError('Sauvegarde impossible.')
    } finally {
      setSaving(false)
    }
  }

  const onRestaurantImageSelected = async (file?: File) => {
    if (!file) return
    try {
      setUploadingImage(true)
      setError('')
      const formData = new FormData()
      formData.append('image', file)
      const res = await uploadAPI.post<{ url: string }>('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm((prev) => ({ ...prev, imageUrl: res.data.url }))
    } catch (e) {
      console.error(e)
      setError("Upload de l'image restaurant impossible.")
    } finally {
      setUploadingImage(false)
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-slate-900">Parametres du restaurant</h1>
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
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{notice}</div>}

      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader>
          <CardTitle>Informations generales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="restaurant-image">Image du restaurant</Label>
            <Input
              id="restaurant-image"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => onRestaurantImageSelected(e.target.files?.[0])}
            />
            {uploadingImage && <p className="text-xs text-slate-500">Upload image...</p>}
            {form.imageUrl && (
              <img src={form.imageUrl} alt="Apercu restaurant" className="mt-2 h-40 w-full rounded-xl object-cover" />
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Telephone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="city">Ville</Label>
            <Input id="city" value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="postalCode">Code postal</Label>
            <Input
              id="postalCode"
              value={form.postalCode}
              onChange={(e) => setForm((prev) => ({ ...prev, postalCode: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cuisineType">Type cuisine</Label>
            <Input
              id="cuisineType"
              value={form.cuisineType}
              onChange={(e) => setForm((prev) => ({ ...prev, cuisineType: e.target.value }))}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="openingHours">Horaires (texte ou JSON)</Label>
            <Input
              id="openingHours"
              value={form.openingHours}
              onChange={(e) => setForm((prev) => ({ ...prev, openingHours: e.target.value }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 sm:col-span-2">
            <span className="text-sm font-medium">Restaurant actif</span>
            <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="rounded-full">
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}
