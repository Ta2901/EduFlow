'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-8 sm:px-6">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <motion.div initial={false} className="text-center">
          <Link href="/" className="flex justify-center">
            <div className="flex items-center">
              <BookOpen className="h-12 w-12 text-primary-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">EduFlow</span>
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Đăng nhập</h2>
          <p className="mt-2 text-sm text-gray-600">
            Nhập tài khoản và mật khẩu — hệ thống tự chuyển đến Admin, giáo viên hoặc học sinh
          </p>
        </motion.div>

        <LoginForm />
      </div>
    </div>
  )
}
