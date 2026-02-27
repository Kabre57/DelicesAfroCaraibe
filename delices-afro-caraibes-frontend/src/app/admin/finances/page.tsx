'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchAdminBundle, AdminOverview, fetchAdminTransactions, AdminTransactionsResponse } from '@/lib/admin'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { deliveryAPI } from '@/lib/api'

type WithdrawRequest = {
  id: string
  userId: string
  amount?: number
  status?: string
  method?: string
  accountRef?: string
  sentAt: string
}

export default function AdminFinancesPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [transactions, setTransactions] = useState<AdminTransactionsResponse | null>(null)
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (status?: string) => {
    const [bundle, tx, withdrawRes] = await Promise.all([
      fetchAdminBundle(),
      fetchAdminTransactions(status && status !== 'ALL' ? { status } : undefined),
      deliveryAPI.get<WithdrawRequest[]>('/deliveries/admin/withdraw-requests'),
    ])
    setOverview(bundle.overview)
    setTransactions(tx)
    setWithdrawRequests(Array.isArray(withdrawRes.data) ? withdrawRes.data : [])
  }

  useEffect(() => {
    load()
      .catch((e) => {
        console.error(e)
        setError('Impossible de charger les finances.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(statusFilter).catch((e) => {
      console.error(e)
      setError('Impossible de filtrer les transactions.')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const forecast = useMemo(() => {
    if (!overview) return 0
    return overview.finance.monthlyGoal - overview.finance.monthlyRevenue
  }, [overview])

  const exportCsv = () => {
    if (!overview || !transactions) return
    const rows = [
      ['payment_id', 'amount', 'status', 'method', 'transaction_id', 'order_id', 'restaurant', 'created_at'],
      ...transactions.data.map((tx) => [
        tx.id,
        String(tx.amount),
        tx.status,
        tx.paymentMethod,
        tx.transactionId || '',
        tx.order?.id || '',
        tx.order?.restaurant?.name || '',
        tx.createdAt,
      ]),
    ]
    const csv = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rapport_finances_admin.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const updateWithdrawStatus = async (id: string, status: 'APPROVED' | 'REJECTED' | 'PAID') => {
    try {
      await deliveryAPI.put(`/deliveries/admin/withdraw-requests/${id}`, { status })
      await load(statusFilter)
    } catch (e) {
      console.error(e)
      setError('Mise a jour retrait impossible.')
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>
  if (!overview) return <div className="p-6 text-red-700">{error || 'Donnees indisponibles.'}</div>

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Finances</h1>
        <p className="text-sm text-slate-600">CA, commissions, paiements et export de rapports.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">CA mensuel</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{overview.finance.monthlyRevenue.toFixed(2)} EUR</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Commissions</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{overview.finance.commissionAveragePercent}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Paiements en attente</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{overview.finance.pendingPaymentsAmount.toFixed(2)} EUR</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Objectif restant</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{Math.max(0, forecast).toFixed(2)} EUR</p></CardContent></Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Transactions detaillees</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-[220px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes</SelectItem>
                <SelectItem value="PENDING">PENDING</SelectItem>
                <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                <SelectItem value="FAILED">FAILED</SelectItem>
                <SelectItem value="REFUNDED">REFUNDED</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {transactions?.data.map((tx) => (
            <div key={tx.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">#{tx.id.slice(0, 8)} - {tx.amount.toFixed(2)} EUR</p>
                <p className="text-xs">{tx.status}</p>
              </div>
              <p className="text-slate-600">
                {tx.order?.restaurant?.name || 'Restaurant'} - Cmd #{tx.order?.id.slice(0, 8) || '-'} - {tx.paymentMethod}
              </p>
            </div>
          ))}
          {transactions && transactions.data.length === 0 && <p className="text-sm text-slate-600">Aucune transaction.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Demandes de retrait livreurs</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {withdrawRequests.length === 0 && <p className="text-sm text-slate-600">Aucune demande.</p>}
          {withdrawRequests.map((request) => (
            <div key={request.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-semibold">
                  {(Number(request.amount || 0)).toFixed(2)} EUR - {request.method || 'BANK_TRANSFER'}
                </p>
                <p className="text-xs">{request.status || 'PENDING'}</p>
              </div>
              <p className="text-slate-600">
                Livreur: {request.userId} - {new Date(request.sentAt).toLocaleString('fr-FR')}
              </p>
              <p className="text-slate-600">Compte: {request.accountRef || '-'}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => updateWithdrawStatus(request.id, 'APPROVED')}>
                  Approuver
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateWithdrawStatus(request.id, 'PAID')}>
                  Marquer paye
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateWithdrawStatus(request.id, 'REJECTED')}>
                  Rejeter
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top revenus restaurants</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {overview.topRestaurants.map((restaurant, index) => (
            <div key={restaurant.restaurantId} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <p>{index + 1}. {restaurant.name}</p>
              <p><strong>{restaurant.revenue.toFixed(2)} EUR</strong></p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          Exporter rapport CSV
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Exporter PDF
        </Button>
      </div>
    </div>
  )
}
