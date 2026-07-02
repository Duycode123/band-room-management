import type { EquipmentStatus, EquipmentType } from './types'

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  AMP: 'Amp',
  MIXER: 'Mixer',
  MIC: 'Micro',
  DRUM: 'Trong',
  GUITAR: 'Guitar',
  KEYBOARD: 'Keyboard',
  OTHER: 'Khac',
}

export const EQUIPMENT_TYPE_OPTIONS: EquipmentType[] = [
  'AMP',
  'MIXER',
  'MIC',
  'DRUM',
  'GUITAR',
  'KEYBOARD',
  'OTHER',
]

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  GOOD: 'Tot',
  BROKEN: 'Hu hong',
  MAINTENANCE: 'Bao tri',
}

export const EQUIPMENT_STATUS_OPTIONS: EquipmentStatus[] = ['GOOD', 'BROKEN', 'MAINTENANCE']

export const EQUIPMENT_STATUS_STYLES: Record<EquipmentStatus, string> = {
  GOOD: 'bg-secondary-container/30 text-secondary border-secondary-container/50',
  BROKEN: 'bg-error-container text-error border-error/30',
  MAINTENANCE: 'bg-tertiary-container text-on-tertiary-container border-tertiary-container/50',
}
