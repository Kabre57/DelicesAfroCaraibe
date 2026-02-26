'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { fetchAdminConfig, updateAdminConfig } from '@/lib/admin'

type AdminConfigState = {
  platformName: string
  supportEmail: string
  supportPhone: string
  currency: string
  defaultCommission: string
  twoFactorRequired: boolean
  dailyReportEnabled: boolean
}

const initialState: AdminConfigState = {
  platformName: 'Delices Afro-Caraibe',
  supportEmail: 'support@delices-afro.com',
  supportPhone: '+33 1 23 45 67 89',
  currency: 'EUR',
  defaultCommission: '22',
  twoFactorRequired: true,
  dailyReportEnabled: true,
}

export default function AdminConfigPage() {
  const [config, setConfig] = useState<AdminConfigState>(initialState)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAdminConfig()
      .then((data) => {
        setConfig({
          platformName: data.platformName || initialState.platformName,
          supportEmail: data.supportEmail || initialState.supportEmail,
          supportPhone: data.supportPhone || initialState.supportPhone,
          currency: data.currency || initialState.currency,
          defaultCommission: String(data.defaultCommissionPercent ?? 22),
          twoFactorRequired: Boolean(data.twoFactorRequired),
          dailyReportEnabled: Boolean(data.dailyReportEnabled),
        })
      })
      .catch((e) => {
        console.error(e)
        setError('Chargement config impossible.')
      })
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    try {
      setError('')
      await updateAdminConfig({
        platformName: config.platformName.trim(),
        supportEmail: config.supportEmail.trim(),
        supportPhone: config.supportPhone.trim(),
        currency: config.currency.trim(),
        defaultCommissionPercent: Number(config.defaultCommission) || 22,
        twoFactorRequired: config.twoFactorRequired,
        dailyReportEnabled: config.dailyReportEnabled,
      })
      setNotice('Configuration enregistree en base.')
    } catch (e) {
      console.error(e)
      setError("Enregistrement de la configuration impossible.")
    }
  }

  const reset = async () => {
    setConfig(initialState)
    try {
      setError('')
      await updateAdminConfig({
        platformName: initialState.platformName,
        supportEmail: initialState.supportEmail,
        supportPhone: initialState.supportPhone,
        currency: initialState.currency,
        defaultCommissionPercent: Number(initialState.defaultCommission),
        twoFactorRequired: initialState.twoFactorRequired,
        dailyReportEnabled: initialState.dailyReportEnabled,
      })
      setNotice('Configuration reinitialisee en base.')
    } catch (e) {
      console.error(e)
      setError('Reinitialisation impossible.')
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Configuration plateforme</h1>
        <p className="text-sm text-slate-600">Parametres globaux admin.</p>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{notice}</div>}

      <Card>
        <CardHeader><CardTitle>Parametres generaux</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="platformName">Nom plateforme</Label>
            <Input id="platformName" value={config.platformName} onChange={(e) => setConfig((p) => ({ ...p, platformName: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="currency">Devise</Label>
            <Input id="currency" value={config.currency} onChange={(e) => setConfig((p) => ({ ...p, currency: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="supportEmail">Email support</Label>
            <Input id="supportEmail" value={config.supportEmail} onChange={(e) => setConfig((p) => ({ ...p, supportEmail: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="supportPhone">Telephone support</Label>
            <Input id="supportPhone" value={config.supportPhone} onChange={(e) => setConfig((p) => ({ ...p, supportPhone: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="defaultCommission">Commission par defaut (%)</Label>
            <Input id="defaultCommission" value={config.defaultCommission} onChange={(e) => setConfig((p) => ({ ...p, defaultCommission: e.target.value }))} />
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">2FA obligatoire admin</span>
              <Switch checked={config.twoFactorRequired} onCheckedChange={(checked) => setConfig((p) => ({ ...p, twoFactorRequired: checked }))} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm">Rapport quotidien</span>
              <Switch checked={config.dailyReportEnabled} onCheckedChange={(checked) => setConfig((p) => ({ ...p, dailyReportEnabled: checked }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save}>Enregistrer</Button>
        <Button variant="outline" onClick={reset}>Reinitialiser</Button>
      </div>
    </div>
  )
}
