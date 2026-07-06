'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminShell from '@/components/admin/AdminShell'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminToast from '@/components/admin/AdminToast'
import { IconCoupons, IconPlus } from '@/components/admin/AdminIcons'
import CouponDetailPanel from '@/components/admin/coupons/CouponDetailPanel'
import CouponFiltersBar from '@/components/admin/coupons/CouponFiltersBar'
import CouponFormModal from '@/components/admin/coupons/CouponFormModal'
import CouponTable from '@/components/admin/coupons/CouponTable'
import {
  createAdminCoupon,
  deleteAdminCoupon,
  EMPTY_COUPON_FORM,
  fetchAdminCoupons,
  toCouponFormData,
  updateAdminCoupon,
} from '@/lib/admin/coupons/adminCouponApi'
import type { AdminCoupon, CouponFilters, CouponFormData } from '@/lib/admin/coupons/types'

const DEFAULT_FILTERS: CouponFilters = {
  query: '',
  discountType: 'ALL',
  lifecycle: 'ALL',
  sortBy: 'code',
  sortOrder: 'asc',
}

type FormModalState =
  | { open: false }
  | { open: true; mode: 'create'; data: CouponFormData }
  | { open: true; mode: 'edit'; couponId: number; data: CouponFormData }

export default function AdminCouponsPage() {
  const [filters, setFilters] = useState<CouponFilters>(DEFAULT_FILTERS)
  const [coupons, setCoupons] = useState<AdminCoupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<AdminCoupon | null>(null)
  const [formModal, setFormModal] = useState<FormModalState>({ open: false })
  const [deleteTarget, setDeleteTarget] = useState<AdminCoupon | null>(null)
  const [toast, setToast] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadCoupons = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await fetchAdminCoupons(filters)
      setCoupons(data)
      setErrorMessage('')
      setSelected((currentCoupon) => {
        if (!currentCoupon) return null
        return data.find((coupon) => coupon.couponId === currentCoupon.couponId) ?? null
      })
    } catch (error) {
      setCoupons([])
      setSelected(null)
      setErrorMessage(error instanceof Error ? error.message : 'Khong the tai danh sach coupon.')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => void loadCoupons(), 200)
    return () => clearTimeout(timer)
  }, [loadCoupons])

  useEffect(() => {
    if (!toast) return

    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const stats = useMemo(() => {
    return {
      total: coupons.length,
      active: coupons.filter((coupon) => coupon.lifecycle === 'ACTIVE').length,
      noExpiry: coupons.filter((coupon) => coupon.lifecycle === 'NO_EXPIRY').length,
      expired: coupons.filter((coupon) => coupon.lifecycle === 'EXPIRED').length,
    }
  }, [coupons])

  const handleCreate = async (data: CouponFormData) => {
    await createAdminCoupon(data)
    setToast('Tao coupon thanh cong.')
    await loadCoupons()
  }

  const handleUpdate = async (data: CouponFormData) => {
    if (!formModal.open || formModal.mode !== 'edit') return

    const updated = await updateAdminCoupon(formModal.couponId, data)
    if (!updated) {
      throw new Error('Khong tim thay coupon.')
    }

    setToast('Cap nhat coupon thanh cong.')
    setSelected(updated)
    await loadCoupons()
  }

  const handleDelete = async (id: number) => {
    await deleteAdminCoupon(id)
    setToast('Xoa coupon thanh cong.')
    setSelected((currentCoupon) => (currentCoupon?.couponId === id ? null : currentCoupon))
    setDeleteTarget(null)
    await loadCoupons()
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminShell>
        <AdminPageHeader
          eyebrow="Coupon"
          title="Quan ly coupon"
          description="CRUD coupon admin dang map truc tiep voi backend /api/admin/coupons."
          breadcrumbs={[
            { label: 'Tong quan', href: '/admin/dashboard' },
            { label: 'Coupon' },
          ]}
          actions={
            <button
              type="button"
              onClick={() => setFormModal({ open: true, mode: 'create', data: EMPTY_COUPON_FORM })}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-medium text-white shadow-lg shadow-brand-orange/25 transition-all hover:bg-brand-orangeHover active:scale-[0.98]"
            >
              <IconPlus className="h-4 w-4" />
              Them coupon
            </button>
          }
        />

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
          <AdminToast message={toast} onDismiss={() => setToast('')} />

          {errorMessage && (
            <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">
              {errorMessage}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard
              label="Ket qua loc"
              value={stats.total}
              hint="Coupon hien thi"
              icon={<IconCoupons className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Dang hieu luc"
              value={stats.active}
              hint="Chua qua ngay het han"
              accent="secondary"
              icon={<span className="text-base">OK</span>}
            />
            <AdminStatCard
              label="Khong het han"
              value={stats.noExpiry}
              hint="expiresAt dang trong"
              accent="tertiary"
              icon={<span className="text-base">--</span>}
            />
            <AdminStatCard
              label="Da het han"
              value={stats.expired}
              hint="Can gia han hoac xoa"
              accent="primary"
              icon={<span className="text-base">!</span>}
            />
          </div>

          <CouponFiltersBar filters={filters} onChange={setFilters} resultCount={coupons.length} />

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-on-surface">Danh sach coupon</h2>
                <p className="text-xs text-on-surface-variant">
                  Backend ho tro code, type, value, minOrderValue va expiresAt.
                </p>
              </div>
              <p className="text-xs text-on-surface-variant">Chon "Chi tiet" de xem mapping</p>
            </div>

            <CouponTable
              coupons={coupons}
              isLoading={isLoading}
              selectedId={selected?.couponId ?? null}
              onSelect={setSelected}
              onEdit={(coupon) =>
                setFormModal({
                  open: true,
                  mode: 'edit',
                  couponId: coupon.couponId,
                  data: toCouponFormData(coupon),
                })
              }
              onDelete={setDeleteTarget}
            />
          </section>
        </div>

        <CouponDetailPanel
          coupon={selected}
          onClose={() => setSelected(null)}
          onEdit={(coupon) =>
            setFormModal({
              open: true,
              mode: 'edit',
              couponId: coupon.couponId,
              data: toCouponFormData(coupon),
            })
          }
          onDelete={handleDelete}
        />

        <CouponFormModal
          open={formModal.open}
          mode={formModal.open ? formModal.mode : 'create'}
          initialData={formModal.open ? formModal.data : EMPTY_COUPON_FORM}
          onClose={() => setFormModal({ open: false })}
          onSubmit={formModal.open && formModal.mode === 'edit' ? handleUpdate : handleCreate}
        />

        {deleteTarget && (
          <>
            <button
              type="button"
              aria-label="Dong xac nhan xoa"
              onClick={() => setDeleteTarget(null)}
              className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--shadow-elevated)]">
                <p className="font-display text-lg font-bold text-on-surface">Xoa coupon?</p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Xac nhan xoa <strong className="text-on-surface">{deleteTarget.code}</strong>. Backend se tu
                  choi neu coupon da duoc ap dung cho booking.
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 rounded-xl border border-outline py-2.5 font-display text-sm font-medium text-on-surface-variant hover:bg-surface-container-low"
                  >
                    Huy
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(deleteTarget.couponId)}
                    className="flex-1 rounded-xl bg-error py-2.5 font-display text-sm font-medium text-white hover:bg-error/90"
                  >
                    Xoa coupon
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </AdminShell>
    </AuthGuard>
  )
}
