'use client'

import type { ReactNode } from 'react'
import BandRoomHeader from '@/components/layout/BandRoomHeader'

export function CustomerPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F5F2EC] text-[#1A1C1E]">
      <BandRoomHeader />
      <section className="mx-auto max-w-6xl px-6 py-8 sm:py-10">{children}</section>
    </main>
  )
}

export function CustomerPageHeader({
  eyebrow = 'Band Room',
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description: string
}) {
  return (
    <div className="mb-6 rounded-[28px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)] md:p-8">
      <p className="font-display text-sm font-bold uppercase tracking-[0.14em] text-[#FF7518]">{eyebrow}</p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#1A1C1E]">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5C5348]">{description}</p>
    </div>
  )
}

export function CustomerCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={[
        'rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  )
}
