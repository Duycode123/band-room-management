'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  CustomerCard,
  CustomerPageHeader,
  CustomerPageShell,
} from '@/components/customer/CustomerPageShell'
import {
  fetchCustomerBookings,
  submitCustomerIssueReport,
  type CustomerBookingSummary,
  type ReportIssueType,
} from '@/lib/customer-account-service'

const issueTypes: Array<{ value: ReportIssueType; label: string }> = [
  { value: 'ROOM', label: 'Phong tap' },
  { value: 'EQUIPMENT', label: 'Thiet bi' },
  { value: 'PAYMENT', label: 'Thanh toan' },
  { value: 'ACCOUNT', label: 'Tai khoan' },
  { value: 'OTHER', label: 'Khac' },
]

export default function CustomerReportIssuePage() {
  const [issueType, setIssueType] = useState<ReportIssueType | ''>('')
  const [bookingCode, setBookingCode] = useState('')
  const [description, setDescription] = useState('')
  const [bookings, setBookings] = useState<CustomerBookingSummary[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true

    void fetchCustomerBookings()
      .then((items) => {
        if (mounted) {
          setBookings(items)
        }
      })
      .catch(() => {
        if (mounted) {
          setBookings([])
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!issueType) {
      setMessage({ type: 'error', text: 'Vui long chon loai su co.' })
      return
    }

    if (!description.trim()) {
      setMessage({ type: 'error', text: 'Noi dung mo ta khong duoc trong.' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)
    try {
      await submitCustomerIssueReport({
        issueType,
        bookingCode: bookingCode.trim(),
        description: description.trim(),
      })
      setIssueType('')
      setBookingCode('')
      setDescription('')
      setMessage({ type: 'success', text: 'Bao cao su co da duoc gui len backend.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Khong the gui bao cao su co.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="Bao cao su co"
        description="Gui thong tin su co de doi ngu Band Room kiem tra va ho tro ban nhanh hon."
      />

      <CustomerCard className="max-w-3xl">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <label>
            <span className="mb-1 block font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
              Loai su co
            </span>
            <select
              value={issueType}
              onChange={(event) => setIssueType(event.target.value as ReportIssueType | '')}
              className="h-12 w-full rounded-2xl border border-[#C9C2B6] bg-white px-4 text-sm outline-none transition focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
            >
              <option value="">Chon loai su co</option>
              {issueTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
              Ma dat phong neu co
            </span>
            <input
              list="customer-booking-codes"
              value={bookingCode}
              onChange={(event) => setBookingCode(event.target.value)}
              placeholder="Vi du: BR00000012"
              className="h-12 w-full rounded-2xl border border-[#C9C2B6] bg-white px-4 text-sm outline-none transition placeholder:text-[#8A8176] focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
            />
            <datalist id="customer-booking-codes">
              {bookings.map((booking) => (
                <option key={booking.code} value={booking.code}>
                  {booking.roomName}
                </option>
              ))}
            </datalist>
          </label>

          <label>
            <span className="mb-1 block font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
              Noi dung mo ta
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-[#C9C2B6] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
            />
          </label>

          {message && (
            <p
              className={[
                'rounded-2xl border px-4 py-3 text-sm',
                message.type === 'success'
                  ? 'border-[#0A4D27]/25 bg-[#F1F8F2] text-[#0A4D27]'
                  : 'border-[#C62828]/20 bg-[#FFEBEE] text-[#C62828]',
              ].join(' ')}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-fit rounded-2xl bg-[#FF7518] px-6 font-display font-semibold text-white transition hover:bg-[#E6640F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Dang gui' : 'Gui bao cao'}
          </button>
        </form>
      </CustomerCard>
    </CustomerPageShell>
  )
}
