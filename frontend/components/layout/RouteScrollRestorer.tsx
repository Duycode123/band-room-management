'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import {
  restoreScrollPosition,
  saveScrollPosition,
  scrollToTopInstant,
} from '@/lib/navigation/scroll-restoration'

export default function RouteScrollRestorer() {
  const pathname = usePathname()
  const previousPathname = useRef(pathname)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (previousPathname.current === pathname) return

    saveScrollPosition(previousPathname.current)
    previousPathname.current = pathname

    if (window.location.hash) return

    requestAnimationFrame(() => {
      const restored = restoreScrollPosition(pathname)
      if (!restored) {
        scrollToTopInstant()
      }
    })
  }, [pathname])

  return null
}
