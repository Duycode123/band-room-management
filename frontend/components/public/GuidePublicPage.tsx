import Image from 'next/image'
import Link from 'next/link'
import BandRoomFooter from '@/components/layout/BandRoomFooter'
import BandRoomHeader from '@/components/layout/BandRoomHeader'
import { faqItems, guideSteps } from '@/lib/public/mock-data'

export default function GuidePublicPage() {
  return (
    <main className="min-h-screen bg-brand-bgGray text-on-surface">
      <BandRoomHeader />

      <section className="relative overflow-hidden bg-secondary text-white">
        <Image
          src="/images/band-room-hero.png"
          alt="Không gian BandHub Studio cho buổi tập band"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-58"
        />
        <div className="absolute inset-0 bg-[linear-gradient(108deg,rgba(4,42,22,0.97)_0%,rgba(4,42,22,0.84)_48%,rgba(4,42,22,0.38)_100%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <p className="font-display text-sm font-semibold uppercase text-primary-fixed">Booking Guide</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold tracking-tight sm:text-6xl">
            Hướng dẫn đặt phòng
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/68">
            Đi từ chọn phòng đến nhận lịch trong một luồng rõ ràng, ít thao tác và dễ kiểm soát cho cả band.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {guideSteps.map((step, index) => (
            <article key={step.id} className="rounded-3xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container font-display text-sm font-bold text-on-primary-container">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className="mt-5 font-display text-xl font-bold text-on-surface">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-surface-container py-14">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="text-center">
            <p className="font-display text-sm font-semibold uppercase text-brand-orange">FAQ</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-on-surface">Câu hỏi thường gặp</h2>
          </div>

          <div className="mt-8 grid gap-4">
            {faqItems.map((item) => (
              <article key={item.id} className="rounded-3xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)]">
                <h3 className="font-display text-lg font-bold text-on-surface">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-on-surface-variant">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="rounded-3xl bg-secondary px-6 py-10 text-white shadow-[var(--shadow-elevated)] sm:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-display text-sm font-bold uppercase text-primary-fixed">Sẵn sàng lên lịch?</p>
              <h2 className="mt-2 font-display text-3xl font-bold">Chọn phòng phù hợp cho buổi tập tiếp theo.</h2>
            </div>
            <Link href="/rooms" className="btn-warm shrink-0">
              Xem phòng tập
            </Link>
          </div>
        </div>
      </section>

      <BandRoomFooter />
    </main>
  )
}
