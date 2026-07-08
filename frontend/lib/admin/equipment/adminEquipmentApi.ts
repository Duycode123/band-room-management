import axios from 'axios'
import api from '@/lib/api'
import type {
  AdminEquipment,
  EquipmentFilters,
  EquipmentFormData,
  EquipmentFormErrors,
  EquipmentRoomOption,
  EquipmentStatus,
  EquipmentType,
} from './types'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type ApiErrorResponse = {
  message?: string
}

type BackendEquipment = {
  id: number
  roomId: number
  roomName: string
  type: EquipmentType
  name: string
  status: EquipmentStatus
  notes?: string | null
}

type BackendRoom = {
  id: number
  roomName: string
}

function normalizeText(value?: string | null) {
  return value?.trim() || ''
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

function mapBackendEquipment(item: BackendEquipment): AdminEquipment {
  return {
    equipmentId: item.id,
    roomId: item.roomId,
    roomName: item.roomName,
    equipmentName: item.name,
    equipmentType: item.type,
    status: item.status,
    notes: normalizeText(item.notes) || undefined,
  }
}

function applyClientFilters(items: AdminEquipment[], filters: EquipmentFilters) {
  const normalizedQuery = filters.query.trim().toLowerCase()

  return items
    .filter((item) => {
      if (normalizedQuery) {
        const matchesQuery =
          item.equipmentName.toLowerCase().includes(normalizedQuery) ||
          item.roomName.toLowerCase().includes(normalizedQuery) ||
          String(item.equipmentId).includes(normalizedQuery)

        if (!matchesQuery) {
          return false
        }
      }

      if (filters.equipmentType !== 'ALL' && item.equipmentType !== filters.equipmentType) {
        return false
      }

      if (filters.status !== 'ALL' && item.status !== filters.status) {
        return false
      }

      return true
    })
    .sort((firstItem, secondItem) => {
      const compareValue =
        filters.sortBy === 'room'
          ? firstItem.roomName.localeCompare(secondItem.roomName, 'vi')
          : firstItem.equipmentName.localeCompare(secondItem.equipmentName, 'vi')

      if (compareValue !== 0) {
        return filters.sortOrder === 'asc' ? compareValue : -compareValue
      }

      const tieBreaker = firstItem.equipmentId - secondItem.equipmentId
      return filters.sortOrder === 'asc' ? tieBreaker : -tieBreaker
    })
}

export function validateEquipmentForm(data: EquipmentFormData): EquipmentFormErrors {
  const errors: EquipmentFormErrors = {}
  const name = data.equipmentName.trim()

  if (!data.roomId || data.roomId < 1) {
    errors.roomId = 'Vui long chon phong cho thiet bi.'
  }

  if (name.length < 2 || name.length > 100) {
    errors.equipmentName = 'Ten thiet bi phai tu 2 den 100 ky tu.'
  }

  if (data.notes.length > 1000) {
    errors.notes = 'Ghi chu toi da 1000 ky tu.'
  }

  return errors
}

export async function fetchEquipmentRooms(): Promise<EquipmentRoomOption[]> {
  try {
    const response = await api.get<ApiResponse<BackendRoom[]>>('/api/rooms')
    const rooms = response.data.data ?? []

    return rooms
      .map((room) => ({
        roomId: room.id,
        roomName: normalizeText(room.roomName) || `Phong ${room.id}`,
      }))
      .sort((firstRoom, secondRoom) => firstRoom.roomName.localeCompare(secondRoom.roomName, 'vi'))
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tai danh sach phong.'))
  }
}

export async function fetchAdminEquipment(filters: EquipmentFilters): Promise<AdminEquipment[]> {
  try {
    const response = await api.get<ApiResponse<BackendEquipment[]>>('/api/admin/equipment', {
      params: {
        type: filters.equipmentType !== 'ALL' ? filters.equipmentType : undefined,
        status: filters.status !== 'ALL' ? filters.status : undefined,
      },
    })

    return applyClientFilters((response.data.data ?? []).map(mapBackendEquipment), filters)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tai danh sach thiet bi.'))
  }
}

export async function createAdminEquipment(data: EquipmentFormData): Promise<AdminEquipment> {
  const errors = validateEquipmentForm(data)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0] || 'Du lieu thiet bi khong hop le.')
  }

  try {
    const response = await api.post<ApiResponse<BackendEquipment>>('/api/admin/equipment', {
      roomId: data.roomId,
      type: data.equipmentType,
      name: data.equipmentName.trim(),
      status: data.status,
      notes: normalizeText(data.notes) || undefined,
    })

    return mapBackendEquipment(response.data.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tao thiet bi.'))
  }
}

export async function updateAdminEquipment(
  id: number,
  data: EquipmentFormData,
): Promise<AdminEquipment | null> {
  const errors = validateEquipmentForm(data)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0] || 'Du lieu thiet bi khong hop le.')
  }

  try {
    const response = await api.put<ApiResponse<BackendEquipment>>(`/api/admin/equipment/${id}`, {
      roomId: data.roomId,
      type: data.equipmentType,
      name: data.equipmentName.trim(),
      status: data.status,
      notes: normalizeText(data.notes) || undefined,
    })

    return mapBackendEquipment(response.data.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the cap nhat thiet bi.'))
  }
}

export async function deleteAdminEquipment(id: number): Promise<void> {
  try {
    await api.delete(`/api/admin/equipment/${id}`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the xoa thiet bi.'))
  }
}

export function toFormData(equipment: AdminEquipment): EquipmentFormData {
  return {
    roomId: equipment.roomId,
    equipmentName: equipment.equipmentName,
    equipmentType: equipment.equipmentType,
    status: equipment.status,
    notes: equipment.notes ?? '',
  }
}

export const EMPTY_EQUIPMENT_FORM: EquipmentFormData = {
  roomId: null,
  equipmentName: '',
  equipmentType: 'AMP',
  status: 'GOOD',
  notes: '',
}
