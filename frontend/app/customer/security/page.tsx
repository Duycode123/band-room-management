'use client'

import { useState, type FormEvent } from 'react'
import {
  CustomerCard,
  CustomerPageHeader,
  CustomerPageShell,
} from '@/components/customer/CustomerPageShell'
import { changeCustomerPassword, type ChangeCustomerPasswordPayload } from '@/lib/customer-profile-service'

const emptyForm: ChangeCustomerPasswordPayload = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export default function CustomerSecurityPage() {
  const [form, setForm] = useState<ChangeCustomerPasswordPayload>(emptyForm)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    if (!form.currentPassword.trim()) {
      return 'Vui lòng nhập mật khẩu hiện tại.'
    }
    if (form.newPassword.length < 8) {
      return 'Mật khẩu mới phải có ít nhất 8 ký tự'
    }
    if (form.newPassword !== form.confirmPassword) {
      return 'Mật khẩu xác nhận không khớp'
    }
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validate()

    if (validationError) {
      setMessage({ type: 'error', text: validationError })
      return
    }

    setIsSubmitting(true)
    setMessage(null)
    try {
      await changeCustomerPassword(form)
      setForm(emptyForm)
      setMessage({ type: 'success', text: 'Cập nhật mật khẩu thành công' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể cập nhật mật khẩu. Vui lòng thử lại.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="Bảo mật & mật khẩu"
        description="Quản lý mật khẩu và bảo vệ tài khoản của bạn."
      />

      <CustomerCard className="max-w-3xl">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <PasswordInput
            label="Mật khẩu hiện tại"
            value={form.currentPassword}
            onChange={(value) => setForm((current) => ({ ...current, currentPassword: value }))}
          />
          <PasswordInput
            label="Mật khẩu mới"
            value={form.newPassword}
            onChange={(value) => setForm((current) => ({ ...current, newPassword: value }))}
          />
          <PasswordInput
            label="Nhập lại mật khẩu mới"
            value={form.confirmPassword}
            onChange={(value) => setForm((current) => ({ ...current, confirmPassword: value }))}
          />

          {message && <MessageBox message={message} />}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-fit rounded-2xl bg-[#FF7518] px-6 font-display font-semibold text-white transition hover:bg-[#E6640F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Đang cập nhật' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </CustomerCard>
    </CustomerPageShell>
  )
}

function PasswordInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label>
      <span className="mb-1 block font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
        {label}
      </span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-[#C9C2B6] bg-white px-4 text-sm outline-none transition focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
      />
    </label>
  )
}

function MessageBox({ message }: { message: { type: 'success' | 'error'; text: string } }) {
  const isSuccess = message.type === 'success'

  return (
    <p
      className={[
        'rounded-2xl border px-4 py-3 text-sm',
        isSuccess
          ? 'border-[#0A4D27]/25 bg-[#F1F8F2] text-[#0A4D27]'
          : 'border-[#C62828]/20 bg-[#FFEBEE] text-[#C62828]',
      ].join(' ')}
    >
      {message.text}
    </p>
  )
}
