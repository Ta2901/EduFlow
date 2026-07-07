'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: Record<string, unknown>
    ) => JitsiApi
  }
}

interface JitsiApi {
  dispose: () => void
  executeCommand: (command: string, ...args: unknown[]) => void
}

interface JitsiMeetingProps {
  roomCode: string
  displayName: string
  isTeacher: boolean
}

const JITSI_DOMAIN = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'

export default function JitsiMeeting({ roomCode, displayName, isTeacher }: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<JitsiApi | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const roomName = `EduFlow_${roomCode}`.toLowerCase().replace(/[^a-z0-9]/g, '')

    const init = () => {
      if (!window.JitsiMeetExternalAPI || !containerRef.current) return

      apiRef.current?.dispose()
      containerRef.current.innerHTML = ''

      apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        userInfo: { displayName },
        configOverwrite: {
          startWithAudioMuted: !isTeacher,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'chat',
            'raisehand',
            'videoquality',
            'filmstrip',
            'tileview',
            'settings',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Học sinh',
          MOBILE_APP_PROMO: false,
        },
      })
    }

    if (window.JitsiMeetExternalAPI) {
      init()
    } else {
      const script = document.createElement('script')
      script.src = `https://${JITSI_DOMAIN}/external_api.js`
      script.async = true
      script.onload = init
      document.body.appendChild(script)
    }

    return () => {
      apiRef.current?.dispose()
      apiRef.current = null
    }
  }, [roomCode, displayName, isTeacher])

  return (
    <div className="relative h-full min-h-[360px] w-full overflow-hidden rounded-lg border bg-gray-900">
      <div ref={containerRef} className="h-full w-full min-h-[360px]" />
      <p className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white">
        Video call · Chia sẻ màn hình qua nút Desktop trên thanh công cụ
      </p>
    </div>
  )
}
