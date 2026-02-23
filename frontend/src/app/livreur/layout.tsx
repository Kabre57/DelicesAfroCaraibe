import { LivreurShell } from '@/components/livreur/livreur-shell'

export default function LivreurLayout({ children }: { children: React.ReactNode }) {
  return <LivreurShell>{children}</LivreurShell>
}
