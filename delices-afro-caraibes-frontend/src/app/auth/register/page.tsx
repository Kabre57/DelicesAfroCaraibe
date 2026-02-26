'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authAPI } from '@/lib/api'

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const dayLabels = [
  ['monday', 'Lundi'],
  ['tuesday', 'Mardi'],
  ['wednesday', 'Mercredi'],
  ['thursday', 'Jeudi'],
  ['friday', 'Vendredi'],
  ['saturday', 'Samedi'],
  ['sunday', 'Dimanche'],
] as const

export default function RegisterPage() {
  const router = useRouter()
  const [hoursByDay, setHoursByDay] = useState<Record<string, { open: string; close: string }>>({
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '09:00', close: '18:00' },
    sunday: { open: '09:00', close: '18:00' },
  })
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'CLIENT',
    address: '',
    city: '',
    postalCode: '',

    restaurantName: '',
    restaurantDescription: '',
    restaurantAddress: '',
    restaurantCity: '',
    restaurantPostalCode: '',
    restaurantPhone: '',
    cuisineType: '',
    restaurateurDocIdUrl: '',
    restaurateurDocRcUrl: '',

    vehicleType: '',
    licensePlate: '',
    coverageZones: '',
    livreurDocIdUrl: '',
    livreurDocAssuranceUrl: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)

    try {
      const additionalData: any = {}
      if (formData.role === 'CLIENT') {
        additionalData.address = formData.address
        additionalData.city = formData.city
        additionalData.postalCode = formData.postalCode
      } else if (formData.role === 'RESTAURATEUR') {
        const openingHours = days.reduce((acc, day) => {
          acc[day] = `${hoursByDay[day].open}-${hoursByDay[day].close}`
          return acc
        }, {} as Record<string, string>)

        additionalData.restaurant = {
          name: formData.restaurantName,
          description: formData.restaurantDescription,
          address: formData.restaurantAddress,
          city: formData.restaurantCity,
          postalCode: formData.restaurantPostalCode,
          phone: formData.restaurantPhone || formData.phone,
          cuisineType: formData.cuisineType,
          openingHours,
        }

        const docs = []
        if (formData.restaurateurDocIdUrl) {
          docs.push({ type: 'PIECE_IDENTITE', fileUrl: formData.restaurateurDocIdUrl })
        }
        if (formData.restaurateurDocRcUrl) {
          docs.push({ type: 'REGISTRE_COMMERCE', fileUrl: formData.restaurateurDocRcUrl })
        }
        additionalData.documents = docs
      } else if (formData.role === 'LIVREUR') {
        additionalData.vehicleType = formData.vehicleType
        additionalData.licensePlate = formData.licensePlate
        additionalData.coverageZones = formData.coverageZones
          ? formData.coverageZones.split(',').map((z) => z.trim()).filter(Boolean)
          : []

        const docs = []
        if (formData.livreurDocIdUrl) {
          docs.push({ type: 'PIECE_IDENTITE', fileUrl: formData.livreurDocIdUrl })
        }
        if (formData.livreurDocAssuranceUrl) {
          docs.push({ type: 'ASSURANCE', fileUrl: formData.livreurDocAssuranceUrl })
        }
        additionalData.documents = docs
      }

      const response = await authAPI.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
        additionalData,
      })

      const { token, user } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      switch (user.role) {
        case 'CLIENT':
          router.push('/client/dashboard')
          break
        case 'RESTAURATEUR':
          router.push('/restaurateur/dashboard')
          break
        case 'LIVREUR':
          router.push('/livreur/dashboard')
          break
        default:
          router.push('/')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Inscription</CardTitle>
          <CardDescription>Creez votre compte DELICES AFRO-CARAIBE</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prenom</Label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telephone</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Type de compte</Label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full h-10 px-3 py-2 border rounded-md"
              >
                <option value="CLIENT">Client</option>
                <option value="RESTAURATEUR">Restaurateur</option>
                <option value="LIVREUR">Livreur</option>
              </select>
            </div>

            {formData.role === 'CLIENT' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleChange} required />
                  </div>
                </div>
              </>
            )}

            {formData.role === 'RESTAURATEUR' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">Nom du restaurant</Label>
                  <Input id="restaurantName" name="restaurantName" value={formData.restaurantName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantDescription">Description</Label>
                  <Input id="restaurantDescription" name="restaurantDescription" value={formData.restaurantDescription} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuisineType">Type de cuisine</Label>
                  <Input id="cuisineType" name="cuisineType" value={formData.cuisineType} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantPhone">Telephone du restaurant</Label>
                  <Input id="restaurantPhone" name="restaurantPhone" value={formData.restaurantPhone} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantAddress">Adresse</Label>
                  <Input id="restaurantAddress" name="restaurantAddress" value={formData.restaurantAddress} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="restaurantCity">Ville</Label>
                    <Input id="restaurantCity" name="restaurantCity" value={formData.restaurantCity} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restaurantPostalCode">Code postal</Label>
                    <Input id="restaurantPostalCode" name="restaurantPostalCode" value={formData.restaurantPostalCode} onChange={handleChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Horaires par jour</Label>
                  <div className="grid gap-2">
                    {dayLabels.map(([key, label]) => (
                      <div key={key} className="grid items-center gap-2 rounded-md border p-2 sm:grid-cols-[100px_1fr_1fr]">
                        <span className="text-sm">{label}</span>
                        <Input
                          type="time"
                          value={hoursByDay[key].open}
                          onChange={(e) =>
                            setHoursByDay((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], open: e.target.value },
                            }))
                          }
                        />
                        <Input
                          type="time"
                          value={hoursByDay[key].close}
                          onChange={(e) =>
                            setHoursByDay((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], close: e.target.value },
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="restaurateurDocIdUrl">URL document piece identite</Label>
                    <Input id="restaurateurDocIdUrl" name="restaurateurDocIdUrl" value={formData.restaurateurDocIdUrl} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restaurateurDocRcUrl">URL document registre commerce</Label>
                    <Input id="restaurateurDocRcUrl" name="restaurateurDocRcUrl" value={formData.restaurateurDocRcUrl} onChange={handleChange} />
                  </div>
                </div>
              </>
            )}

            {formData.role === 'LIVREUR' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Type de vehicule</Label>
                  <Input id="vehicleType" name="vehicleType" value={formData.vehicleType} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">Immatriculation</Label>
                  <Input id="licensePlate" name="licensePlate" value={formData.licensePlate} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverageZones">Zones couvertes (separees par virgules)</Label>
                  <Input id="coverageZones" name="coverageZones" value={formData.coverageZones} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="livreurDocIdUrl">URL piece d'identite</Label>
                    <Input id="livreurDocIdUrl" name="livreurDocIdUrl" value={formData.livreurDocIdUrl} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="livreurDocAssuranceUrl">URL assurance</Label>
                    <Input id="livreurDocAssuranceUrl" name="livreurDocAssuranceUrl" value={formData.livreurDocAssuranceUrl} onChange={handleChange} />
                  </div>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Inscription...' : "S'inscrire"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Vous avez deja un compte ? </span>
              <Link href="/auth/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
