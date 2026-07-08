export const BULK_STUDENT_DEFAULT_PASSWORD = 'eduflow123'

export interface StudentImportRow {
  studentCode: string
  fullName: string
  email?: string
  school?: string
  phone?: string
}

export interface ParseStudentImportResult {
  rows: StudentImportRow[]
  errors: { line: number; message: string }[]
}

const HEADER_ALIASES: Record<string, keyof StudentImportRow> = {
  ma_hs: 'studentCode',
  ma: 'studentCode',
  mhs: 'studentCode',
  studentcode: 'studentCode',
  student_code: 'studentCode',
  id: 'studentCode',
  mã_hs: 'studentCode',
  ho_ten: 'fullName',
  hoten: 'fullName',
  ten: 'fullName',
  name: 'fullName',
  fullname: 'fullName',
  full_name: 'fullName',
  'họ_tên': 'fullName',
  email: 'email',
  truong: 'school',
  school: 'school',
  trường: 'school',
  sdt: 'phone',
  phone: 'phone',
  'số_điện_thoại': 'phone',
}

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
}

function detectDelimiter(line: string): string {
  const counts: [string, number][] = [
    [',', (line.match(/,/g) || []).length],
    [';', (line.match(/;/g) || []).length],
    ['\t', (line.match(/\t/g) || []).length],
  ]
  counts.sort((a, b) => b[1] - a[1])
  return counts[0][1] > 0 ? counts[0][0] : ','
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (!inQuotes && ch === delimiter) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  cells.push(current.trim())
  return cells
}

function mapHeaders(headers: string[]): (keyof StudentImportRow | null)[] {
  return headers.map((h) => {
    const normalized = normalizeHeader(h)
    return HEADER_ALIASES[normalized] ?? null
  })
}

function rowFromCells(
  cells: string[],
  mapping: (keyof StudentImportRow | null)[]
): Partial<StudentImportRow> {
  const row: Partial<StudentImportRow> = {}
  mapping.forEach((key, index) => {
    if (!key) return
    const value = cells[index]?.trim()
    if (value) row[key] = value
  })
  return row
}

function validateRow(row: Partial<StudentImportRow>, line: number, errors: ParseStudentImportResult['errors']) {
  if (!row.studentCode?.trim()) {
    errors.push({ line, message: 'Thiếu mã học sinh' })
    return null
  }
  if (!row.fullName?.trim()) {
    errors.push({ line, message: 'Thiếu họ tên' })
    return null
  }
  return {
    studentCode: row.studentCode.trim().toUpperCase(),
    fullName: row.fullName.trim(),
    email: row.email?.trim().toLowerCase(),
    school: row.school?.trim(),
    phone: row.phone?.trim(),
  } satisfies StudentImportRow
}

export function parseStudentImportFile(content: string): ParseStudentImportResult {
  const errors: ParseStudentImportResult['errors'] = []
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return { rows: [], errors: [{ line: 0, message: 'File trống' }] }
  }

  const delimiter = detectDelimiter(lines[0])
  const firstCells = splitCsvLine(lines[0], delimiter)
  const headerMapping = mapHeaders(firstCells)
  const hasHeader = headerMapping.some((h) => h !== null)

  const dataLines = hasHeader ? lines.slice(1) : lines
  const mapping: (keyof StudentImportRow | null)[] = hasHeader
    ? headerMapping
    : ['studentCode', 'fullName', 'school', 'phone', 'email']

  const rows: StudentImportRow[] = []
  const seenCodes = new Set<string>()

  dataLines.forEach((line, index) => {
    const lineNo = hasHeader ? index + 2 : index + 1
    const cells = splitCsvLine(line, delimiter)
    const partial = rowFromCells(cells, mapping)
    const valid = validateRow(partial, lineNo, errors)
    if (!valid) return

    if (seenCodes.has(valid.studentCode)) {
      errors.push({ line: lineNo, message: `Mã ${valid.studentCode} bị trùng trong file` })
      return
    }
    seenCodes.add(valid.studentCode)
    rows.push(valid)
  })

  return { rows, errors }
}

export function defaultStudentEmail(studentCode: string): string {
  const safe = studentCode.toLowerCase().replace(/[^a-z0-9._-]/g, '')
  return `${safe}@student.eduflow.vn`
}
