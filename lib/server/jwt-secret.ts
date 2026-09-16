import { existsSync, readFileSync } from 'fs'
import path from 'path'

/** Dự phòng khi host không inject env (Vercel/build) — đổi khi đưa lên production thật. */
const FALLBACK_JWT_SECRET =
  '5b2334a4513dd850f40ebcc8df0c385d6669d300669910e70067db3f959702fd'

function strip(value: string | undefined | null) {
  return String(value ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
}

function secretFromEnvFile(filePath: string) {
  try {
    if (!existsSync(filePath)) return ''
    const match = readFileSync(filePath, 'utf8').match(/^\s*JWT_SECRET\s*=\s*(.*)$/m)
    return strip(match?.[1])
  } catch {
    return ''
  }
}

function candidatePaths() {
  const names = ['.env.production.local', '.env.local', '.env.production', '.env']
  const roots = [process.cwd()]
  try {
    roots.push(path.resolve(__dirname, '../..'))
    roots.push(path.resolve(__dirname, '../../..'))
  } catch {
    /* bundled */
  }
  const out: string[] = []
  for (const root of roots) {
    for (const name of names) out.push(path.join(root, name))
  }
  return out
}

export function getJwtSecretString() {
  const fromEnv = strip(process.env.JWT_SECRET) || strip(process.env['JWT_SECRET'])
  if (fromEnv) return fromEnv

  for (const filePath of candidatePaths()) {
    const fromFile = secretFromEnvFile(filePath)
    if (fromFile) return fromFile
  }

  return FALLBACK_JWT_SECRET
}
