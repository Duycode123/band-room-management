import { useState } from 'react'
import {
  formatStaffDate,
  type StaffAccountResponse,
} from '@/lib/admin/staff/adminStaffApi'
import { StaffStatusBadge, StaffVerificationBadge } from './AdminStaffBadges'

type AdminStaffDetailPanelProps = {
  staff: StaffAccountResponse | null
  onClose: () => void
  onDisable: (staff: StaffAccountResponse) => Promise<void>
}

export default function AdminStaffDetailPanel({ staff, onClose, onDisable }: AdminStaffDetailPanelProps) {
  const [confirmDisable, setConfirmDisable] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  if (!staff) return null

  const handleDisable = async () => {
    setIsSaving(true)
    setMessage('')

    try {
      await onDisable(staff)
      setConfirmDisable(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Khong the vo hieu hoa staff.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close staff detail"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-inverse-surface/50 backdrop-blur-sm"
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-outline-variant bg-white shadow-[var(--shadow-elevated)] sm:max-w-lg">
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-brand-greenDark to-brand-greenLight px-5 pb-5 pt-5 text-white">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-orange/20 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">
                ST-{staff.staffId}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold leading-tight">{staff.fullName}</h2>
              <p className="mt-1 break-all text-sm text-inverse-on-surface/80">{staff.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StaffStatusBadge staff={staff} />
                <StaffVerificationBadge verified={staff.emailVerified} />
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 font-display text-sm font-bold text-white hover:bg-white/20"
            >
              X
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Account ID" value={String(staff.accountId)} />
            <MetricCard label="Role" value={staff.role} />
            <MetricCard label="Phone" value={staff.phone || 'Chua co'} />
            <MetricCard label="Date of birth" value={formatStaffDate(staff.dateOfBirth)} />
            <MetricCard label="Created" value={formatStaffDate(staff.createdAt)} />
            <MetricCard label="Login state" value={staff.enabled ? 'Can sign in' : 'Blocked'} />
          </div>

          {staff.initialPassword && (
            <section className="mt-5 rounded-2xl border border-secondary-container/40 bg-secondary-container/15 p-4">
              <h3 className="font-display text-[10px] font-semibold uppercase tracking-wider text-secondary">
                Initial password
              </h3>
              <p className="mt-2 font-display text-lg font-bold text-on-surface">{staff.initialPassword}</p>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                Backend returns this only for admin handoff. Forced password change is still future scope.
              </p>
            </section>
          )}

          {message && (
            <p className="mt-4 rounded-2xl border border-error/30 bg-error-container/30 px-4 py-3 text-xs text-error">
              {message}
            </p>
          )}
        </div>

        <footer className="shrink-0 space-y-2 border-t border-outline-variant bg-surface-container-low/50 px-5 py-4">
          {confirmDisable ? (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant">
                Disable <strong className="text-on-surface">{staff.fullName}</strong>? This keeps history but blocks login.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDisable(false)}
                  disabled={isSaving}
                  className="flex-1 rounded-xl border border-outline py-2.5 font-display text-sm font-medium text-on-surface-variant hover:bg-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDisable()}
                  disabled={isSaving}
                  className="flex-1 rounded-xl bg-error py-2.5 font-display text-sm font-medium text-white hover:bg-error/90 disabled:opacity-50"
                >
                  {isSaving ? 'Disabling...' : 'Disable'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDisable(true)}
              disabled={!staff.enabled}
              className="w-full rounded-xl border border-error/30 py-2.5 font-display text-sm font-medium text-error hover:bg-error-container/30 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {staff.enabled ? 'Disable account' : 'Account disabled'}
            </button>
          )}
        </footer>
      </aside>
    </>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-white p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 break-words font-display text-base font-bold text-on-surface">{value}</p>
    </div>
  )
}
