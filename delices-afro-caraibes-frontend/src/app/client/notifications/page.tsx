'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notificationAPI } from '@/lib/api'
import { getDeliverySocket, getOrderSocket } from '@/lib/socket'

type NotificationItem = {
  id: string
  title: string
  message: string
  isRead: boolean
  sentAt: string
}

export default function ClientNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')

  const load = async (currentUserId: string) => {
    const res = await notificationAPI.get<NotificationItem[]>(`/notifications/user/${currentUserId}`)
    setItems(Array.isArray(res.data) ? res.data : [])
  }

  useEffect(() => {
    const raw = localStorage.getItem('user')
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed?.id) {
      setError('Utilisateur non connecte.')
      setLoading(false)
      return
    }
    setUserId(parsed.id)
    load(parsed.id)
      .catch((e) => {
        console.error(e)
        setError('Impossible de charger les notifications.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!userId) return
    const orderSocket = getOrderSocket()
    const deliverySocket = getDeliverySocket()
    const refresh = () => {
      load(userId).catch((e) => console.error('Notifications refresh error:', e))
    }
    orderSocket.on('order:update', refresh)
    deliverySocket.on('order:update', refresh)
    return () => {
      orderSocket.off('order:update', refresh)
      deliverySocket.off('order:update', refresh)
    }
  }, [userId])

  const markRead = async (id: string) => {
    try {
      await notificationAPI.put(`/notifications/${id}/read`)
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)))
    } catch (e) {
      console.error(e)
    }
  }

  const markAllRead = async () => {
    if (!userId) return
    try {
      await notificationAPI.put(`/notifications/user/${userId}/read-all`)
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })))
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>

  const unread = items.filter((x) => !x.isRead).length

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-fuchsia-100 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-black text-slate-900">Notifications</h1>
          <div className="flex items-center gap-2">
            <Badge className="bg-fuchsia-600 text-white">{unread} non lues</Badge>
            <Button variant="outline" onClick={markAllRead}>Tout marquer lu</Button>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-fuchsia-600" />
            Fil des notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 && <p className="text-sm text-slate-500">Aucune notification.</p>}
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <Badge className={item.isRead ? 'bg-slate-500' : 'bg-fuchsia-600'}>
                  {item.isRead ? 'Lue' : 'Nouvelle'}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">{item.message}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-slate-500">{new Date(item.sentAt).toLocaleString('fr-FR')}</p>
                {!item.isRead && (
                  <Button size="sm" variant="outline" onClick={() => markRead(item.id)}>
                    Marquer lu
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

