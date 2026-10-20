'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  KeyRound,
  LogOut,
  Search,
  Settings,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import ResetPasswordModal from '@/components/admin/ResetPasswordModal'
import BulkStudentImport from '@/components/admin/BulkStudentImport'
import AdminWorkCharts from '@/components/dashboard/AdminWorkCharts'
import AdminTeachingMonitor from '@/components/dashboard/AdminTeachingMonitor'
import PracticeSetPanel from '@/components/class/PracticeSetPanel'
import SettingsPanel from '@/components/settings/SettingsPanel'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'
import { useI18n } from '@/components/i18n/LanguageProvider'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { useAuthStore } from '@/lib/stores/authStore'
import { api, ApiError, type AdminClassRow } from '@/lib/api/client'
import type { AccountStatus } from '@/lib/types'

const STATUS_COLORS: Record<AccountStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  restricted: 'bg-orange-100 text-orange-800 border-orange-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
}

type Tab = 'overview' | 'users' | 'classes' | 'settings'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { t } = useI18n()
  const currentUser = useAuthStore((s) => s.currentUser)!
  const logout = useAuthStore((s) => s.logout)

  const [tab, setTab] = useState<Tab>('overview')
  const [overview, setOverview] = useState({
    pending: 0,
    active: 0,
    restricted: 0,
    suspended: 0,
    teachers: 0,
    students: 0,
    classes: 0,
  })
  const [users, setUsers] = useState<
    {
      id: string
      memberCode?: string
      email: string
      fullName: string
      role: string
      accountStatus: AccountStatus
      statusNote?: string
      school?: string
      createdAt: string
    }[]
  >([])
  const [classes, setClasses] = useState<AdminClassRow[]>([])
  const [teachers, setTeachers] = useState<{ id: string; fullName: string; email: string }[]>([])
  const [allStudents, setAllStudents] = useState<
    { id: string; fullName: string; email: string; accountStatus: AccountStatus }[]
  >([])

  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [rosterIds, setRosterIds] = useState<string[]>([])

  const [newClass, setNewClass] = useState({ title: '', description: '', teacherId: '' })
  const [resetUser, setResetUser] = useState<{
    id: string
    fullName: string
    email: string
  } | null>(null)

  const loadOverview = useCallback(async () => {
    const { overview: data } = await api.admin.overview()
    setOverview(data)
  }, [])

  const loadUsers = useCallback(async () => {
    const { users: data } = await api.admin.listUsers({
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      q: search || undefined,
    })
    setUsers(data)
  }, [roleFilter, statusFilter, search])

  const loadClasses = useCallback(async () => {
    const [{ classes: data }, { teachers: t }, { students: s }] = await Promise.all([
      api.admin.listClasses(),
      api.admin.listTeachers(),
      api.admin.listStudents(),
    ])
    setClasses(data)
    setTeachers(t)
    setAllStudents(s)
  }, [])

  useEffect(() => {
    loadOverview().catch(() => {})
    loadClasses().catch(() => {})
  }, [loadOverview, loadClasses])

  useEffect(() => {
    if (tab === 'users') loadUsers().catch(() => {})
  }, [tab, loadUsers])

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) ?? null,
    [classes, selectedClassId]
  )

  useEffect(() => {
    if (selectedClass) {
      setRosterIds(selectedClass.students.map((s) => s.id))
    }
  }, [selectedClass])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const updateUserStatus = async (userId: string, action: 'approve' | 'setStatus', status?: AccountStatus) => {
    const note =
      action === 'setStatus' && status === 'restricted'
        ? t('admin.noteRestricted')
        : action === 'setStatus' && status === 'suspended'
          ? t('admin.noteSuspended')
          : undefined
    try {
      await api.admin.updateUser(userId, { action, status, statusNote: note })
      toast.success(t('admin.updated'))
      await Promise.all([loadUsers(), loadOverview()])
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('admin.updateFailed'))
    }
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.admin.createClass(newClass)
      toast.success(t('admin.classCreated'))
      setNewClass({ title: '', description: '', teacherId: '' })
      await loadClasses()
      await loadOverview()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('admin.classFailed'))
    }
  }

  const handleSaveRoster = async () => {
    if (!selectedClassId) return
    try {
      await api.admin.updateClassRoster(selectedClassId, rosterIds)
      toast.success(t('admin.rosterSaved'))
      await loadClasses()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('admin.rosterFailed'))
    }
  }

  const toggleRosterStudent = (id: string) => {
    setRosterIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const nav = [
    { id: 'overview' as const, label: t('nav.overview'), icon: LayoutDashboard },
    { id: 'users' as const, label: t('nav.accounts'), icon: Users },
    { id: 'classes' as const, label: t('nav.classes'), icon: BookOpen },
    { id: 'settings' as const, label: t('common.settings'), icon: Settings },
  ]

  return (
    <div id="admin-dashboard" className="min-h-screen bg-slate-100 dark:bg-[#0b1220]">
      <header id="admin-dashboard-header" className="border-b border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-sky-400" />
            <div>
              <h1 className="text-lg font-bold">{t('admin.title')}</h1>
              <p className="text-xs text-slate-400">{t('admin.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-300 sm:inline">{currentUser.fullName}</span>
            <button
              id="admin-dashboard-logout"
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              {t('common.logout')}
            </button>
            <LanguageSwitcher id="admin-dashboard-language" tone="onDark" />
            <ThemeToggle id="admin-dashboard-theme-toggle" className="text-slate-200 hover:bg-slate-800 hover:text-white" />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 p-4 lg:p-6">
        <aside className="hidden w-52 shrink-0 lg:block">
          <nav id="admin-dashboard-nav" className="space-y-1 rounded-xl border bg-white p-2 shadow-sm">
            {nav.map((item) => (
              <button
                key={item.id}
                id={`admin-dashboard-nav-${item.id}`}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  tab === item.id ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 space-y-4">
          <div id="admin-dashboard-nav-mobile" className="flex gap-2 lg:hidden">
            {nav.map((item) => (
              <button
                key={item.id}
                id={`admin-dashboard-nav-mobile-${item.id}`}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${
                  tab === item.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div id="admin-dashboard-overview" className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: t('admin.pending'), value: overview.pending, color: 'text-amber-600' },
                  { label: t('admin.active'), value: overview.active, color: 'text-green-600' },
                  { label: t('admin.restricted'), value: overview.restricted, color: 'text-orange-600' },
                  { label: t('admin.suspended'), value: overview.suspended, color: 'text-red-600' },
                  { label: t('admin.teachers'), value: overview.teachers, color: 'text-blue-600' },
                  { label: t('admin.students'), value: overview.students, color: 'text-violet-600' },
                  { label: t('admin.classes'), value: overview.classes, color: 'text-slate-700' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">{s.label}</p>
                    <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <AdminWorkCharts id="admin-dashboard-work-charts" />
              <AdminTeachingMonitor id="admin-dashboard-teaching-monitor" />
            </div>
          )}

          {tab === 'users' && (
            <div id="admin-dashboard-users" className="space-y-4">
              <BulkStudentImport
                onImported={() => {
                  loadUsers().catch(() => {})
                  loadOverview().catch(() => {})
                  loadClasses().catch(() => {})
                }}
              />

              <div id="admin-dashboard-user-filters" className="flex flex-wrap gap-2 rounded-xl border bg-white p-4 shadow-sm">
                <div className="relative min-w-[180px] flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="admin-dashboard-user-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('admin.searchPlaceholder')}
                    className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
                  />
                </div>
                <select
                  id="admin-dashboard-user-role-filter"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">{t('common.allRoles')}</option>
                  <option value="teacher">{t('role.teacher')}</option>
                  <option value="student">{t('role.student')}</option>
                </select>
                <select
                  id="admin-dashboard-user-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">{t('common.allStatuses')}</option>
                  <option value="pending">{t('status.account.pending')}</option>
                  <option value="active">{t('status.account.active')}</option>
                  <option value="restricted">{t('status.account.restricted')}</option>
                  <option value="suspended">{t('status.account.suspended')}</option>
                </select>
                <button
                  id="admin-dashboard-user-filter-submit"
                  type="button"
                  onClick={() => loadUsers()}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
                >
                  {t('common.filter')}
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">{t('common.user')}</th>
                      <th className="px-4 py-3">{t('admin.memberCode')}</th>
                      <th className="px-4 py-3">{t('common.role')}</th>
                      <th className="px-4 py-3">{t('common.status')}</th>
                      <th className="px-4 py-3">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((u) => (
                      <tr key={u.id} id={`admin-dashboard-user-row-${u.id}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{u.fullName}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">
                          {u.memberCode || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {u.role === 'teacher' ? (
                            <span className="inline-flex items-center text-blue-700">
                              <GraduationCap className="mr-1 h-3.5 w-3.5" />
                              {t('role.teacher')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-violet-700">
                              <Users className="mr-1 h-3.5 w-3.5" />
                              {t('role.student')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[u.accountStatus]}`}
                          >
                            {t(`status.account.${u.accountStatus}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {u.accountStatus === 'pending' && (
                              <button
                                id={`admin-dashboard-user-approve-${u.id}`}
                                type="button"
                                onClick={() => updateUserStatus(u.id, 'approve')}
                                className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                              >
                                {t('admin.approve')}
                              </button>
                            )}
                            {u.accountStatus !== 'active' && u.accountStatus !== 'pending' && (
                              <button
                                id={`admin-dashboard-user-activate-${u.id}`}
                                type="button"
                                onClick={() => updateUserStatus(u.id, 'setStatus', 'active')}
                                className="rounded border px-2 py-1 text-xs"
                              >
                                {t('admin.activate')}
                              </button>
                            )}
                            {u.accountStatus !== 'restricted' && (
                              <button
                                id={`admin-dashboard-user-restrict-${u.id}`}
                                type="button"
                                onClick={() => updateUserStatus(u.id, 'setStatus', 'restricted')}
                                className="rounded border border-orange-300 bg-orange-50 px-2 py-1 text-xs text-orange-800"
                              >
                                {t('admin.restrict')}
                              </button>
                            )}
                            {u.accountStatus !== 'suspended' && (
                              <button
                                id={`admin-dashboard-user-suspend-${u.id}`}
                                type="button"
                                onClick={() => updateUserStatus(u.id, 'setStatus', 'suspended')}
                                className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-800"
                              >
                                {t('admin.suspend')}
                              </button>
                            )}
                            <button
                              id={`admin-dashboard-user-reset-${u.id}`}
                              type="button"
                              onClick={() =>
                                setResetUser({ id: u.id, fullName: u.fullName, email: u.email })
                              }
                              className="inline-flex items-center rounded border border-sky-300 bg-sky-50 px-2 py-1 text-xs text-sky-800"
                            >
                              <KeyRound className="mr-1 h-3 w-3" />
                              {t('admin.resetPassword')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p className="p-8 text-center text-sm text-slate-500">{t('admin.noUsers')}</p>
                )}
              </div>
            </div>
          )}

          {tab === 'classes' && (
            <div id="admin-dashboard-classes" className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <form id="admin-dashboard-create-class-form" onSubmit={handleCreateClass} className="rounded-xl border bg-white p-4 shadow-sm">
                  <h2 className="mb-3 font-semibold text-slate-900">{t('admin.createClass')}</h2>
                  <div className="space-y-2">
                    <input
                      id="admin-dashboard-class-title"
                      required
                      value={newClass.title}
                      onChange={(e) => setNewClass((f) => ({ ...f, title: e.target.value }))}
                      placeholder={t('admin.className')}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                    <textarea
                      id="admin-dashboard-class-description"
                      value={newClass.description}
                      onChange={(e) => setNewClass((f) => ({ ...f, description: e.target.value }))}
                      placeholder={t('admin.description')}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      rows={2}
                    />
                    <select
                      id="admin-dashboard-class-teacher"
                      required
                      value={newClass.teacherId}
                      onChange={(e) => setNewClass((f) => ({ ...f, teacherId: e.target.value }))}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    >
                      <option value="">{t('admin.pickTeacher')}</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} — {t.email}
                        </option>
                      ))}
                    </select>
                    <button id="admin-dashboard-class-create-submit" type="submit" className="w-full rounded-lg bg-slate-900 py-2 text-sm text-white">
                      {t('admin.create')}
                    </button>
                  </div>
                </form>

                <div className="rounded-xl border bg-white shadow-sm">
                  <div className="border-b px-4 py-3 font-semibold">{t('admin.classList', { count: classes.length })}</div>
                  <ul className="max-h-[420px] divide-y overflow-y-auto">
                    {classes.map((c) => (
                      <li key={c.id}>
                        <button
                          id={`admin-dashboard-class-item-${c.id}`}
                          type="button"
                          onClick={() => setSelectedClassId(c.id)}
                          className={`w-full px-4 py-3 text-left hover:bg-slate-50 ${
                            selectedClassId === c.id ? 'bg-sky-50' : ''
                          }`}
                        >
                          <p className="font-medium text-slate-900">{c.title}</p>
                          <p className="text-xs text-slate-500">
                            {t('admin.rosterMeta', { teacher: c.teacherName, count: c.studentCount, code: c.classCode })}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div id="admin-dashboard-roster" className="rounded-xl border bg-white p-4 shadow-sm">
                <h2 className="mb-3 flex items-center font-semibold text-slate-900">
                  <UserCheck className="mr-2 h-5 w-5" />
                  {t('admin.rosterTitle')}
                </h2>
                {!selectedClass ? (
                  <p className="text-sm text-slate-500">{t('admin.pickClass')}</p>
                ) : (
                  <>
                    <p className="mb-3 text-sm text-slate-600">
                      {t('admin.classIs', { title: selectedClass.title })}
                    </p>
                    <div className="max-h-[360px] space-y-1 overflow-y-auto rounded-lg border p-2">
                      {allStudents.map((s) => (
                        <label
                          key={s.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50"
                        >
                          <input
                            id={`admin-dashboard-roster-student-${s.id}`}
                            type="checkbox"
                            checked={rosterIds.includes(s.id)}
                            onChange={() => toggleRosterStudent(s.id)}
                          />
                          <span className="text-sm text-slate-800">{s.fullName}</span>
                          <span className="text-xs text-slate-400">{s.email}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      id="admin-dashboard-roster-save"
                      type="button"
                      onClick={handleSaveRoster}
                      className="mt-3 w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white"
                    >
                      {t('admin.saveRoster', { count: rosterIds.length })}
                    </button>
                    <div className="mt-6 border-t pt-4">
                      <PracticeSetPanel
                        id="admin-dashboard-class-practice"
                        classId={selectedClass.id}
                        canEdit
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {tab === 'settings' && <SettingsPanel id="admin-dashboard-settings" showPassword={false} />}
        </main>
      </div>

      {resetUser && (
        <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} />
      )}
    </div>
  )
}
