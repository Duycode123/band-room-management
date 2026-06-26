'use client'

type AdminToastProps = {
  message: string
  onDismiss?: () => void
}

export default function AdminToast({ message, onDismiss }: AdminToastProps) {
  if (!message) return null

  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-2xl border border-secondary-container/40 bg-gradient-to-r from-secondary-container/20 to-white px-4 py-3 shadow-[var(--shadow-card)]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container/40 text-secondary">
        ✓
      </span>
      <p className="flex-1 text-sm font-medium text-secondary">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-on-surface-variant hover:text-on-surface"
          aria-label="Đóng"
        >
          ✕
        </button>
      )}
    </div>
  )
}
