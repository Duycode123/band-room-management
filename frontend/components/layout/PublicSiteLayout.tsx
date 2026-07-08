import type { ReactNode } from 'react'
import BandRoomFooter from '@/components/layout/BandRoomFooter'
import BandRoomHeader from '@/components/layout/BandRoomHeader'
import RouteScrollRestorer from '@/components/layout/RouteScrollRestorer'

export default function PublicSiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <RouteScrollRestorer />
      <BandRoomHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <BandRoomFooter />
    </div>
  )
}