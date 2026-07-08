'use client'

import { useEffect, useState } from 'react'
import { BookOpen, LogOut, Menu, User, X, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import NotificationBell from '@/components/notifications/NotificationBell'
import RoleUserBadge, { RoleUserBadgeCompact } from '@/components/layout/RoleUserBadge'

export interface SidebarItem {
  id: string
  label: string
  icon: LucideIcon
}

interface DashboardShellProps {
  userId: string
  roleShort: 'GV' | 'HS'
  roleLabel: string
  userName: string
  sidebarItems: SidebarItem[]
  activeTab: string
  onTabChange: (id: string) => void
  onLogout: () => void
  headerTitle: string
  headerSubtitle?: string
  headerAction?: React.ReactNode
  children: React.ReactNode
}

export default function DashboardShell({
  userId,
  roleShort,
  roleLabel,
  userName,
  sidebarItems,
  activeTab,
  onTabChange,
  onLogout,
  headerTitle,
  headerSubtitle,
  headerAction,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:hidden">
        <Link href="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
          <BookOpen className="h-7 w-7 text-primary-600" />
          <span className="font-bold text-gray-900">EduFlow</span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Đóng menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="hidden h-14 shrink-0 items-center border-b px-5 md:flex">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary-600" />
          <span className="font-bold text-gray-900">EduFlow</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onTabChange(item.id)
              setSidebarOpen(false)
            }}
            className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 sm:py-3 ${
              activeTab === item.id
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <item.icon className="mr-3 h-5 w-5 shrink-0" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="shrink-0 border-t p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
          </div>
          <NotificationBell userId={userId} />
          <button
            type="button"
            onClick={onLogout}
            className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-gray-50 text-gray-900">
      {/* Mobile / tablet header (< md) */}
      <header className="sticky top-0 z-30 border-b bg-white shadow-sm md:hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 sm:text-base">{headerTitle}</p>
            {headerSubtitle && (
              <p className="truncate text-xs text-gray-500">{headerSubtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <RoleUserBadgeCompact roleShort={roleShort} userName={userName} />
            <NotificationBell userId={userId} />
          </div>
        </div>
        {headerAction && (
          <div className="border-t px-3 py-2 sm:px-4">
            <div className="flex w-full [&_a]:flex [&_a]:w-full [&_a]:justify-center [&_button]:w-full">
              {headerAction}
            </div>
          </div>
        )}
      </header>

      <div className="flex w-full">
        {/* Desktop sidebar (>= md) */}
        <aside className="hidden w-56 shrink-0 border-r bg-white md:flex md:w-64 md:flex-col lg:sticky lg:top-0 lg:h-screen">
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(85vw,280px)] flex-col bg-white shadow-xl md:hidden">
              {sidebar}
            </aside>
          </>
        )}

        <main className="min-w-0 w-full flex-1 overflow-x-hidden">
          {/* Desktop header */}
          <div className="hidden border-b bg-white px-4 py-4 md:block sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-gray-900 lg:text-2xl">{headerTitle}</h1>
                {headerSubtitle && <p className="text-sm text-gray-600">{headerSubtitle}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <RoleUserBadge roleShort={roleShort} userName={userName} />
                <NotificationBell userId={userId} />
                {headerAction}
              </div>
            </div>
          </div>
          <div className="w-full max-w-full p-3 sm:p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
