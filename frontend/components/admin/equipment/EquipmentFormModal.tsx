'use client'

import { useEffect, useState } from 'react'
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_OPTIONS,
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_TYPE_OPTIONS,
} from '@/lib/admin/equipment/equipmentLabels'
import { validateEquipmentForm } from '@/lib/admin/equipment/adminEquipmentApi'
import type { EquipmentFormData, EquipmentRoomOption } from '@/lib/admin/equipment/types'

type EquipmentFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialData: EquipmentFormData
  rooms: EquipmentRoomOption[]
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
  rooms,
  onClose,
  onSubmit,
}: EquipmentFormModalProps) {
  const [form, setForm] = useState<EquipmentFormData>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof EquipmentFormData, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (!open) return

    setForm(initialData)
    setErrors({})
    setServerError('')
  }, [initialData, open])

  if (!open) return null

  const set = (patch: Partial<EquipmentFormData>) => setForm((currentForm) => ({ ...currentForm, ...patch }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

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
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Khong the luu thiet bi.')
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
          aria-labelledby="equipment-form-title"
          className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-outline-variant bg-white shadow-[var(--shadow-elevated)] sm:rounded-3xl"
        >
          <header className="relative overflow-hidden border-b border-outline-variant bg-gradient-to-r from-brand-greenDark to-brand-greenLight px-6 py-5 text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-orange/20 blur-2xl"
            />
            <p className="relative font-display text-[10px] font-medium uppercase tracking-[0.15em] text-brand-orange">
              {mode === 'create' ? 'Them moi' : 'Chinh sua'}
            </p>
            <h2 id="equipment-form-title" className="relative font-display text-xl font-bold">
              {mode === 'create' ? 'Them thiet bi moi' : 'Cap nhat thiet bi'}
            </h2>
            <p className="relative mt-1 text-xs text-inverse-on-surface/80">
              Dong bo truc tiep voi API quan ly thiet bi cua backend.
            </p>
          </header>

          <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <label className="block">
                <span className={labelClass}>
                  Phong <span className="text-error">*</span>
                </span>
                <select
                  value={form.roomId ?? ''}
                  onChange={(event) => set({ roomId: Number(event.target.value) || null })}
                  className={inputClass}
                >
                  <option value="">Chon phong</option>
                  {rooms.map((room) => (
                    <option key={room.roomId} value={room.roomId}>
                      {room.roomName}
                    </option>
                  ))}
                </select>
                {errors.roomId && <p className="mt-1 text-xs text-error">{errors.roomId}</p>}
              </label>

              <label className="block">
                <span className={labelClass}>
                  Ten thiet bi <span className="text-error">*</span>
                </span>
                <input
                  type="text"
                  value={form.equipmentName}
                  onChange={(event) => set({ equipmentName: event.target.value })}
                  className={inputClass}
                  placeholder="VD: Marshall MG30"
                />
                {errors.equipmentName && <p className="mt-1 text-xs text-error">{errors.equipmentName}</p>}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>
                    Loai thiet bi <span className="text-error">*</span>
                  </span>
                  <select
                    value={form.equipmentType}
                    onChange={(event) => set({ equipmentType: event.target.value as EquipmentFormData['equipmentType'] })}
                    className={inputClass}
                  >
                    {EQUIPMENT_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {EQUIPMENT_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={labelClass}>
                    Trang thai <span className="text-error">*</span>
                  </span>
                  <select
                    value={form.status}
                    onChange={(event) => set({ status: event.target.value as EquipmentFormData['status'] })}
                    className={inputClass}
                  >
                    {EQUIPMENT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {EQUIPMENT_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className={labelClass}>Ghi chu</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => set({ notes: event.target.value })}
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-xl border border-outline bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15"
                  placeholder="Mo ta nhanh tinh trang hoac cach su dung..."
                />
                <p className="mt-1 text-right text-[10px] text-on-surface-variant">{form.notes.length}/1000</p>
                {errors.notes && <p className="mt-1 text-xs text-error">{errors.notes}</p>}
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
                Huy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-medium text-white shadow-md shadow-brand-orange/20 hover:bg-brand-orangeHover disabled:opacity-50"
              >
                {isSaving ? 'Dang luu...' : 'Luu thiet bi'}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </>
  )
}
