'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminToast from '@/components/admin/AdminToast'
import { IconEquipment, IconPlus, IconRefresh } from '@/components/admin/AdminIcons'
import EquipmentDetailPanel from '@/components/admin/equipment/EquipmentDetailPanel'
import EquipmentFiltersBar from '@/components/admin/equipment/EquipmentFiltersBar'
import EquipmentFormModal from '@/components/admin/equipment/EquipmentFormModal'
import EquipmentTable from '@/components/admin/equipment/EquipmentTable'
import {
  createAdminEquipment,
  deleteAdminEquipment,
  EMPTY_EQUIPMENT_FORM,
  fetchAdminEquipment,
  fetchEquipmentRooms,
  toFormData,
  updateAdminEquipment,
} from '@/lib/admin/equipment/adminEquipmentApi'
import type {
  AdminEquipment,
  EquipmentFilters,
  EquipmentFormData,
  EquipmentRoomOption,
} from '@/lib/admin/equipment/types'

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
  | { open: true; mode: 'edit'; equipmentId: number; data: EquipmentFormData }

export default function AdminEquipmentPage() {
  const [filters, setFilters] = useState<EquipmentFilters>(DEFAULT_FILTERS)
  const [equipment, setEquipment] = useState<AdminEquipment[]>([])
  const [rooms, setRooms] = useState<EquipmentRoomOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<AdminEquipment | null>(null)
  const [formModal, setFormModal] = useState<FormModalState>({ open: false })
  const [toast, setToast] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadEquipment = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await fetchAdminEquipment(filters)
      setEquipment(data)
      setErrorMessage('')
      setSelected((currentEquipment) => {
        if (!currentEquipment) return null
        return data.find((item) => item.equipmentId === currentEquipment.equipmentId) ?? null
      })
    } catch (error) {
      setEquipment([])
      setSelected(null)
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách thiết bị.')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void fetchEquipmentRooms()
      .then((data) => setRooms(data))
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách phòng.')
      })
  }, [])

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
      good: equipment.filter((item) => item.status === 'GOOD').length,
      broken: equipment.filter((item) => item.status === 'BROKEN').length,
      maintenance: equipment.filter((item) => item.status === 'MAINTENANCE').length,
    }
  }, [equipment])

  const createInitialForm = useCallback(
    () => ({
      ...EMPTY_EQUIPMENT_FORM,
      roomId: rooms[0]?.roomId ?? null,
    }),
    [rooms],
  )
  const canCreateEquipment = rooms.length > 0

  const handleCreate = async (data: EquipmentFormData) => {
    await createAdminEquipment(data)
    setToast('Thêm thiết bị thành công.')
    await loadEquipment()
  }

  const handleUpdate = async (data: EquipmentFormData) => {
    if (!formModal.open || formModal.mode !== 'edit') return

    const updated = await updateAdminEquipment(formModal.equipmentId, data)
    if (!updated) {
      throw new Error('Không tìm thấy thiết bị.')
    }

    setToast('Cập nhật thiết bị thành công.')
    setSelected(updated)
    await loadEquipment()
  }

  const handleDelete = async (id: number) => {
    await deleteAdminEquipment(id)
    setToast('Xóa thiết bị thành công.')
    setSelected(null)
    await loadEquipment()
  }

  return (
    <>
        <AdminPageHeader
          eyebrow="Thiết bị"
          title="Quản lý thiết bị"
          description="Danh sách thiết bị này đang đọc và ghi trực tiếp vào hệ thống."
          breadcrumbs={[
            { label: 'Tổng quan', href: '/admin/dashboard' },
            { label: 'Thiết bị' },
          ]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void loadEquipment()}
                disabled={isLoading}
                title="Làm mới"
                aria-label="Làm mới"
                className={[
                  'group flex h-10 w-10 items-center justify-center rounded-full',
                  'border border-outline-variant bg-white text-on-surface-variant shadow-sm',
                  'transition-all hover:border-brand-orange/40 hover:text-brand-orange',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                ].join(' ')}
              >
                <IconRefresh
                  className={[
                    'h-[15px] w-[15px] transition-transform duration-300',
                    isLoading ? 'animate-spin' : 'group-hover:rotate-180',
                  ].join(' ')}
                />
              </button>
              <button
                type="button"
                onClick={() => setFormModal({ open: true, mode: 'create', data: createInitialForm() })}
                disabled={!canCreateEquipment}
                title={canCreateEquipment ? 'Thêm thiết bị' : 'Cần tạo phòng trước khi thêm thiết bị'}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-medium text-white shadow-lg shadow-brand-orange/25 transition-all hover:bg-brand-orangeHover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <IconPlus className="h-4 w-4" />
                Thêm mới
              </button>
            </div>
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
              label="Kết quả lọc"
              value={stats.total}
              hint="Thiết bị hiển thị"
              icon={<IconEquipment className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Tốt"
              value={stats.good}
              hint="Sẵn sàng sử dụng"
              accent="secondary"
              icon={<span className="text-base">✓</span>}
            />
            <AdminStatCard
              label="Hư hỏng"
              value={stats.broken}
              hint="Cần xử lý"
              accent="primary"
              icon={<span className="text-base">!</span>}
            />
            <AdminStatCard
              label="Bảo trì"
              value={stats.maintenance}
              hint="Tạm dừng"
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
          initialData={formModal.open ? formModal.data : createInitialForm()}
          rooms={rooms}
          onClose={() => setFormModal({ open: false })}
          onSubmit={formModal.open && formModal.mode === 'edit' ? handleUpdate : handleCreate}
        />
    </>
  )
}
