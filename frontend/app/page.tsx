'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { shouldReopenQuickBooking } from '@/components/booking/quick-booking-draft'
import BandRoomFooter from '@/components/layout/BandRoomFooter'
import BandRoomHeader from '@/components/layout/BandRoomHeader'
import { useHomepageLiveData } from '@/hooks/useHomepageLiveData'
import {
  formatRelativeTime,
  formatSlotDateLabel,
  getActivityActionLabel,
  maskCustomerName,
  type AvailabilityTone,
} from '@/lib/homepage-live-service'

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

const steps = [
  {
    number: '01',
    title: 'Chọn phòng',
    description: 'Vào trang Phòng tập, lọc theo quy mô ban nhạc, thiết bị và ngân sách.',
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

const studioStandards = [
  {
    icon: 'music' as const,
    title: 'Âm học chuẩn studio',
    description: 'Phòng được xử lý âm vật lý, giảm vang lọt và phản xạ để ban nhạc nghe rõ từng nhạc cụ.',
  },
  {
    icon: 'sliders' as const,
    title: 'Thiết bị bảo trì định kỳ',
    description: 'Trống, amp, micro và mixer được kiểm tra trước mỗi ca để sẵn sàng cho rehearsal hoặc thu nhanh.',
  },
  {
    icon: 'users' as const,
    title: 'Đội ngũ hỗ trợ tại chỗ',
    description: 'Nhân viên studio hỗ trợ check-in, setup và xử lý thay đổi lịch ngay trong giờ ca tập.',
  },
] as const

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

function getAvailabilityBadgeClassName(tone: AvailabilityTone) {
  const toneClassName = {
    success: 'border-brand-orange/40 bg-white/10 text-primary-fixed hover:bg-white/15',
    warning: 'border-[#FF7518]/60 bg-[#FF7518]/15 text-[#FFD8B8] hover:bg-[#FF7518]/20',
    muted: 'border-white/20 bg-white/10 text-white/65 hover:bg-white/15',
  }

  return [
    'mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-left font-display text-sm font-semibold transition',
    toneClassName[tone],
  ].join(' ')
}

function getAvailabilityDotClassName(tone: AvailabilityTone) {
  const toneClassName = {
    success: 'bg-brand-orange shadow-[0_0_0_5px_rgba(255,117,24,0.16)]',
    warning: 'bg-[#FFB15F] shadow-[0_0_0_5px_rgba(255,177,95,0.16)]',
    muted: 'bg-white/45',
  }

  return ['h-2 w-2 rounded-full', toneClassName[tone]].join(' ')
}

export default function HomePage() {
  const router = useRouter()
  const {
    availabilityStatus,
    recentActivities,
    nextAvailableSlot,
    isLoading: isLiveDataLoading,
    error: liveDataError,
  } = useHomepageLiveData()
  const [availabilityHintVisible, setAvailabilityHintVisible] = useState(false)

  useEffect(() => {
    if (shouldReopenQuickBooking(window.location.search)) {
      router.replace('/rooms?reopenQuickBooking=1')
    }
  }, [router])

  const goToRooms = () => {
    router.push('/rooms')
  }

  const handleAvailabilityBadgeClick = () => {
    if (availabilityStatus.status === 'CLOSED') {
      setAvailabilityHintVisible(true)
      return
    }

    goToRooms()
  }

  const handleNextSlotBooking = () => {
    if (!nextAvailableSlot) {
      goToRooms()
      return
    }

    const params = new URLSearchParams({
      roomId: nextAvailableSlot.roomId,
      date: nextAvailableSlot.date,
      startTime: nextAvailableSlot.startTime,
      duration: String(nextAvailableSlot.duration),
    })
    router.push(`/rooms?${params.toString()}`)
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-brand-bgGray text-on-surface">
      <BandRoomHeader variant="hero" />

      <section className="relative flex min-h-[720px] items-center overflow-hidden bg-secondary pt-28 text-white md:min-h-screen">
        <Image
          src="/images/band-room-hero.png"
          alt="Phòng tập band chuyên nghiệp với trống, ampli guitar và micro"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-[linear-gradient(108deg,rgba(4,42,22,0.98)_0%,rgba(4,42,22,0.88)_42%,rgba(4,42,22,0.36)_72%,rgba(4,42,22,0.64)_100%)]" />
        <div aria-hidden className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-brand-orange/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 bottom-32 h-80 w-80 rounded-full bg-brand-greenLight/15 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_bottom,transparent,var(--color-brand-bgGray))]" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-20 sm:px-8 lg:grid-cols-[1fr_380px]">
          <div className="max-w-3xl">
            <button
              type="button"
              onClick={handleAvailabilityBadgeClick}
              className={getAvailabilityBadgeClassName(availabilityStatus.tone)}
              aria-live="polite"
            >
              <span className={getAvailabilityDotClassName(availabilityStatus.tone)} />
              <span>{isLiveDataLoading ? 'Đang cập nhật lịch phòng...' : availabilityStatus.label}</span>
            </button>

            {availabilityHintVisible && availabilityStatus.status === 'CLOSED' && (
              <p className="-mt-5 mb-8 max-w-md text-sm text-white/55">
                Bạn vẫn có thể đặt lịch cho ngày tiếp theo.
              </p>
            )}

            <h1 className="font-display text-5xl font-bold leading-none text-white sm:text-6xl lg:text-7xl">
              Không gian của bạn.
              <span className="mt-2 block bg-[linear-gradient(90deg,var(--color-brand-orange),#FFB07A)] bg-clip-text text-transparent">
                Âm nhạc của bạn.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/70">
              Phòng tập chuyên nghiệp dành cho nhạc sĩ, ban nhạc và người sáng tạo. Đặt chỗ nhanh,
              thiết bị sẵn sàng, lịch tập rõ ràng trên trang Phòng tập riêng.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/rooms"
                className="rounded-xl bg-brand-orange px-6 py-3.5 font-display text-sm font-semibold text-white shadow-[0_14px_36px_rgba(255,117,24,0.4)] transition-all hover:bg-brand-orangeHover hover:shadow-[0_18px_40px_rgba(255,117,24,0.48)] active:scale-[0.98]"
              >
                Khám phá phòng
              </Link>
              <a
                href="#process"
                className="rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 font-display text-sm font-semibold text-white/90 backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
              >
                Xem quy trình
              </a>
            </div>

            <div className="mt-14 grid max-w-2xl grid-cols-3 gap-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-md transition-colors hover:border-brand-orange/30 hover:bg-white/10"
                >
                  <p className="font-display text-2xl font-bold text-primary-fixed sm:text-3xl">{item.value}</p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-white/50">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="hidden space-y-4 lg:block">
            <div className="rounded-2xl border border-brand-orange/35 bg-secondary/60 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-xs font-semibold uppercase text-brand-orange">Hoạt động trực tiếp</p>
                <span className="h-2 w-2 rounded-full bg-brand-orange" />
              </div>
              <div className="space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between gap-3 text-sm">
                      <p>
                        <span className="font-semibold text-white">{maskCustomerName(activity.customerName)}</span>
                        <span className="text-white/45"> {getActivityActionLabel(activity.action)} </span>
                        <span className="font-semibold text-primary-fixed">{activity.roomName}</span>
                      </p>
                      <span className="shrink-0 text-xs text-white/35">{formatRelativeTime(activity.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/45">Chưa có hoạt động mới</p>
                )}
              </div>
              {liveDataError && <p className="mt-4 text-xs text-white/40">{liveDataError}</p>}
            </div>

            <div className="rounded-2xl border border-white/15 bg-secondary/60 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <p className="font-display text-xs font-semibold uppercase text-on-secondary-container">Khung giờ tiếp theo</p>
              {nextAvailableSlot ? (
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-lg font-bold text-white">{nextAvailableSlot.roomName}</p>
                    <p className="mt-1 text-sm text-white/45">
                      {formatSlotDateLabel(nextAvailableSlot.date)} · {nextAvailableSlot.startTime} đến{' '}
                      {nextAvailableSlot.endTime}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextSlotBooking}
                    className="rounded-lg bg-brand-orange px-4 py-2 font-display text-xs font-semibold text-white hover:bg-brand-orangeHover"
                  >
                    Đặt
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="font-display text-lg font-bold text-white">Hôm nay đã kín lịch</p>
                  <p className="mt-1 text-sm text-white/45">Vui lòng chọn ngày khác để đặt phòng.</p>
                  <button
                    type="button"
                    onClick={handleNextSlotBooking}
                    className="mt-4 rounded-lg border border-white/20 px-4 py-2 font-display text-xs font-semibold text-white/80 hover:bg-white/10"
                  >
                    Chọn ngày khác
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 bg-surface-container py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-brand-orange">Tại sao chọn Band Room</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-on-surface sm:text-4xl">
              Từ ý tưởng tới buổi tập chỉ trong vài thao tác.
            </h2>
            <p className="mt-4 text-base leading-7 text-on-surface-variant">
              Trải nghiệm đặt phòng mượt, thiết bị sẵn sàng và đội ngũ hỗ trợ ngay tại studio.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/25 hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-brand-orange transition-colors group-hover:bg-brand-orange group-hover:text-white">
                  <Icon name={feature.icon} />
                </div>
                <h3 className="font-display text-lg font-bold text-on-surface">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-on-surface-variant">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative scroll-mt-24 overflow-hidden bg-brand-bgGray py-20 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(26,28,30,0.05) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-brand-orange/10 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-brand-orange">Đặt phòng</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-on-surface sm:text-4xl">
              Trang Phòng tập riêng — lọc, so sánh và đặt lịch
            </h2>
            <p className="mt-4 text-base leading-7 text-on-surface-variant">
              Danh sách phòng, bộ lọc theo loại phòng, sức chứa, giá và lịch trống được tách sang trang riêng để bạn
              tập trung đặt chỗ mà không bị phân tán trên trang chủ.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/rooms"
                className="inline-flex h-12 items-center rounded-xl bg-brand-orange px-6 font-display text-sm font-semibold text-white shadow-[0_14px_32px_rgba(255,117,24,0.35)] transition-all hover:bg-brand-orangeHover active:scale-[0.98]"
              >
                Vào trang Phòng tập
              </Link>
              <Link
                href="/customer/support"
                className="inline-flex h-12 items-center rounded-xl border border-outline-variant bg-white px-6 font-display text-sm font-semibold text-on-surface transition-colors hover:border-brand-orange/40 hover:text-brand-orange"
              >
                Cần tư vấn chọn phòng
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-outline-variant bg-white p-6 shadow-[var(--shadow-elevated)]">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-orange/10 blur-2xl"
            />
            <p className="relative font-display text-sm font-bold text-on-surface">Bạn sẽ tìm thấy trên /rooms</p>
            <ul className="relative mt-5 space-y-4 text-sm leading-6 text-on-surface-variant">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-container text-brand-orange">
                  <Icon name="calendar" className="h-4 w-4" />
                </span>
                Lịch trống theo ngày và khung giờ
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-container text-brand-orange">
                  <Icon name="sliders" className="h-4 w-4" />
                </span>
                Bộ lọc loại phòng, sức chứa, giá
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-container text-brand-orange">
                  <Icon name="bolt" className="h-4 w-4" />
                </span>
                Đặt nhanh ngay trên thẻ phòng
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="process" className="scroll-mt-24 bg-surface-container py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-brand-orange">Cách thức hoạt động</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-on-surface sm:text-4xl">
              Đặt phòng chỉ trong 3 bước.
            </h2>
          </div>

          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-12 hidden h-px bg-gradient-to-r from-transparent via-outline-variant to-transparent md:block" />
            {steps.map((step) => (
              <article
                key={step.number}
                className="group relative rounded-2xl border border-outline-variant bg-white p-6 text-center shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/25 hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-outline-variant bg-primary-container font-display text-lg font-bold text-brand-orange transition-all duration-300 group-hover:border-brand-orange group-hover:bg-brand-orange group-hover:text-white group-hover:shadow-[0_12px_28px_rgba(255,117,24,0.35)]">
                  {step.number}
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-on-surface transition-colors group-hover:text-brand-orange">
                  {step.title}
                </h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-on-surface-variant">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="relative scroll-mt-24 overflow-hidden bg-gradient-to-br from-secondary via-[#06361c] to-brand-greenLight py-20 text-white sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,117,24,0.14),transparent_55%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(10,77,39,0.55),transparent_50%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-brand-orange/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <p className="font-display text-sm font-semibold uppercase text-brand-orange">Về chúng tôi</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
              Studio được xây cho những buổi tập thật — không chỉ để chụp ảnh.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/70">
              Band Room ra đời từ nhu cầu của các ban nhạc độc lập: cần không gian ổn định, thiết bị tin cậy và lịch
              đặt minh bạch. Chúng tôi kết hợp đặt phòng online với đội ngũ studio tại chỗ để bạn tập trung vào âm nhạc.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {studioStandards.map((item) => (
              <article
                key={item.title}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:border-brand-orange/35 hover:bg-white/10"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/20 text-brand-orange transition-colors group-hover:bg-brand-orange group-hover:text-white">
                  <Icon name={item.icon} />
                </div>
                <h3 className="font-display text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/65">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/12 to-white/5 p-6 backdrop-blur-md sm:p-8">
              <p className="font-display text-xs font-semibold uppercase tracking-wider text-brand-orange">
                Cộng đồng nhạc sĩ
              </p>
              <h3 className="mt-3 font-display text-2xl font-bold">Được tin dùng bởi nghệ sĩ và ban nhạc độc lập</h3>
              <ul className="mt-6 space-y-4 text-sm leading-6 text-white/70">
                <li className="flex gap-3">
                  <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
                  Hơn 2.400 lượt đặt mỗi tháng từ rehearsal đến thu demo
                </li>
                <li className="flex gap-3">
                  <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
                  Lịch trống cập nhật theo thời gian thực, giảm trùng ca tập
                </li>
                <li className="flex gap-3">
                  <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
                  Hỗ trợ setup nhạc cụ và check-in ngay tại studio
                </li>
              </ul>
              <Link
                href="/customer/support"
                className="mt-8 inline-flex rounded-lg border border-white/20 px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:border-brand-orange hover:text-brand-orange"
              >
                Liên hệ tham quan studio
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {testimonials.map((item) => (
                <article
                  key={item.name}
                  className="rounded-xl border border-white/10 bg-white p-6 text-on-surface shadow-[var(--shadow-card)]"
                >
                  <div className="mb-4 flex gap-1 text-tertiary">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Icon key={index} name="star" className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-on-surface-variant">&ldquo;{item.quote}&rdquo;</p>
                  <div className="mt-5 border-t border-outline-variant pt-4">
                    <p className="font-display text-sm font-bold text-on-surface">{item.name}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{item.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-brand-bgGray"
        />
      </section>

      <section className="relative overflow-hidden border-y border-outline-variant/60 bg-gradient-to-r from-brand-bgGray via-white to-primary-container/40 py-14 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-brand-orange/10 blur-3xl"
        />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 sm:px-8 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-brand-orange">Bắt đầu ngay</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
              Sẵn sàng cho buổi tập tiếp theo?
            </h2>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant sm:text-base">
              Chọn phòng, giữ khung giờ và bắt đầu rehearsal — tất cả trong vài phút.
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <Link
              href="/rooms"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-brand-orange px-6 font-display text-sm font-semibold text-white shadow-[0_14px_32px_rgba(255,117,24,0.35)] transition-all hover:bg-brand-orangeHover hover:shadow-[0_18px_36px_rgba(255,117,24,0.42)] active:scale-[0.98] sm:flex-none"
            >
              Khám phá phòng
            </Link>
            <Link
              href="/customer/support"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-outline-variant bg-white px-6 font-display text-sm font-semibold text-on-surface transition-colors hover:border-brand-orange/40 hover:text-brand-orange sm:flex-none"
            >
              Nhận tư vấn
            </Link>
          </div>
        </div>
      </section>

      <BandRoomFooter />
    </main>
  )
}
