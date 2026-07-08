'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Search,
  Shield,
  UserCheck,
  Users,
  KeyRound,
} from 'lucide-react'
import toast from 'react-hot-toast'
import ResetPasswordModal from '@/components/admin/ResetPasswordModal'
import BulkStudentImport from '@/components/admin/BulkStudentImport'
import ChangePasswordForm from '@/components/account/ChangePasswordForm'
import { useAuthStore } from '@/lib/stores/authStore'
import { api, ApiError, type AdminClassRow } from '@/lib/api/client'
import type { AccountStatus } from '@/lib/types'
import { ACCOUNT_STATUS_LABELS } from '@/lib/format'

const STATUS_COLORS: Record<AccountStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  restricted: 'bg-orange-100 text-orange-800 border-orange-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
}

type Tab = 'overview' | 'users' | 'classes' | 'password'

export default function AdminDashboardPage() {
  const router = useRouter()
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
        ? 'Bị hạn chế bởi quản trị viên'
        : action === 'setStatus' && status === 'suspended'
          ? 'Bị đình chỉ bởi quản trị viên'
          : undefined
    try {
      await api.admin.updateUser(userId, { action, status, statusNote: note })
      toast.success('Đã cập nhật tài khoản')
      await Promise.all([loadUsers(), loadOverview()])
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Cập nhật thất bại')
    }
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.admin.createClass(newClass)
      toast.success('Đã tạo lớp học')
      setNewClass({ title: '', description: '', teacherId: '' })
      await loadClasses()
      await loadOverview()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Tạo lớp thất bại')
    }
  }

  const handleSaveRoster = async () => {
    if (!selectedClassId) return
    try {
      await api.admin.updateClassRoster(selectedClassId, rosterIds)
      toast.success('Đã cập nhật danh sách lớp')
      await loadClasses()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Lưu danh sách thất bại')
    }
  }

  const toggleRosterStudent = (id: string) => {
    setRosterIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const nav = [
    { id: 'overview' as const, label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'users' as const, label: 'Tài khoản', icon: Users },
    { id: 'classes' as const, label: 'Lớp học', icon: BookOpen },
    { id: 'password' as const, label: 'Mật khẩu', icon: KeyRound },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-sky-400" />
            <div>
              <h1 className="text-lg font-bold">EduFlow Admin</h1>
              <p className="text-xs text-slate-400">Quản lý giáo viên, học sinh và lớp học</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-300 sm:inline">{currentUser.fullName}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 p-4 lg:p-6">
        <aside className="hidden w-52 shrink-0 lg:block">
          <nav className="space-y-1 rounded-xl border bg-white p-2 shadow-sm">
            {nav.map((item) => (
              <button
                key={item.id}
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
          <div className="flex gap-2 lg:hidden">
            {nav.map((item) => (
              <button
                key={item.id}
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Chờ duyệt', value: overview.pending, color: 'text-amber-600' },
                { label: 'Đang hoạt động', value: overview.active, color: 'text-green-600' },
                { label: 'Bị hạn chế', value: overview.restricted, color: 'text-orange-600' },
                { label: 'Đình chỉ', value: overview.suspended, color: 'text-red-600' },
                { label: 'Giáo viên', value: overview.teachers, color: 'text-blue-600' },
                { label: 'Học sinh', value: overview.students, color: 'text-violet-600' },
                { label: 'Lớp học', value: overview.classes, color: 'text-slate-700' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">{s.label}</p>
                  <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'users' && (
            <div className="space-y-4">
              <BulkStudentImport
                onImported={() => {
                  loadUsers().catch(() => {})
                  loadOverview().catch(() => {})
                  loadClasses().catch(() => {})
                }}
              />

              <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-4 shadow-sm">
                <div className="relative min-w-[180px] flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm tên, email hoặc mã ID..."
                    className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="student">Học sinh</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="active">Hoạt động</option>
                  <option value="restricted">Hạn chế</option>
                  <option value="suspended">Đình chỉ</option>
                </select>
                <button
                  type="button"
                  onClick={() => loadUsers()}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
                >
                  Lọc
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Người dùng</th>
                      <th className="px-4 py-3">Mã ID</th>
                      <th className="px-4 py-3">Vai trò</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
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
                              Giáo viên
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-violet-700">
                              <Users className="mr-1 h-3.5 w-3.5" />
                              Học sinh
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[u.accountStatus]}`}
                          >
                            {ACCOUNT_STATUS_LABELS[u.accountStatus]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {u.accountStatus === 'pending' && (
                              <button
                                type="button"
                                onClick={() => updateUserStatus(u.id, 'approve')}
                                className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                              >
                                Duyệt
                              </button>
                            )}
                            {u.accountStatus !== 'active' && u.accountStatus !== 'pending' && (
                              <button
                                type="button"
                                onClick={() => updateUserStatus(u.id, 'setStatus', 'active')}
                                className="rounded border px-2 py-1 text-xs"
                              >
                                Kích hoạt
                              </button>
                            )}
                            {u.accountStatus !== 'restricted' && (
                              <button
                                type="button"
                                onClick={() => updateUserStatus(u.id, 'setStatus', 'restricted')}
                                className="rounded border border-orange-300 bg-orange-50 px-2 py-1 text-xs text-orange-800"
                              >
                                Hạn chế
                              </button>
                            )}
                            {u.accountStatus !== 'suspended' && (
                              <button
                                type="button"
                                onClick={() => updateUserStatus(u.id, 'setStatus', 'suspended')}
                                className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-800"
                              >
                                Đình chỉ
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setResetUser({ id: u.id, fullName: u.fullName, email: u.email })
                              }
                              className="inline-flex items-center rounded border border-sky-300 bg-sky-50 px-2 py-1 text-xs text-sky-800"
                            >
                              <KeyRound className="mr-1 h-3 w-3" />
                              Reset MK
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p className="p-8 text-center text-sm text-slate-500">Không có tài khoản phù hợp</p>
                )}
              </div>
            </div>
          )}

          {tab === 'classes' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <form onSubmit={handleCreateClass} className="rounded-xl border bg-white p-4 shadow-sm">
                  <h2 className="mb-3 font-semibold text-slate-900">Tạo lớp học mới</h2>
                  <div className="space-y-2">
                    <input
                      required
                      value={newClass.title}
                      onChange={(e) => setNewClass((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Tên lớp"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                    <textarea
                      value={newClass.description}
                      onChange={(e) => setNewClass((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Mô tả"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      rows={2}
                    />
                    <select
                      required
                      value={newClass.teacherId}
                      onChange={(e) => setNewClass((f) => ({ ...f, teacherId: e.target.value }))}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    >
                      <option value="">Chọn giáo viên (đã kích hoạt)</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} — {t.email}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="w-full rounded-lg bg-slate-900 py-2 text-sm text-white">
                      Tạo lớp
                    </button>
                  </div>
                </form>

                <div className="rounded-xl border bg-white shadow-sm">
                  <div className="border-b px-4 py-3 font-semibold">Danh sách lớp ({classes.length})</div>
                  <ul className="max-h-[420px] divide-y overflow-y-auto">
                    {classes.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedClassId(c.id)}
                          className={`w-full px-4 py-3 text-left hover:bg-slate-50 ${
                            selectedClassId === c.id ? 'bg-sky-50' : ''
                          }`}
                        >
                          <p className="font-medium text-slate-900">{c.title}</p>
                          <p className="text-xs text-slate-500">
                            GV: {c.teacherName} · {c.studentCount} HS · Mã {c.classCode}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <h2 className="mb-3 flex items-center font-semibold text-slate-900">
                  <UserCheck className="mr-2 h-5 w-5" />
                  Danh sách học sinh trong lớp
                </h2>
                {!selectedClass ? (
                  <p className="text-sm text-slate-500">Chọn một lớp để quản lý danh sách học sinh.</p>
                ) : (
                  <>
                    <p className="mb-3 text-sm text-slate-600">
                      Lớp: <strong>{selectedClass.title}</strong>
                    </p>
                    <div className="max-h-[360px] space-y-1 overflow-y-auto rounded-lg border p-2">
                      {allStudents.map((s) => (
                        <label
                          key={s.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50"
                        >
                          <input
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
                      type="button"
                      onClick={handleSaveRoster}
                      className="mt-3 w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white"
                    >
                      Lưu danh sách ({rosterIds.length} học sinh)
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {tab === 'password' && <ChangePasswordForm />}
        </main>
      </div>

      {resetUser && (
        <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} />
      )}
    </div>
  )
}
