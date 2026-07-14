import { createHash, randomInt } from 'crypto'
import { prisma } from '../prisma'
import { logActivity } from './activityLog'
import { hashPassword } from './password'
import { revokeAllQuickLoginsForUser } from './quickLogin'

export type ResetChannel = 'email' | 'phone'

const OTP_TTL_MS = 10 * 60 * 1000
const OTP_LENGTH = 6

function hashOtp(code: string) {
  return createHash('sha256').update(code).digest('hex')
}

export function normalizePhone(input: string) {
  return input.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
}

export function normalizeEmail(input: string) {
  return input.trim().toLowerCase()
}

export function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  if (!domain) return '***'
  const visible = name.slice(0, Math.min(2, name.length))
  return `${visible}***@${domain}`
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '****'
  return `***${digits.slice(-4)}`
}

function generateOtp() {
  const max = 10 ** OTP_LENGTH
  return String(randomInt(0, max)).padStart(OTP_LENGTH, '0')
}

async function findUserByLoginId(loginId: string) {
  const id = loginId.trim()
  return prisma.user.findFirst({
    where: {
      OR: [{ email: id.toLowerCase() }, { memberCode: id }],
    },
  })
}

async function deliverOtp(channel: ResetChannel, target: string, code: string, fullName: string) {
  console.info(`[password-reset] OTP for ${channel}:${target} → ${code}`)

  if (channel === 'email') {
    const resendKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM || process.env.SMTP_FROM || 'EduFlow <onboarding@resend.dev>'
    if (resendKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [target],
            subject: 'Mã khôi phục mật khẩu EduFlow',
            text: `Xin chào ${fullName},\n\nMã OTP của bạn là: ${code}\nMã có hiệu lực trong 10 phút.\n\nNếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.`,
          }),
        })
        if (res.ok) return { delivered: true as const, method: 'resend' as const }
        console.error('[password-reset] Resend failed', await res.text())
      } catch (err) {
        console.error('[password-reset] Resend error', err)
      }
    }
    return { delivered: false as const, method: 'log' as const }
  }

  // Phone / SMS — optional Twilio
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER
  if (sid && token && from) {
    try {
      const auth = Buffer.from(`${sid}:${token}`).toString('base64')
      const body = new URLSearchParams({
        To: target,
        From: from,
        Body: `EduFlow: Ma OTP dat lai mat khau la ${code}. Hieu luc 10 phut.`,
      })
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        }
      )
      if (res.ok) return { delivered: true as const, method: 'twilio' as const }
      console.error('[password-reset] Twilio failed', await res.text())
    } catch (err) {
      console.error('[password-reset] Twilio error', err)
    }
  }
  return { delivered: false as const, method: 'log' as const }
}

function showDevOtp() {
  return (
    process.env.AUTH_SHOW_DEV_OTP === 'true' ||
    process.env.NODE_ENV !== 'production'
  )
}

export async function requestPasswordReset(input: {
  loginId: string
  channel: ResetChannel
  contact: string
}) {
  const loginId = input.loginId.trim()
  const channel = input.channel
  const contactRaw = input.contact.trim()

  if (!loginId || !contactRaw) {
    throw new Error('Vui lòng nhập tài khoản và thông tin khôi phục')
  }
  if (channel !== 'email' && channel !== 'phone') {
    throw new Error('Phương thức xác thực không hợp lệ')
  }

  const user = await findUserByLoginId(loginId)
  // Generic message to avoid account enumeration
  const genericOk = {
    ok: true as const,
    message:
      'Nếu thông tin khớp, mã OTP đã được gửi. Vui lòng kiểm tra email hoặc tin nhắn.',
  }

  if (!user || user.role === 'admin') {
    return { ...genericOk, requestId: null as string | null, maskedTarget: null as string | null }
  }

  if (channel === 'email') {
    const contact = normalizeEmail(contactRaw)
    const recovery = user.recoveryEmail ? normalizeEmail(user.recoveryEmail) : null
    const loginEmail = normalizeEmail(user.email)
    const matched = contact === recovery || contact === loginEmail
    if (!matched) {
      return { ...genericOk, requestId: null, maskedTarget: null }
    }

    const code = generateOtp()
    const row = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        channel: 'email',
        target: contact,
        codeHash: hashOtp(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    })

    const delivery = await deliverOtp('email', contact, code, user.fullName)
    return {
      ok: true as const,
      requestId: row.id,
      maskedTarget: maskEmail(contact),
      message: delivery.delivered
        ? `Đã gửi mã OTP tới email ${maskEmail(contact)}`
        : `Đã tạo mã OTP cho email ${maskEmail(contact)}. ${
            showDevOtp()
              ? 'Chưa cấu hình SMTP — dùng mã hiển thị bên dưới (môi trường phát triển).'
              : 'Nếu không nhận được email, liên hệ quản trị viên hoặc cấu hình SMTP.'
          }`,
      devOtp: showDevOtp() ? code : undefined,
    }
  }

  const contact = normalizePhone(contactRaw)
  const userPhone = user.phone ? normalizePhone(user.phone) : ''
  if (!userPhone || contact !== userPhone) {
    return { ...genericOk, requestId: null, maskedTarget: null }
  }

  const code = generateOtp()
  const row = await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      channel: 'phone',
      target: contact,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  })

  const delivery = await deliverOtp('phone', contact, code, user.fullName)
  return {
    ok: true as const,
    requestId: row.id,
    maskedTarget: maskPhone(contact),
    message: delivery.delivered
      ? `Đã gửi mã OTP tới số ${maskPhone(contact)}`
      : `Đã tạo mã OTP cho số ${maskPhone(contact)}. ${
          showDevOtp()
            ? 'Chưa cấu hình SMS — dùng mã hiển thị bên dưới (môi trường phát triển).'
            : 'Nếu không nhận được tin nhắn, liên hệ quản trị viên.'
        }`,
    devOtp: showDevOtp() ? code : undefined,
  }
}

export async function resetPasswordWithOtp(input: {
  requestId: string
  code: string
  newPassword: string
}) {
  const requestId = input.requestId.trim()
  const code = input.code.trim()
  const newPassword = input.newPassword

  if (!requestId || !code) throw new Error('Thiếu mã xác thực')
  if (newPassword.length < 6) throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự')

  const row = await prisma.passwordResetToken.findUnique({ where: { id: requestId } })
  if (!row || row.usedAt) throw new Error('Yêu cầu không hợp lệ hoặc đã dùng')
  if (row.expiresAt.getTime() < Date.now()) throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.')

  if (row.codeHash !== hashOtp(code)) {
    throw new Error('Mã OTP không đúng')
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { password: await hashPassword(newPassword) },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ])

  void revokeAllQuickLoginsForUser(row.userId)

  await logActivity({
    userId: row.userId,
    type: 'password_change',
    title: 'Đặt lại mật khẩu',
    message: 'Bạn đã đặt lại mật khẩu qua quên mật khẩu',
    meta: { via: 'forgot_password' },
  })

  return { ok: true as const, message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập.' }
}
