const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

export function generateTempPassword(length = 8): string {
  let password = ''
  for (let i = 0; i < length; i++) {
    password += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return password
}
