'use client'

import { useEffect, useState } from 'react'
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_OPTIONS,
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_TYPE_OPTIONS,
} from '@/lib/admin/equipment/equipmentLabels'
import { validateEquipmentForm } from '@/lib/admin/equipment/adminEquipmentApi'
import type { EquipmentFormData } from '@/lib/admin/equipment/types'

type EquipmentFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialData: EquipmentFormData
  onClose: () => void
  onSubmit: (data: EquipmentFormData) => Promise<void>
}

const inputClass =
  'h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

const labelClass =
  'mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant'

export default function EquipmentFormModal({
  open,
  mode,
  initialData,
  onClose,
  onSubmit,
}: EquipmentFormModalProps) {
  const [form, setForm] = useState<EquipmentFormData>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof EquipmentFormData, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(initialData)
      setErrors({})
      setServerError('')
    }
  }, [open, initialData])

  if (!open) return null

  const set = (patch: Partial<EquipmentFormData>) => setForm((f) => ({ ...f, ...patch }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateEquipmentForm(form)
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
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Không thể lưu thiết bị.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Đóng form"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="equipment-form-title"
          className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-outline-variant bg-white shadow-[var(--shadow-elevated)] sm:rounded-3xl"
        >
          <header className="relative overflow-hidden border-b border-outline-variant bg-gradient-to-r from-brand-greenDark to-brand-greenLight px-6 py-5 text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-orange/20 blur-2xl"
            />
            <p className="relative font-display text-[10px] font-medium uppercase tracking-[0.15em] text-brand-orange">
              {mode === 'create' ? 'Thêm mới' : 'Chỉnh sửa'}
            </p>
            <h2 id="equipment-form-title" className="relative font-display text-xl font-bold">
              {mode === 'create' ? 'Thêm thiết bị mới' : 'Cập nhật thiết bị'}
            </h2>
            <p className="relative mt-1 text-xs text-inverse-on-surface/80">
              Điền thông tin thiết bị cho thuê trong hệ thống BandSpace.
            </p>
          </header>

          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <label className="block">
                <span className={labelClass}>
                  Tên thiết bị <span className="text-error">*</span>
                </span>
                <input
                  type="text"
                  value={form.equipmentName}
                  onChange={(e) => set({ equipmentName: e.target.value })}
                  className={inputClass}
                  placeholder="VD: Marshall MG30 Guitar Amp"
                />
                {errors.equipmentName && (
                  <p className="mt-1 text-xs text-error">{errors.equipmentName}</p>
                )}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>
                    Loại thiết bị <span className="text-error">*</span>
                  </span>
                  <select
                    value={form.equipmentType}
                    onChange={(e) =>
                      set({ equipmentType: e.target.value as EquipmentFormData['equipmentType'] })
                    }
                    className={inputClass}
                  >
                    {EQUIPMENT_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {EQUIPMENT_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={labelClass}>
                    Trạng thái <span className="text-error">*</span>
                  </span>
                  <select
                    value={form.status}
                    onChange={(e) => set({ status: e.target.value as EquipmentFormData['status'] })}
                    className={inputClass}
                  >
                    {EQUIPMENT_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {EQUIPMENT_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>
                    Số lượng <span className="text-error">*</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.quantity}
                    onChange={(e) => set({ quantity: parseInt(e.target.value, 10) || 0 })}
                    className={inputClass}
                  />
                  {errors.quantity && <p className="mt-1 text-xs text-error">{errors.quantity}</p>}
                </label>

                <label className="block">
                  <span className={labelClass}>
                    Giá thuê (VND) <span className="text-error">*</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={form.rentalPrice}
                    onChange={(e) => set({ rentalPrice: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                  />
                  {errors.rentalPrice && (
                    <p className="mt-1 text-xs text-error">{errors.rentalPrice}</p>
                  )}
                </label>
              </div>

              <label className="block">
                <span className={labelClass}>Mô tả</span>
                <textarea
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl border border-outline bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15"
                  placeholder="Mô tả ngắn về thiết bị..."
                />
                <p className="mt-1 text-right text-[10px] text-on-surface-variant">
                  {form.description.length}/500
                </p>
                {errors.description && (
                  <p className="mt-1 text-xs text-error">{errors.description}</p>
                )}
              </label>

              <label className="block">
                <span className={labelClass}>URL hình ảnh</span>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => set({ imageUrl: e.target.value })}
                  className={inputClass}
                  placeholder="https://... hoặc /images/..."
                />
                {errors.imageUrl && <p className="mt-1 text-xs text-error">{errors.imageUrl}</p>}
              </label>

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
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-medium text-white shadow-md shadow-brand-orange/20 hover:bg-brand-orangeHover disabled:opacity-50"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thiết bị'}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </>
  )
}
