'use client'

import { useEffect, useState } from 'react'
import { userAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type UserResponse = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  client?: {
    address: string
    city: string
    postalCode: string
  } | null
}

export default function ClientProfilePage() {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const raw = localStorage.getItem('user')
        if (!raw) return
        const parsed = JSON.parse(raw) as { id: string }
        const response = await userAPI.get<UserResponse>(`/users/${parsed.id}`)
        setUser(response.data)
      } catch (error) {
        console.error('Profile load error:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="p-6">Chargement...</div>
  if (!user) return <div className="p-6 text-slate-600">Profil indisponible.</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-900">Mon profil</h1>
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>Nom: {user.firstName} {user.lastName}</p>
          <p>Email: {user.email}</p>
          <p>Téléphone: {user.phone}</p>
          <p>Adresse: {user.client?.address || 'N/A'}</p>
          <p>Ville: {user.client?.city || 'N/A'}</p>
          <p>Code postal: {user.client?.postalCode || 'N/A'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
