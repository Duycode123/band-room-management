'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const roleDisplayNames = {
  ADMIN: 'Quản trị viên',
  STAFF: 'Nhân viên',
  CUSTOMER: 'Khách hàng',
}

const navItems = [
  { label: 'Phòng tập', href: '#rooms' },
  { label: 'Thiết bị', href: '#features' },
  { label: 'Bảng giá', href: '#rooms' },
  { label: 'Về chúng tôi', href: '#about' },
]

const liveFeed = [
  { user: 'Minh Anh', room: 'Studio A', time: '2 phút trước' },
  { user: 'The Waves', room: 'The Vault', time: '11 phút trước' },
  { user: 'Gia Huy', room: 'Pod C', time: '18 phút trước' },
]

const stats = [
  { value: '2.400+', label: 'Lượt đặt mỗi tháng' },
  { value: '48', label: 'Khung giờ mỗi ngày' },
  { value: '4.9/5', label: 'Điểm đánh giá' },
]

const features = [
  {
    icon: 'bolt',
    title: 'Đặt phòng tức thì',
    description: 'Xem lịch trống theo thời gian thực, chọn khung giờ và nhận xác nhận trong một luồng gọn gàng.',
  },
  {
    icon: 'calendar',
    title: 'Lịch tập linh hoạt',
    description: 'Đặt theo giờ, nửa buổi hoặc cả buổi. Phù hợp cho rehearsal, thu demo và luyện cá nhân.',
  },
  {
    icon: 'sliders',
    title: 'Thiết bị chuyên nghiệp',
    description: 'Trống acoustic, amp guitar, micro, mixer và monitor được chuẩn bị theo ghi chú của ban nhạc.',
  },
  {
    icon: 'shield',
    title: 'Hỗ trợ tại chỗ',
    description: 'Nhân viên studio hỗ trợ check-in, setup nhạc cụ và xử lý nhanh khi lịch tập thay đổi.',
  },
] as const

const rooms = [
  {
    id: 'studio-a',
    name: 'Studio A - Phòng Đỏ',
    type: 'Tập band đầy đủ',
    capacity: 'Tối đa 10 người',
    equipments: ['Trống Tama', 'Marshall Stack', 'Mixer 16 kênh'],
    pricePerHour: 350000,
    rating: 4.9,
    badge: 'Phổ biến nhất',
    image: '/images/band-room-hero.png',
    imageClassName: 'object-[62%_center]',
  },
  {
    id: 'the-vault',
    name: 'The Vault - Thu âm',
    type: 'Thu demo và mix nhạc',
    capacity: 'Tối đa 6 người',
    equipments: ['Console SSL', 'Genelec Monitor', 'Vocal Booth'],
    pricePerHour: 500000,
    rating: 4.8,
    badge: 'Cao cấp',
    image: '/images/band-room-hero.png',
    imageClassName: 'object-[74%_center]',
  },
  {
    id: 'practice-pod-c',
    name: 'Practice Pod C',
    type: 'Luyện tập cá nhân',
    capacity: 'Tối đa 2 người',
    equipments: ['Roland Kit', 'Fender Amp', 'AKG C414'],
    pricePerHour: 150000,
    rating: 4.7,
    badge: 'Tiết kiệm',
    image: '/images/band-room-hero.png',
    imageClassName: 'object-[45%_center]',
  },
] as const

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

const steps = [
  {
    number: '01',
    title: 'Chọn phòng',
    description: 'Lọc theo quy mô ban nhạc, loại thiết bị và ngân sách.',
  },
  {
    number: '02',
    title: 'Chọn giờ tập',
    description: 'Xem khung giờ trống và giữ chỗ ngay trong lịch.',
  },
  {
    number: '03',
    title: 'Xác nhận',
    description: 'Hoàn tất đặt phòng và nhận thông tin check-in.',
  },
]

const testimonials = [
  {
    name: 'Marcus Reeves',
    role: 'Guitarist chuyên nghiệp',
    quote:
      'Studio A làm buổi rehearsal của ban nhạc mượt hơn hẳn. Âm thanh chắc, phòng sạch và đặt lịch rất nhanh.',
  },
  {
    name: 'The Crimson Waves',
    role: 'Ban nhạc indie',
    quote:
      'Tụi mình tập hàng tuần nên phần lịch trống theo thời gian thực cực kỳ hữu ích. Không còn nhắn qua lại để giữ phòng.',
  },
]

type IconName = (typeof features)[number]['icon'] | 'music' | 'users' | 'clock' | 'star' | 'check'

function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    music: (
      <>
        <path d="M9 18V5l10-2v13" />
        <path d="M9 9l10-2" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
      </>
    ),
    bolt: <path d="M13 2 4 14h7l-1 8 10-13h-7l1-7z" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
        <circle cx="9" cy="6" r="2" />
        <circle cx="15" cy="12" r="2" />
        <circle cx="7" cy="18" r="2" />
      </>
    ),
    shield: <path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-5" />,
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    star: (
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z" />
    ),
    check: <path d="M20 6 9 17l-5-5" />,
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {paths[name]}
    </svg>
  )
}

export default function HomePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleBookingClick = () => {
    setMenuOpen(false)

    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    router.push('/customer/booking')
  }

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    router.replace('/')
  }

  const userDisplayName = user ? roleDisplayNames[user.role] : ''
  const avatarInitial = userDisplayName.trim().charAt(0).toUpperCase() || 'U'

  return (
    <main className="min-h-screen overflow-x-hidden bg-brand-bgGray text-on-surface">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-brand-bgGray/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-5 py-4 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Band Room homepage">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange text-white">
              <Icon name="music" className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold">Band Room</span>
          </Link>

          <nav className="mx-auto hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-lg px-4 py-2 font-display text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-outline bg-white/70 px-3 py-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange font-display text-xs font-bold text-white">
                    {avatarInitial}
                  </span>
                  <span className="max-w-[160px] truncate font-display text-sm font-semibold text-on-surface">
                    {userDisplayName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-lg bg-inverse-surface px-5 py-2.5 font-display text-sm font-semibold text-inverse-on-surface transition-colors hover:bg-secondary-container"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 font-display text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
                >
                  Đăng nhập
                </Link>
                <button
                  type="button"
                  onClick={handleBookingClick}
                  disabled={isLoading}
                  className="rounded-lg bg-brand-orange px-5 py-2.5 font-display text-sm font-semibold text-white shadow-[0_10px_28px_rgba(255,117,24,0.28)] transition-all hover:bg-brand-orangeHover active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
                >
                  Đặt phòng
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="ml-auto rounded-lg border border-outline bg-white/70 px-3 py-2 font-display text-sm font-semibold text-on-surface md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? 'Đóng' : 'Menu'}
          </button>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="border-t border-outline-variant bg-brand-bgGray px-5 pb-5 md:hidden">
            <nav className="grid py-2">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-outline-variant py-3 font-display text-sm font-semibold text-on-surface-variant"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            {isAuthenticated && user ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-outline bg-white px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange font-display text-sm font-bold text-white">
                    {avatarInitial}
                  </span>
                  <span className="truncate font-display text-sm font-semibold text-on-surface">{userDisplayName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="w-full rounded-lg bg-inverse-surface px-4 py-3 font-display text-sm font-semibold text-inverse-on-surface"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg border border-outline bg-white px-4 py-3 text-center font-display text-sm font-semibold text-on-surface"
                >
                  Đăng nhập
                </Link>
                <button
                  type="button"
                  onClick={handleBookingClick}
                  disabled={isLoading}
                  className="rounded-lg bg-brand-orange px-4 py-3 font-display text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
                >
                  Đặt phòng
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <section className="relative flex min-h-[720px] items-center overflow-hidden bg-secondary pt-28 text-white md:min-h-screen">
        <Image
          src="/images/band-room-hero.png"
          alt="Phòng tập band chuyên nghiệp với trống, ampli guitar và micro"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-[linear-gradient(108deg,rgba(4,42,22,0.98)_0%,rgba(4,42,22,0.88)_42%,rgba(4,42,22,0.36)_72%,rgba(4,42,22,0.64)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(to_bottom,transparent,var(--color-brand-bgGray))]" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-20 sm:px-8 lg:grid-cols-[1fr_380px]">
          <div className="max-w-3xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-orange/40 bg-white/10 px-4 py-2 font-display text-sm font-semibold text-primary-fixed">
              <span className="h-2 w-2 rounded-full bg-brand-orange" />
              Đang mở - 7 phòng còn trống hôm nay
            </div>

            <h1 className="font-display text-5xl font-bold leading-none text-white sm:text-6xl lg:text-7xl">
              Không gian của bạn.
              <span className="mt-2 block bg-[linear-gradient(90deg,var(--color-brand-orange),#FFB07A)] bg-clip-text text-transparent">
                Âm nhạc của bạn.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/70">
              Phòng tập chuyên nghiệp dành cho nhạc sĩ, ban nhạc và người sáng tạo. Đặt chỗ nhanh,
              thiết bị sẵn sàng, lịch tập rõ ràng ngay từ homepage.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleBookingClick}
                disabled={isLoading}
                className="rounded-lg bg-brand-orange px-6 py-3.5 font-display text-sm font-semibold text-white shadow-[0_14px_36px_rgba(255,117,24,0.35)] transition-all hover:bg-brand-orangeHover active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
              >
                Đặt phòng ngay
              </button>
              <a
                href="#rooms"
                className="rounded-lg border border-white/30 bg-white/10 px-6 py-3.5 font-display text-sm font-semibold text-white transition-colors hover:bg-white/15"
              >
                Khám phá phòng
              </a>
            </div>

            <div className="mt-14 grid max-w-2xl grid-cols-3 gap-5">
              {stats.map((item) => (
                <div key={item.label}>
                  <p className="font-display text-2xl font-bold text-primary-fixed sm:text-3xl">{item.value}</p>
                  <p className="mt-1 text-xs font-medium uppercase text-white/45">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="hidden space-y-3 lg:block">
            <div className="rounded-xl border border-brand-orange/30 bg-secondary/80 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-xs font-semibold uppercase text-brand-orange">Hoạt động trực tiếp</p>
                <span className="h-2 w-2 rounded-full bg-brand-orange" />
              </div>
              <div className="space-y-3">
                {liveFeed.map((item) => (
                  <div key={`${item.user}-${item.room}`} className="flex items-center justify-between gap-3 text-sm">
                    <p>
                      <span className="font-semibold text-white">{item.user}</span>
                      <span className="text-white/45"> đã đặt </span>
                      <span className="font-semibold text-primary-fixed">{item.room}</span>
                    </p>
                    <span className="shrink-0 text-xs text-white/35">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/15 bg-secondary/80 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
              <p className="font-display text-xs font-semibold uppercase text-on-secondary-container">Khung giờ tiếp theo</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="font-display text-lg font-bold text-white">Studio A</p>
                  <p className="mt-1 text-sm text-white/45">Hôm nay - 19:00 đến 22:00</p>
                </div>
                <button
                  type="button"
                  onClick={handleBookingClick}
                  className="rounded-lg bg-brand-orange px-4 py-2 font-display text-xs font-semibold text-white hover:bg-brand-orangeHover"
                >
                  Đặt
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="features" className="bg-surface-container py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="font-display text-sm font-semibold uppercase text-brand-orange">Tại sao chọn Band Room</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-on-surface sm:text-4xl">
              Từ ý tưởng tới buổi tập chỉ trong vài thao tác.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-brand-orange">
                  <Icon name={feature.icon} />
                </div>
                <h3 className="font-display text-lg font-bold text-on-surface">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-on-surface-variant">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="rooms" className="bg-brand-bgGray py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="font-display text-sm font-semibold uppercase text-brand-orange">Không gian của chúng tôi</p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-on-surface sm:text-4xl">
                Phòng phổ biến
              </h2>
            </div>
            <button
              type="button"
              onClick={handleBookingClick}
              className="w-fit rounded-lg border border-outline bg-white px-5 py-3 font-display text-sm font-semibold text-brand-orange transition-colors hover:bg-primary-container"
            >
              Xem lịch đặt phòng
            </button>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {rooms.map((room) => (
              <article
                key={room.id}
                className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
                  <Image
                    src={room.image}
                    alt={room.name}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className={`object-cover transition-transform duration-300 hover:scale-[1.03] ${room.imageClassName}`}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,42,22,0.55),transparent_58%)]" />
                  <span className="absolute left-3 top-3 rounded-full bg-primary-container px-3 py-1 font-display text-xs font-semibold text-on-primary-container">
                    {room.badge}
                  </span>
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 font-display text-xs font-semibold text-on-surface">
                    <Icon name="star" className="h-3.5 w-3.5 text-tertiary" />
                    {room.rating}
                  </span>
                </div>

                <div className="p-6">
                  <p className="font-display text-xs font-semibold uppercase text-on-surface-variant">{room.type}</p>
                  <h3 className="mt-1.5 font-display text-xl font-bold text-on-surface">{room.name}</h3>

                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1.5">
                      <Icon name="users" className="h-3.5 w-3.5" />
                      {room.capacity}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="clock" className="h-3.5 w-3.5" />
                      Tính theo giờ
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {room.equipments.map((gear) => (
                      <span
                        key={gear}
                        className="rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1 font-display text-xs font-medium text-on-surface-variant"
                      >
                        {gear}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-outline-variant pt-4">
                    <div>
                      <span className="font-display text-2xl font-bold text-on-surface">{formatCurrency(room.pricePerHour)}</span>
                      <span className="text-xs text-on-surface-variant"> / giờ</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleBookingClick}
                      className="rounded-lg bg-brand-orange px-4 py-2.5 font-display text-xs font-semibold text-white transition-colors hover:bg-brand-orangeHover"
                    >
                      Đặt ngay
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-container py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-sm font-semibold uppercase text-brand-orange">Cách thức hoạt động</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-on-surface sm:text-4xl">
              Đặt phòng chỉ trong 3 bước.
            </h2>
          </div>

          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-outline-variant md:block" />
            {steps.map((step, index) => (
              <article key={step.number} className="relative text-center">
                <div
                  className={[
                    'mx-auto flex h-20 w-20 items-center justify-center rounded-xl border font-display text-xl font-bold shadow-[var(--shadow-card)]',
                    index === 1
                      ? 'border-brand-orange bg-brand-orange text-white'
                      : 'border-outline-variant bg-white text-brand-orange',
                  ].join(' ')}
                >
                  {step.number}
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-on-surface">{step.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-on-surface-variant">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-brand-bgGray py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="font-display text-sm font-semibold uppercase text-brand-orange">Cộng đồng nhạc sĩ</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-on-surface sm:text-4xl">
              Một nơi tập luyện ấm, gọn và đủ lực cho mọi buổi diễn.
            </h2>
            <p className="mt-5 text-base leading-7 text-on-surface-variant">
              Band Room kết hợp lịch đặt phòng trực tuyến, dữ liệu phòng trống và đội ngũ studio tại chỗ để ban nhạc
              tập trung vào phần quan trọng nhất: chơi nhạc thật tốt.
            </p>
            <button
              type="button"
              onClick={handleBookingClick}
              className="mt-8 rounded-lg bg-brand-orange px-6 py-3.5 font-display text-sm font-semibold text-white shadow-[0_12px_32px_rgba(255,117,24,0.25)] transition-colors hover:bg-brand-orangeHover"
            >
              Bắt đầu đặt phòng
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)]">
                <div className="mb-4 flex gap-1 text-tertiary">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Icon key={index} name="star" className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm leading-6 text-on-surface-variant">"{item.quote}"</p>
                <div className="mt-5 border-t border-outline-variant pt-4">
                  <p className="font-display text-sm font-bold text-on-surface">{item.name}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{item.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-secondary py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange text-white">
                <Icon name="music" className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-bold">Band Room</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-white/55">
              Đặt phòng tập nhạc trực tuyến dễ dàng cho ban nhạc, nghệ sĩ và người sáng tạo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="rounded-lg border border-white/20 px-4 py-2 font-display text-sm font-semibold text-white/80 hover:bg-white/10">
              Đăng nhập
            </Link>
            <button
              type="button"
              onClick={handleBookingClick}
              className="rounded-lg bg-brand-orange px-4 py-2 font-display text-sm font-semibold text-white hover:bg-brand-orangeHover"
            >
              Đặt phòng
            </button>
          </div>
        </div>
      </footer>
    </main>
  )
}
