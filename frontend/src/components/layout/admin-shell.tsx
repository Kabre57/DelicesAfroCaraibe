'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CircleUserRound,
  HandCoins,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Settings,
  Shield,
  Store,
  Truck,
  Users,
} from 'lucide-react'
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
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/restos', label: 'Restos', icon: Store },
  { href: '/admin/livreurs', label: 'Livreurs', icon: Truck },
  { href: '/admin/finances', label: 'Finances', icon: HandCoins },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/config', label: 'Config', icon: Settings },
  { href: '/admin/support', label: 'Support', icon: LifeBuoy },
] as const

export function AdminShell({ children }: { children: React.ReactNode }) {
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
    if (parsed.role !== 'ADMIN') {
      router.push('/')
      return
    }
    setUser(parsed)
  }, [router])

  const initials = useMemo(() => {
    if (!user) return 'AD'
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
  }, [user])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#dbeafe_0%,#eef2ff_35%,#f8fafc_100%)]">
      <header className="sticky top-0 z-20 border-b border-blue-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">espace administration</p>
              <h1 className="text-lg font-black text-slate-900">Controle plateforme</h1>
            </div>
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
                <Link href="/admin/dashboard">
                  <CircleUserRound className="mr-2 h-4 w-4" />
                  Dashboard
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
        <aside className="hidden h-fit rounded-2xl border border-blue-100 bg-white/90 p-3 md:block">
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
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
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

      <div className="mx-auto hidden w-full max-w-7xl px-4 pb-4 text-right text-xs text-slate-500 md:block">
        Derniere maj: {new Date().toLocaleTimeString('fr-FR')} - Version 1.0.0
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-blue-100 bg-white/95 backdrop-blur md:hidden">
        <nav className="mx-auto grid max-w-4xl grid-cols-4 gap-1 p-2">
          {items.slice(0, 8).map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center rounded-lg px-2 py-2 text-[11px] ${
                  active ? 'bg-blue-600 text-white' : 'text-slate-600'
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
