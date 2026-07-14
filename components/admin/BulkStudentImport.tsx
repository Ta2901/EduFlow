'use client'

import { useRef, useState } from 'react'
import { Download, FileUp, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, ApiError } from '@/lib/api/client'
import { BULK_STUDENT_DEFAULT_PASSWORD } from '@/lib/utils/parseStudentImport'

const TEMPLATE_CSV = `ma_hs,ho_ten,truong,sdt
HS001,Nguyễn Văn An,THPT EduFlow,0901234567
HS002,Trần Thị Bình,THPT EduFlow,
HS003,Lê Văn Cường,THPT EduFlow,0912345678`

interface ImportResult {
  created: { studentCode: string; fullName: string; email: string }[]
  skipped: { studentCode: string; reason: string }[]
  parseErrors: { line: number; message: string }[]
}

interface BulkStudentImportProps {
  onImported?: () => void
}

export default function BulkStudentImport({ onImported }: BulkStudentImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const downloadTemplate = () => {
    const blob = new Blob([`\uFEFF${TEMPLATE_CSV}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mau-danh-sach-hoc-sinh.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = async (file: File) => {
    setLoading(true)
    setResult(null)
    try {
      const data = await api.admin.importStudents(file)
      setResult(data)
      if (data.created.length > 0) {
        toast.success(`Đã tạo ${data.created.length} tài khoản học sinh`)
        onImported?.()
      } else if (data.skipped.length > 0 || data.parseErrors.length > 0) {
        toast.error('Không tạo được tài khoản mới — xem chi tiết bên dưới')
      } else {
        toast.error('File không có dữ liệu hợp lệ')
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Import thất bại')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div id="admin-bulk-import" className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <Users className="h-5 w-5 text-violet-600" />
            Tạo học sinh hàng loạt
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Tải lên file CSV/TXT danh sách học sinh. Mật khẩu mặc định:{' '}
            <strong className="font-mono text-slate-700">{BULK_STUDENT_DEFAULT_PASSWORD}</strong>
          </p>
        </div>
        <button
          id="admin-bulk-import-template"
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Tải file mẫu
        </button>
      </div>

      <div className="rounded-lg border border-dashed border-violet-200 bg-violet-50/50 p-4">
        <p className="mb-2 text-xs text-slate-600">
          Cột bắt buộc: <code className="rounded bg-white px-1">ma_hs</code>,{' '}
          <code className="rounded bg-white px-1">ho_ten</code>. Tùy chọn: truong, sdt, email.
        </p>
        <label
          id="admin-bulk-import-dropzone"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-violet-300 bg-white px-4 py-6 text-center hover:bg-violet-50"
        >
          <FileUp className="h-8 w-8 text-violet-500" />
          <span className="text-sm font-medium text-slate-800">
            {loading ? 'Đang xử lý...' : 'Chọn hoặc kéo thả file CSV/TXT'}
          </span>
          <span className="text-xs text-slate-500">Đăng nhập bằng mã tài khoản hoặc email</span>
          <input
            id="admin-bulk-import-file"
            ref={inputRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            disabled={loading}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </label>
      </div>

      {result && (
        <div id="admin-bulk-import-result" className="mt-4 space-y-3 text-sm">
          {result.created.length > 0 && (
            <div id="admin-bulk-import-created" className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="font-medium text-green-800">
                Đã tạo {result.created.length} tài khoản (mật khẩu: {BULK_STUDENT_DEFAULT_PASSWORD})
              </p>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-green-900">
                {result.created.map((s) => (
                  <li key={s.studentCode} id={`admin-bulk-import-created-${s.studentCode}`} className="font-mono text-xs">
                    {s.studentCode} — {s.fullName} — {s.email}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.skipped.length > 0 && (
            <div id="admin-bulk-import-skipped" className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="font-medium text-amber-800">Bỏ qua {result.skipped.length} dòng</p>
              <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-amber-900">
                {result.skipped.map((s) => (
                  <li key={`${s.studentCode}-${s.reason}`} className="text-xs">
                    {s.studentCode}: {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.parseErrors.length > 0 && (
            <div id="admin-bulk-import-errors" className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="font-medium text-red-800">Lỗi đọc file</p>
              <ul className="mt-2 space-y-1 text-red-900">
                {result.parseErrors.map((e, i) => (
                  <li key={`${e.line}-${i}`} className="text-xs">
                    Dòng {e.line}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
