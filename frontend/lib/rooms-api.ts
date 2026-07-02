import api from '@/lib/api'

export type BackendRoomStatus = 'TRONG' | 'DANG_DUNG' | 'BAO_TRI'

export type BackendRoomType = {
  id: number
  typeName: string
  description?: string | null
  pricePerHour?: number | string | null
  capacity?: number | null
}

export type BackendRoom = {
  id: number
  roomName: string
  roomType?: BackendRoomType | null
  floor?: number | null
  maxPeople?: number | null
  status?: BackendRoomStatus | null
  description?: string | null
  imageUrl?: string | null
}

type ApiResponse<T> = {
  success?: boolean
  message?: string
  data?: T
}

export type CreateBackendRoomPayload = {
  roomName: string
  roomTypeId: number
  status?: BackendRoomStatus
}

function readApiData<T>(payload: T | ApiResponse<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiResponse<T>).data as T
  }

  return payload as T
}

export async function fetchRooms(params?: {
  roomTypeId?: number
  status?: BackendRoomStatus
}) {
  const response = await api.get<ApiResponse<BackendRoom[]> | BackendRoom[]>('/api/rooms', {
    params,
  })

  return readApiData(response.data) ?? []
}

export async function fetchRoom(roomId: string | number) {
  const normalizedRoomId = String(roomId).trim()

  if (!/^\d+$/.test(normalizedRoomId)) {
    return null
  }

  const response = await api.get<ApiResponse<BackendRoom> | BackendRoom>(`/api/rooms/${normalizedRoomId}`)
  return readApiData(response.data)
}

export async function fetchRoomTypes() {
  const response = await api.get<ApiResponse<BackendRoomType[]> | BackendRoomType[]>('/api/room-types')
  return readApiData(response.data) ?? []
}

export async function createRoom(payload: CreateBackendRoomPayload) {
  const response = await api.post<ApiResponse<BackendRoom> | BackendRoom>('/api/rooms', payload)
  return readApiData(response.data)
}

export function getRoomApiErrorMessage(error: unknown, fallback = 'Không thể kết nối API phòng.') {
  const maybeError = error as {
    message?: string
    response?: {
      data?: {
        message?: string
        error?: string
      }
    }
  }

  return maybeError.response?.data?.message || maybeError.response?.data?.error || maybeError.message || fallback
}
