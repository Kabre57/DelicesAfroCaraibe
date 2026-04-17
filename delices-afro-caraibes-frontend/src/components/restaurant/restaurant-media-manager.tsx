'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { restaurantAPI, uploadAPI } from '@/lib/api'
import { resolveMediaUrl } from '@/lib/media'
import { Restaurant, RestaurantGalleryImage } from '@/types'

type Props = {
  restaurant: Restaurant
  onRestaurantChange?: (restaurant: Restaurant) => void
}

const getApiErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.error || error?.message || fallback

export function RestaurantMediaManager({ restaurant, onRestaurantChange }: Props) {
  const [coverUrl, setCoverUrl] = useState(restaurant.imageUrl || '')
  const [gallery, setGallery] = useState<RestaurantGalleryImage[]>(restaurant.galleryImages || [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setCoverUrl(restaurant.imageUrl || '')
    setGallery(restaurant.galleryImages || [])
  }, [restaurant])

  useEffect(() => {
    syncFromApi().catch((e) => {
      console.error(e)
      setError(getApiErrorMessage(e, 'Chargement galerie impossible.'))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant.id])

  const syncFromApi = async () => {
    const res = await restaurantAPI.get<Restaurant>(`/restaurants/${restaurant.id}`)
    setCoverUrl(res.data.imageUrl || '')
    setGallery(res.data.galleryImages || [])
    onRestaurantChange?.(res.data)
  }

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    const res = await uploadAPI.post<{ url: string }>('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.url
  }

  const onCoverSelected = async (file?: File) => {
    if (!file) return
    try {
      setBusy(true)
      setError('')
      const url = await uploadFile(file)
      const res = await restaurantAPI.put<Restaurant>(`/restaurants/${restaurant.id}`, {
        imageUrl: url,
      })
      setCoverUrl(res.data.imageUrl || '')
      onRestaurantChange?.(res.data)
      await syncFromApi()
    } catch (e) {
      console.error(e)
      setError(getApiErrorMessage(e, "Impossible d'enregistrer l'image principale."))
    } finally {
      setBusy(false)
    }
  }

  const onGallerySelected = async (files?: FileList | null) => {
    if (!files?.length) return
    try {
      setBusy(true)
      setError('')
      for (const file of Array.from(files)) {
        const url = await uploadFile(file)
        await restaurantAPI.post(`/restaurants/${restaurant.id}/gallery`, {
          imageUrl: url,
          altText: restaurant.name,
        })
      }
      await syncFromApi()
    } catch (e) {
      console.error(e)
      setError(getApiErrorMessage(e, "Impossible d'ajouter une image a la galerie."))
    } finally {
      setBusy(false)
    }
  }

  const removeGalleryImage = async (imageId: string) => {
    try {
      setBusy(true)
      setError('')
      await restaurantAPI.delete(`/restaurants/${restaurant.id}/gallery/${imageId}`)
      await syncFromApi()
    } catch (e) {
      console.error(e)
      setError(getApiErrorMessage(e, 'Suppression image galerie impossible.'))
    } finally {
      setBusy(false)
    }
  }

  const reorderGallery = async (imageId: string, direction: 'left' | 'right') => {
    const currentIndex = gallery.findIndex((image) => image.id === imageId)
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= gallery.length) return

    const nextGallery = [...gallery]
    const [movedImage] = nextGallery.splice(currentIndex, 1)
    nextGallery.splice(targetIndex, 0, movedImage)

    const optimisticGallery = nextGallery.map((image, index) => ({ ...image, sortOrder: index }))

    try {
      setBusy(true)
      setError('')
      setGallery(optimisticGallery)
      await restaurantAPI.put(`/restaurants/${restaurant.id}/gallery/reorder`, {
        imageIds: optimisticGallery.map((image) => image.id),
      })
      await syncFromApi()
    } catch (e) {
      console.error(e)
      setError(getApiErrorMessage(e, 'Tri des images impossible.'))
      await syncFromApi()
    } finally {
      setBusy(false)
    }
  }

  const useAsCover = async (imageUrl: string) => {
    try {
      setBusy(true)
      setError('')
      const res = await restaurantAPI.put<Restaurant>(`/restaurants/${restaurant.id}`, {
        imageUrl,
      })
      setCoverUrl(res.data.imageUrl || '')
      onRestaurantChange?.(res.data)
      await syncFromApi()
    } catch (e) {
      console.error(e)
      setError(getApiErrorMessage(e, "Mise a jour de l'image principale impossible."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">Image principale</h3>
              <p className="text-sm text-slate-600">Visible sur les listes et la fiche restaurant.</p>
            </div>
            {busy && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
          </div>
          <div className="mb-3 h-48 overflow-hidden rounded-xl bg-slate-100">
            {coverUrl ? (
              <img src={resolveMediaUrl(coverUrl)} alt={restaurant.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
                Aucune image principale
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`cover-${restaurant.id}`}>Remplacer l&apos;image principale</Label>
            <Input
              id={`cover-${restaurant.id}`}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => onCoverSelected(e.target.files?.[0])}
              disabled={busy}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="mb-1 font-semibold text-slate-900">Galerie</h3>
          <p className="mb-3 text-sm text-slate-600">Ajoutez plusieurs photos du restaurant, de la salle ou des plats.</p>
          <div className="space-y-2">
            <Label htmlFor={`gallery-${restaurant.id}`}>Ajouter des images</Label>
            <Input
              id={`gallery-${restaurant.id}`}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              multiple
              onChange={(e) => onGallerySelected(e.target.files)}
              disabled={busy}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {gallery.map((image) => (
              <div key={image.id} className="rounded-xl border border-slate-200 p-2">
                <div className="mb-2 h-28 overflow-hidden rounded-lg bg-slate-100">
                  <img src={resolveMediaUrl(image.imageUrl)} alt={image.altText || restaurant.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => reorderGallery(image.id, 'left')}
                    disabled={busy || gallery[0]?.id === image.id}
                  >
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                    Monter
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => reorderGallery(image.id, 'right')}
                    disabled={busy || gallery[gallery.length - 1]?.id === image.id}
                  >
                    <ArrowRight className="mr-1 h-3.5 w-3.5" />
                    Descendre
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => useAsCover(image.imageUrl)}
                    disabled={busy}
                  >
                    <Star className="mr-1 h-3.5 w-3.5" />
                    Couverture
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => removeGalleryImage(image.id)}
                    disabled={busy}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {gallery.length === 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              <ImagePlus className="h-4 w-4" />
              Aucune image dans la galerie pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
