'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchAdminBundle, AdminOverview, PendingLivreur, PendingResto } from '@/lib/admin'
import { userAPI } from '@/lib/api'

type AdminUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  phone?: string
  createdAt: string
}

export default function AdminUsersPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [pendingRestos, setPendingRestos] = useState<PendingResto[]>([])
  const [pendingLivreurs, setPendingLivreurs] = useState<PendingLivreur[]>([])
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)

  const load = async () => {
    try {
      const data = await fetchAdminBundle()
      setOverview(data.overview)
      setPendingRestos(data.pendingRestos)
      setPendingLivreurs(data.pendingLivreurs)
    } catch (e) {
      console.error(e)
      setError('Impossible de charger les utilisateurs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const users = useMemo<AdminUser[]>(() => {
    if (!overview) return []
    return overview.users.recent.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    }))
  }, [overview])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const byRole = roleFilter === 'ALL' || user.role === roleFilter
      const q = search.trim().toLowerCase()
      const bySearch =
        !q ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q)
      return byRole && bySearch
    })
  }, [users, roleFilter, search])

  const openUser = async (id: string) => {
    try {
      const res = await userAPI.get(`/users/${id}`)
      setSelectedUser(res.data)
      setDetailOpen(true)
    } catch (e) {
      console.error(e)
      setError('Impossible de charger le detail utilisateur.')
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Gestion des utilisateurs</h1>
        <p className="text-sm text-slate-600">Clients, restaurateurs, livreurs et admins.</p>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <Card className="border-slate-200/70 bg-white/90">
        <CardContent className="pt-5">
          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous</SelectItem>
                <SelectItem value="CLIENT">Clients</SelectItem>
                <SelectItem value="RESTAURATEUR">Restaurateurs</SelectItem>
                <SelectItem value="LIVREUR">Livreurs</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher utilisateur" className="pl-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total users</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{overview?.kpis.usersTotal ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Nouveaux clients 24h</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{overview?.users.newClients24h ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Restos en attente</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{pendingRestos.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Livreurs en attente</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{pendingLivreurs.length}</p></CardContent></Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Liste utilisateurs</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {filteredUsers.map((user) => (
            <div key={user.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <div>
                <p className="font-semibold">{user.firstName} {user.lastName}</p>
                <p className="text-slate-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{user.role}</Badge>
                <Button size="sm" variant="outline" onClick={() => openUser(user.id)}>Voir</Button>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && <p className="text-sm text-slate-600">Aucun utilisateur.</p>}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profil utilisateur</DialogTitle>
            <DialogDescription>Detail compte et profil associe.</DialogDescription>
          </DialogHeader>
          {!selectedUser ? (
            <p className="text-sm text-slate-600">Chargement...</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p><strong>Nom:</strong> {selectedUser.firstName} {selectedUser.lastName}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p><strong>Telephone:</strong> {selectedUser.phone || '-'}</p>
              <p><strong>Cree le:</strong> {new Date(selectedUser.createdAt).toLocaleString('fr-FR')}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

