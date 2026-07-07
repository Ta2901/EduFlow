import StudentAuthGuard from '@/components/student/StudentAuthGuard'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentAuthGuard>{children}</StudentAuthGuard>
}
