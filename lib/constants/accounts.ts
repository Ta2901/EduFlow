/** Login ID for the default admin account (stored in User.email). */
export const ADMIN_LOGIN_ID = 'eduflow.admin'

/** Initial admin password — only applied when creating admin or migrating legacy seed admin. */
export const ADMIN_DEFAULT_PASSWORD = 'firstedu.eduflow'

/** Old admin logins migrated to ADMIN_LOGIN_ID on seed. */
export const LEGACY_ADMIN_LOGIN_IDS = ['admin@eduflow.com', 'edufow.admin'] as const
