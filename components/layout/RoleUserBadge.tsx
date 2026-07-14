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
  return (
    <div
      id={id}
      className={`hidden max-w-[min(40vw,220px)] items-center gap-1.5 rounded-full border px-2.5 py-1 sm:flex sm:max-w-xs ${styles[roleShort]}`}
      title={`${roleShort} ${userName}`}
    >
      <span className="shrink-0 text-xs font-bold">{roleShort}</span>
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
  return (
    <div
      id={id}
      className={`flex max-w-[42vw] items-center gap-1 rounded-full border px-2 py-0.5 sm:hidden ${styles[roleShort]}`}
      title={`${roleShort} ${userName}`}
    >
      <span className="shrink-0 text-[10px] font-bold">{roleShort}</span>
      <span className="truncate text-[10px] font-medium">{userName}</span>
    </div>
  )
}
