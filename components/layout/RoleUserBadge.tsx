'use client'

import { useI18n } from '@/components/i18n/LanguageProvider'

interface RoleUserBadgeProps {
  id?: string
  roleShort: 'GV' | 'HS'
  userName: string
}

const styles = {
  GV: 'bg-blue-100 text-blue-800 border-blue-200',
  HS: 'bg-violet-100 text-violet-800 border-violet-200',
}

export default function RoleUserBadge({
  id = 'role-user-badge',
  roleShort,
  userName,
}: RoleUserBadgeProps) {
  const { t } = useI18n()
  const short = roleShort === 'GV' ? t('role.shortTeacher') : t('role.shortStudent')
  return (
    <div
      id={id}
      className={`hidden max-w-[min(40vw,220px)] items-center gap-1.5 rounded-full border px-2.5 py-1 sm:flex sm:max-w-xs ${styles[roleShort]}`}
      title={`${short} ${userName}`}
    >
      <span className="shrink-0 text-xs font-bold">{short}</span>
      <span className="truncate text-xs font-medium">{userName}</span>
    </div>
  )
}

interface RoleUserBadgeCompactProps extends RoleUserBadgeProps {}

export function RoleUserBadgeCompact({
  id = 'role-user-badge-compact',
  roleShort,
  userName,
}: RoleUserBadgeCompactProps) {
  const { t } = useI18n()
  const short = roleShort === 'GV' ? t('role.shortTeacher') : t('role.shortStudent')
  return (
    <div
      id={id}
      className={`flex max-w-[42vw] items-center gap-1 rounded-full border px-2 py-0.5 sm:hidden ${styles[roleShort]}`}
      title={`${short} ${userName}`}
    >
      <span className="shrink-0 text-[10px] font-bold">{short}</span>
      <span className="truncate text-[10px] font-medium">{userName}</span>
    </div>
  )
}
