'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import AuthBanner from '@/components/auth/AuthBanner'
import {
  AuthError,
  AuthField,
  AuthFormPanel,
  AuthMobileBrand,
  AuthShell,
  AuthSubmitButton,
} from '@/components/auth/AuthField'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const sent = searchParams.get('sent') === '1'
  const initialEmail = searchParams.get('email') ?? ''
  const [email, setEmail] = useState(initialEmail)
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>(
    token ? 'checking' : 'idle',
  )
  const [message, setMessage] = useState(
    sent
      ? 'Tai khoan da duoc tao. Vui long kiem tra email va bam vao lien ket xac thuc truoc khi dang nhap.'
      : '',
  )
  const [error, setError] = useState('')
  const [isResending, setIsResending] = useState(false)

  const canResend = useMemo(() => email.trim().length > 0 && !isResending, [email, isResending])

  useEffect(() => {
    if (!token) return

    let mounted = true
    setStatus('checking')
    setError('')

    api
      .post('/api/auth/verify-email', { token })
      .then(() => {
        if (!mounted) return
        setStatus('success')
        setMessage('Email da duoc xac thuc thanh cong. Ban co the dang nhap ngay bay gio.')
      })
      .catch((err: unknown) => {
        if (!mounted) return
        const axiosErr = err as { response?: { data?: { message?: string } } }
        setStatus('error')
        setError(axiosErr.response?.data?.message || 'Lien ket xac thuc khong hop le hoac da het han.')
      })

    return () => {
      mounted = false
    }
  }, [token])

  async function handleResend(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsResending(true)

    try {
      await api.post('/api/auth/resend-verification-email', { email: email.trim().toLowerCase() })
      setMessage('He thong da gui lai email xac thuc. Vui long kiem tra hop thu den va spam.')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'Khong the gui lai email xac thuc. Vui long thu lai.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthShell>
      <AuthBanner
        description="Xac thuc email giup bao ve tai khoan, giam dang ky ao va dam bao thong bao dat phong duoc gui dung nguoi."
        bullets={[
          { title: 'Bao ve tai khoan', desc: 'Chi email that moi co the kich hoat tai khoan.' },
          { title: 'Nhan thong bao', desc: 'Hoa don, lich dat va ho tro se gui ve email da xac thuc.' },
          { title: 'Giam gian lan', desc: 'Han che tao nhieu tai khoan bang email tam thoi.' },
        ]}
      />

      <AuthFormPanel>
        <AuthMobileBrand />
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface">Xac thuc email</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Hoan tat buoc nay de kich hoat tai khoan va dang nhap.
          </p>
        </div>

        {status === 'checking' && (
          <div className="mb-4 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
            Dang kiem tra lien ket xac thuc...
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}
        {error && <AuthError message={error} />}

        {status === 'success' ? (
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-brand-orange font-display text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:bg-brand-orangeHover active:scale-[0.98]"
          >
            Dang nhap
          </button>
        ) : (
          <form onSubmit={handleResend} className="space-y-4">
            <AuthField
              label="Email dang ky"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              icon="email"
            />
            <AuthSubmitButton disabled={!canResend}>
              {isResending ? 'Dang gui lai...' : 'Gui lai email xac thuc'}
            </AuthSubmitButton>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-on-surface-variant">
          Da xac thuc?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="cursor-pointer font-display font-semibold text-brand-orange hover:underline"
          >
            Quay lai dang nhap
          </button>
        </p>
      </AuthFormPanel>
    </AuthShell>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}
