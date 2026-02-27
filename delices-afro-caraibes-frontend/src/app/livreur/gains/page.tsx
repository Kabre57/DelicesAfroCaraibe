'use client'

import { useEffect, useState } from 'react'
import { HandCoins, ReceiptText, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { fetchCourierMetrics, requestCourierWithdraw } from '@/lib/livreur'
import { CourierMetrics } from '@/types'

export default function LivreurGainsPage() {
  const [metrics, setMetrics] = useState<CourierMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestAmount, setRequestAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState<'BANK_TRANSFER' | 'MOBILE_MONEY'>('BANK_TRANSFER')
  const [accountRef, setAccountRef] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const data = await fetchCourierMetrics()
      setMetrics(data)
      setLoading(false)
    }
    load()
  }, [])

  const reload = async () => {
    const data = await fetchCourierMetrics()
    setMetrics(data)
  }

  const submitWithdraw = async () => {
    if (!metrics) return
    const amount = Number(requestAmount)
    if (Number.isNaN(amount) || amount <= 0) {
      setError('Montant invalide.')
      return
    }
    if (amount < metrics.earnings.formula.minWithdrawalAmount) {
      setError(
        `Montant minimum: ${metrics.earnings.formula.minWithdrawalAmount.toFixed(2)} EUR`
      )
      return
    }
    try {
      setError('')
      setNotice('')
      await requestCourierWithdraw({
        amount,
        method: withdrawMethod,
        accountRef: accountRef || undefined,
      })
      setRequestAmount('')
      setNotice('Demande de retrait envoyee.')
      await reload()
    } catch (e: any) {
      console.error(e)
      setError(e?.response?.data?.error || 'Demande de retrait impossible.')
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>
  if (!metrics) return <div className="p-6">Aucune donnee.</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-900">Gains et portefeuille</h1>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{notice}</div>}

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

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Solde disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-emerald-700">
              {metrics.earnings.availableBalance.toFixed(2)} EUR
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Retraits en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-amber-700">
              {metrics.earnings.pendingWithdrawAmount.toFixed(2)} EUR
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Retraits payes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-slate-800">
              {metrics.earnings.paidWithdrawAmount.toFixed(2)} EUR
            </p>
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
          <p>Retrait minimum: {metrics.earnings.formula.minWithdrawalAmount.toFixed(2)} EUR</p>
          <Separator />
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="withdraw-amount">Montant</Label>
              <Input
                id="withdraw-amount"
                type="number"
                step="0.01"
                min="0"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="withdraw-method">Methode</Label>
              <select
                id="withdraw-method"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value as 'BANK_TRANSFER' | 'MOBILE_MONEY')}
              >
                <option value="BANK_TRANSFER">Virement bancaire</option>
                <option value="MOBILE_MONEY">Mobile money</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="withdraw-account">Compte / numero</Label>
              <Input
                id="withdraw-account"
                value={accountRef}
                onChange={(e) => setAccountRef(e.target.value)}
                placeholder="IBAN ou numero mobile"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full rounded-full" onClick={submitWithdraw}>
                Demander un retrait
              </Button>
            </div>
          </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Demandes de retrait</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {metrics.withdrawRequests.length === 0 && (
            <p className="text-sm text-slate-600">Aucune demande de retrait.</p>
          )}
          {metrics.withdrawRequests.map((req) => (
            <div key={req.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-semibold">{req.amount.toFixed(2)} EUR - {req.method}</p>
                <Badge variant="outline">{req.status}</Badge>
              </div>
              <p className="text-slate-600">
                {new Date(req.sentAt).toLocaleString('fr-FR')}
                {req.accountRef ? ` - ${req.accountRef}` : ''}
              </p>
              {req.notes && <p className="text-slate-600">Note: {req.notes}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
