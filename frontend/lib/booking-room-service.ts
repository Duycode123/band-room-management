import { bookingRooms, findBookingRoom, type BookingRoom } from '@/components/booking/booking-data'
import {
  findBookingRoomInCatalog,
  mapBackendRoomToBookingRoom,
} from '@/lib/room-mappers'
import { fetchRoom, fetchRooms } from '@/lib/rooms-api'

export type PublicBookingRoomCatalog = {
  rooms: BookingRoom[]
  source: 'backend' | 'fallback'
}

export async function fetchPublicBookingRoomCatalog(): Promise<PublicBookingRoomCatalog> {
  try {
    const rooms = await fetchRooms()
    return {
      rooms: rooms.map((room, index) => mapBackendRoomToBookingRoom(room, index)),
      source: 'backend',
    }
  } catch {
    return {
      rooms: bookingRooms,
      source: 'fallback',
    }
  }
}

export async function fetchPublicBookingRooms(): Promise<BookingRoom[]> {
  const { rooms } = await fetchPublicBookingRoomCatalog()
  return rooms
}

export async function resolveBookingRoom(roomId: string | null, catalog: BookingRoom[] = bookingRooms) {
  const catalogRoom = findBookingRoomInCatalog(roomId, catalog)
  if (catalogRoom) return catalogRoom

  if (!roomId) return null

  try {
    const room = await fetchRoom(roomId)
    return room ? mapBackendRoomToBookingRoom(room) : null
  } catch {
    return findBookingRoom(roomId)
  }
}

export async function resolveBookingRoomOrFallback(roomId: string | null, catalog: BookingRoom[] = bookingRooms) {
  return (await resolveBookingRoom(roomId, catalog)) ?? bookingRooms[0]
}
