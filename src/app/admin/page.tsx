import { AdminPackagesPanel } from '@/features/admin/components/admin-packages-panel'

export default function AdminPage() {
  return (
    <main className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_rgba(120,70,28,0.22),_transparent_50%),linear-gradient(180deg,#1a1612_0%,#221c16_100%)]">
      <AdminPackagesPanel />
    </main>
  )
}
