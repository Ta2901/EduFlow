const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateClassCode(length = 6): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return code
}

export function generateUniqueClassCode(existingCodes: string[]): string {
  let code = generateClassCode()
  let attempts = 0
  while (existingCodes.includes(code) && attempts < 50) {
    code = generateClassCode()
    attempts++
  }
  return code
}
