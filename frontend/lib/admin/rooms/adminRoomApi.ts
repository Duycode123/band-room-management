import {
  inferRoomCategoryFromTypeName,
  mapAdminStatusToBackendStatus,
  mapBackendRoomToAdminRoom,
  mapRoomTypeToAdminOption,
} from '@/lib/room-mappers'
import {
  createRoom,
  fetchRooms,
  fetchRoomTypes,
  getRoomApiErrorMessage,
} from '@/lib/rooms-api'
import type {
  AdminRoom,
  AdminRoomTypeOption,
  RoomFormData,
  RoomFormErrors,
  RoomStatus,
} from './types'

function pickRoomType(data: RoomFormData, roomTypes: AdminRoomTypeOption[]) {
  if (data.roomTypeId) {
    return roomTypes.find((roomType) => roomType.id === data.roomTypeId) ?? null
  }

  if (data.category) {
    return roomTypes.find((roomType) => roomType.category === data.category) ?? null
  }

  return roomTypes[0] ?? null
}

export function formatRoomPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function validateRoomForm(data: RoomFormData): RoomFormErrors {
  const errors: RoomFormErrors = {}
  const name = data.name.trim()
  const code = data.code.trim()

  if (name.length < 2 || name.length > 100) {
    errors.name = 'Tên phòng phải từ 2-100 ký tự.'
  }

  if (!/^[A-Z0-9-]{3,16}$/i.test(code)) {
    errors.code = 'Mã phòng chỉ gồm chữ, số, dấu gạch ngang và dài 3-16 ký tự.'
  }

  if (!data.category) {
    errors.category = 'Vui lòng chọn hạng phòng.'
  }

  if (!data.status) {
    errors.status = 'Vui lòng chọn trạng thái.'
  }

  if (!Number.isInteger(data.capacity) || data.capacity < 1 || data.capacity > 50) {
    errors.capacity = 'Sức chứa phải là số nguyên từ 1-50.'
  }

  if (!Number.isFinite(data.pricePerHour) || data.pricePerHour < 0) {
    errors.pricePerHour = 'Giá/giờ phải lớn hơn hoặc bằng 0.'
  }

  if (data.description.length > 500) {
    errors.description = 'Mô tả tối đa 500 ký tự.'
  }

  if (data.image.trim() && !/^https?:\/\/.+/i.test(data.image.trim()) && !data.image.startsWith('/')) {
    errors.image = 'URL ảnh không hợp lệ.'
  }

  return errors
}

export async function getAdminRoomTypes(): Promise<AdminRoomTypeOption[]> {
  try {
    const roomTypes = await fetchRoomTypes()
    return roomTypes.map(mapRoomTypeToAdminOption)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể tải hạng phòng từ backend.'))
  }
}

export async function getAdminRooms(): Promise<AdminRoom[]> {
  try {
    const rooms = await fetchRooms()
    return rooms.map((room, index) => mapBackendRoomToAdminRoom(room, index))
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể tải danh sách phòng từ backend.'))
  }
}

export async function createAdminRoom(data: RoomFormData): Promise<AdminRoom> {
  const errors = validateRoomForm(data)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0])
  }

  const roomTypes = await getAdminRoomTypes()
  const roomType = pickRoomType(data, roomTypes)

  if (!roomType) {
    throw new Error('Backend chưa có hạng phòng. Vui lòng tạo hạng phòng trước khi thêm phòng.')
  }

  try {
    const room = await createRoom({
      roomName: data.name.trim(),
      roomTypeId: roomType.id,
      status: mapAdminStatusToBackendStatus(data.status || 'active'),
    })

    return mapBackendRoomToAdminRoom(room)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể thêm phòng trên backend.'))
  }
}

export async function updateAdminRoom(_id: string, _data: RoomFormData): Promise<AdminRoom | null> {
  throw new Error('Backend hiện chưa có API cập nhật phòng. Chỉ có thể thêm và xem phòng thật.')
}

export async function deleteAdminRoom(_id: string): Promise<void> {
  throw new Error('Backend hiện chưa có API xóa phòng. Không thể xóa phòng thật ở frontend.')
}

export async function updateRoomStatus(_id: string, _status: RoomStatus): Promise<AdminRoom | null> {
  throw new Error('Backend hiện chưa có API đổi trạng thái phòng.')
}

export function toRoomFormData(room: AdminRoom): RoomFormData {
  return {
    name: room.name,
    code: room.code,
    roomTypeId: room.roomTypeId ?? null,
    category: room.category,
    capacity: room.capacity,
    pricePerHour: room.pricePerHour,
    status: room.status,
    description: room.description,
    equipments: room.equipments.join('\n'),
    image: room.image,
  }
}

export function getDefaultRoomForm(roomTypes: AdminRoomTypeOption[] = []): RoomFormData {
  const roomType = roomTypes[0]
  const category = roomType?.category ?? inferRoomCategoryFromTypeName('')

  return {
    ...EMPTY_ROOM_FORM,
    roomTypeId: roomType?.id ?? null,
    category,
    capacity: roomType?.capacity ?? EMPTY_ROOM_FORM.capacity,
    pricePerHour: roomType?.pricePerHour ?? EMPTY_ROOM_FORM.pricePerHour,
  }
}

export const EMPTY_ROOM_FORM: RoomFormData = {
  name: '',
  code: '',
  roomTypeId: null,
  category: 'standard',
  capacity: 1,
  pricePerHour: 0,
  status: 'active',
  description: '',
  equipments: '',
  image: '/images/band-room-hero.png',
}
