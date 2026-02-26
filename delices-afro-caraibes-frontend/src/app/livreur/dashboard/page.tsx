'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Compass, MapPinned, Power, ShieldAlert, Target, Timer, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { deliveryAPI } from '@/lib/api'
import { fetchCourierDeliveries, fetchCourierMetrics } from '@/lib/livreur'
import { CourierMetrics, Delivery, DeliveryStatus } from '@/types'

const ONLINE_STORAGE_KEY = 'courier-online'
const DAILY_OBJECTIVE = 100
const OFFER_DURATION_SECONDS = 30

export default function LivreurDashboardPage() {
  const [available, setAvailable] = useState<Delivery[]>([])
  const [mine, setMine] = useState<Delivery[]>([])
  const [metrics, setMetrics] = useState<CourierMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [offerTimer, setOfferTimer] = useState(OFFER_DURATION_SECONDS)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setError('')
      const [deliveryData, metricsData] = await Promise.all([
        fetchCourierDeliveries(),
        fetchCourierMetrics(),
      ])
      setAvailable(deliveryData.available)
      setMine(deliveryData.mine)
      setMetrics(metricsData)
    } catch (e) {
      console.error(e)
      setError('Impossible de charger le tableau de bord livreur.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedOnline = localStorage.getItem(ONLINE_STORAGE_KEY)
    if (storedOnline !== null) setIsOnline(storedOnline === 'true')
    load()
  }, [])

  const currentDelivery = useMemo(
    () => mine.find((delivery) => delivery.status !== 'DELIVERED'),
    [mine]
  )

  const deliveredCount = metrics?.stats.deliveriesCount ?? 0
  const gainsToday = metrics?.earnings.today ?? 0
  const gainsWeek = metrics?.earnings.week ?? 0
  const acceptanceRate = metrics?.stats.acceptanceRate ?? 0
  const cancellationRate = metrics?.stats.cancellationRate ?? 0
  const objectiveProgress = Math.min(100, (gainsToday / DAILY_OBJECTIVE) * 100)
  const nextOffer = available[0]

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

  const toggleOnline = () => {
    const next = !isOnline
    setIsOnline(next)
    localStorage.setItem(ONLINE_STORAGE_KEY, String(next))
  }

  const acceptDelivery = async (deliveryId: string) => {
    try {
      await deliveryAPI.put(`/deliveries/${deliveryId}/accept`)
      await load()
    } catch (e) {
      console.error(e)
      setError("Impossible d'accepter la course.")
    }
  }

  const refuseCurrentOffer = () => {
    setAvailable((list) => list.slice(1))
  }

  const updateStatus = async (id: string, status: DeliveryStatus) => {
    try {
      await deliveryAPI.put(`/deliveries/${id}/status`, { status })
      await load()
    } catch (e) {
      console.error(e)
      setError('Impossible de mettre a jour le statut de livraison.')
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-600 to-cyan-700 p-5 text-white shadow-xl shadow-emerald-200/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">espace livreur</p>
            <h1 className="text-2xl font-black">Cockpit des livraisons</h1>
            <p className="text-sm text-emerald-100">Operationnel, en temps reel, mobile-first.</p>
          </div>
          <Button
            onClick={toggleOnline}
            className={`rounded-full ${isOnline ? 'bg-white text-emerald-700' : 'bg-rose-500 text-white'}`}
          >
            <Power className="mr-2 h-4 w-4" />
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </Button>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-emerald-100/70 bg-white/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-black ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-emerald-100/70 bg-white/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Zone active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">Abidjan Centre</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-100/70 bg-white/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">Velo</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-100/70 bg-white/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Gains du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{gainsToday.toFixed(2)} EUR</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-cyan-100/70 bg-white/90 shadow-lg shadow-cyan-100/40">
          <CardHeader>
            <CardTitle>Nouvelle commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!nextOffer ? (
              <p className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 p-3 text-slate-600">
                Recherche de commandes en cours...
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                    Timer: {offerTimer}s
                  </Badge>
                  <span className="text-xs text-slate-500">Distance/temps via navigation</span>
                </div>
                <div className="space-y-1 text-sm text-slate-700">
                  <p>
                    <strong>Restaurant:</strong> {nextOffer.pickupAddress}
                  </p>
                  <p>
                    <strong>Client:</strong> {nextOffer.deliveryAddress}
                  </p>
                  <p>
                    <strong>Duree max:</strong> {nextOffer.estimatedTime ?? 25} min
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button className="rounded-full" onClick={() => acceptDelivery(nextOffer.id)}>
                    ACCEPTER
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={refuseCurrentOffer}>
                    REFUSER
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-cyan-100/70 bg-white/90 shadow-lg shadow-cyan-100/40">
          <CardHeader>
            <CardTitle>Commande en cours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!currentDelivery ? (
              <p className="rounded-lg border border-dashed border-cyan-200 bg-cyan-50/40 p-3 text-slate-600">
                Aucune mission active pour le moment.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Badge>{currentDelivery.status}</Badge>
                  <span className="text-xs text-slate-500">#{currentDelivery.orderId.slice(0, 8)}</span>
                </div>
                <div className="space-y-1 text-sm text-slate-700">
                  <p>
                    <strong>Pickup:</strong> {currentDelivery.pickupAddress}
                  </p>
                  <p>
                    <strong>Livraison:</strong> {currentDelivery.deliveryAddress}
                  </p>
                </div>
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
                  <Link href="/livreur/messages">
                    <Button variant="outline" className="rounded-full">
                      Contacter client
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/40 xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-cyan-600" />
              Navigation et carte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-emerald-50 p-5">
              <p className="text-sm text-slate-700">• Vous etes ici</p>
              <p className="text-sm text-slate-700">• {available.length} commande(s) disponible(s)</p>
              <p className="text-sm text-slate-700">• Zones chaudes detectees</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/livreur/courses">
                  <Button className="rounded-full">Voir les courses</Button>
                </Link>
                <Link href="/livreur/messages">
                  <Button variant="outline" className="rounded-full">
                    Support
                  </Button>
                </Link>
                {currentDelivery && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                      currentDelivery.pickupAddress
                    )}&destination=${encodeURIComponent(currentDelivery.deliveryAddress)}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Button variant="outline" className="rounded-full">
                      <Compass className="mr-2 h-4 w-4" />
                      Demarrer navigation
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-orange-600" />
              Gains et portefeuille
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p className="flex justify-between">
              <span>Gains du jour</span>
              <strong>{gainsToday.toFixed(2)} EUR</strong>
            </p>
            <p className="flex justify-between">
              <span>Gains semaine</span>
              <strong>{gainsWeek.toFixed(2)} EUR</strong>
            </p>
            <p className="flex justify-between">
              <span>Livraisons effectuees</span>
              <strong>{deliveredCount}</strong>
            </p>
            <Separator />
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${objectiveProgress}%` }} />
            </div>
            <p className="text-xs text-slate-500">
              Objectif journalier: {gainsToday.toFixed(2)}/{DAILY_OBJECTIVE} EUR
            </p>
            <Link href="/livreur/gains">
              <Button className="mt-2 w-full rounded-full">Retrait instantane</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Profil et statistiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p className="flex justify-between">
              <span>Taux d'acceptation</span>
              <strong>{acceptanceRate}%</strong>
            </p>
            <p className="flex justify-between">
              <span>Taux d'annulation</span>
              <strong>{cancellationRate}%</strong>
            </p>
            <p className="flex justify-between">
              <span>Livraisons effectuees</span>
              <strong>{deliveredCount}</strong>
            </p>
            <Link href="/livreur/profil">
              <Button variant="outline" className="mt-2 w-full rounded-full">
                Voir profil complet
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
              Support et alertes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <Link href="/livreur/messages">
              <Button variant="outline" className="w-full justify-start rounded-full">
                J'ai un probleme
              </Button>
            </Link>
            <Link href="/livreur/messages">
              <Button variant="outline" className="w-full justify-start rounded-full">
                Signaler un retard
              </Button>
            </Link>
            <Link href="/livreur/profil">
              <Button variant="outline" className="w-full justify-start rounded-full">
                Documents et verification
              </Button>
            </Link>
            <p className="pt-1 text-xs text-slate-500">
              Canal support connecte au backend delivery-service.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Timer className="h-4 w-4" />
        Objectif du jour: atteindre {DAILY_OBJECTIVE} EUR pour debloquer un bonus.
      </div>
    </div>
  )
}
