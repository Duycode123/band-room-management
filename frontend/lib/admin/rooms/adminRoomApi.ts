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
    errors.name = 'Tên phòng phải từ 2-100 ký tự.'
  }

  if (!data.roomTypeId && !data.category) {
    errors.category = 'Vui lòng chọn hạng phòng.'
  }

  if (!data.status) {
    errors.status = 'Vui lòng chọn trạng thái.'
  }

  if (!Number.isFinite(data.capacity) || data.capacity < 1 || data.capacity > 100) {
    errors.capacity = 'Sức chứa phải nằm trong khoảng 1-100 người.'
  }

  if (data.description.length > 500) {
    errors.description = 'Mô tả tối đa 500 ký tự.'
  }

  if (data.image.trim() && !/^https?:\/\/.+/i.test(data.image.trim())) {
    errors.image = 'URL ảnh phải là link http hoặc https.'
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
      maxPeople: data.capacity,
      imageUrl: normalizeOptionalImageUrl(data.image),
      status: mapAdminStatusToBackendStatus(data.status || 'active'),
    })

    return mapBackendRoomToAdminRoom(room)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể thêm phòng trên backend.'))
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
    throw new Error('Backend chưa có hạng phòng để cập nhật.')
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
    throw new Error(getRoomApiErrorMessage(error, 'Không thể cập nhật phòng trên backend.'))
  }
}

export async function deleteAdminRoom(id: string): Promise<void> {
  try {
    await deleteRoom(id)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể xóa phòng trên backend.'))
  }
}

export async function updateRoomStatus(id: string, status: RoomStatus): Promise<AdminRoom | null> {
  try {
    const room = await updateRoomOperationalStatus(id, mapAdminStatusToBackendStatus(status))
    return mapBackendRoomToAdminRoom(room)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể đổi trạng thái phòng.'))
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
    throw new Error(getRoomApiErrorMessage(error, 'Không thể tải ảnh phòng lên Cloudinary.'))
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
