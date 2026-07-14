import type { UserRole } from '@/lib/types'

const STORAGE_KEY = 'eduflow-quick-accounts'
const MAX_ACCOUNTS = 5

export interface SavedQuickAccount {
  userId: string
  email: string
  fullName: string
  role: UserRole
  memberCode?: string
  loginId: string
  tokenId: string
  token: string
  savedAt: string
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export function listSavedQuickAccounts(): SavedQuickAccount[] {
  if (!canUseStorage()) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedQuickAccount[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((a) => a?.userId && a?.token && a?.tokenId)
  } catch {
    return []
  }
}

function writeAccounts(accounts: SavedQuickAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts.slice(0, MAX_ACCOUNTS)))
}

export function saveQuickAccount(account: SavedQuickAccount) {
  if (!canUseStorage()) return
  const rest = listSavedQuickAccounts().filter((a) => a.userId !== account.userId)
  writeAccounts([account, ...rest])
}

export function removeQuickAccount(userId: string): SavedQuickAccount | null {
  if (!canUseStorage()) return null
  const all = listSavedQuickAccounts()
  const removed = all.find((a) => a.userId === userId) ?? null
  writeAccounts(all.filter((a) => a.userId !== userId))
  return removed
}

export function clearQuickAccounts() {
  if (!canUseStorage()) return
  localStorage.removeItem(STORAGE_KEY)
}
