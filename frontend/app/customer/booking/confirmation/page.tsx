import { Suspense } from 'react'
import AuthGuard from '@/components/AuthGuard'
import BookingConfirmationClient from '@/components/booking/BookingConfirmationClient'

export default function CustomerBookingConfirmationPage() {
  return (
    <Suspense fallback={<BookingConfirmationFallback />}>
      <AuthGuard allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
        <BookingConfirmationClient />
      </AuthGuard>
    </Suspense>
  )
}

function BookingConfirmationFallback() {
  return (
    <main className="min-h-screen bg-[#F5F2EC] px-6 py-10 text-[#1A1C1E]">
      <div className="mx-auto max-w-7xl rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
        <p className="font-display text-lg font-semibold">Đang tải thông tin đặt phòng...</p>
      </div>
    </main>
  )
}
