'use client'

import { useEffect, useState } from 'react'
import { userAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface PendingResto {
  id: string
  user: { id: string; email: string; firstName: string; lastName: string; phone: string }
  restaurants: { id: string; name: string; city: string }[]
}

interface PendingLivreur {
  id: string
  user: { id: string; email: string; firstName: string; lastName: string; phone: string }
  vehicleType: string
  licensePlate?: string
  coverageZones: string[]
}

export default function AdminDashboardPage() {
  const [restos, setRestos] = useState<PendingResto[]>([])
  const [livreurs, setLivreurs] = useState<PendingLivreur[]>([])
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [r, l] = await Promise.all([
        userAPI.get('/users/pending/restaurateurs'),
        userAPI.get('/users/pending/livreurs'),
      ])
      setRestos(r.data)
      setLivreurs(l.data)
    } catch (e) {
      console.error(e)
      setError('Impossible de charger les demandes')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const approveResto = async (userId: string) => {
    await userAPI.put(`/users/restaurateur/${userId}/approve`)
    load()
  }
  const approveLivreur = async (userId: string) => {
    await userAPI.put(`/users/livreur/${userId}/approve`)
    load()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        {error && <div className="text-red-600">{error}</div>}

        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Restaurateurs en attente</h2>
            <Badge variant="outline">{restos.length}</Badge>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {restos.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>
                      {r.user.firstName} {r.user.lastName}
                    </span>
                    <Badge>{r.user.email}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{r.user.phone}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {r.restaurants.map((rs) => (
                    <div key={rs.id} className="text-sm">
                      {rs.name} — {rs.city}
                    </div>
                  ))}
                  <Separator />
                  <Button onClick={() => approveResto(r.user.id)}>Approuver</Button>
                </CardContent>
              </Card>
            ))}
            {restos.length === 0 && <p className="text-muted-foreground">Aucune demande.</p>}
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Livreurs en attente</h2>
            <Badge variant="outline">{livreurs.length}</Badge>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {livreurs.map((l) => (
              <Card key={l.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>
                      {l.user.firstName} {l.user.lastName}
                    </span>
                    <Badge>{l.user.email}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{l.user.phone}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Véhicule : {l.vehicleType}</p>
                  {l.licensePlate && <p>Immatriculation : {l.licensePlate}</p>}
                  {l.coverageZones?.length > 0 && (
                    <p>Zones : {l.coverageZones.join(', ')}</p>
                  )}
                  <Separator />
                  <Button onClick={() => approveLivreur(l.user.id)}>Approuver</Button>
                </CardContent>
              </Card>
            ))}
            {livreurs.length === 0 && <p className="text-muted-foreground">Aucune demande.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
