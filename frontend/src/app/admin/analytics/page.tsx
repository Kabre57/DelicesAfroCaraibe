'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  fetchAdminAuditLogs,
  fetchAdminBundle,
  fetchAdminTransactions,
  AdminAuditLog,
  AdminOverview,
  AdminTransactionsResponse,
} from '@/lib/admin'

const monthKey = (isoDate: string) => {
  const d = new Date(isoDate)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [transactions, setTransactions] = useState<AdminTransactionsResponse | null>(null)
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetchAdminBundle(),
      fetchAdminTransactions({ page: 1, pageSize: 200 }),
      fetchAdminAuditLogs(),
    ])
      .then(([bundle, tx, audits]) => {
        setOverview(bundle.overview)
        setTransactions(tx)
        setAuditLogs(audits)
      })
      .catch((e) => {
        console.error(e)
        setError('Impossible de charger les analytics avances.')
      })
      .finally(() => setLoading(false))
  }, [])

  const peak = useMemo(() => {
    if (!overview?.charts.ordersByHour?.length) return null
    return [...overview.charts.ordersByHour].sort((a, b) => b.orders - a.orders)[0]
  }, [overview])

  const paymentFailureRate = useMemo(() => {
    if (!transactions?.totals.transactions) return 0
    const failed = transactions.byStatus.find((s) => s.status === 'FAILED')?.count || 0
    return Number(((failed / transactions.totals.transactions) * 100).toFixed(1))
  }, [transactions])

  const periodTrend = useMemo(() => {
    if (!transactions) return { last7: 0, prev7: 0, deltaPct: 0, amountLast7: 0, amountPrev7: 0 }
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const last7From = now - 7 * dayMs
    const prev7From = now - 14 * dayMs
    const prev7To = last7From

    let last7 = 0
    let prev7 = 0
    let amountLast7 = 0
    let amountPrev7 = 0

    for (const tx of transactions.data) {
      const t = new Date(tx.createdAt).getTime()
      if (t >= last7From) {
        last7 += 1
        amountLast7 += tx.amount
      } else if (t >= prev7From && t < prev7To) {
        prev7 += 1
        amountPrev7 += tx.amount
      }
    }

    const deltaPct =
      prev7 === 0 ? (last7 > 0 ? 100 : 0) : Number((((last7 - prev7) / prev7) * 100).toFixed(1))

    return { last7, prev7, deltaPct, amountLast7, amountPrev7 }
  }, [transactions])

  const monthlyRevenueTrend = useMemo(() => {
    if (!transactions) return []
    const map = new Map<string, number>()
    transactions.data.forEach((tx) => {
      const key = monthKey(tx.createdAt)
      map.set(key, (map.get(key) || 0) + tx.amount)
    })
    return Array.from(map.entries())
      .map(([month, amount]) => ({ month, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
  }, [transactions])

  const cohorts = useMemo(() => {
    if (!transactions) return []
    const ordersByClient = new Map<string, string[]>()
    transactions.data.forEach((tx) => {
      const clientId = tx.order?.client?.id
      if (!clientId) return
      if (!ordersByClient.has(clientId)) ordersByClient.set(clientId, [])
      ordersByClient.get(clientId)!.push(tx.createdAt)
    })

    const cohortMap = new Map<string, { clients: number; repeatClients: number }>()
    for (const [, dates] of ordersByClient.entries()) {
      const sorted = [...dates].sort()
      const cohort = monthKey(sorted[0])
      const current = cohortMap.get(cohort) || { clients: 0, repeatClients: 0 }
      current.clients += 1
      if (sorted.length > 1) current.repeatClients += 1
      cohortMap.set(cohort, current)
    }

    return Array.from(cohortMap.entries())
      .map(([cohort, v]) => ({
        cohort,
        clients: v.clients,
        repeatClients: v.repeatClients,
        retentionPct: v.clients === 0 ? 0 : Number(((v.repeatClients / v.clients) * 100).toFixed(1)),
      }))
      .sort((a, b) => a.cohort.localeCompare(b.cohort))
      .slice(-6)
  }, [transactions])

  const auditByAction = useMemo(() => {
    const map = new Map<string, number>()
    auditLogs.forEach((log) => map.set(log.action, (map.get(log.action) || 0) + 1))
    return Array.from(map.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [auditLogs])

  if (loading) return <div className="p-6">Chargement...</div>
  if (!overview || !transactions) return <div className="p-6 text-red-700">{error || 'Donnees indisponibles.'}</div>

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Analytics avances</h1>
        <p className="text-sm text-slate-600">Cohortes, taux d'echec paiement, tendances multi-periodes, audit logs.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Transactions</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{transactions.totals.transactions}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Montant total</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{transactions.totals.amount.toFixed(2)} EUR</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Taux echec paiement</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{paymentFailureRate}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Logs audit</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{auditLogs.length}</p></CardContent></Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tendance 7j vs 7j precedents</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Transactions 7j: <strong>{periodTrend.last7}</strong></p>
            <p>Transactions 7j precedents: <strong>{periodTrend.prev7}</strong></p>
            <p>Delta volume: <strong>{periodTrend.deltaPct}%</strong></p>
            <p>Montant 7j: <strong>{periodTrend.amountLast7.toFixed(2)} EUR</strong></p>
            <p>Montant 7j precedents: <strong>{periodTrend.amountPrev7.toFixed(2)} EUR</strong></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Heure de pointe</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!peak ? (
              <p>Aucune donnee.</p>
            ) : (
              <>
                <p>Pic a <strong>{String(peak.hour).padStart(2, '0')}h</strong></p>
                <p>Volume: <strong>{peak.orders}</strong> commandes</p>
                <p>Revenu: <strong>{peak.revenue.toFixed(2)} EUR</strong></p>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Cohortes clients (base transactions)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {cohorts.map((c) => (
              <div key={c.cohort} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <p className="font-semibold">Cohorte {c.cohort}</p>
                <p>Clients: {c.clients} - Repeat: {c.repeatClients} - Retention: {c.retentionPct}%</p>
              </div>
            ))}
            {cohorts.length === 0 && <p className="text-sm text-slate-600">Pas assez de donnees cohortes.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tendance revenus mensuels</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {monthlyRevenueTrend.map((m) => (
              <div key={m.month} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <p className="font-semibold">{m.month}</p>
                <p>{m.amount.toFixed(2)} EUR</p>
              </div>
            ))}
            {monthlyRevenueTrend.length === 0 && <p className="text-sm text-slate-600">Aucune donnee multi-periode.</p>}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Audit logs - actions les plus frequentes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {auditByAction.map((entry) => (
            <div key={entry.action} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <p>{entry.action}</p>
              <strong>{entry.count}</strong>
            </div>
          ))}
          {auditByAction.length === 0 && <p className="text-sm text-slate-600">Aucun log d'audit.</p>}
        </CardContent>
      </Card>
    </div>
  )
}

