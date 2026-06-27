import { MOCK_ADMIN_EQUIPMENT } from './mockEquipment'
import type {
  AdminEquipment,
  EquipmentFilters,
  EquipmentFormData,
  EquipmentFormErrors,
} from './types'

let equipmentStore = [...MOCK_ADMIN_EQUIPMENT]

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalize(text: string) {
  return text.trim().toLowerCase()
}

function nextCode() {
  const nums = equipmentStore.map((e) => parseInt(e.equipmentCode.replace(/\D/g, ''), 10))
  const max = nums.length ? Math.max(...nums) : 0
  return `TB-${String(max + 1).padStart(3, '0')}`
}

function computeAvailable(quantity: number, status: AdminEquipment['status'], current?: AdminEquipment) {
  if (status === 'DISABLED' || status === 'MAINTENANCE') return 0
  if (status === 'IN_USE' && current) return current.availableQuantity
  return quantity
}

export function formatEquipmentPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export function validateEquipmentForm(data: EquipmentFormData): EquipmentFormErrors {
  const errors: EquipmentFormErrors = {}
  const name = data.equipmentName.trim()

  if (name.length < 2 || name.length > 100) {
    errors.equipmentName = 'Tên thiết bị phải từ 2–100 ký tự.'
  }
  if (data.quantity < 0 || !Number.isInteger(data.quantity)) {
    errors.quantity = 'Số lượng phải là số nguyên ≥ 0.'
  }
  if (data.rentalPrice < 0) {
    errors.rentalPrice = 'Giá thuê phải ≥ 0.'
  }
  if (data.description.length > 500) {
    errors.description = 'Mô tả tối đa 500 ký tự.'
  }
  if (data.imageUrl.trim() && !/^https?:\/\/.+/i.test(data.imageUrl.trim()) && !data.imageUrl.startsWith('/')) {
    errors.imageUrl = 'URL ảnh không hợp lệ.'
  }

  return errors
}

function filterAndSort(items: AdminEquipment[], filters: EquipmentFilters): AdminEquipment[] {
  let result = items.filter((item) => {
    const q = normalize(filters.query)
    const matchQuery =
      !q ||
      normalize(item.equipmentName).includes(q) ||
      normalize(item.equipmentCode).includes(q)
    const matchType = filters.equipmentType === 'ALL' || item.equipmentType === filters.equipmentType
    const matchStatus = filters.status === 'ALL' || item.status === filters.status
    return matchQuery && matchType && matchStatus
  })

  result = [...result].sort((a, b) => {
    let cmp = 0
    if (filters.sortBy === 'name') cmp = a.equipmentName.localeCompare(b.equipmentName, 'vi')
    if (filters.sortBy === 'price') cmp = a.rentalPrice - b.rentalPrice
    if (filters.sortBy === 'quantity') cmp = a.quantity - b.quantity
    return filters.sortOrder === 'asc' ? cmp : -cmp
  })

  return result
}

export async function fetchAdminEquipment(filters: EquipmentFilters): Promise<AdminEquipment[]> {
  await delay(250)
  return filterAndSort(equipmentStore, filters)
}

export async function createAdminEquipment(data: EquipmentFormData): Promise<AdminEquipment> {
  await delay(300)
  const errors = validateEquipmentForm(data)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0])
  }

  const item: AdminEquipment = {
    equipmentId: `eq-${Date.now()}`,
    equipmentCode: nextCode(),
    equipmentName: data.equipmentName.trim(),
    equipmentType: data.equipmentType,
    quantity: data.quantity,
    availableQuantity: computeAvailable(data.quantity, data.status),
    rentalPrice: data.rentalPrice,
    status: data.status,
    description: data.description.trim() || undefined,
    imageUrl: data.imageUrl.trim() || undefined,
    inActiveBooking: false,
  }

  equipmentStore = [item, ...equipmentStore]
  return item
}

export async function updateAdminEquipment(
  id: string,
  data: EquipmentFormData,
): Promise<AdminEquipment | null> {
  await delay(300)
  const errors = validateEquipmentForm(data)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0])
  }

  const index = equipmentStore.findIndex((e) => e.equipmentId === id)
  if (index < 0) return null

  const current = equipmentStore[index]
  const updated: AdminEquipment = {
    ...current,
    equipmentName: data.equipmentName.trim(),
    equipmentType: data.equipmentType,
    quantity: data.quantity,
    availableQuantity: computeAvailable(data.quantity, data.status, current),
    rentalPrice: data.rentalPrice,
    status: data.status,
    description: data.description.trim() || undefined,
    imageUrl: data.imageUrl.trim() || undefined,
  }

  equipmentStore[index] = updated
  return updated
}

export async function deleteAdminEquipment(id: string): Promise<void> {
  await delay(250)
  const item = equipmentStore.find((e) => e.equipmentId === id)
  if (!item) throw new Error('Không tìm thấy thiết bị.')
  if (item.inActiveBooking) {
    throw new Error('Thiết bị hiện đang được sử dụng trong hệ thống.')
  }
  equipmentStore = equipmentStore.filter((e) => e.equipmentId !== id)
}

export function toFormData(equipment: AdminEquipment): EquipmentFormData {
  return {
    equipmentName: equipment.equipmentName,
    equipmentType: equipment.equipmentType,
    quantity: equipment.quantity,
    rentalPrice: equipment.rentalPrice,
    status: equipment.status,
    description: equipment.description ?? '',
    imageUrl: equipment.imageUrl ?? '',
  }
}

export const EMPTY_EQUIPMENT_FORM: EquipmentFormData = {
  equipmentName: '',
  equipmentType: 'GUITAR',
  quantity: 1,
  rentalPrice: 0,
  status: 'AVAILABLE',
  description: '',
  imageUrl: '',
}
