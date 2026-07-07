import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref: string
  action?: React.ReactNode
  userId?: string
}

export default function PageHeader({ title, subtitle, backHref, action, userId }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-white shadow-sm">
      <div className="mx-auto w-full max-w-5xl px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={backHref}
            className="shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-gray-900 sm:text-xl">{title}</h1>
            {subtitle && (
              <p className="truncate text-xs text-gray-500 sm:text-sm">{subtitle}</p>
            )}
          </div>
          {userId && <NotificationBell userId={userId} />}
          {action && (
            <div className="hidden shrink-0 sm:block">{action}</div>
          )}
        </div>
        {action && (
          <div className="mt-2 sm:hidden [&_a]:flex [&_a]:w-full [&_a]:justify-center [&_button]:w-full">
            {action}
          </div>
        )}
      </div>
    </header>
  )
}
