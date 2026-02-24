'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Download,
  MapPin,
  Pill,
  Search,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { restaurantAPI } from '@/lib/api'

type DiscoveryHomeResponse = {
  city: string | null
  promo: {
    code: string
    title: string
  }
  categories: { name: string; restaurantCount: number }[]
  popular: {
    id: string
    name: string
    city: string
    cuisineType: string
    averageRating: number
    reviewCount: number
    startingPrice: number | null
  }[]
}

type DiscoveryServiceItem = {
  id: string
  name: string
  city: string
  cuisineType: string
}

type DiscoveryServicesResponse = {
  city: string | null
  services: {
    key: 'COURSES' | 'PHARMACY' | 'FLOWERS' | string
    title: string
    items: DiscoveryServiceItem[]
  }[]
}

const categoryIcon = (name: string) => {
  const normalized = name.toLowerCase()
  if (normalized.includes('senegal') || normalized.includes('tiep')) return 'T'
  if (normalized.includes('ivoir') || normalized.includes('yassa')) return 'Y'
  if (normalized.includes('mafe')) return 'M'
  if (normalized.includes('riz')) return 'R'
  if (normalized.includes('attieke')) return 'A'
  if (normalized.includes('grill')) return 'G'
  return name.slice(0, 1).toUpperCase()
}

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [discovery, setDiscovery] = useState<DiscoveryHomeResponse | null>(null)
  const [serviceGroups, setServiceGroups] = useState<DiscoveryServicesResponse['services']>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [discoverRes, listRes] = await Promise.all([
          restaurantAPI.get<DiscoveryHomeResponse>('/restaurants/discover/home'),
          restaurantAPI.get<DiscoveryServicesResponse>('/restaurants/discover/services'),
        ])
        setDiscovery(discoverRes.data)
        setServiceGroups(Array.isArray(listRes.data?.services) ? listRes.data.services : [])
      } catch (e) {
        console.error('Home load error:', e)
        setError('Impossible de charger les donnees d accueil.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const services = useMemo(() => {
    const iconFor = (key: string) => {
      if (key === 'COURSES') return ShoppingCart
      if (key === 'PHARMACY') return Pill
      if (key === 'FLOWERS') return Sparkles
      return Store
    }

    return serviceGroups.map((group) => ({
      key: group.key,
      title: group.title,
      icon: iconFor(group.key),
      items: group.items,
    }))
  }, [serviceGroups])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#fff7ed_0%,#fff2e8_35%,#f8fafc_100%)]">
      <header className="sticky top-0 z-20 border-b border-orange-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">delices afro-caraibe</p>
            <h1 className="text-lg font-black text-slate-900">Accueil Application</h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Inscription</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5">
        <section className="rounded-2xl border border-orange-200/80 bg-white/95 p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
              <MapPin className="h-4 w-4" />
              {discovery?.city || 'Abidjan'}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Livraison locale rapide
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              className="h-11 border-slate-200 pl-9"
              placeholder="Restaurants, plats, cuisines..."
              readOnly
            />
          </div>
        </section>

        <section className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 p-5 text-white shadow-lg shadow-orange-200/40">
          <p className="text-xs uppercase tracking-[0.2em] text-orange-100">Bon plan</p>
          <h2 className="mt-1 text-2xl font-black">{discovery?.promo?.title || '-50% sur votre premiere commande'}</h2>
          <p className="text-sm text-orange-100">Code: {discovery?.promo?.code || 'BIENVENUE'}</p>
          <div className="mt-3">
            <Link href="/restaurants">
              <Button className="bg-white text-orange-700 hover:bg-orange-50">Commander maintenant</Button>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
          <h3 className="mb-3 text-xl font-black text-slate-900">Categories</h3>
          {loading ? (
            <p className="text-sm text-slate-600">Chargement...</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {(discovery?.categories || []).slice(0, 12).map((c) => (
                <button
                  key={c.name}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                >
                  <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-orange-600">
                    {categoryIcon(c.name)}
                  </div>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-xl font-black text-slate-900">Restaurants populaires</h3>
            <Link href="/restaurants" className="text-sm font-semibold text-orange-600">
              Voir tout
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-slate-600">Chargement...</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {(discovery?.popular || []).slice(0, 6).map((r) => (
                <Card key={r.id} className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{r.name}</CardTitle>
                    <p className="text-sm text-slate-500">
                      {r.cuisineType} - {r.city}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-sm text-slate-600">Note {r.averageRating || 0} - {r.reviewCount} avis</p>
                    <p className="text-sm text-slate-600">
                      {r.startingPrice !== null ? `A partir de ${r.startingPrice.toFixed(2)} EUR` : 'Prix sur menu'}
                    </p>
                    <Link href={`/restaurants/${r.id}`}>
                      <Button size="sm" className="mt-2 w-full bg-orange-600 hover:bg-orange-700">
                        Commander
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
          <h3 className="mb-3 text-xl font-black text-slate-900">Autres services</h3>
          {services.length === 0 ? (
            <p className="text-sm text-slate-600">
              Aucun service courses/pharmacie/fleurs configure en base pour le moment.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {services.map((s) => (
                <Card key={s.key} className="border-slate-200">
                  <CardContent className="flex items-center gap-3 py-5">
                    <div className="rounded-full bg-slate-100 p-3">
                      <s.icon className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{s.title}</p>
                      {s.items.slice(0, 2).map((item) => (
                        <p key={item.id} className="text-sm text-slate-600">
                          {item.name} - {item.city}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Telecharger l application</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                Suivez votre commande en temps reel et commandez en quelques secondes.
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  App Store
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Google Play
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-sky-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Espace livreur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-700">
                Passez en ligne, acceptez des courses, suivez vos gains et gerer votre activite.
              </p>
              <div className="flex gap-2">
                <Link href="/auth/register?role=livreur">
                  <Button className="gap-2 bg-cyan-700 hover:bg-cyan-800">
                    <Truck className="h-4 w-4" />
                    Devenir livreur
                  </Button>
                </Link>
                <Link href="/livreur/dashboard">
                  <Button variant="outline">Ouvrir dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
          <h3 className="mb-3 text-xl font-black text-slate-900">Acces par profil</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/client/dashboard">
              <Button variant="outline" className="w-full justify-start">Client</Button>
            </Link>
            <Link href="/restaurateur/dashboard">
              <Button variant="outline" className="w-full justify-start">Restaurateur</Button>
            </Link>
            <Link href="/livreur/dashboard">
              <Button variant="outline" className="w-full justify-start">Livreur</Button>
            </Link>
            <Link href="/admin/dashboard">
              <Button variant="outline" className="w-full justify-start">
                <Store className="mr-2 h-4 w-4" />
                Administration
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
