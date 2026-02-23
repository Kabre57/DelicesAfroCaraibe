'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  CircleUserRound,
  Gauge,
  HandCoins,
  LayoutPanelLeft,
  LifeBuoy,
  LogOut,
  MessageSquare,
  PackageOpen,
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

type LivreurUser = {
  id: string
  role: string
  firstName: string
  lastName: string
  email: string
}

const navItems = [
  { href: '/livreur/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/livreur/courses', label: 'Courses', icon: PackageOpen },
  { href: '/livreur/gains', label: 'Gains', icon: HandCoins },
  { href: '/livreur/messages', label: 'Messages', icon: MessageSquare },
  { href: '/livreur/profil', label: 'Profil', icon: CircleUserRound },
] as const

export function LivreurShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<LivreurUser | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (!raw) {
      router.push('/auth/login')
      return
    }

    const parsed = JSON.parse(raw) as LivreurUser
    if (parsed.role !== 'LIVREUR') {
      router.push('/')
      return
    }

    setUser(parsed)
  }, [router])

  const initials = useMemo(() => {
    if (!user) return 'LV'
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
  }, [user])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#dcfce7_0%,#f0fdf4_28%,#f8fafc_100%)]">
      <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <LayoutPanelLeft className="h-5 w-5 text-emerald-700" />
            <span className="text-sm font-black uppercase tracking-[0.15em] text-emerald-700">Espace Livreur</span>
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
              <DropdownMenuLabel>
                {user?.firstName} {user?.lastName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/livreur/profil">
                  <CircleUserRound className="mr-2 h-4 w-4" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/livreur/messages">
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  Support
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
        <aside className="hidden h-fit rounded-2xl border border-emerald-100 bg-white/90 p-3 md:block">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
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

      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-emerald-100 bg-white/95 backdrop-blur md:hidden">
        <nav className="mx-auto grid max-w-3xl grid-cols-5 gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center rounded-lg px-2 py-2 text-[11px] ${
                  active ? 'bg-emerald-600 text-white' : 'text-slate-600'
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
