'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { validateRoomForm } from '@/lib/admin/rooms/adminRoomApi'
import type { RoomFormData, RoomFormErrors } from '@/lib/admin/rooms/types'
import {
  roomCategoryLabels,
  roomCategoryOptions,
  roomStatusLabels,
  roomStatusOptions,
} from '@/lib/admin/rooms/types'

type RoomFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialData: RoomFormData
  onClose: () => void
  onSubmit: (data: RoomFormData) => Promise<void>
}

const inputClass =
  'h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

const labelClass =
  'mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant'

export default function RoomFormModal({
  open,
  mode,
  initialData,
  onClose,
  onSubmit,
}: RoomFormModalProps) {
  const [form, setForm] = useState<RoomFormData>(initialData)
  const [errors, setErrors] = useState<RoomFormErrors>({})
  const [serverError, setServerError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(initialData)
    setErrors({})
    setServerError('')
    setIsSaving(false)
  }, [open, initialData])

  if (!open) return null

  const set = (patch: Partial<RoomFormData>) => setForm((current) => ({ ...current, ...patch }))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationErrors = validateRoomForm(form)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setServerError('')
    setIsSaving(true)

    try {
      await onSubmit(form)
      onClose()
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Không thể lưu phòng tập.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Đóng form phòng tập"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="room-form-title"
          className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-outline-variant bg-white shadow-[var(--shadow-elevated)] sm:rounded-3xl"
        >
          <header className="relative overflow-hidden border-b border-outline-variant bg-gradient-to-r from-brand-greenDark to-brand-greenLight px-6 py-5 text-white">
            <p className="font-display text-[10px] font-medium uppercase tracking-[0.15em] text-brand-orange">
              {mode === 'create' ? 'Thêm phòng' : 'Chỉnh sửa phòng'}
            </p>
            <h2 id="room-form-title" className="font-display text-xl font-bold">
              {mode === 'create' ? 'Thêm phòng tập mới' : 'Cập nhật phòng tập'}
            </h2>
            <p className="mt-1 text-xs text-inverse-on-surface/80">
              Quản lý thông tin vận hành, giá thuê và thiết bị trong từng phòng.
            </p>
          </header>

          <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>
                    Tên phòng <span className="text-error">*</span>
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => set({ name: event.target.value })}
                    className={inputClass}
                    placeholder="VD: Studio A1"
                    autoFocus
                  />
                  {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
                </label>

                <label className="block">
                  <span className={labelClass}>
                    Mã phòng <span className="text-error">*</span>
                  </span>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(event) => set({ code: event.target.value })}
                    className={inputClass}
                    placeholder="VD: STD-A1"
                  />
                  {errors.code && <p className="mt-1 text-xs text-error">{errors.code}</p>}
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>
                    Hạng phòng <span className="text-error">*</span>
                  </span>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      set({ category: event.target.value as RoomFormData['category'] })
                    }
                    className={inputClass}
                  >
                    {roomCategoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {roomCategoryLabels[category]}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-error">{errors.category}</p>}
                </label>

                <label className="block">
                  <span className={labelClass}>
                    Trạng thái <span className="text-error">*</span>
                  </span>
                  <select
                    value={form.status}
                    onChange={(event) => set({ status: event.target.value as RoomFormData['status'] })}
                    className={inputClass}
                  >
                    {roomStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {roomStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                  {errors.status && <p className="mt-1 text-xs text-error">{errors.status}</p>}
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>
                    Sức chứa <span className="text-error">*</span>
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    step={1}
                    value={form.capacity}
                    onChange={(event) => set({ capacity: parseInt(event.target.value, 10) || 0 })}
                    className={inputClass}
                  />
                  {errors.capacity && <p className="mt-1 text-xs text-error">{errors.capacity}</p>}
                </label>

                <label className="block">
                  <span className={labelClass}>
                    Giá/giờ (VND) <span className="text-error">*</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={form.pricePerHour}
                    onChange={(event) => set({ pricePerHour: parseFloat(event.target.value) || 0 })}
                    className={inputClass}
                  />
                  {errors.pricePerHour && (
                    <p className="mt-1 text-xs text-error">{errors.pricePerHour}</p>
                  )}
                </label>
              </div>

              <label className="block">
                <span className={labelClass}>Thiết bị trong phòng</span>
                <textarea
                  value={form.equipments}
                  onChange={(event) => set({ equipments: event.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-outline bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15"
                  placeholder="Nhập mỗi thiết bị một dòng hoặc cách nhau bằng dấu phẩy"
                />
              </label>

              <label className="block">
                <span className={labelClass}>Mô tả</span>
                <textarea
                  value={form.description}
                  onChange={(event) => set({ description: event.target.value })}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl border border-outline bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15"
                  placeholder="Mô tả ngắn về phòng tập..."
                />
                <p className="mt-1 text-right text-[10px] text-on-surface-variant">
                  {form.description.length}/500
                </p>
                {errors.description && <p className="mt-1 text-xs text-error">{errors.description}</p>}
              </label>

              <label className="block">
                <span className={labelClass}>URL hình ảnh</span>
                <input
                  type="text"
                  value={form.image}
                  onChange={(event) => set({ image: event.target.value })}
                  className={inputClass}
                  placeholder="https://... hoặc /images/..."
                />
                {errors.image && <p className="mt-1 text-xs text-error">{errors.image}</p>}
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
                {isSaving ? 'Đang lưu...' : 'Lưu phòng'}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </>
  )
}
