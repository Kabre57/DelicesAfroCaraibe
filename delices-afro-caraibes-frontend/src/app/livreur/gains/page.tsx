'use client'

import { useEffect, useState } from 'react'
import { HandCoins, ReceiptText, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { fetchCourierMetrics } from '@/lib/livreur'
import { CourierMetrics } from '@/types'

export default function LivreurGainsPage() {
  const [metrics, setMetrics] = useState<CourierMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const data = await fetchCourierMetrics()
      setMetrics(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-6">Chargement...</div>
  if (!metrics) return <div className="p-6">Aucune donnee.</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-900">Gains et portefeuille</h1>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Aujourd&apos;hui</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className="text-3xl font-black">{metrics.earnings.today.toFixed(2)} EUR</p>
            <HandCoins className="h-6 w-6 text-amber-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cette semaine</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className="text-3xl font-black">{metrics.earnings.week.toFixed(2)} EUR</p>
            <Wallet className="h-6 w-6 text-emerald-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total cumule</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className="text-3xl font-black">{metrics.earnings.total.toFixed(2)} EUR</p>
            <ReceiptText className="h-6 w-6 text-blue-600" />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Regles de calcul backend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Base fixe: {metrics.earnings.formula.baseFee.toFixed(2)} EUR / course</p>
          <p>Part variable: {(metrics.earnings.formula.variableRate * 100).toFixed(1)}% du montant commande</p>
          <p>Commission plateforme: {(metrics.earnings.formula.platformCommissionRate * 100).toFixed(1)}% sur le gain brut</p>
          <Separator />
          <Button variant="outline" className="rounded-full">
            Demander un retrait
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des virements/courses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {metrics.payouts.length === 0 && <p className="text-sm text-slate-600">Aucun paiement disponible.</p>}
          {metrics.payouts.map((payout) => (
            <div key={payout.deliveryId} className="rounded-lg border border-slate-200 px-3 py-2">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-semibold">Delivery #{payout.deliveryId.slice(0, 8)}</p>
                <Badge variant="outline">{new Date(payout.deliveredAt).toLocaleDateString('fr-FR')}</Badge>
              </div>
              <div className="grid gap-1 text-xs text-slate-600 sm:grid-cols-4">
                <p>Commande: {payout.orderTotal.toFixed(2)} EUR</p>
                <p>Brut: {payout.gross.toFixed(2)} EUR</p>
                <p>Commission: {payout.platformCommission.toFixed(2)} EUR</p>
                <p className="font-semibold text-slate-900">Net: {payout.net.toFixed(2)} EUR</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
