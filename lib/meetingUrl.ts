const MAX_LEN = 2000

export function normalizeMeetingUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.length > MAX_LEN) {
    throw new Error('Link họp quá dài')
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let parsed: URL
  try {
    parsed = new URL(withProtocol)
  } catch {
    throw new Error('Link họp không hợp lệ')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Link họp phải bắt đầu bằng https://')
  }
  if (!parsed.hostname.includes('.')) {
    throw new Error('Link họp không hợp lệ')
  }

  return parsed.toString()
}

export function meetingProviderLabel(url?: string | null): string {
  if (!url) return ''
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host.includes('zoom.')) return 'Zoom'
    if (host.includes('meet.google.')) return 'Google Meet'
    if (host.includes('teams.microsoft.') || host.includes('teams.live.')) return 'Microsoft Teams'
    if (host.includes('webex.')) return 'Webex'
  } catch {
    return 'Họp trực tuyến'
  }
  return 'Họp trực tuyến'
}
