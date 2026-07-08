import AdminAuthGuard from '@/components/admin/AdminAuthGuard'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>
}
