'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAvailableSlots } from '@/lib/booking/bookingApi'
import type { TimeSlot } from '@/lib/booking/types'

const POLL_INTERVAL_MS = 15_000

export function useAvailableSlots(roomId: string | null, date: string) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState('')
  const selectedSlotIdRef = useRef<string | null>(null)

  const load = useCallback(async () => {
    if (!roomId || !date) {
      setSlots([])
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = await fetchAvailableSlots(roomId, date)
      const selectedId = selectedSlotIdRef.current
      setSlots(
        data.map((slot) =>
          slot.id === selectedId && slot.status === 'available'
            ? { ...slot, status: 'selected' as const }
            : slot,
        ),
      )
      setLastUpdated(new Date())
    } catch {
      setError('Không thể tải lịch trống. Thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }, [roomId, date])

  const selectSlot = useCallback((slotId: string | null) => {
    selectedSlotIdRef.current = slotId
    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.status === 'past' || slot.status === 'booked') return slot
        if (slot.id === slotId) return { ...slot, status: 'selected' }
        if (slot.status === 'selected') return { ...slot, status: 'available' }
        return slot
      }),
    )
  }, [])

  useEffect(() => {
    selectedSlotIdRef.current = null
    load()
  }, [load])

  useEffect(() => {
    if (!roomId || !date) return
    const timer = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [roomId, date, load])

  return { slots, isLoading, lastUpdated, error, refresh: load, selectSlot }
}
