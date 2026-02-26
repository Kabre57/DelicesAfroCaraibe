'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchAdminBundle,
  AdminOverview,
  createAdminSupportTicket,
  fetchAdminSupportTickets,
  updateAdminSupportTicket,
  AdminSupportTicket,
} from '@/lib/admin'

export default function AdminSupportPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ticketEmail, setTicketEmail] = useState('')
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketMessage, setTicketMessage] = useState('')
  const [ticketPriority, setTicketPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [ticketStatusFilter, setTicketStatusFilter] = useState('ALL')
  const [notice, setNotice] = useState('')

  const loadTickets = async (status?: string) => {
    const data = await fetchAdminSupportTickets(
      status && status !== 'ALL'
        ? {
            status,
          }
        : undefined
    )
    setTickets(data)
  }

  useEffect(() => {
    Promise.all([fetchAdminBundle(), loadTickets()])
      .then(([data]) => setOverview(data.overview))
      .catch((e) => {
        console.error(e)
        setError('Chargement support impossible.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadTickets(ticketStatusFilter).catch((e) => {
      console.error(e)
      setError('Filtrage tickets impossible.')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketStatusFilter])

  const submit = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) return
    try {
      setError('')
      await createAdminSupportTicket({
        subject: ticketSubject.trim(),
        message: `Contact: ${ticketEmail || '-'}\n\n${ticketMessage.trim()}`,
        category: 'ADMIN_PORTAL',
        priority: ticketPriority,
      })
      setNotice('Ticket enregistre en base.')
      setTicketEmail('')
      setTicketSubject('')
      setTicketMessage('')
      await loadTickets(ticketStatusFilter)
    } catch (e) {
      console.error(e)
      setError('Creation ticket impossible.')
    }
  }

  const updateTicketStatus = async (id: string, status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED') => {
    try {
      setError('')
      await updateAdminSupportTicket(id, { status })
      await loadTickets(ticketStatusFilter)
    } catch (e) {
      console.error(e)
      setError('Mise a jour ticket impossible.')
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Support admin</h1>
        <p className="text-sm text-slate-600">Alertes, incidents et suivi support.</p>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{notice}</div>}

      <Card>
        <CardHeader><CardTitle>Alertes automatiques</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {overview?.alerts.length ? (
            overview.alerts.map((alert) => (
              <div key={alert.type} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-700" />
                  {alert.message}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600">Aucune alerte active.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Creer un ticket support</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="ticketEmail">Email utilisateur</Label>
            <Input id="ticketEmail" value={ticketEmail} onChange={(e) => setTicketEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ticketSubject">Sujet</Label>
            <Input id="ticketSubject" value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Priorite</Label>
            <Select value={ticketPriority} onValueChange={(value) => setTicketPriority(value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">LOW</SelectItem>
                <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                <SelectItem value="HIGH">HIGH</SelectItem>
                <SelectItem value="URGENT">URGENT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ticketMessage">Message</Label>
            <Textarea id="ticketMessage" value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} />
          </div>
          <Button onClick={submit}>Enregistrer ticket</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tickets support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-[220px]">
            <Select value={ticketStatusFilter} onValueChange={setTicketStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous</SelectItem>
                <SelectItem value="OPEN">OPEN</SelectItem>
                <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                <SelectItem value="CLOSED">CLOSED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{ticket.title}</p>
                <div className="flex gap-2">
                  <span className="rounded-full border px-2 py-0.5 text-xs">{ticket.priority || 'MEDIUM'}</span>
                  <span className="rounded-full border px-2 py-0.5 text-xs">{ticket.status || 'OPEN'}</span>
                </div>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{ticket.message || '-'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => updateTicketStatus(ticket.id, 'OPEN')}>OPEN</Button>
                <Button size="sm" variant="outline" onClick={() => updateTicketStatus(ticket.id, 'IN_PROGRESS')}>IN_PROGRESS</Button>
                <Button size="sm" onClick={() => updateTicketStatus(ticket.id, 'CLOSED')}>CLOSED</Button>
              </div>
            </div>
          ))}
          {tickets.length === 0 && <p className="text-sm text-slate-600">Aucun ticket.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
