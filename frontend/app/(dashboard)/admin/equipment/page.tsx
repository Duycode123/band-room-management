'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminShell from '@/components/admin/AdminShell'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminToast from '@/components/admin/AdminToast'
import { IconEquipment, IconPlus } from '@/components/admin/AdminIcons'
import EquipmentDetailPanel from '@/components/admin/equipment/EquipmentDetailPanel'
import EquipmentFiltersBar from '@/components/admin/equipment/EquipmentFiltersBar'
import EquipmentFormModal from '@/components/admin/equipment/EquipmentFormModal'
import EquipmentTable from '@/components/admin/equipment/EquipmentTable'
import {
  createAdminEquipment,
  deleteAdminEquipment,
  EMPTY_EQUIPMENT_FORM,
  fetchAdminEquipment,
  toFormData,
  updateAdminEquipment,
} from '@/lib/admin/equipment/adminEquipmentApi'
import type { AdminEquipment, EquipmentFilters, EquipmentFormData } from '@/lib/admin/equipment/types'

const DEFAULT_FILTERS: EquipmentFilters = {
  query: '',
  equipmentType: 'ALL',
  status: 'ALL',
  sortBy: 'name',
  sortOrder: 'asc',
}

type FormModalState =
  | { open: false }
  | { open: true; mode: 'create'; data: EquipmentFormData }
  | { open: true; mode: 'edit'; equipmentId: string; data: EquipmentFormData }

export default function AdminEquipmentPage() {
  const [filters, setFilters] = useState<EquipmentFilters>(DEFAULT_FILTERS)
  const [equipment, setEquipment] = useState<AdminEquipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<AdminEquipment | null>(null)
  const [formModal, setFormModal] = useState<FormModalState>({ open: false })
  const [toast, setToast] = useState('')

  const loadEquipment = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchAdminEquipment(filters)
      setEquipment(data)
      setSelected((current) => {
        if (!current) return null
        return data.find((e) => e.equipmentId === current.equipmentId) ?? null
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => void loadEquipment(), 200)
    return () => clearTimeout(timer)
  }, [loadEquipment])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const stats = useMemo(() => {
    return {
      total: equipment.length,
      available: equipment.filter((e) => e.status === 'AVAILABLE').length,
      inUse: equipment.filter((e) => e.status === 'IN_USE').length,
      maintenance: equipment.filter((e) => e.status === 'MAINTENANCE' || e.status === 'DISABLED').length,
    }
  }, [equipment])

  const handleCreate = async (data: EquipmentFormData) => {
    await createAdminEquipment(data)
    setToast('Thêm thiết bị thành công.')
    await loadEquipment()
  }

  const handleUpdate = async (data: EquipmentFormData) => {
    if (formModal.open && formModal.mode === 'edit') {
      const updated = await updateAdminEquipment(formModal.equipmentId, data)
      if (!updated) throw new Error('Không tìm thấy thiết bị.')
      setToast('Cập nhật thiết bị thành công.')
      setSelected(updated)
      await loadEquipment()
    }
  }

  const handleDelete = async (id: string) => {
    await deleteAdminEquipment(id)
    setToast('Xóa thiết bị thành công.')
    setSelected(null)
    await loadEquipment()
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminShell>
        <AdminPageHeader
          eyebrow="Thiết bị cho thuê"
          title="Quản lý thiết bị"
          description="Kiểm soát nhạc cụ và gear — số lượng khả dụng, giá thuê, trạng thái bảo trì đồng bộ với đặt phòng."
          breadcrumbs={[
            { label: 'Tổng quan', href: '/admin/dashboard' },
            { label: 'Thiết bị' },
          ]}
          actions={
            <button
              type="button"
              onClick={() =>
                setFormModal({ open: true, mode: 'create', data: { ...EMPTY_EQUIPMENT_FORM } })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-medium text-white shadow-lg shadow-brand-orange/25 transition-all hover:bg-brand-orangeHover active:scale-[0.98]"
            >
              <IconPlus className="h-4 w-4" />
              Thêm mới
            </button>
          }
        />

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
          <AdminToast message={toast} onDismiss={() => setToast('')} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard
              label="Kết quả lọc"
              value={stats.total}
              hint="Thiết bị hiển thị"
              icon={<IconEquipment className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Khả dụng"
              value={stats.available}
              hint="Sẵn sàng cho thuê"
              accent="secondary"
              icon={<span className="text-base">✓</span>}
            />
            <AdminStatCard
              label="Đang sử dụng"
              value={stats.inUse}
              hint="Trong booking"
              accent="primary"
              icon={<span className="text-base">◉</span>}
            />
            <AdminStatCard
              label="Bảo trì / Ngưng"
              value={stats.maintenance}
              hint="Tạm không cho thuê"
              accent="tertiary"
              icon={<span className="text-base">⚙</span>}
            />
          </div>

          <EquipmentFiltersBar filters={filters} onChange={setFilters} resultCount={equipment.length} />

          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-on-surface">Danh sách thiết bị</h2>
              <p className="text-xs text-on-surface-variant">Nhấn thẻ để xem chi tiết</p>
            </div>
            <EquipmentTable
              equipment={equipment}
              isLoading={isLoading}
              selectedId={selected?.equipmentId ?? null}
              onSelect={setSelected}
            />
          </section>

          <p className="pb-4 text-center text-[11px] text-on-surface-variant">
            * Demo FE — dữ liệu mock, sẽ kết nối API khi tích hợp backend.
          </p>
        </div>

        <EquipmentDetailPanel
          equipment={selected}
          onClose={() => setSelected(null)}
          onEdit={(item) =>
            setFormModal({ open: true, mode: 'edit', equipmentId: item.equipmentId, data: toFormData(item) })
          }
          onDelete={handleDelete}
        />

        <EquipmentFormModal
          open={formModal.open}
          mode={formModal.open ? formModal.mode : 'create'}
          initialData={formModal.open ? formModal.data : EMPTY_EQUIPMENT_FORM}
          onClose={() => setFormModal({ open: false })}
          onSubmit={formModal.open && formModal.mode === 'edit' ? handleUpdate : handleCreate}
        />
      </AdminShell>
    </AuthGuard>
  )
}
