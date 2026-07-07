import OnlineAuthGuard from '@/components/online/OnlineAuthGuard'

export default function OnlineLayout({ children }: { children: React.ReactNode }) {
  return <OnlineAuthGuard>{children}</OnlineAuthGuard>
}
