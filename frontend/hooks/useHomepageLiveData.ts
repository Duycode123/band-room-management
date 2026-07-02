'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchHomepageSummary,
  getAvailabilityStatus,
  getInitialAvailabilityStatus,
  type AvailabilityStatus,
  type NextAvailableSlot,
  type RecentActivity,
} from '@/lib/homepage-live-service'

type HomepageLiveData = {
  availabilityStatus: AvailabilityStatus
  recentActivities: RecentActivity[]
  nextAvailableSlot: NextAvailableSlot | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const POLLING_INTERVAL_MS = 30000

export function useHomepageLiveData(): HomepageLiveData {
  const mountedRef = useRef(false)
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(() => getInitialAvailabilityStatus())
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [nextAvailableSlot, setNextAvailableSlot] = useState<NextAvailableSlot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)

    try {
      const summary = await fetchHomepageSummary()

      if (!mountedRef.current) return

      setAvailabilityStatus(getAvailabilityStatus(summary))
      setRecentActivities(summary.recentActivities)
      setNextAvailableSlot(summary.nextAvailableSlots[0] ?? null)
      setError(null)
    } catch {
      if (!mountedRef.current) return

      setError('Không thể tải dữ liệu hiện tại')
    } finally {
      if (!mountedRef.current) return

      if (!silent) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    void loadData()

    const intervalId = window.setInterval(() => {
      void loadData(true)
    }, POLLING_INTERVAL_MS)

    return () => {
      mountedRef.current = false
      window.clearInterval(intervalId)
    }
  }, [loadData])

  return {
    availabilityStatus,
    recentActivities,
    nextAvailableSlot,
    isLoading,
    error,
    refresh: () => loadData(false),
  }
}
