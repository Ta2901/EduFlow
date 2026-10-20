'use client'

import { useEffect, useState } from 'react'
import { BookOpen, LogOut, Menu, User, X, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import LanguageSwitcher, { VersionBadge } from '@/components/i18n/LanguageSwitcher'
import { useI18n } from '@/components/i18n/LanguageProvider'
import ChatHeaderButton from '@/components/layout/ChatHeaderButton'
import NotificationBell from '@/components/notifications/NotificationBell'
import RoleUserBadge, { RoleUserBadgeCompact } from '@/components/layout/RoleUserBadge'
import ThemeToggle from '@/components/theme/ThemeToggle'

export interface SidebarItem {
  id: string
  label: string
  icon: LucideIcon
}

interface DashboardShellProps {
  /** Root DOM id prefix, e.g. student-dashboard | teacher-dashboard */
  idPrefix?: string
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
  idPrefix = 'dashboard',
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
  const { t } = useI18n()
  const pid = idPrefix

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

  const hasChatTab = sidebarItems.some((item) => item.id === 'chat')
  const openChat = () => {
    onTabChange('chat')
    setSidebarOpen(false)
  }

  const renderSidebar = (scope: 'desktop' | 'mobile') => (
    <div id={`${pid}-sidebar-${scope}`} className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:hidden">
        <Link
          id={`${pid}-logo-mobile`}
          href="/"
          className="flex items-center gap-2"
          onClick={() => setSidebarOpen(false)}
        >
          <BookOpen className="h-7 w-7 text-primary-600" />
          <span className="font-bold text-gray-900">EduFlow</span>
          <VersionBadge className="ml-1.5" />
        </Link>
        <button
          id={`${pid}-sidebar-close`}
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label={t('common.closeMenu')}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="hidden h-14 shrink-0 items-center border-b px-5 md:flex">
        <Link id={`${pid}-logo`} href="/" className="flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary-600" />
          <span className="font-bold text-gray-900">EduFlow</span>
          <VersionBadge className="ml-1.5" />
        </Link>
      </div>

      <nav id={`${pid}-nav-${scope}`} className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            id={`${pid}-nav-${scope}-${item.id}`}
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

      <div id={`${pid}-sidebar-footer-${scope}`} className="shrink-0 border-t p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <div id={`${pid}-user-${scope}`} className="flex min-w-0 flex-1 items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
          </div>
          <NotificationBell userId={userId} id={`${pid}-notifications-sidebar-${scope}`} />
          {hasChatTab && (
            <ChatHeaderButton
              id={`${pid}-chat-sidebar-${scope}`}
              active={activeTab === 'chat'}
              onClick={openChat}
            />
          )}
          <button
            id={`${pid}-logout-${scope}`}
            type="button"
            onClick={onLogout}
            className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
            title={t('common.logout')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div
      id={pid}
      className="min-h-screen w-full max-w-[100vw] bg-gray-50 text-gray-900 dark:bg-[#0b1220] dark:text-gray-100"
    >
      <header id={`${pid}-header-mobile`} className="sticky top-0 z-30 border-b bg-white shadow-sm md:hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
          <button
            id={`${pid}-menu-open`}
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label={t('common.openMenu')}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div id={`${pid}-header-mobile-titles`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 sm:text-base">{headerTitle}</p>
            {headerSubtitle && (
              <p className="truncate text-xs text-gray-500">{headerSubtitle}</p>
            )}
          </div>
          <div id={`${pid}-header-mobile-actions`} className="flex shrink-0 items-center gap-1.5">
            <RoleUserBadgeCompact
              id={`${pid}-badge-mobile`}
              roleShort={roleShort}
              userName={userName}
            />
            {hasChatTab && (
              <ChatHeaderButton
                id={`${pid}-chat-mobile`}
                active={activeTab === 'chat'}
                onClick={openChat}
              />
            )}
            <NotificationBell userId={userId} id={`${pid}-notifications-mobile`} />
            <LanguageSwitcher id={`${pid}-language-mobile`} />
            <ThemeToggle id={`${pid}-theme-mobile`} />
          </div>
        </div>
        {headerAction && (
          <div id={`${pid}-quick-action-mobile`} className="border-t px-3 py-2 sm:px-4">
            <div className="flex w-full [&_a]:flex [&_a]:w-full [&_a]:justify-center [&_button]:w-full">
              {headerAction}
            </div>
          </div>
        )}
      </header>

      <div className="flex w-full">
        <aside
          id={`${pid}-aside-desktop`}
          className="hidden w-56 shrink-0 border-r bg-white md:flex md:w-64 md:flex-col lg:sticky lg:top-0 lg:h-screen"
        >
          {renderSidebar('desktop')}
        </aside>

        {sidebarOpen && (
          <>
            <div
              id={`${pid}-sidebar-backdrop`}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden
            />
            <aside
              id={`${pid}-aside-drawer`}
              className="fixed inset-y-0 left-0 z-50 flex w-[min(85vw,280px)] flex-col bg-white shadow-xl md:hidden"
            >
              {renderSidebar('mobile')}
            </aside>
          </>
        )}

        <main id={`${pid}-main`} className="min-w-0 w-full flex-1 overflow-x-hidden">
          <div id={`${pid}-header-desktop`} className="hidden border-b bg-white px-4 py-4 md:block sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div id={`${pid}-header-desktop-titles`} className="min-w-0">
                <h1 className="truncate text-xl font-bold text-gray-900 lg:text-2xl">{headerTitle}</h1>
                {headerSubtitle && <p className="text-sm text-gray-600">{headerSubtitle}</p>}
              </div>
              <div id={`${pid}-header-desktop-actions`} className="flex shrink-0 items-center gap-2">
                <RoleUserBadge id={`${pid}-badge-desktop`} roleShort={roleShort} userName={userName} />
                {hasChatTab && (
                  <ChatHeaderButton
                    id={`${pid}-chat-desktop`}
                    active={activeTab === 'chat'}
                    onClick={openChat}
                  />
                )}
                <NotificationBell userId={userId} id={`${pid}-notifications-desktop`} />
                <div id={`${pid}-quick-action-desktop`}>{headerAction}</div>
                <LanguageSwitcher id={`${pid}-language-desktop`} />
                <ThemeToggle id={`${pid}-theme-desktop`} />
              </div>
            </div>
          </div>
          <div id={`${pid}-content`} className="w-full max-w-full p-3 sm:p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
