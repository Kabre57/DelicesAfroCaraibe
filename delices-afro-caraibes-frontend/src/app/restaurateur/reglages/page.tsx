'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { restaurantAPI, uploadAPI, userAPI } from '@/lib/api'
import { Restaurant } from '@/types'

type DashboardResponse = {
  restaurants: Restaurant[]
}

type DayHours = {
  open: string
  close: string
}

type FormState = {
  name: string
  description: string
  address: string
  city: string
  postalCode: string
  phone: string
  cuisineType: string
  openingHoursByDay: Record<string, DayHours>
  isActive: boolean
  imageUrl: string
}

type RestaurateurDocument = {
  id: string
  type: string
  fileUrl: string
  status: 'PENDING' | 'VALID' | 'EXPIRED' | 'REJECTED'
  expiresAt?: string | null
}

type SubAccount = {
  id: string
  restaurantId: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  role: string
  mustChangePassword?: boolean
  isActive: boolean
}

const weekDays = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
] as const

const defaultHours = weekDays.reduce((acc, day) => {
  acc[day.key] = { open: '09:00', close: '18:00' }
  return acc
}, {} as Record<string, DayHours>)

const emptyForm: FormState = {
  name: '',
  description: '',
  address: '',
  city: '',
  postalCode: '',
  phone: '',
  cuisineType: '',
  openingHoursByDay: defaultHours,
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

  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [documents, setDocuments] = useState<RestaurateurDocument[]>([])
  const [docType, setDocType] = useState('PIECE_IDENTITE')
  const [docImageUrl, setDocImageUrl] = useState('')
  const [docExpiresAt, setDocExpiresAt] = useState('')

  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [subFirstName, setSubFirstName] = useState('')
  const [subLastName, setSubLastName] = useState('')
  const [subEmail, setSubEmail] = useState('')
  const [subPhone, setSubPhone] = useState('')
  const [subRole, setSubRole] = useState('MANAGER')
  const [subPassword, setSubPassword] = useState('')

  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) || null,
    [restaurants, selectedRestaurantId]
  )

  const parseOpeningHours = (openingHours: unknown) => {
    const result: Record<string, DayHours> = { ...defaultHours }
    if (openingHours && typeof openingHours === 'object') {
      const source = openingHours as Record<string, any>
      weekDays.forEach((day) => {
        const value = source[day.key]
        if (typeof value === 'string' && value.includes('-')) {
          const [open, close] = value.split('-')
          if (open && close) result[day.key] = { open: open.trim(), close: close.trim() }
        } else if (value && typeof value === 'object') {
          const open = typeof value.open === 'string' ? value.open : result[day.key].open
          const close = typeof value.close === 'string' ? value.close : result[day.key].close
          result[day.key] = { open, close }
        }
      })
    }
    return result
  }

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
      openingHoursByDay: parseOpeningHours(restaurant.openingHours),
      isActive: Boolean(restaurant.isActive),
      imageUrl: restaurant.imageUrl || '',
    })
  }

  const loadRestaurateurExtras = async (userId: string) => {
    const [profileRes, subRes] = await Promise.all([
      userAPI.get(`/users/restaurateur/${userId}`),
      userAPI.get<SubAccount[]>(`/users/restaurateur/${userId}/subaccounts`),
    ])
    setDocuments(Array.isArray(profileRes.data?.documents) ? profileRes.data.documents : [])
    setSubAccounts(Array.isArray(subRes.data) ? subRes.data : [])
  }

  useEffect(() => {
    const init = async () => {
      try {
        const raw = localStorage.getItem('user')
        const parsed = raw ? JSON.parse(raw) : null
        if (!parsed?.id) {
          setError('Utilisateur non connecte.')
          setLoading(false)
          return
        }
        setCurrentUserId(parsed.ownerUserId || parsed.id)

        const res = await restaurantAPI.get<DashboardResponse>('/restaurants/my/dashboard')
        setRestaurants(res.data.restaurants)
        const first = res.data.restaurants[0]?.id || ''
        setSelectedRestaurantId(first)
        const firstRestaurant = res.data.restaurants.find((r) => r.id === first) || null
        hydrateForm(firstRestaurant)

        await loadRestaurateurExtras(parsed.ownerUserId || parsed.id)
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

      const openingHours: Record<string, string> = {}
      weekDays.forEach((day) => {
        const pair = form.openingHoursByDay[day.key]
        openingHours[day.key] = `${pair.open}-${pair.close}`
      })

      await restaurantAPI.put(`/restaurants/${selectedRestaurantId}`, {
        name: form.name.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        phone: form.phone.trim(),
        cuisineType: form.cuisineType.trim(),
        openingHours,
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

  const uploadFile = async (file?: File) => {
    if (!file) return null
    const formData = new FormData()
    formData.append('image', file)
    const res = await uploadAPI.post<{ url: string }>('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.url
  }

  const onRestaurantImageSelected = async (file?: File) => {
    if (!file) return
    try {
      setUploadingImage(true)
      setError('')
      const url = await uploadFile(file)
      if (url) setForm((prev) => ({ ...prev, imageUrl: url }))
    } catch (e) {
      console.error(e)
      setError("Upload de l'image restaurant impossible.")
    } finally {
      setUploadingImage(false)
    }
  }

  const onDocImageSelected = async (file?: File) => {
    if (!file) return
    try {
      setUploadingImage(true)
      setError('')
      const url = await uploadFile(file)
      if (url) setDocImageUrl(url)
    } catch (e) {
      console.error(e)
      setError("Upload du document impossible.")
    } finally {
      setUploadingImage(false)
    }
  }

  const addRestaurateurDocument = async () => {
    if (!currentUserId || !docImageUrl) {
      setError('Document incomplet.')
      return
    }
    try {
      setSaving(true)
      setError('')
      await userAPI.post(`/users/restaurateur/${currentUserId}/documents`, {
        type: docType,
        fileUrl: docImageUrl,
        expiresAt: docExpiresAt || undefined,
      })
      setDocImageUrl('')
      setDocExpiresAt('')
      await loadRestaurateurExtras(currentUserId)
      setNotice('Document ajoute.')
    } catch (e) {
      console.error(e)
      setError('Ajout document impossible.')
    } finally {
      setSaving(false)
    }
  }

  const createSubAccount = async () => {
    if (!currentUserId || !selectedRestaurantId || !subFirstName || !subLastName || !subEmail || !subPassword) {
      setError('Sous-compte incomplet.')
      return
    }
    if (subPassword.length < 8) {
      setError('Mot de passe sous-compte: minimum 8 caracteres.')
      return
    }
    try {
      setSaving(true)
      setError('')
      await userAPI.post(`/users/restaurateur/${currentUserId}/subaccounts`, {
        restaurantId: selectedRestaurantId,
        firstName: subFirstName,
        lastName: subLastName,
        email: subEmail,
        phone: subPhone || undefined,
        role: subRole,
        password: subPassword,
      })
      setSubFirstName('')
      setSubLastName('')
      setSubEmail('')
      setSubPhone('')
      setSubRole('MANAGER')
      setSubPassword('')
      await loadRestaurateurExtras(currentUserId)
      setNotice('Sous-compte cree.')
    } catch (e) {
      console.error(e)
      setError('Creation sous-compte impossible.')
    } finally {
      setSaving(false)
    }
  }

  const toggleSubAccount = async (sub: SubAccount) => {
    if (!currentUserId) return
    try {
      setSaving(true)
      setError('')
      await userAPI.put(`/users/restaurateur/${currentUserId}/subaccounts/${sub.id}`, {
        isActive: !sub.isActive,
      })
      await loadRestaurateurExtras(currentUserId)
    } catch (e) {
      console.error(e)
      setError('Mise a jour sous-compte impossible.')
    } finally {
      setSaving(false)
    }
  }

  const deleteSubAccount = async (subId: string) => {
    if (!currentUserId) return
    try {
      setSaving(true)
      setError('')
      await userAPI.delete(`/users/restaurateur/${currentUserId}/subaccounts/${subId}`)
      await loadRestaurateurExtras(currentUserId)
    } catch (e) {
      console.error(e)
      setError('Suppression sous-compte impossible.')
    } finally {
      setSaving(false)
    }
  }

  const resetSubAccountPassword = async (subId: string) => {
    if (!currentUserId) return
    const newPassword = window.prompt('Nouveau mot de passe (min 8 caracteres):')
    if (!newPassword) return
    if (newPassword.length < 8) {
      setError('Mot de passe trop court (min 8 caracteres).')
      return
    }
    try {
      setSaving(true)
      setError('')
      await userAPI.put(`/users/restaurateur/${currentUserId}/subaccounts/${subId}/password`, {
        password: newPassword,
        mustChangePassword: true,
      })
      await loadRestaurateurExtras(currentUserId)
      setNotice('Mot de passe sous-compte mis a jour.')
    } catch (e) {
      console.error(e)
      setError('Mise a jour mot de passe impossible.')
    } finally {
      setSaving(false)
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
          <div className="sm:col-span-2 space-y-2">
            <Label>Horaires par jour</Label>
            <div className="grid gap-2">
              {weekDays.map((day) => (
                <div key={day.key} className="grid items-center gap-2 rounded-lg border p-2 sm:grid-cols-[110px_1fr_1fr]">
                  <span className="text-sm font-medium">{day.label}</span>
                  <Input
                    type="time"
                    value={form.openingHoursByDay[day.key]?.open || '09:00'}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        openingHoursByDay: {
                          ...prev.openingHoursByDay,
                          [day.key]: { ...prev.openingHoursByDay[day.key], open: e.target.value },
                        },
                      }))
                    }
                  />
                  <Input
                    type="time"
                    value={form.openingHoursByDay[day.key]?.close || '18:00'}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        openingHoursByDay: {
                          ...prev.openingHoursByDay,
                          [day.key]: { ...prev.openingHoursByDay[day.key], close: e.target.value },
                        },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 sm:col-span-2">
            <span className="text-sm font-medium">Restaurant actif</span>
            <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents restaurateur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PIECE_IDENTITE">Piece d'identite</SelectItem>
                <SelectItem value="REGISTRE_COMMERCE">Registre commerce</SelectItem>
                <SelectItem value="ASSURANCE">Assurance</SelectItem>
                <SelectItem value="AUTRE">Autre</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={docExpiresAt} onChange={(e) => setDocExpiresAt(e.target.value)} />
            <Input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(e) => onDocImageSelected(e.target.files?.[0])} />
            <Button onClick={addRestaurateurDocument} disabled={saving || !docImageUrl}>Ajouter document</Button>
          </div>
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span>{doc.type}</span>
              <span>{doc.status}{doc.expiresAt ? ` - ${new Date(doc.expiresAt).toISOString().slice(0, 10)}` : ''}</span>
            </div>
          ))}
          {documents.length === 0 && <p className="text-sm text-slate-500">Aucun document.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sous-comptes restaurant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-7">
            <Input placeholder="Prenom" value={subFirstName} onChange={(e) => setSubFirstName(e.target.value)} />
            <Input placeholder="Nom" value={subLastName} onChange={(e) => setSubLastName(e.target.value)} />
            <Input placeholder="Email" value={subEmail} onChange={(e) => setSubEmail(e.target.value)} />
            <Input placeholder="Telephone" value={subPhone} onChange={(e) => setSubPhone(e.target.value)} />
            <Input placeholder="Mot de passe initial" type="password" value={subPassword} onChange={(e) => setSubPassword(e.target.value)} />
            <Select value={subRole} onValueChange={setSubRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="CAISSE">Caisse</SelectItem>
                <SelectItem value="CUISINE">Cuisine</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={createSubAccount} disabled={saving}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter
            </Button>
          </div>
          {subAccounts.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{sub.firstName} {sub.lastName} - {sub.role}</p>
                <p className="text-slate-500">{sub.email} {sub.mustChangePassword ? '(mot de passe a changer)' : ''}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => resetSubAccountPassword(sub.id)}>Reset MDP</Button>
                <Button variant="outline" onClick={() => toggleSubAccount(sub)}>{sub.isActive ? 'Desactiver' : 'Activer'}</Button>
                <Button variant="outline" onClick={() => deleteSubAccount(sub.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {subAccounts.length === 0 && <p className="text-sm text-slate-500">Aucun sous-compte.</p>}
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
