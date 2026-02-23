import { RestaurateurShell } from '@/components/layout/restaurateur-shell'

export default function RestaurateurLayout({ children }: { children: React.ReactNode }) {
  return <RestaurateurShell>{children}</RestaurateurShell>
}
