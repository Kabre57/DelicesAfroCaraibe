'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  LocateFixed,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { restaurantAPI } from '@/lib/api'

type DiscoveryHomeResponse = {
  city: string | null
  promo: { code: string; title: string }
  categories: { name: string; restaurantCount: number; imageUrl?: string | null }[]
  popular: {
    id: string
    name: string
    city: string
    cuisineType: string
    imageUrl?: string | null
    averageRating: number
    reviewCount: number
    startingPrice: number | null
  }[]
  popularDishes: {
    id: string
    name: string
    category: string
    imageUrl?: string | null
    price: number
    orderCount: number
    restaurant: { id: string; name: string; city: string }
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

const categoryGlyph = (name: string) => {
  const x = name.toLowerCase()
  if (x.includes('afric')) return 'AF'
  if (x.includes('carib')) return 'CB'
  if (x.includes('creole')) return 'CR'
  if (x.includes('grill')) return 'GR'
  if (x.includes('sal')) return 'SL'
  if (x.includes('dess')) return 'DS'
  return name.slice(0, 2).toUpperCase()
}

const ImageWithFallback = ({
  src,
  alt,
  className,
  fallback,
}: {
  src?: string | null
  alt: string
  className: string
  fallback: ReactNode
}) => {
  const [broken, setBroken] = useState(false)
  if (!src || broken) return <>{fallback}</>
  return <img src={src} alt={alt} className={className} onError={() => setBroken(true)} />
}

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [address, setAddress] = useState('')
  const [discovery, setDiscovery] = useState<DiscoveryHomeResponse | null>(null)
  const [serviceGroups, setServiceGroups] = useState<DiscoveryServicesResponse['services']>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [discoverRes, servicesRes] = await Promise.all([
          restaurantAPI.get<DiscoveryHomeResponse>('/restaurants/discover/home'),
          restaurantAPI.get<DiscoveryServicesResponse>('/restaurants/discover/services'),
        ])
        setDiscovery(discoverRes.data)
        setServiceGroups(Array.isArray(servicesRes.data?.services) ? servicesRes.data.services : [])
      } catch (e) {
        console.error('Home load error:', e)
        setError('Impossible de charger les donnees d accueil.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const city = discovery?.city || 'Abidjan'
  const categories = useMemo(() => (discovery?.categories || []).slice(0, 12), [discovery])
  const popular = useMemo(() => (discovery?.popular || []).slice(0, 8), [discovery])
  const popularDishes = useMemo(() => (discovery?.popularDishes || []).slice(0, 8), [discovery])
  const services = useMemo(() => serviceGroups.slice(0, 3), [serviceGroups])
  const cities = useMemo(
    () => Array.from(new Set((discovery?.popular || []).map((r) => r.city))).filter(Boolean).slice(0, 4),
    [discovery]
  )

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#1f1f1f]">
      <header className="sticky top-0 z-50 border-b border-[#ececec] bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="Delices Afro-Caraibe" width={44} height={44} className="rounded-md" />
            <span className="text-[13px] font-black tracking-[0.24em] text-[#d100b8]">
              DELICES AFRO-CARAIBE
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-[14px] font-semibold text-[#1d1d1d]">
                Connexion
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="rounded-xl bg-[#d100b8] px-5 text-[14px] font-semibold hover:bg-[#b0009a]">
                Inscription
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-[#FF00FF]">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 md:py-16">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black leading-[1.05] text-[#1d1d1d] md:text-[68px]">
                On vous livre
                <br />
                plus que des repas
              </h1>
              <p className="mt-5 max-w-2xl text-[18px] text-[#2a2a2a]">
                Supermarches, magasins, pharmacies... tout ce qu il vous faut, livre dans votre ville.
              </p>
            </div>

            <div className="mt-8 max-w-3xl rounded-2xl bg-white p-3 shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-[#8a8a8a]" />
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={`Votre adresse a ${city}`}
                    className="h-11 border-[#ececec] bg-[#f7f7f7] pl-9"
                  />
                </div>
                <Link href="/restaurants">
                  <Button className="h-11 w-full gap-2 rounded-xl bg-[#00a082] px-5 hover:bg-[#008a70] sm:w-auto">
                    Commander
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#4d4d4d]">
                <LocateFixed className="h-4 w-4 text-[#d100b8]" />
                {city}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#4d4d4d]">
                <Sparkles className="h-4 w-4 text-[#d100b8]" />
                Livraison locale rapide
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-10">
          <h2 className="mb-5 text-[28px] font-black text-[#1d1d1d]">Parcourir par categorie</h2>
          {loading ? (
            <p className="text-sm text-[#777]">Chargement...</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {categories.map((c) => (
                <Link
                  key={c.name}
                  href="/restaurants"
                  className="rounded-2xl border border-[#ececec] bg-white p-4 text-center transition hover:-translate-y-0.5 hover:shadow"
                >
                  <div className="mx-auto mb-2 h-14 w-14 overflow-hidden rounded-full border border-[#f1e2d2] bg-[#fff3e5]">
                    <ImageWithFallback
                      src={c.imageUrl}
                      alt={c.name}
                      className="h-full w-full object-cover"
                      fallback={
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-[#d100b8]">
                          {categoryGlyph(c.name)}
                        </div>
                      }
                    />
                  </div>
                  <p className="line-clamp-1 text-xs font-semibold text-[#333]">{c.name}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[28px] font-black text-[#1d1d1d]">Restaurants populaires</h2>
            <Link href="/restaurants" className="inline-flex items-center gap-1 text-sm font-bold text-[#d100b8]">
              Voir tous
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-[#777]">Chargement...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {popular.map((r) => (
                <Link
                  key={r.id}
                  href={`/restaurants/${r.id}`}
                  className="rounded-2xl border border-[#ececec] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="mb-3 h-32 w-full overflow-hidden rounded-xl bg-[#fff5eb]">
                    <ImageWithFallback
                      src={r.imageUrl}
                      alt={r.name}
                      className="h-full w-full object-cover"
                      fallback={
                        <div className="flex h-full items-center justify-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[11px] font-black text-[#d100b8] shadow-sm">
                            {categoryGlyph(r.cuisineType)}
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <p className="line-clamp-1 text-base font-black text-[#222]">{r.name}</p>
                  <p className="line-clamp-1 text-sm text-[#777]">{r.cuisineType}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#666]">
                    <Sparkles className="h-3.5 w-3.5 text-[#ff7be5]" />
                    <span>{Number(r.averageRating || 0).toFixed(1)}</span>
                    <span>({r.reviewCount})</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs text-[#777]">
                    <Clock3 className="h-3.5 w-3.5" />
                    25-35 min
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[28px] font-black text-[#1d1d1d]">Plats populaires</h2>
            <Link href="/restaurants" className="inline-flex items-center gap-1 text-sm font-bold text-[#d100b8]">
              Explorer
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-[#777]">Chargement...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {popularDishes.map((dish) => (
                <Link
                  key={dish.id}
                  href={`/restaurants/${dish.restaurant.id}`}
                  className="overflow-hidden rounded-2xl border border-[#ececec] bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="h-36 w-full overflow-hidden bg-[#f6efe7]">
                    <ImageWithFallback
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="h-full w-full object-cover"
                      fallback={
                        <div className="flex h-full items-center justify-center text-sm font-black text-[#d100b8]">
                          {categoryGlyph(dish.category)}
                        </div>
                      }
                    />
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-1 text-base font-black text-[#202020]">{dish.name}</p>
                    <p className="line-clamp-1 text-sm text-[#707070]">{dish.restaurant.name}</p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="font-bold text-[#d100b8]">{dish.price.toFixed(2)} EUR</span>
                      <span className="text-[#707070]">{dish.orderCount} cmd</span>
                    </div>
                  </div>
                </Link>
              ))}
              {popularDishes.length === 0 && (
                <p className="text-sm text-[#777]">Aucun plat populaire disponible.</p>
              )}
            </div>
          )}
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-10">
          <h2 className="mb-5 text-[28px] font-black text-[#1d1d1d]">Autres services</h2>
          {services.length === 0 ? (
            <p className="text-sm text-[#777]">Aucun service disponible pour le moment.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {services.map((s) => (
                <div key={s.key} className="rounded-2xl border border-[#ececec] bg-white p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Store className="h-5 w-5 text-[#00a082]" />
                    <p className="font-black text-[#202020]">{s.title}</p>
                  </div>
                  <div className="space-y-1 text-sm text-[#666]">
                    {s.items.slice(0, 3).map((it) => (
                      <p key={it.id} className="line-clamp-1">
                        {it.name} - {it.city}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white py-10">
          <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#ececec] p-5">
              <Truck className="h-7 w-7 text-[#d100b8]" />
              <p className="mt-3 text-xl font-black">Livraison rapide</p>
              <p className="mt-1 text-sm text-[#666]">Commandes livrees en moins de 30 minutes.</p>
            </div>
            <div className="rounded-2xl border border-[#ececec] p-5">
              <Search className="h-7 w-7 text-[#00a082]" />
              <p className="mt-3 text-xl font-black">Large selection</p>
              <p className="mt-1 text-sm text-[#666]">{popular.length} restaurants populaires disponibles.</p>
            </div>
            <div className="rounded-2xl border border-[#ececec] p-5">
              <ShieldCheck className="h-7 w-7 text-[#ff7be5]" />
              <p className="mt-3 text-xl font-black">Paiement securise</p>
              <p className="mt-1 text-sm text-[#666]">Paiement simple avec plusieurs options.</p>
            </div>
          </div>
        </section>

        <footer className="bg-[#202020] py-10 text-white">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 md:grid-cols-4">
            <div>
              <p className="font-black text-[#ff7be5]">DELICES</p>
              <p className="mt-2 text-sm text-[#bdbdbd]">Livraison locale a {city}</p>
            </div>
            <div>
              <p className="mb-2 font-bold">Villes</p>
              <div className="space-y-1 text-sm text-[#bdbdbd]">
                {cities.map((c) => (
                  <p key={c}>{c}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 font-bold">Categories</p>
              <div className="space-y-1 text-sm text-[#bdbdbd]">
                {categories.slice(0, 4).map((c) => (
                  <p key={c.name}>{c.name}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 font-bold">Services</p>
              <div className="space-y-1 text-sm text-[#bdbdbd]">
                {serviceGroups.slice(0, 4).map((s) => (
                  <p key={s.key}>{s.title}</p>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </main>

      {error && (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,760px)] -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow">
          {error}
        </div>
      )}
    </div>
  )
}

