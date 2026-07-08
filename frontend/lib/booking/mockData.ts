import type { PracticeRoom } from './types'

export const PRACTICE_ROOMS: PracticeRoom[] = [
  {
    id: 'room-a',
    name: 'Studio A — Acoustic',
    capacity: 4,
    pricePerHour: 120_000,
    equipment: ['Trống', 'Amp guitar', 'Bàn mixer'],
  },
  {
    id: 'room-b',
    name: 'Studio B — Band',
    capacity: 6,
    pricePerHour: 180_000,
    equipment: ['Full drum kit', 'Bass amp', 'Mic vocal'],
  },
  {
    id: 'room-c',
    name: 'Studio C — VIP',
    capacity: 8,
    pricePerHour: 250_000,
    equipment: ['Piano điện', 'Monitor', 'Cách âm cao cấp'],
    isVip: true,
  },
  {
    id: 'room-d',
    name: 'Studio D — Rehearsal',
    capacity: 5,
    pricePerHour: 150_000,
    equipment: ['PA system', 'Mic', 'Stand nhạc cụ'],
  },
]
