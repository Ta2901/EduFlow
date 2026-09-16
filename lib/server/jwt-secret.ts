import { existsSync, readFileSync } from 'fs'
import path from 'path'

function strip(value: string | undefined | null) {
  return String(value ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
}

function secretFromEnvFile(fileName: string) {
  try {
    const filePath = path.join(process.cwd(), fileName)
    if (!existsSync(filePath)) return ''
    const match = readFileSync(filePath, 'utf8').match(/^\s*JWT_SECRET\s*=\s*(.*)$/m)
    return strip(match?.[1])
  } catch {
    return ''
  }
}

/** Đọc JWT_SECRET lúc runtime (không để webpack inline `undefined` lúc build). */
export function getJwtSecretString() {
  // Tránh process.env.JWT_SECRET tĩnh — Next 14 có thể thay bằng undefined lúc compile.
  const fromProcess = strip(process.env['JWT_SECRET'])
  if (fromProcess) return fromProcess

  const fromLocal = secretFromEnvFile('.env.local') || secretFromEnvFile('.env')
  if (fromLocal) return fromLocal

  if (process.env.NODE_ENV !== 'production') {
    return 'eduflow-dev-jwt-secret-min-32-characters-long'
  }

  throw new Error(
    'Máy chủ chưa cấu hình JWT_SECRET. Thêm biến này vào .env (hoặc env của host) rồi khởi động lại.'
  )
}
