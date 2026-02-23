'use client'

import { useEffect, useMemo, useState } from 'react'
import { Compass, MapPinned, MessageSquareWarning } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { deliveryAPI } from '@/lib/api'
import { fetchCourierDeliveries } from '@/lib/livreur'
import { Delivery, DeliveryStatus } from '@/types'

const OFFER_DURATION_SECONDS = 30

export default function LivreurCoursesPage() {
  const [available, setAvailable] = useState<Delivery[]>([])
  const [mine, setMine] = useState<Delivery[]>([])
  const [offerTimer, setOfferTimer] = useState(OFFER_DURATION_SECONDS)
  const [loading, setLoading] = useState(true)

  const currentDelivery = useMemo(
    () => mine.find((delivery) => delivery.status !== 'DELIVERED'),
    [mine]
  )

  const nextOffer = available[0]

  const load = async () => {
    const deliveryData = await fetchCourierDeliveries()
    setAvailable(deliveryData.available)
    setMine(deliveryData.mine)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!nextOffer) {
      setOfferTimer(OFFER_DURATION_SECONDS)
      return
    }

    setOfferTimer(OFFER_DURATION_SECONDS)
    const timer = setInterval(() => {
      setOfferTimer((prev) => {
        if (prev <= 1) {
          setAvailable((list) => list.slice(1))
          return OFFER_DURATION_SECONDS
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [nextOffer?.id])

  const accept = async (id: string) => {
    await deliveryAPI.put(`/deliveries/${id}/accept`)
    load()
  }

  const updateStatus = async (id: string, status: DeliveryStatus) => {
    await deliveryAPI.put(`/deliveries/${id}/status`, { status })
    load()
  }

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-900">Gestion des courses</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!nextOffer && (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                Aucune commande disponible.
              </p>
            )}
            {nextOffer && (
              <>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Timer: {offerTimer}s</Badge>
                  <span className="text-xs text-slate-500">Distance/temps via navigation</span>
                </div>
                <div className="space-y-1 text-sm text-slate-700">
                  <p>Restaurant: {nextOffer.pickupAddress}</p>
                  <p>Client: {nextOffer.deliveryAddress}</p>
                  <p>Temps estime: {nextOffer.estimatedTime ?? 15} min</p>
                </div>
                <div className="flex gap-2">
                  <Button className="rounded-full" onClick={() => accept(nextOffer.id)}>
                    Accepter
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={() => setAvailable((list) => list.slice(1))}>
                    Refuser
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commande en cours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!currentDelivery && (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                Aucune mission active.
              </p>
            )}
            {currentDelivery && (
              <>
                <div className="flex items-center justify-between">
                  <Badge>{currentDelivery.status}</Badge>
                  <span className="text-xs text-slate-500">Commande #{currentDelivery.orderId.slice(0, 8)}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p>Pickup: {currentDelivery.pickupAddress}</p>
                  <p>Livraison: {currentDelivery.deliveryAddress}</p>
                </div>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {currentDelivery.status === 'ACCEPTED' && (
                    <Button className="rounded-full" onClick={() => updateStatus(currentDelivery.id, DeliveryStatus.PICKED_UP)}>
                      Je suis arrive
                    </Button>
                  )}
                  {currentDelivery.status === 'PICKED_UP' && (
                    <Button className="rounded-full" onClick={() => updateStatus(currentDelivery.id, DeliveryStatus.ON_ROUTE)}>
                      Commande recuperee
                    </Button>
                  )}
                  {currentDelivery.status === 'ON_ROUTE' && (
                    <Button className="rounded-full" onClick={() => updateStatus(currentDelivery.id, DeliveryStatus.DELIVERED)}>
                      Marquer livree
                    </Button>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                      currentDelivery.pickupAddress
                    )}&destination=${encodeURIComponent(currentDelivery.deliveryAddress)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="outline" className="rounded-full">
                      <Compass className="mr-2 h-4 w-4" />
                      Navigation
                    </Button>
                  </a>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique rapide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {mine.length === 0 && <p className="text-sm text-slate-600">Aucune course.</p>}
          {mine.map((delivery) => (
            <div key={delivery.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">#{delivery.id.slice(0, 8)}</p>
                <p className="text-xs text-slate-500">{delivery.deliveryAddress}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{delivery.status}</Badge>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.deliveryAddress)}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Button size="sm" variant="ghost">
                    <MapPinned className="h-4 w-4" />
                  </Button>
                </a>
                <Button size="sm" variant="ghost">
                  <MessageSquareWarning className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
