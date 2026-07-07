import TeacherAuthGuard from '@/components/teacher/TeacherAuthGuard'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <TeacherAuthGuard>{children}</TeacherAuthGuard>
}
