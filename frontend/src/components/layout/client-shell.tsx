'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { CircleUserRound, Heart, House, LogOut, PackageOpen, Search } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type User = {
  role: string
  firstName: string
  lastName: string
  email: string
}

const items = [
  { href: '/client/dashboard', label: 'Accueil', icon: House },
  { href: '/restaurants', label: 'Recherche', icon: Search },
  { href: '/client/orders', label: 'Commandes', icon: PackageOpen },
  { href: '/client/favorites', label: 'Favoris', icon: Heart },
  { href: '/client/profile', label: 'Moi', icon: CircleUserRound },
] as const

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (!raw) {
      router.push('/auth/login')
      return
    }
    const parsed = JSON.parse(raw) as User
    if (parsed.role !== 'CLIENT') {
      router.push('/')
      return
    }
    setUser(parsed)
  }, [router])

  const initials = useMemo(() => {
    if (!user) return 'CL'
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
  }, [user])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#fee2e2_0%,#fff7ed_40%,#f8fafc_100%)]">
      <header className="sticky top-0 z-20 border-b border-orange-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">espace client</p>
            <h1 className="text-lg font-black text-slate-900">DELICES AFRO-CARAIBE</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">
                  {user?.firstName} {user?.lastName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/client/dashboard">
                  <CircleUserRound className="mr-2 h-4 w-4" />
                  Mon espace
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Deconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-5 md:grid-cols-[240px_1fr]">
        <aside className="hidden h-fit rounded-2xl border border-orange-100 bg-white/90 p-3 md:block">
          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-200'
                      : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>
        <main className="pb-20 md:pb-0">{children}</main>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-orange-100 bg-white/95 backdrop-blur md:hidden">
        <nav className="mx-auto grid max-w-3xl grid-cols-5 gap-1 p-2">
          {items.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center rounded-lg px-2 py-2 text-[11px] ${
                  active ? 'bg-orange-600 text-white' : 'text-slate-600'
                }`}
              >
                <Icon className="mb-1 h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </footer>
    </div>
  )
}
