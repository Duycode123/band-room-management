import { bookingRooms, findBookingRoom, type BookingRoom } from '@/components/booking/booking-data'
import {
  findBookingRoomInCatalog,
  mapBackendRoomToBookingRoom,
} from '@/lib/room-mappers'
import { fetchRoom, fetchRooms } from '@/lib/rooms-api'

export async function fetchPublicBookingRooms(): Promise<BookingRoom[]> {
  try {
    const rooms = await fetchRooms()
    return rooms.map((room, index) => mapBackendRoomToBookingRoom(room, index))
  } catch {
    return bookingRooms
  }
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
