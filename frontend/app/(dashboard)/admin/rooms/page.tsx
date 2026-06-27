'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminShell from '@/components/admin/AdminShell'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminToast from '@/components/admin/AdminToast'
import { IconPlus, IconRooms } from '@/components/admin/AdminIcons'
import RoomDeleteConfirmModal from '@/components/admin/rooms/RoomDeleteConfirmModal'
import RoomDetailPanel from '@/components/admin/rooms/RoomDetailPanel'
import RoomFiltersBar from '@/components/admin/rooms/RoomFiltersBar'
import RoomFormModal from '@/components/admin/rooms/RoomFormModal'
import RoomTable from '@/components/admin/rooms/RoomTable'
import {
  createAdminRoom,
  deleteAdminRoom,
  EMPTY_ROOM_FORM,
  getAdminRooms,
  toRoomFormData,
  updateAdminRoom,
  updateRoomStatus,
} from '@/lib/admin/rooms/adminRoomApi'
import type { AdminRoom, RoomFilters, RoomFormData } from '@/lib/admin/rooms/types'

const DEFAULT_FILTERS: RoomFilters = {
  query: '',
  category: 'ALL',
  status: 'ALL',
  sortBy: 'updated',
}

type FormModalState =
  | { open: false }
  | { open: true; mode: 'create'; data: RoomFormData }
  | { open: true; mode: 'edit'; roomId: string; data: RoomFormData }

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function filterAndSortRooms(rooms: AdminRoom[], filters: RoomFilters) {
  const query = normalize(filters.query)

  const filtered = rooms.filter((room) => {
    const matchQuery =
      !query ||
      normalize(room.name).includes(query) ||
      normalize(room.code).includes(query) ||
      normalize(room.categoryLabel).includes(query)
    const matchCategory = filters.category === 'ALL' || room.category === filters.category
    const matchStatus = filters.status === 'ALL' || room.status === filters.status

    return matchQuery && matchCategory && matchStatus
  })

  return [...filtered].sort((a, b) => {
    if (filters.sortBy === 'price-asc') return a.pricePerHour - b.pricePerHour
    if (filters.sortBy === 'price-desc') return b.pricePerHour - a.pricePerHour
    if (filters.sortBy === 'capacity') return b.capacity - a.capacity
    return 0
  })
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<AdminRoom[]>([])
  const [filters, setFilters] = useState<RoomFilters>(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<AdminRoom | null>(null)
  const [formModal, setFormModal] = useState<FormModalState>({ open: false })
  const [deleteTarget, setDeleteTarget] = useState<AdminRoom | null>(null)
  const [toast, setToast] = useState('')

  const loadRooms = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getAdminRooms()
      setRooms(data)
      setSelected((current) => {
        if (!current) return null
        return data.find((room) => room.id === current.id) ?? null
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRooms()
  }, [loadRooms])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const visibleRooms = useMemo(() => filterAndSortRooms(rooms, filters), [rooms, filters])

  const stats = useMemo(() => {
    const active = rooms.filter((room) => room.status === 'active' || room.status === 'occupied').length
    const maintenance = rooms.filter((room) => room.status === 'maintenance').length
    const occupancy =
      rooms.length > 0
        ? Math.round(rooms.reduce((total, room) => total + room.occupancyRateToday, 0) / rooms.length)
        : 0

    return {
      total: rooms.length,
      active,
      maintenance,
      occupancy,
    }
  }, [rooms])

  const handleCreate = async (data: RoomFormData) => {
    await createAdminRoom(data)
    setToast('Thêm phòng tập thành công.')
    await loadRooms()
  }

  const handleUpdate = async (data: RoomFormData) => {
    if (!formModal.open || formModal.mode !== 'edit') return

    const updated = await updateAdminRoom(formModal.roomId, data)
    if (!updated) throw new Error('Không tìm thấy phòng tập.')

    setToast('Cập nhật phòng tập thành công.')
    setSelected(updated)
    await loadRooms()
  }

  const handleDelete = async (roomId: string) => {
    await deleteAdminRoom(roomId)
    setToast('Xóa phòng tập thành công.')
    setSelected((current) => (current?.id === roomId ? null : current))
    await loadRooms()
  }

  const handleMaintenance = async (room: AdminRoom) => {
    const updated = await updateRoomStatus(room.id, 'maintenance')
    if (!updated) throw new Error('Không tìm thấy phòng tập.')

    setToast(`${room.name} đã được chuyển sang trạng thái bảo trì.`)
    setSelected((current) => (current?.id === room.id ? updated : current))
    await loadRooms()
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminShell>
        <AdminPageHeader
          eyebrow="ROOM MANAGEMENT"
          title="Quản lý phòng tập"
          description="Theo dõi danh sách phòng, trạng thái vận hành, lịch hôm nay và thao tác nhanh cho đội ngũ quản trị BandSpace."
          breadcrumbs={[
            { label: 'Tổng quan', href: '/admin/dashboard' },
            { label: 'Phòng tập' },
          ]}
          actions={
            <>
              <button
                type="button"
                onClick={() => setToast('Đã chuẩn bị dữ liệu phòng tập để xuất.')}
                className="rounded-xl border border-outline bg-white px-4 py-2.5 font-display text-sm font-medium text-on-surface-variant shadow-sm transition-colors hover:border-brand-orange/30 hover:text-brand-orange"
              >
                Xuất dữ liệu
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormModal({ open: true, mode: 'create', data: { ...EMPTY_ROOM_FORM } })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-medium text-white shadow-lg shadow-brand-orange/25 transition-all hover:bg-brand-orangeHover active:scale-[0.98]"
              >
                <IconPlus className="h-4 w-4" />
                Thêm phòng
              </button>
            </>
          }
        />

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
          <AdminToast message={toast} onDismiss={() => setToast('')} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard
              label="Tổng số phòng"
              value={stats.total}
              hint="Phòng đang quản lý"
              icon={<IconRooms className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Đang hoạt động"
              value={stats.active}
              hint="Sẵn sàng hoặc đang có lịch"
              accent="secondary"
              icon={<span className="text-base">✓</span>}
            />
            <AdminStatCard
              label="Đang bảo trì"
              value={stats.maintenance}
              hint="Tạm khóa lịch đặt"
              accent="tertiary"
              icon={<span className="text-base">⚙</span>}
            />
            <AdminStatCard
              label="Tỷ lệ lấp đầy hôm nay"
              value={`${stats.occupancy}%`}
              hint="Trung bình toàn bộ phòng"
              accent="primary"
              icon={<span className="text-base">%</span>}
            />
          </div>

          <RoomFiltersBar filters={filters} onChange={setFilters} resultCount={visibleRooms.length} />

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-on-surface">Danh sách phòng tập</h2>
                <p className="text-xs text-on-surface-variant">
                  Quản lý trạng thái, giá thuê, thiết bị và lịch sử dụng trong ngày.
                </p>
              </div>
              <p className="text-xs text-on-surface-variant">Chọn “Chi tiết” để mở hồ sơ phòng</p>
            </div>

            <RoomTable
              rooms={visibleRooms}
              isLoading={isLoading}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              onEdit={(room) =>
                setFormModal({ open: true, mode: 'edit', roomId: room.id, data: toRoomFormData(room) })
              }
              onDelete={setDeleteTarget}
              onMaintenance={(room) => void handleMaintenance(room)}
            />
          </section>

          <p className="pb-4 text-center text-[11px] text-on-surface-variant">
            * Demo FE - dữ liệu mock, sẵn sàng thay bằng API quản lý phòng khi tích hợp backend.
          </p>
        </div>

        <RoomDetailPanel
          room={selected}
          onClose={() => setSelected(null)}
          onEdit={(room) =>
            setFormModal({ open: true, mode: 'edit', roomId: room.id, data: toRoomFormData(room) })
          }
        />

        <RoomFormModal
          open={formModal.open}
          mode={formModal.open ? formModal.mode : 'create'}
          initialData={formModal.open ? formModal.data : EMPTY_ROOM_FORM}
          onClose={() => setFormModal({ open: false })}
          onSubmit={formModal.open && formModal.mode === 'edit' ? handleUpdate : handleCreate}
        />

        <RoomDeleteConfirmModal
          room={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      </AdminShell>
    </AuthGuard>
  )
}
