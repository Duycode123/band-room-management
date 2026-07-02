'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const exploreLinks = [
  { label: 'Phòng tập', href: '/rooms' },
  { label: 'Hướng dẫn', href: '/guide' },
  { label: 'Blog', href: '/blog' },
  { label: 'Trang chủ', href: '/' },
]

const supportLinks = [
  { label: 'Trung tâm hỗ trợ', href: '/guide' },
  { label: 'Chính sách đặt phòng', href: '/guide' },
  { label: 'Chính sách hủy lịch', href: '/guide' },
  { label: 'Liên hệ', href: 'mailto:support@bandroom.local' },
]

export default function BandRoomFooter() {
  const { isAuthenticated } = useAuth()

  return (
    <footer className="bg-secondary text-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_0.9fr_1.05fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3" aria-label="BandHub Studio homepage">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange text-white shadow-[0_12px_30px_rgba(255,117,24,0.24)]">
                <LogoIcon />
              </span>
              <span className="font-display text-xl font-bold text-white">BandHub Studio</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/62">
              Đặt phòng tập nhạc trực tuyến dành cho ban nhạc, nghệ sĩ và người sáng tạo.
            </p>
            <div className="mt-6 flex gap-3" aria-label="BandHub Studio social links">
              {['IG', 'FB', 'YT'].map((item) => (
                <span
                  key={item}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 font-display text-xs font-bold text-white/70"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-white">Khám phá</h3>
            <nav className="mt-5 grid gap-3 text-sm text-white/62" aria-label="Footer khám phá">
              {exploreLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-brand-orange">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-white">Hỗ trợ</h3>
            <nav className="mt-5 grid gap-3 text-sm text-white/62" aria-label="Footer hỗ trợ">
              {supportLinks.map((item) => (
                <Link key={item.label} href={item.href} className="transition-colors hover:text-brand-orange">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-white">Liên hệ</h3>
            <div className="mt-5 space-y-3 text-sm leading-6 text-white/62">
              <p>
                <span className="text-white/85">Hotline:</span> 0900 000 000
              </p>
              <p>
                <span className="text-white/85">Email:</span>{' '}
                <a href="mailto:support@bandroom.local" className="hover:text-brand-orange">
                  support@bandroom.local
                </a>
              </p>
              <p>
                <span className="text-white/85">Địa chỉ:</span> Tòa nhà HPC Landmark, Hà Đông, Hà Nội
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {!isAuthenticated && (
                <Link
                  href="/login"
                  className="rounded-lg border border-white/15 px-4 py-2.5 font-display text-sm font-semibold text-white/82 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Đăng nhập
                </Link>
              )}
              <Link
                href="/rooms"
                className="rounded-lg bg-brand-orange px-4 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-brand-orangeHover"
              >
                Khám phá phòng
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 BandHub Studio. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/guide" className="transition-colors hover:text-brand-orange">
              Điều khoản sử dụng
            </Link>
            <Link href="/guide" className="transition-colors hover:text-brand-orange">
              Chính sách bảo mật
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function LogoIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M9 18V5l10-2v13" />
      <path d="M9 9l10-2" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  )
}
