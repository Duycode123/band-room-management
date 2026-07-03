import {
  inferRoomCategoryFromTypeName,
  mapAdminStatusToBackendStatus,
  mapBackendRoomToAdminRoom,
  mapRoomTypeToAdminOption,
} from '@/lib/room-mappers'
import {
  createRoom,
  deleteRoom,
  fetchRooms,
  fetchRoomTypes,
  getRoomApiErrorMessage,
  updateRoom,
  updateRoomOperationalStatus,
  uploadRoomImage,
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

  if (name.length < 2 || name.length > 100) {
    errors.name = 'Ten phong phai tu 2-100 ky tu.'
  }

  if (!data.roomTypeId && !data.category) {
    errors.category = 'Vui long chon hang phong.'
  }

  if (!data.status) {
    errors.status = 'Vui long chon trang thai.'
  }

  if (!Number.isFinite(data.capacity) || data.capacity < 1 || data.capacity > 100) {
    errors.capacity = 'Suc chua phai nam trong khoang 1-100 nguoi.'
  }

  if (data.description.length > 500) {
    errors.description = 'Mo ta toi da 500 ky tu.'
  }

  if (data.image.trim() && !/^https?:\/\/.+/i.test(data.image.trim())) {
    errors.image = 'URL anh phai la link http hoac https.'
  }

  return errors
}

export async function getAdminRoomTypes(): Promise<AdminRoomTypeOption[]> {
  try {
    const roomTypes = await fetchRoomTypes()
    return roomTypes.map(mapRoomTypeToAdminOption)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Khong the tai hang phong tu backend.'))
  }
}

export async function getAdminRooms(): Promise<AdminRoom[]> {
  try {
    const rooms = await fetchRooms()
    return rooms.map((room, index) => mapBackendRoomToAdminRoom(room, index))
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Khong the tai danh sach phong tu backend.'))
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
    throw new Error('Backend chua co hang phong. Vui long tao hang phong truoc khi them phong.')
  }

  try {
    const room = await createRoom({
      roomName: data.name.trim(),
      roomTypeId: roomType.id,
      maxPeople: data.capacity,
      imageUrl: normalizeOptionalImageUrl(data.image),
      status: mapAdminStatusToBackendStatus(data.status || 'active'),
    })

    return mapBackendRoomToAdminRoom(room)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Khong the them phong tren backend.'))
  }
}

export async function updateAdminRoom(id: string, data: RoomFormData): Promise<AdminRoom | null> {
  const errors = validateRoomForm(data)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0])
  }

  const roomTypes = await getAdminRoomTypes()
  const roomType = pickRoomType(data, roomTypes)

  if (!roomType) {
    throw new Error('Backend chua co hang phong de cap nhat.')
  }

  try {
    const room = await updateRoom(id, {
      roomName: data.name.trim(),
      roomTypeId: roomType.id,
      maxPeople: data.capacity,
      imageUrl: normalizeOptionalImageUrl(data.image),
      status: mapAdminStatusToBackendStatus(data.status || 'active'),
    })

    return mapBackendRoomToAdminRoom(room)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Khong the cap nhat phong tren backend.'))
  }
}

export async function deleteAdminRoom(id: string): Promise<void> {
  try {
    await deleteRoom(id)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Khong the xoa phong tren backend.'))
  }
}

export async function updateRoomStatus(id: string, status: RoomStatus): Promise<AdminRoom | null> {
  try {
    const room = await updateRoomOperationalStatus(id, mapAdminStatusToBackendStatus(status))
    return mapBackendRoomToAdminRoom(room)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Khong the doi trang thai phong.'))
  }
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
    image: room.imageUrl ?? '',
  }
}

export async function uploadAdminRoomImage(file: File) {
  try {
    return await uploadRoomImage(file)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Khong the tai anh phong len Cloudinary.'))
  }
}

function normalizeOptionalImageUrl(imageUrl: string) {
  const normalized = imageUrl.trim()
  return normalized ? normalized : null
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
  image: '',
}
