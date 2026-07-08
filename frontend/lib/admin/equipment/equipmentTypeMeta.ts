import type { EquipmentType } from './types'

export const EQUIPMENT_TYPE_META: Record<
  EquipmentType,
  { gradient: string; iconLetter: string; emoji: string }
> = {
  AMP: {
    gradient: 'from-slate-600/20 via-slate-400/10 to-surface-container-high',
    iconLetter: 'A',
    emoji: 'S',
  },
  MIXER: {
    gradient: 'from-cyan-500/20 via-sky-400/10 to-secondary-container/30',
    iconLetter: 'M',
    emoji: 'M',
  },
  MIC: {
    gradient: 'from-sky-500/20 via-blue-400/10 to-secondary-container/30',
    iconLetter: 'I',
    emoji: 'Mic',
  },
  DRUM: {
    gradient: 'from-rose-500/20 via-red-400/10 to-error-container',
    iconLetter: 'D',
    emoji: 'D',
  },
  GUITAR: {
    gradient: 'from-amber-500/20 via-orange-400/10 to-primary-container',
    iconLetter: 'G',
    emoji: 'G',
  },
  KEYBOARD: {
    gradient: 'from-violet-500/20 via-purple-400/10 to-tertiary-container',
    iconLetter: 'K',
    emoji: 'K',
  },
  OTHER: {
    gradient: 'from-emerald-500/20 via-green-400/10 to-secondary-container/20',
    iconLetter: 'O',
    emoji: 'O',
  },
}
