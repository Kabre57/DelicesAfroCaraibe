'use client'

import { useEffect, useState } from 'react'
import { deliveryAPI } from '@/lib/api'
import { Delivery } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getDeliverySocket } from '@/lib/socket'

export default function LivreurDashboardPage() {
  const [available, setAvailable] = useState<Delivery[]>([])
  const [mine, setMine] = useState<Delivery[]>([])
  const [error, setError] = useState('')

  const refresh = async () => {
    try {
      const [a, m] = await Promise.all([
        deliveryAPI.get('/deliveries/available'),
        deliveryAPI.get('/deliveries/livreur/me'),
      ])
      setAvailable(a.data)
      setMine(m.data)
    } catch (e) {
      console.error(e)
      setError('Impossible de charger les livraisons')
    }
  }

  useEffect(() => {
    refresh()
    const socket = getDeliverySocket()
    socket.on('delivery:update', () => refresh())
    return () => {
      socket.off('delivery:update')
    }
  }, [])

  const accept = async (id: string) => {
    await deliveryAPI.put(`/deliveries/${id}/accept`)
    refresh()
  }

  const markDelivered = async (id: string) => {
    await deliveryAPI.put(`/deliveries/${id}/status`, { status: 'DELIVERED' })
    refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold">Tableau de bord livreur</h1>
        {error && <div className="text-red-600">{error}</div>}

        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">À prendre</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {available.map((d) => (
              <Card key={d.id}>
                <CardHeader className="flex justify-between">
                  <CardTitle>Livraison #{d.id.slice(0, 6)}</CardTitle>
                  <Badge variant="outline">{d.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>Pickup : {d.pickupAddress}</p>
                  <p>Livraison : {d.deliveryAddress}</p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                      d.pickupAddress
                    )}&destination=${encodeURIComponent(d.deliveryAddress)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    Voir l'itinéraire
                  </a>
                  <Separator className="my-2" />
                  <Button onClick={() => accept(d.id)}>Accepter</Button>
                </CardContent>
              </Card>
            ))}
            {available.length === 0 && <p className="text-muted-foreground">Aucune livraison disponible.</p>}
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Mes livraisons</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {mine.map((d) => (
              <Card key={d.id}>
                <CardHeader className="flex justify-between">
                  <CardTitle>Livraison #{d.id.slice(0, 6)}</CardTitle>
                  <Badge variant="outline">{d.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>Pickup : {d.pickupAddress}</p>
                  <p>Livraison : {d.deliveryAddress}</p>
                  <Separator className="my-2" />
                  {d.status !== 'DELIVERED' && (
                    <Button onClick={() => markDelivered(d.id)}>Marquer livrée</Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {mine.length === 0 && <p className="text-muted-foreground">Aucune livraison en cours.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
