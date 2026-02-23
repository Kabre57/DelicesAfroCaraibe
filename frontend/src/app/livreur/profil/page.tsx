'use client'

import { useEffect, useMemo, useState } from 'react'
import { CircleUserRound, FileBadge2, ShieldCheck, Star, Timer } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchCourierMetrics } from '@/lib/livreur'
import { CourierMetrics } from '@/types'

type User = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export default function LivreurProfilPage() {
  const [user, setUser] = useState<User | null>(null)
  const [metrics, setMetrics] = useState<CourierMetrics | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (raw) setUser(JSON.parse(raw))
    fetchCourierMetrics().then(setMetrics).catch(() => undefined)
  }, [])

  const rating = useMemo(() => {
    if (!metrics) return 0
    return Math.max(4, Math.min(5, 4 + metrics.stats.acceptanceRate / 100))
  }, [metrics])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-900">Profil livreur</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleUserRound className="h-5 w-5 text-blue-600" />
            Informations compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <strong>Nom:</strong> {user?.firstName} {user?.lastName}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Telephone:</strong> {user?.phone}
          </p>
          <div className="pt-2">
            <Badge className="gap-1">
              <Star className="h-3 w-3" /> Note moyenne {rating.toFixed(1)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-amber-600" />
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Taux d&apos;acceptation: {metrics?.stats.acceptanceRate ?? 0}%</p>
            <p>Taux d&apos;annulation: {metrics?.stats.cancellationRate ?? 0}%</p>
            <p>Livraisons effectuees: {metrics?.stats.deliveriesCount ?? 0}</p>
            <p>Temps d&apos;attente moyen: {metrics?.stats.averageWaitMinutes ?? 0} min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBadge2 className="h-5 w-5 text-emerald-600" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span>Piece d&apos;identite</span>
              <Badge variant="outline">Valide - 2027-12-31</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span>Assurance</span>
              <Badge variant="outline">Valide - 2026-09-15</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span>Casier judiciaire</span>
              <Badge variant="outline">Valide - 2026-11-02</Badge>
            </div>
            <p className="flex items-center gap-2 text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Compte verifie
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
