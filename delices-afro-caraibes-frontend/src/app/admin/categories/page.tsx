'use client'

import { useEffect, useState } from 'react'
import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { restaurantAPI, uploadAPI } from '@/lib/api'

type CategoryItem = {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  isActive: boolean
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => {
    try {
      const res = await restaurantAPI.get<CategoryItem[]>('/restaurants/categories')
      setCategories(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error(e)
      setError('Impossible de charger les categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const uploadImage = async (file?: File) => {
    if (!file) return
    try {
      setSaving(true)
      setError('')
      const formData = new FormData()
      formData.append('image', file)
      const res = await uploadAPI.post<{ url: string }>('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImageUrl(res.data.url)
    } catch (e) {
      console.error(e)
      setError("Upload d'image categorie impossible.")
    } finally {
      setSaving(false)
    }
  }

  const createCategory = async () => {
    if (!name.trim()) {
      setError('Nom categorie requis.')
      return
    }
    try {
      setSaving(true)
      setError('')
      setNotice('')
      await restaurantAPI.post('/restaurants/categories', {
        name: name.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl || undefined,
        isActive: true,
      })
      setName('')
      setDescription('')
      setImageUrl('')
      setNotice('Categorie creee.')
      await load()
    } catch (e) {
      console.error(e)
      setError('Creation categorie impossible.')
    } finally {
      setSaving(false)
    }
  }

  const updateImage = async (id: string, file?: File) => {
    if (!file) return
    try {
      setSaving(true)
      setError('')
      const formData = new FormData()
      formData.append('image', file)
      const res = await uploadAPI.post<{ url: string }>('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await restaurantAPI.put(`/restaurants/categories/${id}`, { imageUrl: res.data.url })
      setNotice('Image categorie mise a jour.')
      await load()
    } catch (e) {
      console.error(e)
      setError('Mise a jour image categorie impossible.')
    } finally {
      setSaving(false)
    }
  }

  const removeCategory = async (id: string) => {
    try {
      setSaving(true)
      setError('')
      await restaurantAPI.delete(`/restaurants/categories/${id}`)
      setNotice('Categorie supprimee.')
      await load()
    } catch (e) {
      console.error(e)
      setError('Suppression categorie impossible.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Catalogue categories</h1>
        <p className="text-sm text-slate-600">Gestion centralisee des categories visibles sur l'accueil.</p>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{notice}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Ajouter une categorie</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Ivoirien" />
          </div>
          <div className="space-y-1">
            <Label>Description (optionnel)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Image</Label>
            <Input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(e) => uploadImage(e.target.files?.[0])} />
            {imageUrl && <img src={imageUrl} alt="Apercu categorie" className="mt-2 h-24 w-24 rounded-lg object-cover" />}
          </div>
          <div className="sm:col-span-2">
            <Button onClick={createCategory} disabled={saving}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter categorie
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories existantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="grid items-center gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[90px_1fr_auto_auto]"
            >
              <div className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100">
                {category.imageUrl ? (
                  <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div>
                <p className="font-semibold">{category.name}</p>
                <p className="text-xs text-slate-500">{category.slug}</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <ImagePlus className="h-4 w-4" />
                Changer image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => updateImage(category.id, e.target.files?.[0])}
                />
              </label>
              <Button variant="outline" onClick={() => removeCategory(category.id)} disabled={saving}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-slate-600">Aucune categorie.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
