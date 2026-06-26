export type EquipmentType =
  | 'GUITAR'
  | 'DRUM'
  | 'KEYBOARD'
  | 'AMPLIFIER'
  | 'MICROPHONE'
  | 'MONITOR'
  | 'RECORDING'

export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'DISABLED'

export type AdminEquipment = {
  equipmentId: string
  equipmentCode: string
  equipmentName: string
  equipmentType: EquipmentType
  quantity: number
  availableQuantity: number
  rentalPrice: number
  status: EquipmentStatus
  description?: string
  imageUrl?: string
  /** Mock flag — block delete when true (AC-04). */
  inActiveBooking: boolean
}

export type EquipmentFilters = {
  query: string
  equipmentType: EquipmentType | 'ALL'
  status: EquipmentStatus | 'ALL'
  sortBy: 'name' | 'price' | 'quantity'
  sortOrder: 'asc' | 'desc'
}

export type EquipmentFormData = {
  equipmentName: string
  equipmentType: EquipmentType
  quantity: number
  rentalPrice: number
  status: EquipmentStatus
  description: string
  imageUrl: string
}

export type EquipmentFormErrors = Partial<Record<keyof EquipmentFormData, string>>
