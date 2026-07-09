import type { EquipmentStatus, EquipmentType } from './types'

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  AMP: 'Ampli',
  MIXER: 'Bàn trộn',
  MIC: 'Micro',
  DRUM: 'Trống',
  GUITAR: 'Guitar',
  KEYBOARD: 'Đàn keyboard',
  OTHER: 'Khác',
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
  GOOD: 'Tốt',
  BROKEN: 'Hư hỏng',
  MAINTENANCE: 'Bảo trì',
}

export const EQUIPMENT_STATUS_OPTIONS: EquipmentStatus[] = ['GOOD', 'BROKEN', 'MAINTENANCE']

export const EQUIPMENT_STATUS_STYLES: Record<EquipmentStatus, string> = {
  GOOD: 'bg-secondary-container/30 text-secondary border-secondary-container/50',
  BROKEN: 'bg-error-container text-error border-error/30',
  MAINTENANCE: 'bg-tertiary-container text-on-tertiary-container border-tertiary-container/50',
}
