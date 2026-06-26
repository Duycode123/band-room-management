export type RoomCategory = 'standard' | 'band' | 'recording' | 'premium'

export type RoomCategoryOption = {
  id: RoomCategory
  label: string
  description: string
}

export type BookingRoom = {
  id: string
  code: string
  name: string
  category: RoomCategory
  categoryLabel: string
  type: string
  badge: string
  rating: number
  reviews: number
  capacity: string
  location: string
  image: string
  imageClassName: string
  pricePerHour: number
  equipments: string[]
  includedEquipments: string[]
  addons: string[]
  description: string
  isAvailable: boolean
  nextAvailableTime?: string
  note: string
}

export type BookingAddOn = {
  id: string
  name: string
  price: number
}

export type RoomReview = {
  id: string
  roomId: string
  customerName: string
  rating: number
  comment: string
  createdAt: string
}

export type PaymentMethodId = 'bank_transfer' | 'e_wallet' | 'cash'

export type PaymentMethod = {
  id: PaymentMethodId
  label: string
  description: string
}

export function getTodayDateString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const DEFAULT_BOOKING_DATE = getTodayDateString()
export const DEFAULT_START_TIME = ''
export const DEFAULT_DURATION = 0
export const BOOKING_DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const
export const MEMBER_DISCOUNT = 50000
export const EMPTY_NOTE_TEXT = 'Không có ghi chú thêm.'

export const roomCategories: RoomCategoryOption[] = [
  {
    id: 'standard',
    label: 'Standard Practice',
    description: 'Luyện tập cá nhân, nhóm nhỏ, giá dễ tiếp cận.',
  },
  {
    id: 'band',
    label: 'Band Rehearsal',
    description: 'Phòng tập đầy đủ cho band rehearsal.',
  },
  {
    id: 'recording',
    label: 'Recording & Mixing',
    description: 'Thu demo, vocal, podcast và mix nhạc.',
  },
  {
    id: 'premium',
    label: 'Premium Studio',
    description: 'Không gian cao cấp, riêng tư và thiết bị tốt hơn.',
  },
]

export const bookingAddOns: BookingAddOn[] = [
  { id: 'fender-guitar', name: 'Guitar điện Fender', price: 80000 },
  { id: 'jack-cable', name: 'Dây jack dự phòng', price: 20000 },
  { id: 'mic-stand', name: 'Stand micro', price: 50000 },
  { id: 'guitar-pedal', name: 'Pedal guitar', price: 70000 },
  { id: 'monitor-headphone', name: 'Tai nghe kiểm âm', price: 60000 },
  { id: 'shure-mic', name: 'Micro Shure SM58', price: 90000 },
]

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'bank_transfer',
    label: 'Chuyển khoản ngân hàng',
    description: 'Quét mã để thanh toán',
  },
  {
    id: 'e_wallet',
    label: 'Ví điện tử',
    description: 'Bạn sẽ được chuyển đến ví điện tử sau khi xác nhận đặt phòng.',
  },
  {
    id: 'cash',
    label: 'Thanh toán tại quầy',
    description: 'Vui lòng thanh toán tại quầy khi đến nhận phòng.',
  },
]

export const roomReviews: RoomReview[] = [
  {
    id: 'review-1',
    roomId: 'studio-a',
    customerName: 'Minh Anh',
    rating: 5,
    comment: 'Phòng cách âm tốt, trống và ampli hoạt động ổn định. Nhân viên hỗ trợ nhanh.',
    createdAt: '2026-06-24T10:30:00',
  },
  {
    id: 'review-2',
    roomId: 'studio-a',
    customerName: 'Hoàng Phúc',
    rating: 4,
    comment: 'Không gian sạch, setup nhanh. Phù hợp cho band tập trước buổi diễn.',
    createdAt: '2026-06-22T18:15:00',
  },
  {
    id: 'review-3',
    roomId: 'studio-b',
    customerName: 'Lan Hương',
    rating: 5,
    comment: 'Monitor nghe rõ, phòng vừa đủ cho band 5 người và nhân viên set line rất nhanh.',
    createdAt: '2026-06-23T20:10:00',
  },
  {
    id: 'review-4',
    roomId: 'practice-pod-a',
    customerName: 'Quang Huy',
    rating: 4,
    comment: 'Pod gọn, sạch và giá hợp lý cho luyện cá nhân trước giờ diễn.',
    createdAt: '2026-06-21T09:45:00',
  },
  {
    id: 'review-5',
    roomId: 'the-vault',
    customerName: 'The Waves',
    rating: 5,
    comment: 'Phòng thu âm rất ổn, monitor rõ, vocal booth yên tĩnh.',
    createdAt: '2026-06-20T14:00:00',
  },
  {
    id: 'review-6',
    roomId: 'the-vault',
    customerName: 'Bảo Trân',
    rating: 5,
    comment: 'Thu vocal demo rất mượt, kỹ thuật viên hỗ trợ chỉnh gain kỹ.',
    createdAt: '2026-06-18T16:25:00',
  },
  {
    id: 'review-7',
    roomId: 'amber-live-room',
    customerName: 'Duy Khang',
    rating: 5,
    comment: 'Không gian rộng, ánh sáng đẹp, quay live session lên hình rất ổn.',
    createdAt: '2026-06-19T19:00:00',
  },
  {
    id: 'review-8',
    roomId: 'producer-suite-vip',
    customerName: 'Mai Linh',
    rating: 5,
    comment: 'Suite riêng tư, bàn producer tiện và loa kiểm âm nghe chi tiết.',
    createdAt: '2026-06-17T11:20:00',
  },
]

const image = '/images/band-room-hero.png'

export const bookingRooms: BookingRoom[] = [
  {
    id: 'practice-pod-a',
    code: 'BR-2026-0801',
    name: 'Practice Pod A',
    category: 'standard',
    categoryLabel: 'Standard Practice',
    type: 'Luyện tập cá nhân',
    badge: 'Tiết kiệm',
    rating: 4.6,
    reviews: 186,
    capacity: 'Tối đa 2 người',
    location: 'Tầng 1, Band Room Studio',
    image,
    imageClassName: 'object-[38%_center]',
    pricePerHour: 120000,
    equipments: ['Roland Kit', 'Fender Champ', 'Tai nghe kiểm âm'],
    includedEquipments: ['Roland Kit', 'Fender Champ', 'Tai nghe kiểm âm', 'Stand nhạc'],
    addons: ['Dây jack dự phòng', 'Stand micro', 'Backing track setup'],
    description: 'Không gian nhỏ gọn cho luyện cá nhân, warm-up trước show hoặc tập kỹ thuật.',
    isAvailable: true,
    nextAvailableTime: '10:00',
    note: 'Phù hợp luyện cá nhân, vui lòng giữ âm lượng trong ngưỡng phòng nhỏ.',
  },
  {
    id: 'practice-pod-b',
    code: 'BR-2026-0802',
    name: 'Practice Pod B',
    category: 'standard',
    categoryLabel: 'Standard Practice',
    type: 'Luyện nhóm nhỏ',
    badge: 'Linh hoạt',
    rating: 4.7,
    reviews: 204,
    capacity: 'Tối đa 3 người',
    location: 'Tầng 1, Band Room Studio',
    image,
    imageClassName: 'object-[48%_center]',
    pricePerHour: 140000,
    equipments: ['Yamaha DTX', 'Vox AC15', 'Mixer 8 kênh'],
    includedEquipments: ['Yamaha DTX', 'Vox AC15', 'Mixer 8 kênh', 'Micro Shure'],
    addons: ['Guitar điện Fender', 'Dây jack dự phòng', 'Tai nghe kiểm âm'],
    description: 'Phòng luyện nhóm nhỏ với setup nhanh, phù hợp acoustic session và duo rehearsal.',
    isAvailable: true,
    nextAvailableTime: '13:00',
    note: 'Ưu tiên setup nhanh cho nhóm nhỏ và kiểm tra monitor trước giờ vào phòng.',
  },
  {
    id: 'practice-pod-c',
    code: 'BR-2026-0803',
    name: 'Practice Pod C',
    category: 'standard',
    categoryLabel: 'Standard Practice',
    type: 'Luyện tập cá nhân',
    badge: 'Tiết kiệm',
    rating: 4.7,
    reviews: 342,
    capacity: 'Tối đa 2 người',
    location: 'Tầng 1, Band Room Studio',
    image,
    imageClassName: 'object-[45%_center]',
    pricePerHour: 150000,
    equipments: ['Roland Kit', 'Fender Amp', 'AKG C414'],
    includedEquipments: ['Roland Kit', 'Fender Amp', 'AKG C414', 'Tai nghe kiểm âm'],
    addons: ['Backing track setup', 'Dây jack dự phòng', 'Stand nhạc'],
    description: 'Pod luyện cá nhân có micro tốt hơn cho vocal take nhanh hoặc luyện nhạc cụ chính.',
    isAvailable: false,
    nextAvailableTime: 'Ngày mai 09:00',
    note: 'Phù hợp luyện cá nhân, vui lòng giữ âm lượng trong ngưỡng phòng nhỏ.',
  },
  {
    id: 'studio-a',
    code: 'BR-2026-0821',
    name: 'Studio A - Phòng Đỏ',
    category: 'band',
    categoryLabel: 'Band Rehearsal',
    type: 'Tập band đầy đủ',
    badge: 'Phổ biến nhất',
    rating: 4.9,
    reviews: 218,
    capacity: 'Tối đa 10 người',
    location: 'Tầng 2, Band Room Studio',
    image,
    imageClassName: 'object-[62%_center]',
    pricePerHour: 350000,
    equipments: ['Trống Tama', 'Marshall Stack', 'Mixer 16 kênh'],
    includedEquipments: ['Trống Tama', 'Marshall Stack', 'Mixer 16 kênh', 'Micro Shure'],
    addons: ['Guitar điện Fender', 'Dây jack dự phòng', 'Stand micro'],
    description: 'Phòng rehearsal chủ lực cho band đầy đủ, âm thanh cân bằng và sân khấu nhỏ.',
    isAvailable: true,
    nextAvailableTime: '19:00',
    note: 'Cần chuẩn bị phòng trước 15 phút, ưu tiên âm thanh vocal rõ.',
  },
  {
    id: 'studio-b',
    code: 'BR-2026-0822',
    name: 'Studio B - Phòng Xanh',
    category: 'band',
    categoryLabel: 'Band Rehearsal',
    type: 'Rehearsal nhóm vừa',
    badge: 'Cân bằng',
    rating: 4.8,
    reviews: 176,
    capacity: 'Tối đa 8 người',
    location: 'Tầng 2, Band Room Studio',
    image,
    imageClassName: 'object-[68%_center]',
    pricePerHour: 320000,
    equipments: ['Pearl Export', 'Orange Combo', 'Mixer 12 kênh'],
    includedEquipments: ['Pearl Export', 'Orange Combo', 'Mixer 12 kênh', 'Monitor wedge'],
    addons: ['Micro Shure SM58', 'Pedal guitar', 'Dây jack dự phòng'],
    description: 'Không gian rehearsal ấm, hợp band indie, pop-rock và buổi tập setlist dài.',
    isAvailable: true,
    nextAvailableTime: '17:00',
    note: 'Chuẩn bị monitor rõ vocal và line guitar sạch.',
  },
  {
    id: 'studio-c',
    code: 'BR-2026-0823',
    name: 'Studio C - Phòng Gỗ',
    category: 'band',
    categoryLabel: 'Band Rehearsal',
    type: 'Rehearsal âm thanh mộc',
    badge: 'Âm ấm',
    rating: 4.8,
    reviews: 149,
    capacity: 'Tối đa 9 người',
    location: 'Tầng 2, Band Room Studio',
    image,
    imageClassName: 'object-[58%_center]',
    pricePerHour: 380000,
    equipments: ['Gretsch Kit', 'Fender Twin', 'Mixer 16 kênh'],
    includedEquipments: ['Gretsch Kit', 'Fender Twin', 'Mixer 16 kênh', 'Bass amp Ampeg'],
    addons: ['Guitar điện Fender', 'Micro Shure SM58', 'Stand micro'],
    description: 'Phòng xử lý âm mộc, phù hợp jazz, soul, acoustic band và rehearsal cần độ chi tiết.',
    isAvailable: true,
    nextAvailableTime: '20:00',
    note: 'Ưu tiên setup acoustic và giảm bleed cho vocal.',
  },
  {
    id: 'the-vault',
    code: 'BR-2026-0831',
    name: 'The Vault - Thu âm',
    category: 'recording',
    categoryLabel: 'Recording & Mixing',
    type: 'Thu demo và mix nhạc',
    badge: 'Cao cấp',
    rating: 4.8,
    reviews: 157,
    capacity: 'Tối đa 6 người',
    location: 'Tầng 3, Band Room Studio',
    image,
    imageClassName: 'object-[74%_center]',
    pricePerHour: 500000,
    equipments: ['Console SSL', 'Genelec Monitor', 'Vocal Booth'],
    includedEquipments: ['Console SSL', 'Genelec Monitor', 'Vocal Booth', 'Rack outboard'],
    addons: ['Kỹ thuật viên thu âm', 'Micro condenser', 'Gói mix nhanh'],
    description: 'Phòng thu kín, kiểm âm chuẩn để thu demo, vocal, podcast và overdub.',
    isAvailable: true,
    nextAvailableTime: '15:00',
    note: 'Ưu tiên chuẩn bị vocal booth và kiểm tra monitor trước giờ vào phòng.',
  },
  {
    id: 'vocal-booth-pro',
    code: 'BR-2026-0832',
    name: 'Vocal Booth Pro',
    category: 'recording',
    categoryLabel: 'Recording & Mixing',
    type: 'Thu vocal chuyên dụng',
    badge: 'Vocal',
    rating: 4.9,
    reviews: 133,
    capacity: 'Tối đa 3 người',
    location: 'Tầng 3, Band Room Studio',
    image,
    imageClassName: 'object-[70%_center]',
    pricePerHour: 420000,
    equipments: ['Neumann TLM', 'Apollo Interface', 'Closed Booth'],
    includedEquipments: ['Neumann TLM', 'Apollo Interface', 'Closed Booth', 'Pop filter'],
    addons: ['Kỹ thuật viên thu âm', 'Tai nghe kiểm âm', 'Micro Shure SM58'],
    description: 'Booth khô, sạch, chuyên cho vocal lead, harmony, voice-over và podcast.',
    isAvailable: false,
    nextAvailableTime: 'Ngày mai 10:00',
    note: 'Kiểm tra lyric stand và headphone mix trước giờ thu.',
  },
  {
    id: 'mix-suite-01',
    code: 'BR-2026-0833',
    name: 'Mix Suite 01',
    category: 'recording',
    categoryLabel: 'Recording & Mixing',
    type: 'Mixing và production',
    badge: 'Mix room',
    rating: 4.9,
    reviews: 119,
    capacity: 'Tối đa 4 người',
    location: 'Tầng 3, Band Room Studio',
    image,
    imageClassName: 'object-[64%_center]',
    pricePerHour: 550000,
    equipments: ['Genelec 8351', 'SSL UC1', 'MIDI Station'],
    includedEquipments: ['Genelec 8351', 'SSL UC1', 'MIDI Station', 'Reference DAC'],
    addons: ['Kỹ thuật viên thu âm', 'Gói mix nhanh', 'Tai nghe kiểm âm'],
    description: 'Suite kiểm âm chi tiết cho mixing, arrangement và production session cùng producer.',
    isAvailable: true,
    nextAvailableTime: '18:00',
    note: 'Mang project file và reference track để setup phiên nhanh hơn.',
  },
  {
    id: 'amber-live-room',
    code: 'BR-2026-0841',
    name: 'Amber Live Room',
    category: 'premium',
    categoryLabel: 'Premium Studio',
    type: 'Live room cao cấp',
    badge: 'VIP',
    rating: 5,
    reviews: 94,
    capacity: 'Tối đa 14 người',
    location: 'Tầng 4, Band Room Studio',
    image,
    imageClassName: 'object-[56%_center]',
    pricePerHour: 650000,
    equipments: ['DW Collector', 'Mesa Stack', 'Stage Lighting'],
    includedEquipments: ['DW Collector', 'Mesa Stack', 'Stage Lighting', 'In-ear monitor'],
    addons: ['Kỹ thuật viên thu âm', 'Guitar điện Fender', 'Micro Shure SM58'],
    description: 'Live room rộng, ánh sáng đẹp, phù hợp rehearsal cao cấp và quay session live.',
    isAvailable: true,
    nextAvailableTime: '21:00',
    note: 'Chuẩn bị ánh sáng sân khấu và line check đầy đủ trước giờ vào phòng.',
  },
  {
    id: 'black-forest-studio',
    code: 'BR-2026-0842',
    name: 'Black Forest Studio',
    category: 'premium',
    categoryLabel: 'Premium Studio',
    type: 'Studio riêng tư',
    badge: 'Riêng tư',
    rating: 4.9,
    reviews: 87,
    capacity: 'Tối đa 12 người',
    location: 'Tầng 4, Band Room Studio',
    image,
    imageClassName: 'object-[78%_center]',
    pricePerHour: 720000,
    equipments: ['Ludwig Kit', 'Marshall JVM', 'Private Lounge'],
    includedEquipments: ['Ludwig Kit', 'Marshall JVM', 'Private Lounge', 'Premium monitors'],
    addons: ['Kỹ thuật viên thu âm', 'Pedal guitar', 'Stand micro'],
    description: 'Phòng premium có lounge riêng cho band cần không gian kín và trải nghiệm chỉn chu.',
    isAvailable: false,
    nextAvailableTime: 'Ngày mai 14:00',
    note: 'Chuẩn bị lounge và setup riêng theo yêu cầu khách VIP.',
  },
  {
    id: 'producer-suite-vip',
    code: 'BR-2026-0843',
    name: 'Producer Suite VIP',
    category: 'premium',
    categoryLabel: 'Premium Studio',
    type: 'Production suite VIP',
    badge: 'Producer',
    rating: 5,
    reviews: 76,
    capacity: 'Tối đa 8 người',
    location: 'Tầng 4, Band Room Studio',
    image,
    imageClassName: 'object-[72%_center]',
    pricePerHour: 900000,
    equipments: ['SSL Console', 'Focal Trio', 'Producer Desk'],
    includedEquipments: ['SSL Console', 'Focal Trio', 'Producer Desk', 'Private assistant'],
    addons: ['Kỹ thuật viên thu âm', 'Gói mix nhanh', 'Micro condenser'],
    description: 'Suite cao cấp nhất cho production camp, mix review và buổi làm việc riêng với producer.',
    isAvailable: true,
    nextAvailableTime: '16:00',
    note: 'Chuẩn bị reference monitor, session template và không gian tiếp khách.',
  },
]

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

export function getReviewsByRoomId(roomId: string) {
  return roomReviews
    .filter((review) => review.roomId === roomId)
    .sort((firstReview, secondReview) => Date.parse(secondReview.createdAt) - Date.parse(firstReview.createdAt))
}

export function getAverageRating(reviews: RoomReview[]) {
  if (reviews.length === 0) return 0

  const totalRating = reviews.reduce((total, review) => total + review.rating, 0)
  return totalRating / reviews.length
}

export function maskCustomerName(customerName: string) {
  const parts = customerName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Khách hàng'
  if (parts.length === 1) return parts[0]

  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}

export function formatRelativeTime(createdAt: string) {
  const createdDate = new Date(createdAt)

  if (Number.isNaN(createdDate.getTime())) {
    return 'Gần đây'
  }

  const now = new Date()
  const diffInMilliseconds = now.getTime() - createdDate.getTime()
  const diffInDays = Math.max(0, Math.floor(diffInMilliseconds / 86400000))

  if (diffInDays === 0) return 'Hôm nay'
  if (diffInDays === 1) return '1 ngày trước'
  if (diffInDays < 30) return `${diffInDays} ngày trước`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths === 1) return '1 tháng trước'

  return `${diffInMonths} tháng trước`
}

export function findBookingRoom(roomId: string | null) {
  return bookingRooms.find((room) => room.id === roomId) ?? null
}

export function getBookingRoomOrFallback(roomId: string | null) {
  return findBookingRoom(roomId) ?? bookingRooms[0]
}

export function normalizeDuration(value: string | number | null) {
  const duration = Number(value)
  return Number.isInteger(duration) && duration >= 0 && duration <= 8 ? duration : DEFAULT_DURATION
}

export function getRoomSubtotal(room: BookingRoom, duration: number) {
  return room.pricePerHour * duration
}

export function parseAddonIds(value: string | null) {
  if (!value) return []

  const validIds = new Set(bookingAddOns.map((addon) => addon.id))
  return value
    .split(',')
    .map((id) => id.trim())
    .filter((id, index, ids) => validIds.has(id) && ids.indexOf(id) === index)
}

export function getSelectedAddOns(addonIds: string[]) {
  const selectedIds = new Set(addonIds)
  return bookingAddOns.filter((addon) => selectedIds.has(addon.id))
}

export function getAddOnsTotal(addOns: BookingAddOn[]) {
  return addOns.reduce((total, addon) => total + addon.price, 0)
}

export function getBookingTotal(room: BookingRoom, duration: number, addOnsTotal = 0) {
  return Math.max(0, getRoomSubtotal(room, duration) + addOnsTotal - MEMBER_DISCOUNT)
}

export function calculateEndTime(startTime: string, duration: number) {
  const [hourValue, minuteValue] = startTime.split(':').map(Number)
  const hour = Number.isFinite(hourValue) ? hourValue : 0
  const minute = Number.isFinite(minuteValue) ? minuteValue : 0
  const endHour = (hour + duration) % 24

  return `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
