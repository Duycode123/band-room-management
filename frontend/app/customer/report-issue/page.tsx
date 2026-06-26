'use client'

import { useState, type FormEvent } from 'react'
import {
  CustomerCard,
  CustomerPageHeader,
  CustomerPageShell,
} from '@/components/customer/CustomerPageShell'
import { submitCustomerIssueReport } from '@/lib/customer-account-service'

const issueTypes = ['Phòng tập', 'Thiết bị', 'Thanh toán', 'Tài khoản', 'Khác']

export default function CustomerReportIssuePage() {
  const [issueType, setIssueType] = useState('')
  const [bookingCode, setBookingCode] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!issueType) {
      setMessage({ type: 'error', text: 'Vui lòng chọn loại sự cố.' })
      return
    }

    if (!description.trim()) {
      setMessage({ type: 'error', text: 'Nội dung mô tả không được trống.' })
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
      setMessage({ type: 'success', text: 'Cảm ơn bạn. Chúng tôi đã ghi nhận báo cáo của bạn.' })
    } catch {
      setMessage({ type: 'error', text: 'Không thể gửi báo cáo. Vui lòng thử lại.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="Báo cáo sự cố"
        description="Gửi thông tin sự cố để đội ngũ Band Room kiểm tra và hỗ trợ bạn nhanh hơn."
      />

      <CustomerCard className="max-w-3xl">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <label>
            <span className="mb-1 block font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
              Loại sự cố
            </span>
            <select
              value={issueType}
              onChange={(event) => setIssueType(event.target.value)}
              className="h-12 w-full rounded-2xl border border-[#C9C2B6] bg-white px-4 text-sm outline-none transition focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
            >
              <option value="">Chọn loại sự cố</option>
              {issueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
              Mã đặt phòng nếu có
            </span>
            <input
              value={bookingCode}
              onChange={(event) => setBookingCode(event.target.value)}
              placeholder="Ví dụ: BR-2026-0821"
              className="h-12 w-full rounded-2xl border border-[#C9C2B6] bg-white px-4 text-sm outline-none transition placeholder:text-[#8A8176] focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
            />
          </label>

          <label>
            <span className="mb-1 block font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
              Nội dung mô tả
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
            {isSubmitting ? 'Đang gửi' : 'Gửi báo cáo'}
          </button>
        </form>
      </CustomerCard>
    </CustomerPageShell>
  )
}
