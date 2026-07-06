'use client'

import { useEffect, useState } from 'react'
import {
  COUPON_TYPE_LABELS,
  validateCouponForm,
} from '@/lib/admin/coupons/adminCouponApi'
import type { CouponFormData } from '@/lib/admin/coupons/types'

type CouponFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialData: CouponFormData
  onClose: () => void
  onSubmit: (data: CouponFormData) => Promise<void>
}

const inputClass =
  'h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

const labelClass =
  'mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant'

export default function CouponFormModal({
  open,
  mode,
  initialData,
  onClose,
  onSubmit,
}: CouponFormModalProps) {
  const [form, setForm] = useState<CouponFormData>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof CouponFormData, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (!open) return

    setForm(initialData)
    setErrors({})
    setServerError('')
  }, [initialData, open])

  if (!open) return null

  const set = (patch: Partial<CouponFormData>) => setForm((currentForm) => ({ ...currentForm, ...patch }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const validationErrors = validateCouponForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setIsSaving(true)
    setServerError('')

    try {
      await onSubmit(form)
      onClose()
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Khong the luu coupon.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Dong form"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-form-title"
          className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-outline-variant bg-white shadow-[var(--shadow-elevated)] sm:rounded-3xl"
        >
          <header className="border-b border-outline-variant bg-gradient-to-r from-brand-greenDark to-brand-greenLight px-6 py-5 text-white">
            <p className="font-display text-[10px] font-medium uppercase tracking-[0.15em] text-brand-orange">
              {mode === 'create' ? 'Them moi' : 'Chinh sua'}
            </p>
            <h2 id="coupon-form-title" className="font-display text-xl font-bold">
              {mode === 'create' ? 'Tao coupon moi' : 'Cap nhat coupon'}
            </h2>
            <p className="mt-1 text-xs text-inverse-on-surface/80">
              Dong bo truc tiep voi API /api/admin/coupons cua backend.
            </p>
          </header>

          <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <label className="block">
                <span className={labelClass}>
                  Ma coupon <span className="text-error">*</span>
                </span>
                <input
                  type="text"
                  value={form.code}
                  onChange={(event) => set({ code: event.target.value.toUpperCase() })}
                  className={inputClass}
                  placeholder="VD: SUMMER10"
                />
                {errors.code && <p className="mt-1 text-xs text-error">{errors.code}</p>}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>
                    Loai coupon <span className="text-error">*</span>
                  </span>
                  <select
                    value={form.discountType}
                    onChange={(event) =>
                      set({ discountType: event.target.value as CouponFormData['discountType'] })
                    }
                    className={inputClass}
                  >
                    <option value="PERCENTAGE">{COUPON_TYPE_LABELS.PERCENTAGE}</option>
                    <option value="FIXED_AMOUNT">{COUPON_TYPE_LABELS.FIXED_AMOUNT}</option>
                  </select>
                </label>

                <label className="block">
                  <span className={labelClass}>
                    Gia tri <span className="text-error">*</span>
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step={form.discountType === 'PERCENTAGE' ? '0.01' : '1000'}
                    value={form.discountValue}
                    onChange={(event) => set({ discountValue: event.target.value })}
                    className={inputClass}
                    placeholder={form.discountType === 'PERCENTAGE' ? '10' : '50000'}
                  />
                  {errors.discountValue && <p className="mt-1 text-xs text-error">{errors.discountValue}</p>}
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Don toi thieu</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.minOrderValue}
                    onChange={(event) => set({ minOrderValue: event.target.value })}
                    className={inputClass}
                    placeholder="Bo trong neu khong yeu cau"
                  />
                  {errors.minOrderValue && <p className="mt-1 text-xs text-error">{errors.minOrderValue}</p>}
                </label>

                <label className="block">
                  <span className={labelClass}>Ngay het han</span>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(event) => set({ expiresAt: event.target.value })}
                    className={inputClass}
                  />
                </label>
              </div>

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
                Huy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-medium text-white shadow-md shadow-brand-orange/20 hover:bg-brand-orangeHover disabled:opacity-50"
              >
                {isSaving ? 'Dang luu...' : 'Luu coupon'}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </>
  )
}
