'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import BookingRoomCard from '@/components/booking/BookingRoomCard'
import BookingQuickModal from '@/components/booking/BookingQuickModal'
import RoomDetailModal from '@/components/booking/RoomDetailModal'
import AccountMenu from '@/components/layout/AccountMenu'
import {
  type BookingRoomAvailabilitySummary,
  type BookingRoomReviewSummary,
  mapPracticeRoomToBookingRoom,
  roomCategories,
  type BookingRoom,
} from '@/components/booking/booking-data'
import { useAuth } from '@/contexts/AuthContext'
import { useHomepageLiveData } from '@/hooks/useHomepageLiveData'
import { fetchAvailableSlots, fetchRooms } from '@/lib/booking/bookingApi'
import {
  formatRelativeTime,
  formatSlotDateLabel,
  getActivityActionLabel,
  maskCustomerName,
  type AvailabilityTone,
} from '@/lib/homepage-live-service'
import { fetchRoomReviewSummaries } from '@/lib/public-room-review-service'

const navItems = [
  { label: 'Phòng tập', href: '#rooms' },
  { label: 'Về chúng tôi', href: '#about' },
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

type RoomCatalogFilter = 'all' | string

type RoomTierFilter = {
  id: RoomCatalogFilter
  label: string
  description?: string
  count: number
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

type QuickBookingState = {
  room: BookingRoom
  initialDate?: string
  initialStartTime?: string
  initialDuration?: number
}

function getRoomTierFilterId(room: BookingRoom) {
  return room.roomTierId ? `tier-${room.roomTierId}` : `legacy-${room.category}`
}

function getRoomTierLabel(room: BookingRoom) {
  return room.roomTierName?.trim() || room.categoryLabel
}

function getRoomTierDescription(room: BookingRoom) {
  return room.roomTierDescription?.trim() || undefined
}

function getTodayRoomCatalogDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

async function fetchRoomAvailabilitySummaries(roomIds: string[]) {
  const date = getTodayRoomCatalogDate()
  const availabilityEntries = await Promise.all(
    roomIds.map(async (roomId) => {
      try {
        const slots = await fetchAvailableSlots(roomId, date)
        const firstAvailableSlot = slots.find((slot) => slot.status === 'available')
        const summary: BookingRoomAvailabilitySummary = {
          isAvailable: Boolean(firstAvailableSlot),
          nextAvailableTime: firstAvailableSlot?.start,
        }

        return [roomId, summary] as const
      } catch {
        return [roomId, undefined] as const
      }
    }),
  )

  return new Map<string, BookingRoomAvailabilitySummary | undefined>(availabilityEntries)
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
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const {
    availabilityStatus,
    recentActivities,
    nextAvailableSlot,
    isLoading: isLiveDataLoading,
    error: liveDataError,
  } = useHomepageLiveData()
  const [menuOpen, setMenuOpen] = useState(false)
  const [availabilityHintVisible, setAvailabilityHintVisible] = useState(false)
  const [rooms, setRooms] = useState<BookingRoom[]>([])
  const [isRoomCatalogLoading, setIsRoomCatalogLoading] = useState(true)
  const [roomCatalogError, setRoomCatalogError] = useState('')
  const [quickBooking, setQuickBooking] = useState<QuickBookingState | null>(null)
  const [selectedRoomDetail, setSelectedRoomDetail] = useState<BookingRoom | null>(null)
  const [activeRoomFilter, setActiveRoomFilter] = useState<RoomCatalogFilter>('all')
  useEffect(() => {
    let active = true

    void (async () => {
      setIsRoomCatalogLoading(true)
      setRoomCatalogError('')

      try {
        const practiceRooms = await fetchRooms()
        const [reviewSummaries, availabilitySummaries] = await Promise.all([
          fetchRoomReviewSummaries().catch(() => null),
          fetchRoomAvailabilitySummaries(practiceRooms.map((room) => room.id)),
        ])

        if (!active) return

        setRooms(
          practiceRooms.map((room) =>
            mapPracticeRoomToBookingRoom(room, {
              reviewSummary: reviewSummaries?.get(room.id) as BookingRoomReviewSummary | undefined,
              availabilitySummary: availabilitySummaries.get(room.id),
            }),
          ),
        )
      } catch {
        if (!active) return

        setRooms([])
        setRoomCatalogError('Không thể tải danh sách phòng từ backend lúc này.')
      } finally {
        if (!active) return

        setIsRoomCatalogLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const visibleRooms =
    activeRoomFilter === 'all' ? rooms : rooms.filter((room) => getRoomTierFilterId(room) === activeRoomFilter)
  const roomTierFilters = [
    { id: 'all' as const, label: 'Tất cả', description: 'Hiển thị toàn bộ hạng phòng hiện có.', count: rooms.length },
    ...Array.from(
      rooms.reduce((filters, room) => {
        const filterId = getRoomTierFilterId(room)
        const existingFilter = filters.get(filterId)

        if (existingFilter) {
          existingFilter.count += 1
          return filters
        }

        filters.set(filterId, {
          id: filterId,
          label: getRoomTierLabel(room),
          description: getRoomTierDescription(room),
          count: 1,
        })
        return filters
      }, new Map<string, RoomTierFilter>()),
    )
      .map(([, filter]) => filter)
      .sort((firstFilter, secondFilter) => firstFilter.label.localeCompare(secondFilter.label, 'vi')),
  ]
  const activeRoomTier = roomTierFilters.find((filter) => filter.id === activeRoomFilter) ?? roomTierFilters[0]

  useEffect(() => {
    if (roomTierFilters.some((filter) => filter.id === activeRoomFilter)) return

    setActiveRoomFilter('all')
  }, [activeRoomFilter, roomTierFilters])
  const roomCatalogStats = [
    [String(roomCategories.filter((category) => rooms.some((room) => room.category === category.id)).length), 'Hạng phòng'],
    [String(rooms.length), 'Phòng tập'],
    ['Live', 'Cập nhật lịch trống'],
  ]

  const scrollToRooms = () => {
    document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleBookingClick = () => {
    setMenuOpen(false)

    if (isAuthLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    router.push('/customer/booking')
  }

  const handleAvailabilityBadgeClick = () => {
    if (availabilityStatus.status === 'CLOSED') {
      setAvailabilityHintVisible(true)
      return
    }

    if (availabilityStatus.count > 0) {
      scrollToRooms()
    }
  }

  const handleNextSlotBooking = () => {
    if (!nextAvailableSlot) {
      scrollToRooms()
      return
    }

    const room = rooms.find((item) => item.id === nextAvailableSlot.roomId) ?? null

    if (!room) {
      handleBookingClick()
      return
    }

    setQuickBooking({
      room,
      initialDate: nextAvailableSlot.date,
      initialStartTime: nextAvailableSlot.startTime,
      initialDuration: nextAvailableSlot.duration,
    })
  }

  const handleBookRoom = (room: BookingRoom) => {
    setSelectedRoomDetail(null)
    setQuickBooking({ room })
  }

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

          <nav className="mx-auto hidden items-center gap-6 md:flex">
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
              <AccountMenu />
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
                  disabled={isAuthLoading}
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
              <div className="mt-4 flex justify-end">
                <AccountMenu align="full" onNavigate={() => setMenuOpen(false)} />
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
                  disabled={isAuthLoading}
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
              thiết bị sẵn sàng, lịch tập rõ ràng ngay từ homepage.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={scrollToRooms}
                className="rounded-lg bg-brand-orange px-6 py-3.5 font-display text-sm font-semibold text-white shadow-[0_14px_36px_rgba(255,117,24,0.35)] transition-all hover:bg-brand-orangeHover active:scale-[0.98]"
              >
                Khám phá phòng
              </button>
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

            <div className="rounded-xl border border-white/15 bg-secondary/80 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
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
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="font-display text-sm font-semibold uppercase text-brand-orange">Room Catalog</p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-on-surface sm:text-4xl">
                Khám phá phòng tập
              </h2>
              <p className="mt-4 text-base leading-7 text-on-surface-variant">
                Chọn không gian phù hợp với buổi tập, thu âm hoặc sản xuất âm nhạc của bạn.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto">
              {[
                [String(roomTierFilters.length - 1), 'Hạng phòng'],
                [String(rooms.length), 'Phòng tập'],
                ['Live', 'Cập nhật lịch trống'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl border border-outline-variant bg-white px-4 py-3 shadow-[var(--shadow-card)]">
                  <p className="font-display text-xl font-bold text-brand-orange">{value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase text-on-surface-variant">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {!isRoomCatalogLoading && rooms.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {roomTierFilters.map((filter) => {
                const active = activeRoomFilter === filter.id

                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveRoomFilter(filter.id)}
                    className={[
                      'rounded-full border px-4 py-2 font-display text-sm font-semibold transition',
                      active
                        ? 'border-brand-orange bg-brand-orange text-white shadow-[0_10px_26px_rgba(255,117,24,0.24)]'
                        : 'border-outline bg-white text-on-surface-variant hover:bg-primary-container hover:text-on-surface',
                    ].join(' ')}
                  >
                    {filter.label}
                    <span className={active ? 'ml-2 text-white/75' : 'ml-2 text-on-surface-variant'}>
                      {filter.count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="mt-8 rounded-xl border border-outline-variant bg-white px-5 py-4 shadow-[var(--shadow-card)]">
            <div>
              <p className="font-display text-sm font-bold text-on-surface">
                {activeRoomTier?.label || 'Tất cả hạng phòng'}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {roomCatalogError
                  ? roomCatalogError
                  : isRoomCatalogLoading
                    ? 'Đang tải danh sách phòng từ backend.'
                    : activeRoomTier?.description || `Đang hiển thị ${visibleRooms.length} phòng phù hợp.`}
              </p>
            </div>
          </div>

          {visibleRooms.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {isRoomCatalogLoading ? (
              <div className="rounded-xl border border-outline-variant bg-white px-5 py-8 text-center text-sm text-on-surface-variant shadow-[var(--shadow-card)] sm:col-span-2 lg:col-span-3">
                Đang tải room list từ backend...
              </div>
            ) : roomCatalogError ? (
              <div className="rounded-xl border border-[#FF7518]/25 bg-white px-5 py-8 text-center text-sm text-[#6B3200] shadow-[var(--shadow-card)] sm:col-span-2 lg:col-span-3">
                {roomCatalogError}
              </div>
            ) : visibleRooms.length > 0 ? (
              visibleRooms.map((room) => (
                  <BookingRoomCard
                    key={room.id}
                    room={room}
                    renderIcon={(name, className) => <Icon name={name} className={className} />}
                    onOpenDetail={setSelectedRoomDetail}
                    onBook={handleBookRoom}
                  />
                ))
            ) : (
              <div className="rounded-xl border border-outline-variant bg-white px-5 py-8 text-center text-sm text-on-surface-variant shadow-[var(--shadow-card)] sm:col-span-2 lg:col-span-3">
                Backend hiện chưa trả về phòng nào để hiển thị.
              </div>
            )}
            </div>
          ) : (
            <div className="mt-10 rounded-xl border border-dashed border-outline-variant bg-white px-6 py-12 text-center shadow-[var(--shadow-card)]">
              <p className="font-display text-lg font-bold text-on-surface">Chưa có phòng phù hợp</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Vui lòng thử hạng phòng khác hoặc quay lại sau khi admin thêm phòng mới.
              </p>
            </div>
          )}
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

      <footer className="bg-secondary text-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_0.9fr_1.05fr]">
            <div>
              <Link href="/" className="inline-flex items-center gap-3" aria-label="Band Room homepage">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange text-white shadow-[0_12px_30px_rgba(255,117,24,0.24)]">
                  <Icon name="music" className="h-5 w-5" />
                </span>
                <span className="font-display text-xl font-bold text-white">Band Room</span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/62">
                Đặt phòng tập nhạc trực tuyến dành cho ban nhạc, nghệ sĩ và người sáng tạo.
              </p>
              <div className="mt-6 flex gap-3" aria-label="Band Room social links">
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
                <a href="#rooms" className="transition-colors hover:text-brand-orange">
                  Phòng tập
                </a>
                <a href="#features" className="transition-colors hover:text-brand-orange">
                  Thiết bị
                </a>
                <a href="#rooms" className="transition-colors hover:text-brand-orange">
                  Bảng giá
                </a>
                <a href="#about" className="transition-colors hover:text-brand-orange">
                  Về chúng tôi
                </a>
              </nav>
            </div>

            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-white">Hỗ trợ</h3>
              <nav className="mt-5 grid gap-3 text-sm text-white/62" aria-label="Footer hỗ trợ">
                <a href="#about" className="transition-colors hover:text-brand-orange">
                  Trung tâm hỗ trợ
                </a>
                <a href="#rooms" className="transition-colors hover:text-brand-orange">
                  Chính sách đặt phòng
                </a>
                <a href="#rooms" className="transition-colors hover:text-brand-orange">
                  Chính sách hủy lịch
                </a>
                <a href="mailto:support@bandroom.local" className="transition-colors hover:text-brand-orange">
                  Liên hệ
                </a>
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
                  <span className="text-white/85">Địa chỉ:</span> Hà Nội, Việt Nam
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
                <button
                  type="button"
                  onClick={scrollToRooms}
                  className="rounded-lg bg-brand-orange px-4 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-brand-orangeHover"
                >
                  Khám phá phòng
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Band Room. All rights reserved.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <a href="#about" className="transition-colors hover:text-brand-orange">
                Điều khoản sử dụng
              </a>
              <a href="#about" className="transition-colors hover:text-brand-orange">
                Chính sách bảo mật
              </a>
            </div>
          </div>
        </div>
      </footer>

      <RoomDetailModal
        room={selectedRoomDetail}
        open={Boolean(selectedRoomDetail)}
        onClose={() => setSelectedRoomDetail(null)}
        onBook={handleBookRoom}
      />

      {quickBooking && (
        <BookingQuickModal
          room={quickBooking.room}
          open
          initialDate={quickBooking.initialDate}
          initialStartTime={quickBooking.initialStartTime}
          initialDuration={quickBooking.initialDuration}
          onClose={() => setQuickBooking(null)}
        />
      )}
    </main>
  )
}
