'use client'

import { FormEvent, useEffect, useState } from 'react'
import { MessageSquare, Send, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchChatHistory, fetchCourierDeliveries, reportCourierIssue } from '@/lib/livreur'
import { getChatSocket } from '@/lib/socket'
import { Delivery } from '@/types'

type ChatMessage = {
  id: string
  orderId: string
  senderId: string
  senderRole: 'CLIENT' | 'LIVREUR' | 'RESTAURATEUR'
  message: string
  timestamp: string
  read: boolean
}

export default function LivreurMessagesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatText, setChatText] = useState('')
  const [supportType, setSupportType] = useState<'SAFETY' | 'CUSTOMER' | 'RESTAURANT' | 'VEHICLE' | 'OTHER'>('OTHER')
  const [supportMessage, setSupportMessage] = useState('')
  const [status, setStatus] = useState('')
  const [user, setUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (raw) {
      const parsed = JSON.parse(raw)
      setUser({ id: parsed.id })
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      const { mine } = await fetchCourierDeliveries()
      setDeliveries(mine)
      if (mine[0]) setSelectedOrderId(mine[0].orderId)
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedOrderId || !user) return
    const socket = getChatSocket()
    socket.emit('join-chat', { orderId: selectedOrderId, userId: user.id, role: 'LIVREUR' })

    const onHistory = (history: ChatMessage[]) => setMessages(history)
    const onNewMessage = (message: ChatMessage) => {
      if (message.orderId === selectedOrderId) {
        setMessages((prev) => [...prev, message])
      }
    }

    socket.on('chat-history', onHistory)
    socket.on('new-message', onNewMessage)

    fetchChatHistory(selectedOrderId)
      .then(setMessages)
      .catch(() => undefined)

    return () => {
      socket.emit('leave-chat', { orderId: selectedOrderId, userId: user.id })
      socket.off('chat-history', onHistory)
      socket.off('new-message', onNewMessage)
    }
  }, [selectedOrderId, user?.id])

  const sendMessage = (event: FormEvent) => {
    event.preventDefault()
    if (!chatText.trim() || !selectedOrderId || !user) return

    const socket = getChatSocket()
    socket.emit('send-message', {
      orderId: selectedOrderId,
      senderId: user.id,
      senderRole: 'LIVREUR',
      message: chatText.trim(),
    })
    setChatText('')
  }

  const submitSupport = async (event: FormEvent) => {
    event.preventDefault()
    const relatedDelivery = deliveries.find((delivery) => delivery.orderId === selectedOrderId)
    await reportCourierIssue({
      type: supportType,
      message: supportMessage,
      deliveryId: relatedDelivery?.id,
    })
    setSupportMessage('')
    setStatus('Signalement envoye au support.')
  }

  const handleSupportTypeChange = (value: string) => {
    if (
      value === 'SAFETY' ||
      value === 'CUSTOMER' ||
      value === 'RESTAURANT' ||
      value === 'VEHICLE' ||
      value === 'OTHER'
    ) {
      setSupportType(value)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-900">Chat et support</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Chat operationnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Commande</Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionne une commande" />
                </SelectTrigger>
                <SelectContent>
                  {deliveries.map((delivery) => (
                    <SelectItem key={delivery.id} value={delivery.orderId}>
                      {delivery.orderId.slice(0, 8)} - {delivery.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="h-72 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
              {messages.length === 0 && <p className="text-sm text-slate-500">Aucun message.</p>}
              {messages.map((message) => (
                <div key={message.id} className="rounded-lg bg-white px-3 py-2 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <Badge variant="outline">{message.senderRole}</Badge>
                    <span className="text-xs text-slate-400">
                      {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p>{message.message}</p>
                </div>
              ))}
            </div>

            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Ecrire un message..."
              />
              <Button type="submit" className="rounded-full">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
              Support en direct
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={submitSupport} className="space-y-3">
              <div className="space-y-2">
                <Label>Type de probleme</Label>
                <Select value={supportType} onValueChange={handleSupportTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAFETY">Securite</SelectItem>
                    <SelectItem value="CUSTOMER">Client injoignable</SelectItem>
                    <SelectItem value="RESTAURANT">Restaurant ferme/retard</SelectItem>
                    <SelectItem value="VEHICLE">Vehicule en panne</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Input
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Decris le probleme en detail"
                  required
                />
              </div>
              <Button type="submit" className="rounded-full">
                Envoyer au support
              </Button>
            </form>
            {status && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{status}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
