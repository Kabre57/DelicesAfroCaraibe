'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authAPI } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
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
    // Restaurateur
    restaurantName: '',
    restaurantDescription: '',
    restaurantAddress: '',
    restaurantCity: '',
    restaurantPostalCode: '',
    restaurantPhone: '',
    cuisineType: '',
    openingHours: '',
    // Livreur
    vehicleType: '',
    licensePlate: '',
    coverageZones: '',
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
        additionalData.restaurant = {
          name: formData.restaurantName,
          description: formData.restaurantDescription,
          address: formData.restaurantAddress,
          city: formData.restaurantCity,
          postalCode: formData.restaurantPostalCode,
          phone: formData.restaurantPhone || formData.phone,
          cuisineType: formData.cuisineType,
          openingHours: formData.openingHours || { monday: '09:00-18:00' },
        }
      } else if (formData.role === 'LIVREUR') {
        additionalData.vehicleType = formData.vehicleType
        additionalData.licensePlate = formData.licensePlate
        additionalData.coverageZones = formData.coverageZones
          ? formData.coverageZones.split(',').map(z => z.trim()).filter(Boolean)
          : []
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
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription')
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
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Inscription</CardTitle>
          <CardDescription>Créez votre compte DÉLICES AFRO-CARAÏBE</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
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
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {formData.role === 'RESTAURATEUR' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">Nom du restaurant</Label>
                  <Input
                    id="restaurantName"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantDescription">Description</Label>
                  <Input
                    id="restaurantDescription"
                    name="restaurantDescription"
                    value={formData.restaurantDescription}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuisineType">Type de cuisine</Label>
                  <Input
                    id="cuisineType"
                    name="cuisineType"
                    value={formData.cuisineType}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantPhone">Téléphone du restaurant</Label>
                  <Input
                    id="restaurantPhone"
                    name="restaurantPhone"
                    value={formData.restaurantPhone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantAddress">Adresse</Label>
                  <Input
                    id="restaurantAddress"
                    name="restaurantAddress"
                    value={formData.restaurantAddress}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="restaurantCity">Ville</Label>
                    <Input
                      id="restaurantCity"
                      name="restaurantCity"
                      value={formData.restaurantCity}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restaurantPostalCode">Code postal</Label>
                    <Input
                      id="restaurantPostalCode"
                      name="restaurantPostalCode"
                      value={formData.restaurantPostalCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {formData.role === 'LIVREUR' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Type de véhicule</Label>
                  <Input
                    id="vehicleType"
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">Immatriculation</Label>
                  <Input
                    id="licensePlate"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverageZones">Zones couvertes (séparées par des virgules)</Label>
                  <Input
                    id="coverageZones"
                    name="coverageZones"
                    value={formData.coverageZones}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Vous avez déjà un compte ? </span>
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
