'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { formatCurrency } from '@/components/booking/booking-data'
import BandRoomFooter from '@/components/layout/BandRoomFooter'
import BandRoomHeader from '@/components/layout/BandRoomHeader'
import {
  filterRooms,
  getAvailabilityLabel,
  getRooms,
  publicRoomCategories,
  type Room,
  type RoomAvailabilityStatus,
  type RoomCapacityFilter,
  type RoomCategory,
  type RoomFilters,
  type RoomPriceFilter,
} from '@/lib/public/mock-data'

const availabilityOptions: Array<{ value: 'all' | RoomAvailabilityStatus; label: string }> = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'AVAILABLE', label: 'Còn trống hôm nay' },
  { value: 'ALMOST_FULL', label: 'Sắp kín lịch' },
  { value: 'FULL_TODAY', label: 'Kín lịch hôm nay' },
]

const capacityOptions: Array<{ value: RoomCapacityFilter; label: string }> = [
  { value: 'all', label: 'Mọi sức chứa' },
  { value: 'small', label: '1-4 người' },
  { value: 'medium', label: '5-8 người' },
  { value: 'large', label: '9+ người' },
]

const priceOptions: Array<{ value: RoomPriceFilter; label: string }> = [
  { value: 'all', label: 'Mọi mức giá' },
  { value: 'budget', label: 'Dưới 250k/giờ' },
  { value: 'standard', label: '250k-500k/giờ' },
  { value: 'premium', label: 'Trên 500k/giờ' },
]

const defaultFilters: RoomFilters = {
  search: '',
  category: 'all',
  capacity: 'all',
  availability: 'all',
  price: 'all',
}

export default function RoomsPublicPage() {
  const [filters, setFilters] = useState<RoomFilters>(defaultFilters)
  const rooms = useMemo(() => getRooms(), [])
  const filteredRooms = useMemo(() => filterRooms(rooms, filters), [rooms, filters])

  const updateFilter = <Key extends keyof RoomFilters>(key: Key, value: RoomFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <main className="min-h-screen bg-brand-bgGray text-on-surface">
      <BandRoomHeader />

      <section className="relative overflow-hidden border-b border-outline-variant bg-secondary text-white">
        <Image
          src="/images/band-room-hero.png"
          alt="Phòng tập band với trống, ampli và micro"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-62"
        />
        <div className="absolute inset-0 bg-[linear-gradient(108deg,rgba(4,42,22,0.96)_0%,rgba(4,42,22,0.82)_48%,rgba(4,42,22,0.42)_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="font-display text-sm font-semibold uppercase text-primary-fixed">Room Catalog</p>
            <h1 className="mt-3 font-display text-5xl font-bold tracking-tight sm:text-6xl">Phòng tập</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/68">
              Chọn không gian tập phù hợp với ban nhạc của bạn.
            </p>
          </div>
          <div className="rounded-2xl border border-white/12 bg-white/8 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
            <p className="font-display text-sm font-bold text-white">Lịch phòng hôm nay</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <Metric
                value={String(rooms.filter((room) => room.availabilityStatus === 'AVAILABLE').length)}
                label="Còn trống"
              />
              <Metric
                value={String(rooms.filter((room) => room.availabilityStatus === 'ALMOST_FULL').length)}
                label="Sắp kín"
              />
              <Metric
                value={String(rooms.filter((room) => room.availabilityStatus === 'FULL_TODAY').length)}
                label="Kín lịch"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
            <label className="block">
              <span className="mb-2 block font-display text-xs font-bold uppercase text-on-surface-variant">
                Tìm phòng
              </span>
              <input
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                placeholder="Tên phòng, thiết bị, loại phòng..."
                className="input-field"
              />
            </label>

            <FilterSelect
              label="Loại phòng"
              value={filters.category}
              onChange={(value) => updateFilter('category', value as 'all' | RoomCategory)}
              options={[
                { value: 'all', label: 'Tất cả loại phòng' },
                ...publicRoomCategories.map((category) => ({ value: category.id, label: category.label })),
              ]}
            />
            <FilterSelect
              label="Sức chứa"
              value={filters.capacity}
              onChange={(value) => updateFilter('capacity', value as RoomCapacityFilter)}
              options={capacityOptions}
            />
            <FilterSelect
              label="Trạng thái"
              value={filters.availability}
              onChange={(value) => updateFilter('availability', value as 'all' | RoomAvailabilityStatus)}
              options={availabilityOptions}
            />
            <FilterSelect
              label="Khoảng giá"
              value={filters.price}
              onChange={(value) => updateFilter('price', value as RoomPriceFilter)}
              options={priceOptions}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-xl font-bold text-on-surface">{filteredRooms.length} phòng phù hợp</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Search/filter đang chạy bằng local state, sẵn sàng thay bằng API.
            </p>
          </div>
          <button type="button" onClick={() => setFilters(defaultFilters)} className="btn-secondary">
            Xóa bộ lọc
          </button>
        </div>

        {filteredRooms.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-outline-variant bg-white px-6 py-16 text-center shadow-[var(--shadow-card)]">
            <p className="font-display text-2xl font-bold text-on-surface">Không tìm thấy phòng</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
              Thử đổi từ khóa tìm kiếm hoặc nới rộng bộ lọc loại phòng, sức chứa, trạng thái lịch.
            </p>
          </div>
        )}
      </section>

      <BandRoomFooter />
    </main>
  )
}

function RoomCard({ room }: { room: Room }) {
  const availabilityStatus = room.availabilityStatus ?? 'AVAILABLE'
  const imageSrc = room.image ?? '/images/band-room-hero.png'
  const isFull = availabilityStatus === 'FULL_TODAY'

  return (
    <article className="group overflow-hidden rounded-3xl border border-outline-variant bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(26,28,30,0.12)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
        <Image
          src={imageSrc}
          alt={room.name}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className={['object-cover transition duration-300 group-hover:scale-105', room.imageClassName].join(' ')}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,42,22,0.58),transparent_58%)]" />
        <span
          className={[
            'absolute left-4 top-4 rounded-full border px-3 py-1 font-display text-xs font-bold',
            getAvailabilityClassName(availabilityStatus),
          ].join(' ')}
        >
          {getAvailabilityLabel(availabilityStatus)}
        </span>
        {typeof room.rating === 'number' && (
          <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 font-display text-xs font-bold text-on-surface">
            ★ {room.rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="p-6">
        <p className="font-display text-xs font-bold uppercase text-brand-orange">{room.categoryLabel}</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-on-surface">{room.name}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-on-surface-variant">{room.description}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <InfoPill label="Sức chứa" value={room.capacity} />
          <InfoPill label="Giá" value={`${formatCurrency(room.pricePerHour)} / giờ`} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {room.equipments.slice(0, 3).map((equipment) => (
            <span
              key={equipment}
              className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-medium text-on-surface-variant"
            >
              {equipment}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-outline-variant pt-5">
          <p className="text-sm text-on-surface-variant">{room.nextAvailableSlot ?? 'Chọn ngày phù hợp'}</p>
          <Link
            href={isFull ? '/customer/booking' : `/customer/booking?roomId=${room.id}`}
            className={isFull ? 'btn-secondary' : 'btn-warm'}
          >
            {isFull ? 'Chọn ngày khác' : 'Đặt ngay'}
          </Link>
        </div>
      </div>
    </article>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-display text-xs font-bold uppercase text-on-surface-variant">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="input-field">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-4">
      <p className="font-display text-2xl font-bold text-primary-fixed">{value}</p>
      <p className="mt-1 text-xs text-white/58">{label}</p>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-3 py-3">
      <p className="font-display text-[11px] font-bold uppercase text-on-surface-variant">{label}</p>
      <p className="mt-1 font-semibold text-on-surface">{value}</p>
    </div>
  )
}

function getAvailabilityClassName(status: RoomAvailabilityStatus) {
  if (status === 'FULL_TODAY') return 'border-outline bg-white/95 text-on-surface'
  if (status === 'ALMOST_FULL') return 'border-[#FF7518]/35 bg-[#FFF2E8] text-[#9A4A08]'
  return 'border-secondary-container/50 bg-[#E8F5EC] text-secondary'
}
