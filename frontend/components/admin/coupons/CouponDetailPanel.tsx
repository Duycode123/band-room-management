'use client'

import { useState } from 'react'
import {
  COUPON_TYPE_LABELS,
  formatCouponDate,
  formatCouponMoney,
  formatCouponValue,
} from '@/lib/admin/coupons/adminCouponApi'
import type { AdminCoupon } from '@/lib/admin/coupons/types'
import { CouponLifecycleBadge, CouponTypeBadge } from './CouponBadges'

type CouponDetailPanelProps = {
  coupon: AdminCoupon | null
  onClose: () => void
  onEdit: (coupon: AdminCoupon) => void
  onDelete: (id: number) => Promise<void>
}

export default function CouponDetailPanel({
  coupon,
  onClose,
  onEdit,
  onDelete,
}: CouponDetailPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState('')

  if (!coupon) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    setMessage('')

    try {
      await onDelete(coupon.couponId)
      onClose()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Khong the xoa coupon.')
      setConfirmDelete(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Dong chi tiet"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-inverse-surface/50 backdrop-blur-sm"
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-outline-variant bg-white shadow-[var(--shadow-elevated)] sm:max-w-lg">
        <div className="shrink-0 border-b border-outline-variant bg-gradient-to-br from-brand-greenDark to-brand-greenLight px-5 pb-5 pt-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 font-display text-xl font-bold text-brand-orange">
                %
              </div>
              <div className="min-w-0">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">
                  CP-{String(coupon.couponId).padStart(4, '0')}
                </p>
                <h2 className="truncate font-display text-xl font-bold leading-tight">
                  {coupon.code}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-inverse-on-surface hover:bg-white/20"
            >
              X
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CouponTypeBadge type={coupon.discountType} />
            <CouponLifecycleBadge lifecycle={coupon.lifecycle} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Ma coupon" value={coupon.code} />
            <MetricCard label="Loai" value={COUPON_TYPE_LABELS[coupon.discountType]} />
            <MetricCard label="Gia tri" value={formatCouponValue(coupon)} />
            <MetricCard label="Don toi thieu" value={formatCouponMoney(coupon.minOrderValue)} />
            <MetricCard label="Ngay het han" value={formatCouponDate(coupon.expiresAt)} />
            <MetricCard label="ID backend" value={String(coupon.couponId)} />
          </div>

          <section className="mt-5 rounded-2xl border border-outline-variant bg-surface-container-low/50 p-4">
            <h3 className="font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Mapping BE
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              Form nay gui truc tiep cac field BE dang nhan: code, type, value, minOrderValue va expiresAt.
            </p>
          </section>

          {message && (
            <p className="mt-4 rounded-2xl border border-error/30 bg-error-container/30 px-4 py-3 text-xs text-error">
              {message}
            </p>
          )}
        </div>

        <footer className="shrink-0 space-y-2 border-t border-outline-variant bg-surface-container-low/50 px-5 py-4">
          {confirmDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant">
                Xac nhan xoa <strong className="text-on-surface">{coupon.code}</strong>?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl border border-outline py-2.5 font-display text-sm font-medium text-on-surface-variant hover:bg-white disabled:opacity-50"
                >
                  Huy
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl bg-error py-2.5 font-display text-sm font-medium text-white hover:bg-error/90 disabled:opacity-50"
                >
                  {isDeleting ? 'Dang xoa...' : 'Xoa coupon'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(coupon)}
                className="flex-1 rounded-xl bg-brand-orange py-2.5 font-display text-sm font-medium text-white shadow-md shadow-brand-orange/20 hover:bg-brand-orangeHover"
              >
                Chinh sua
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex-1 rounded-xl border border-error/30 py-2.5 font-display text-sm font-medium text-error hover:bg-error-container/30"
              >
                Xoa
              </button>
            </div>
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
