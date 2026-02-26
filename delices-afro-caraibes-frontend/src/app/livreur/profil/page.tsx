'use client'

import { useEffect, useState } from 'react'
import { CircleUserRound, FileBadge2, ShieldCheck, Star, Timer } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { userAPI } from '@/lib/api'

type LivreurProfile = {
  user: { firstName: string; lastName: string; email: string; phone: string }
  averageRating: number
  stats: {
    acceptanceRate: number
    cancellationRate: number
    deliveriesCount: number
    averageWaitMinutes: number
  }
  documents: {
    id: string
    type: string
    status: 'PENDING' | 'VALID' | 'EXPIRED' | 'REJECTED'
    expiresAt?: string | null
  }[]
  isApproved: boolean
}

const labelForType = (type: string) => {
  if (type === 'PIECE_IDENTITE') return "Piece d'identite"
  if (type === 'ASSURANCE') return 'Assurance'
  if (type === 'CASIER_JUDICIAIRE') return 'Casier judiciaire'
  return type
}

export default function LivreurProfilPage() {
  const [profile, setProfile] = useState<LivreurProfile | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const raw = localStorage.getItem('user')
        const parsed = raw ? JSON.parse(raw) : null
        if (!parsed?.id) return
        const res = await userAPI.get<LivreurProfile>(`/users/livreur/${parsed.id}/profile`)
        setProfile(res.data)
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

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
            <strong>Nom:</strong> {profile?.user.firstName} {profile?.user.lastName}
          </p>
          <p>
            <strong>Email:</strong> {profile?.user.email}
          </p>
          <p>
            <strong>Telephone:</strong> {profile?.user.phone}
          </p>
          <div className="pt-2">
            <Badge className="gap-1">
              <Star className="h-3 w-3" /> Note moyenne {Number(profile?.averageRating || 0).toFixed(1)}
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
            <p>Taux d&apos;acceptation: {profile?.stats.acceptanceRate ?? 0}%</p>
            <p>Taux d&apos;annulation: {profile?.stats.cancellationRate ?? 0}%</p>
            <p>Livraisons effectuees: {profile?.stats.deliveriesCount ?? 0}</p>
            <p>Temps d&apos;attente moyen: {profile?.stats.averageWaitMinutes ?? 0} min</p>
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
            {(profile?.documents || []).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span>{labelForType(doc.type)}</span>
                <Badge variant="outline">
                  {doc.status} {doc.expiresAt ? `- ${new Date(doc.expiresAt).toISOString().slice(0, 10)}` : ''}
                </Badge>
              </div>
            ))}
            {(profile?.documents || []).length === 0 && <p>Aucun document</p>}
            <p className="flex items-center gap-2 text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              {profile?.isApproved ? 'Compte verifie' : 'Compte en attente de validation'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
