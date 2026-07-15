'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const equipmentSlides = [
  {
    title: 'Bộ trống acoustic',
    caption: 'Full kit lắp sẵn — kick, snare, tom & cymbal',
    image:
      'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=1200&q=80',
    alt: 'Bộ trống acoustic trong phòng tập',
  },
  {
    title: 'Amp guitar & bass',
    caption: 'Amp sẵn sàng, hỗ trợ DI box khi cần line-out',
    image:
      'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?auto=format&fit=crop&w=1200&q=80',
    alt: 'Amply guitar trong studio',
  },
  {
    title: 'Micro & vocal',
    caption: 'Mic động, stand và pop filter cho vocal',
    image:
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
    alt: 'Micro studio trong phòng thu',
  },
  {
    title: 'Mixer & monitor',
    caption: 'Mixer và monitor giúp nghe rõ từng nhạc cụ',
    image:
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
    alt: 'Bàn mixer âm thanh studio',
  },
  {
    title: 'Guitar sẵn sàng',
    caption: 'Không gian setup nhanh cho rehearsal',
    image:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
    alt: 'Guitar điện trên giá trong studio',
  },
  {
    title: 'Cáp & phụ kiện',
    caption: 'Jack, cáp loa, pedalboard cơ bản',
    image:
      'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&w=1200&q=80',
    alt: 'Pedalboard và phụ kiện guitar',
  },
  {
    title: 'Setup trước giờ tập',
    caption: 'Nhân viên hỗ trợ sound check tại chỗ',
    image:
      'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&w=1200&q=80',
    alt: 'Không gian phòng tập band sẵn sàng',
  },
  {
    title: 'Bass & low-end',
    caption: 'Amp bass và DI cho tiếng chắc, rõ',
    image:
      'https://images.unsplash.com/photo-1460036521480-ff49c08c2781?auto=format&fit=crop&w=1200&q=80',
    alt: 'Bass guitar trong phòng tập nhạc',
  },
] as const

type EquipmentSlide = (typeof equipmentSlides)[number]

function EquipmentCard({ slide, priority = false }: { slide: EquipmentSlide; priority?: boolean }) {
  return (
    <article className="equipment-card group relative h-[280px] w-[280px] shrink-0 overflow-hidden rounded-[22px] sm:h-[320px] sm:w-[340px] lg:h-[360px] lg:w-[380px]">
      <Image
        src={slide.image}
        alt={slide.alt}
        fill
        sizes="(max-width: 640px) 280px, (max-width: 1024px) 340px, 380px"
        priority={priority}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_28%,rgba(10,12,14,0.55)_68%,rgba(10,12,14,0.92)_100%)]"
      />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="font-display text-lg font-bold text-white sm:text-xl">{slide.title}</p>
        <p className="mt-1.5 text-sm leading-5 text-white/75">{slide.caption}</p>
      </div>
    </article>
  )
}

export default function EquipmentShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const node = sectionRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.12 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const isPaused = paused || !inView
  const loop = [...equipmentSlides, ...equipmentSlides]

  return (
    <section
      ref={sectionRef}
      id="equipment"
      className="scroll-mt-20 overflow-hidden bg-surface-container py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-brand-orange">
              Thiết bị studio
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-on-surface sm:text-4xl">
              Nhạc cụ &amp; âm thanh có sẵn trong phòng
            </h2>
            <p className="mt-4 text-base leading-7 text-on-surface-variant">
              Thiết bị đi kèm khi đặt phòng — không cần mang cả dàn nhạc. Ghi chú nhu cầu khi đặt để studio chuẩn bị
              trước giờ tập.
            </p>
          </div>
          <Link
            href="/rooms"
            className="inline-flex h-12 shrink-0 cursor-pointer items-center rounded-xl border border-outline-variant bg-white px-6 font-display text-sm font-semibold text-on-surface transition-colors hover:border-brand-orange/40 hover:text-brand-orange"
          >
            Chọn phòng có thiết bị phù hợp
          </Link>
        </div>
      </div>

      <div className="relative mt-10 sm:mt-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-surface-container to-transparent sm:w-16 lg:w-24"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-surface-container to-transparent sm:w-16 lg:w-24"
        />

        <div className="equipment-marquee-mask overflow-hidden">
          <div
            className={[
              'equipment-marquee-track equipment-marquee-left flex w-max gap-4 sm:gap-5',
              isPaused ? 'equipment-marquee-paused' : '',
            ].join(' ')}
            style={{ ['--equipment-marquee-duration' as string]: '48s' }}
          >
            {loop.map((slide, index) => (
              <div
                key={`${slide.title}-${index}`}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
                <EquipmentCard slide={slide} priority={index < 2} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
