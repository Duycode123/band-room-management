import type { EquipmentStatus, EquipmentType } from './types'

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  GUITAR: 'Guitar',
  DRUM: 'Trống',
  KEYBOARD: 'Keyboard',
  AMPLIFIER: 'Amplifier',
  MICROPHONE: 'Micro',
  MONITOR: 'Loa kiểm âm',
  RECORDING: 'Thiết bị Recording',
}

export const EQUIPMENT_TYPE_OPTIONS: EquipmentType[] = [
  'GUITAR',
  'DRUM',
  'KEYBOARD',
  'AMPLIFIER',
  'MICROPHONE',
  'MONITOR',
  'RECORDING',
]

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  AVAILABLE: 'Khả dụng',
  IN_USE: 'Đang sử dụng',
  MAINTENANCE: 'Bảo trì',
  DISABLED: 'Ngưng hoạt động',
}

export const EQUIPMENT_STATUS_OPTIONS: EquipmentStatus[] = [
  'AVAILABLE',
  'IN_USE',
  'MAINTENANCE',
  'DISABLED',
]

export const EQUIPMENT_STATUS_STYLES: Record<EquipmentStatus, string> = {
  AVAILABLE: 'bg-secondary-container/30 text-secondary border-secondary-container/50',
  IN_USE: 'bg-primary-container text-on-primary-container border-primary-container/60',
  MAINTENANCE: 'bg-tertiary-container text-on-tertiary-container border-tertiary-container/50',
  DISABLED: 'bg-surface-container text-on-surface-variant border-outline-variant',
}
