'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  EMPTY_STAFF_ACCOUNT_FORM,
  validateStaffAccountForm,
  type StaffAccountFormData,
  type StaffAccountResponse,
} from '@/lib/admin/staff/adminStaffApi'

type AdminStaffCreateModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: StaffAccountFormData) => Promise<StaffAccountResponse>
}

const inputClass =
  'h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

const labelClass =
  'mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant'

export default function AdminStaffCreateModal({ open, onClose, onSubmit }: AdminStaffCreateModalProps) {
  const [form, setForm] = useState<StaffAccountFormData>(EMPTY_STAFF_ACCOUNT_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof StaffAccountFormData, string>>>({})
  const [createdStaff, setCreatedStaff] = useState<StaffAccountResponse | null>(null)
  const [serverError, setServerError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    setForm(EMPTY_STAFF_ACCOUNT_FORM)
    setErrors({})
    setCreatedStaff(null)
    setServerError('')
  }, [open])

  if (!open) return null

  const set = (patch: Partial<StaffAccountFormData>) => setForm((currentForm) => ({ ...currentForm, ...patch }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const validationErrors = validateStaffAccountForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setIsSaving(true)
    setServerError('')

    try {
      const result = await onSubmit(form)
      setCreatedStaff(result)
      setForm({ ...EMPTY_STAFF_ACCOUNT_FORM, initialPassword: result.initialPassword || '' })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Khong the tao tai khoan staff.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Dong form tao staff"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-create-title"
          className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-outline-variant bg-white shadow-[var(--shadow-elevated)] sm:rounded-3xl"
        >
          <header className="relative overflow-hidden border-b border-outline-variant bg-gradient-to-r from-brand-greenDark to-brand-greenLight px-6 py-5 text-white">
            <p className="font-display text-[10px] font-medium uppercase tracking-[0.15em] text-brand-orange">
              Tao staff
            </p>
            <h2 id="staff-create-title" className="font-display text-xl font-bold">
              Tao tai khoan nhan vien
            </h2>
            <p className="mt-1 text-xs text-inverse-on-surface/80">
              Tai khoan se duoc tao voi role STAFF va co the dang nhap bang mat khau ban dau.
            </p>
          </header>

          <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <label className="block">
                <span className={labelClass}>
                  Ho ten <span className="text-error">*</span>
                </span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => set({ fullName: event.target.value })}
                  className={inputClass}
                  placeholder="VD: Nguyen Van A"
                />
                {errors.fullName && <p className="mt-1 text-xs text-error">{errors.fullName}</p>}
              </label>

              <label className="block">
                <span className={labelClass}>
                  Email <span className="text-error">*</span>
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => set({ email: event.target.value })}
                  className={inputClass}
                  placeholder="staff@example.com"
                />
                {errors.email && <p className="mt-1 text-xs text-error">{errors.email}</p>}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>So dien thoai</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => set({ phone: event.target.value })}
                    className={inputClass}
                    placeholder="0901234567"
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Ngay sinh</span>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(event) => set({ dateOfBirth: event.target.value })}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block">
                <span className={labelClass}>Mat khau ban dau</span>
                <input
                  type="text"
                  value={form.initialPassword}
                  onChange={(event) => set({ initialPassword: event.target.value })}
                  className={inputClass}
                  placeholder="De trong de backend dung mac dinh 123123"
                />
                {errors.initialPassword && <p className="mt-1 text-xs text-error">{errors.initialPassword}</p>}
              </label>

              {createdStaff && (
                <div className="rounded-xl border border-secondary-container/40 bg-secondary-container/15 px-3 py-3 text-sm text-on-surface">
                  <p className="font-display font-bold text-secondary">Da tao staff #{createdStaff.staffId}</p>
                  <p className="mt-1">Email: {createdStaff.email}</p>
                  <p>Mat khau ban dau: {createdStaff.initialPassword || 'Khong co trong response'}</p>
                </div>
              )}

              {serverError && (
                <p className="rounded-xl border border-error/30 bg-error-container/30 px-3 py-2.5 text-xs text-error">
                  {serverError}
                </p>
              )}
            </div>

            <footer className="flex justify-end gap-2 border-t border-outline-variant bg-surface-container-low/40 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-xl border border-outline px-5 py-2.5 font-display text-sm font-medium text-on-surface-variant hover:bg-white disabled:opacity-50"
              >
                Dong
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-medium text-white shadow-md shadow-brand-orange/20 hover:bg-brand-orangeHover disabled:opacity-50"
              >
                {isSaving ? 'Dang tao...' : 'Tao staff'}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </>
  )
}
