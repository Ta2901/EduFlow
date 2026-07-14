'use client'

import { MessageCircle } from 'lucide-react'

interface ChatHeaderButtonProps {
  id?: string
  active?: boolean
  onClick: () => void
}

export default function ChatHeaderButton({
  id = 'chat-header-btn',
  active,
  onClick,
}: ChatHeaderButtonProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`relative rounded-lg p-2 transition-colors ${
        active
          ? 'bg-primary-100 text-primary-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-primary-600'
      }`}
      aria-label="Chat lớp"
      title="Chat lớp"
    >
      <MessageCircle className="h-5 w-5" />
    </button>
  )
}
