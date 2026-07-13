import api from '@/lib/api'
import type { ChatbotReply, ChatbotSendOptions } from './types'

type BackendSuggestedRoom = {
  roomId?: number
  id?: number
}

type BackendChatbotReply = {
  answer: string
  suggestedQuestions?: string[]
  suggestedRooms?: BackendSuggestedRoom[]
  usedAi?: boolean
  mode?: string
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

type RoomApiItem = {
  id: number
  roomName: string
  roomType?: {
    typeName?: string
    description?: string
    pricePerHour?: number | string | null
  } | null
  maxPeople?: number | null
  status?: string | null
  imageUrl?: string | null
}

const RESPONSE_RULES: Array<{ keywords: string[]; reply: ChatbotReply }> = [
  {
    keywords: ['đặt phòng', 'dat phong', 'booking', 'đặt lịch', 'book'],
    reply: {
      content:
        'Bạn có thể đặt phòng nhanh: chọn phòng → chọn ngày & khung giờ trống → xác nhận → thanh toán. Vào **Đặt phòng** hoặc trang chủ để bắt đầu nhé!',
      quickReplies: [
        { id: 'qr-book', label: 'Hướng dẫn đặt phòng', message: 'Hướng dẫn chi tiết cách đặt phòng' },
        { id: 'qr-price', label: 'Giá thuê phòng', message: 'Giá thuê phòng bao nhiêu?' },
      ],
    },
  },
  {
    keywords: ['giá', 'gia', 'price', 'bao nhiêu', 'chi phí', 'phí'],
    reply: {
      content:
        'Giá tính theo giờ, tùy loại phòng và khung giờ. Bạn hỏi kiểu **"Có phòng nào dưới 300k?"** hoặc **"Band 4 người giá khoảng bao nhiêu?"** để mình lọc sát hơn.',
      quickReplies: [
        { id: 'qr-types', label: 'Các loại phòng', message: 'Có những loại phòng nào?' },
        { id: 'qr-budget', label: 'Dưới 300k', message: 'Có phòng nào dưới 300k một giờ không?' },
      ],
    },
  },
  {
    keywords: ['loại phòng', 'phòng nào', 'studio', 'thu âm', 'rehearsal'],
    reply: {
      content:
        'BandHub có các phòng rehearsal/band với sức chứa và thiết bị khác nhau. Cho mình biết số người hoặc thiết bị cần (micro, mixer, trống...) để gợi ý phòng phù hợp!',
    },
  },
  {
    keywords: ['hủy', 'huy', 'cancel', 'đổi lịch', 'doi lich'],
    reply: {
      content:
        'Bạn có thể hủy lịch trước giờ tập tối thiểu **24 tiếng** theo chính sách hiện tại. Vào **Lịch của tôi** để thao tác, hoặc liên hệ hỗ trợ nếu cần xử lý gấp.',
    },
  },
  {
    keywords: ['thanh toán', 'payment', 'vnpay', 'sepay', 'chuyển khoản', 'tiền mặt', 'đặt cọc'],
    reply: {
      content:
        'Thanh toán online qua VietQR/SePay. Ở checkout bạn có thể **đặt cọc 50.000đ** hoặc thanh toán toàn bộ. Booking chờ thanh toán có thể hết hạn nếu chưa hoàn tất.',
    },
  },
  {
    keywords: ['giờ mở', 'mở cửa', 'open', 'đóng cửa', 'giờ hoạt động'],
    reply: {
      content: 'Studio mở cửa từ **08:00 – 24:00** mỗi ngày. Bạn có thể đặt online theo lịch trống real-time của từng phòng.',
    },
  },
  {
    keywords: ['thiết bị', 'nhạc cụ', 'micro', 'amp', 'trống', 'mixer', 'guitar'],
    reply: {
      content:
        'Mỗi phòng có gói thiết bị riêng. Bạn có thể hỏi cụ thể: **"Phòng nào có micro và mixer?"** hoặc ghi chú nhu cầu khi đặt để nhân viên chuẩn bị.',
    },
  },
  {
    keywords: ['hướng dẫn', 'chi tiết', 'cách đặt', 'làm sao'],
    reply: {
      content:
        '**4 bước đặt phòng:**\n1. Chọn phòng phù hợp\n2. Chọn ngày & giờ trống\n3. Kiểm tra tổng tiền / mã giảm giá\n4. Xác nhận & thanh toán\n\nCần mình gợi ý phòng theo số người không?',
      quickReplies: [
        { id: 'qr-go-book', label: 'Đi tới đặt phòng', message: 'Link đặt phòng ở đâu?' },
        { id: 'qr-people', label: 'Cho 4 người', message: 'Band 4 người nên chọn phòng nào?' },
      ],
    },
  },
  {
    keywords: ['link', 'ở đâu', 'trang', 'đường dẫn'],
    reply: {
      content:
        'Đăng nhập tài khoản khách → menu **Đặt phòng**, hoặc từ trang chủ chọn **Đặt ngay** trên thẻ phòng.',
    },
  },
  {
    keywords: ['xin chào', 'hello', 'hi', 'chào', 'hey'],
    reply: {
      content: 'Chào bạn! Mình là **BandBot** của BandHub Studio. Bạn muốn đặt phòng, hỏi giá, kiểm tra lịch trống hay cần hỗ trợ gì?',
      quickReplies: [
        { id: 'qr-1', label: 'Đặt phòng', message: 'Tôi muốn đặt phòng' },
        { id: 'qr-2', label: 'Giá phòng', message: 'Giá thuê phòng bao nhiêu?' },
        { id: 'qr-3', label: 'Giờ mở cửa', message: 'Studio mở cửa mấy giờ?' },
      ],
    },
  },
]

const DEFAULT_REPLY: ChatbotReply = {
  content:
    'Mình chưa chắc về câu này — bạn thử hỏi về **đặt phòng**, **giá**, **hủy lịch** hoặc **thanh toán**. Nếu cần người thật, gọi hotline hoặc vào mục **Trợ giúp** nhé!',
  quickReplies: [
    { id: 'qr-fallback-1', label: 'Đặt phòng', message: 'Hướng dẫn đặt phòng' },
    { id: 'qr-fallback-2', label: 'Liên hệ hỗ trợ', message: 'Làm sao liên hệ nhân viên?' },
  ],
}

function toQuickReplies(questions?: string[]) {
  return (questions ?? []).slice(0, 3).map((question, index) => ({
    id: `ai-suggested-${index}`,
    label: question.length > 28 ? `${question.slice(0, 25)}...` : question,
    message: question,
  }))
}

async function sendBackendChatbotMessage(
  message: string,
  options: ChatbotSendOptions = {},
): Promise<ChatbotReply> {
  const response = await api.post<ApiEnvelope<BackendChatbotReply>>('/api/ai/chat', {
    message,
    history: options.history ?? [],
    excludeRoomIds: options.excludeRoomIds ?? [],
  })
  const payload = response.data
  if (!payload.success || !payload.data?.answer) {
    throw new Error(payload.message || 'Chatbot chưa phản hồi được')
  }

  const suggestedRoomIds = (payload.data.suggestedRooms ?? [])
    .map((room) => room.roomId ?? room.id)
    .filter((id): id is number => typeof id === 'number')

  return {
    content: payload.data.answer,
    quickReplies: toQuickReplies(payload.data.suggestedQuestions),
    usedAi: payload.data.usedAi,
    mode: payload.data.mode,
    suggestedRoomIds,
  }
}

const SUPPORT_REPLY: ChatbotReply = {
  content:
    'Bạn có thể liên hệ qua hotline **1900 xxxx** hoặc email **support@bandspace.vn**. Hoặc vào mục **Trợ giúp** để xem câu hỏi thường gặp.',
}

const ROOM_FALLBACK_QUICK_REPLIES = [
  { id: 'qr-common-booking', label: 'Cách đặt phòng', message: 'Tôi muốn đặt phòng thì làm thế nào?' },
  { id: 'qr-common-hours', label: 'Giờ mở cửa', message: 'Studio mở cửa lúc mấy giờ?' },
  { id: 'qr-common-coupon', label: 'Mã giảm giá', message: 'Có mã giảm giá nào đang dùng được không?' },
  { id: 'qr-common-support', label: 'Liên hệ hỗ trợ', message: 'Làm sao liên hệ nhân viên?' },
]

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function extractPeopleCount(normalized: string) {
  const withUnit = normalized.match(/(\d{1,3})\s*(?:nguoi|ng|khach|thanh vien|ban)\b/)
  if (withUnit) return Number(withUnit[1])

  const shortForm = normalized.match(/(?:cho|band|nhom|to)\s*(\d{1,3})\b/)
  if (shortForm) {
    const people = Number(shortForm[1])
    if (people >= 1 && people <= 50) return people
  }

  return null
}

function extractMaxPrice(normalized: string) {
  const match = normalized.match(/(?:duoi|toi da|khong qua|tam|khoang)?\s*(\d+(?:[.,]\d+)?)\s*(k|nghin|ngan|trieu|m|vnd|d|dong)/)
  if (!match) return null

  const rawValue = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(rawValue)) return null

  const unit = match[2]
  if (unit === 'k' || unit === 'nghin' || unit === 'ngan') return rawValue * 1000
  if (unit === 'trieu' || unit === 'm') return rawValue * 1000000
  return rawValue
}

function formatMoney(value: number | string | null | undefined) {
  const numberValue = typeof value === 'string' ? Number(value) : value
  if (!numberValue || Number.isNaN(numberValue)) return 'chưa có giá'
  return `${numberValue.toLocaleString('vi-VN')}đ/giờ`
}

function normalizeRoomPrice(room: RoomApiItem) {
  const value = room.roomType?.pricePerHour
  const numberValue = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(numberValue) ? Number(numberValue) : Number.MAX_SAFE_INTEGER
}

function roomSummary(room: RoomApiItem) {
  const typeName = room.roomType?.typeName ? ` - ${room.roomType.typeName}` : ''
  const capacity = room.maxPeople ? `, tối đa ${room.maxPeople} người` : ''
  const status = room.status && room.status !== 'AVAILABLE' ? `, trạng thái ${room.status}` : ''
  return `${room.roomName}${typeName}, ${formatMoney(room.roomType?.pricePerHour)}${capacity}${status}`
}

function buildRoomAdvice(room: RoomApiItem, peopleCount: number | null, maxPrice: number | null) {
  const reasons = []
  if (peopleCount != null && room.maxPeople != null && room.maxPeople >= peopleCount) {
    reasons.push(`đủ sức chứa cho ${peopleCount} người`)
  }
  if (maxPrice != null && normalizeRoomPrice(room) <= maxPrice) {
    reasons.push(`nằm trong ngân sách ${formatMoney(maxPrice)}`)
  }
  if (room.status === 'AVAILABLE') {
    reasons.push('đang sẵn sàng đặt')
  }

  const reasonText = reasons.length > 0 ? ` vì ${reasons.join(', ')}` : ''
  return `Cho nhu cầu của bạn, ưu tiên **${room.roomName}**${reasonText}. Đây là phòng ${room.roomType?.typeName ?? 'phù hợp'}, giá ${formatMoney(room.roomType?.pricePerHour)}${room.maxPeople ? `, sức chứa tối đa ${room.maxPeople} người` : ''}.`
}

const ROOM_NAME_STOPWORDS = new Set([
  'cho', 'nao', 're', 'tot', 'trong', 'co', 'voi', 'theo', 'duoi', 'tren',
  'ban', 'may', 'gi', 'dang', 'san', 'lon', 'nho', 'dep', 'hat', 'nhac',
  'karaoke', 'studio', 'band', 'rehearsal', 'thue', 'dat', 'xem', 'het',
  'all', 'moi', 'cac', 'nhung', 'mot', 'cai', 'nay', 'kia', 'ay', 'do',
  'thi', 'sao', 'nhi', 'nhe', 'di', 'khong', 'duoc', 'phu', 'hop',
  'loai', 'kieu', 'khac', 'them', 'nua', 'tim', 'tu', 'van', 'goi',
])

function isAskingOtherRooms(normalized: string) {
  return (
    normalized.includes('phong khac') ||
    normalized.includes('loai khac') ||
    normalized.includes('phong loai') ||
    normalized.includes('lua chon khac') ||
    normalized.includes('goi y khac') ||
    normalized.includes('tu van phong khac') ||
    normalized.includes('tim phong loai') ||
    normalized.includes('phong kieu khac')
  )
}

function extractRequestedRoomName(normalized: string): string | null {
  if (isAskingOtherRooms(normalized)) return null
  const match = normalized.match(/(?:phong|room)\s+([a-z0-9_-]{2,40})\b/)
  if (
    match?.[1] &&
    !ROOM_NAME_STOPWORDS.has(match[1]) &&
    !/^\d+$/.test(match[1]) &&
    !/^\d+ng$/.test(match[1])
  ) {
    return match[1]
  }
  return null
}

function roomNameMatches(roomName: string, query: string) {
  const name = normalize(roomName)
  const q = normalize(query)
  if (name === q) return true
  if (q.length >= 2 && name.includes(q)) return true
  return name.length >= 3 && q.includes(name)
}

function isAskingPrice(normalized: string) {
  return normalized.includes('gia thue') ||
    normalized.includes('gia phong') ||
    normalized.includes('bao nhieu') ||
    normalized.includes('bang gia') ||
    normalized.includes('chi phi') ||
    normalized.includes('phi thue') ||
    normalized.includes('gia cac phong')
}

async function buildPriceDbFallbackReply(): Promise<ChatbotReply | null> {
  const response = await api.get<ApiEnvelope<RoomApiItem[]>>('/api/rooms')
  const rooms = (response.data.data ?? [])
    .filter((room) => room.status !== 'MAINTENANCE')
    .filter((room) => normalizeRoomPrice(room) !== Number.MAX_SAFE_INTEGER)
    .sort((first, second) => normalizeRoomPrice(first) - normalizeRoomPrice(second))

  if (rooms.length === 0) return null

  const cheapest = rooms[0]
  const highest = rooms[rooms.length - 1]
  const byType = new Map<string, RoomApiItem>()
  rooms.forEach((room) => {
    const typeName = room.roomType?.typeName ?? 'Phòng tập'
    const existing = byType.get(typeName)
    if (!existing || normalizeRoomPrice(room) < normalizeRoomPrice(existing)) {
      byType.set(typeName, room)
    }
  })

  const typeLines = Array.from(byType.values())
    .slice(0, 4)
    .map((room) => `**${room.roomType?.typeName ?? room.roomName}** từ ${formatMoney(room.roomType?.pricePerHour)}`)
    .join('; ')

  return {
    content:
      `Giá thuê hiện dao động khoảng **${formatMoney(cheapest.roomType?.pricePerHour)} đến ${formatMoney(highest.roomType?.pricePerHour)}** tùy loại phòng. Một vài mức tham khảo: ${typeLines}. Nếu bạn cho mình số người, ngân sách và khung giờ, mình sẽ gợi ý phòng hợp nhất.`,
    quickReplies: [
      { id: 'qr-price-budget', label: 'Dưới 300k', message: 'Có phòng nào dưới 300k một giờ không?' },
      { id: 'qr-price-people', label: 'Cho 4 người', message: 'Band 4 người nên chọn phòng nào?' },
    ],
    mode: 'FRONTEND_DB_FALLBACK',
  }
}

async function buildRoomDbFallbackReply(message: string): Promise<ChatbotReply | null> {
  const normalized = normalize(message)
  const peopleCount = extractPeopleCount(normalized)
  const maxPrice = extractMaxPrice(normalized)
  const requestedRoomName = extractRequestedRoomName(normalized)
  const asksRoom =
    normalized.includes('phong') ||
    normalized.includes('band') ||
    normalized.includes('studio') ||
    normalized.includes('tap') ||
    peopleCount != null ||
    maxPrice != null ||
    requestedRoomName != null

  if (!asksRoom) return null

  const response = await api.get<ApiEnvelope<RoomApiItem[]>>('/api/rooms')
  const rooms = response.data.data ?? []
  const availableRooms = rooms.filter((room) => room.status !== 'MAINTENANCE')

  if (requestedRoomName) {
    const namedRooms = availableRooms.filter((room) => roomNameMatches(room.roomName, requestedRoomName))
    if (namedRooms.length === 0) {
      const alternatives = availableRooms.slice(0, 3).map(roomSummary).join('; ')
      return {
        content: alternatives
          ? `Mình không tìm thấy phòng tên "${requestedRoomName}" trong hệ thống. Các phòng đang có thể tham khảo: ${alternatives}. Bạn gõ đúng tên phòng nếu muốn mình tư vấn chi tiết.`
          : `Mình không tìm thấy phòng tên "${requestedRoomName}" trong hệ thống. Bạn hỏi "Cho tôi xem tất cả phòng đang có" nhé.`,
        quickReplies: ROOM_FALLBACK_QUICK_REPLIES,
        mode: 'FRONTEND_DB_FALLBACK',
      }
    }

    const room = namedRooms[0]
    return {
      content: `Thông tin phòng bạn hỏi: ${roomSummary(room)}. Bạn muốn kiểm tra lịch trống theo khung giờ cụ thể không?`,
      quickReplies: ROOM_FALLBACK_QUICK_REPLIES,
      mode: 'FRONTEND_DB_FALLBACK',
    }
  }

  if (isAskingOtherRooms(normalized)) {
    const selectedRooms = availableRooms.slice(0, 5)
    if (selectedRooms.length === 0) {
      return {
        content: 'Hiện mình chưa có phòng khác để gợi ý. Bạn thử hỏi theo số người, ngân sách hoặc khung giờ nhé.',
        quickReplies: ROOM_FALLBACK_QUICK_REPLIES,
        mode: 'FRONTEND_DB_FALLBACK',
      }
    }
    return {
      content: `Mình gợi ý thêm các phòng sau: ${selectedRooms.map(roomSummary).join('; ')}. Bạn muốn lọc theo số người, ngân sách, hay khung giờ cụ thể không?`,
      quickReplies: ROOM_FALLBACK_QUICK_REPLIES,
      mode: 'FRONTEND_DB_FALLBACK',
    }
  }

  const candidates = availableRooms
    .filter((room) => peopleCount == null || (room.maxPeople ?? 0) >= peopleCount)
    .filter((room) => maxPrice == null || normalizeRoomPrice(room) <= maxPrice)
    .sort((first, second) => {
      const capacityScore = (room: RoomApiItem) =>
        peopleCount == null || room.maxPeople == null ? Number.MAX_SAFE_INTEGER : Math.max(0, room.maxPeople - peopleCount)
      return capacityScore(first) - capacityScore(second) || normalizeRoomPrice(first) - normalizeRoomPrice(second)
    })

  if (candidates.length === 0) {
    const constraints = [
      peopleCount != null ? `${peopleCount} người` : null,
      maxPrice != null ? `ngân sách ${formatMoney(maxPrice)}` : null,
    ].filter(Boolean)
    return {
      content: constraints.length
        ? `Mình chưa thấy phòng phù hợp với ${constraints.join(' và ')}. Bạn thử nới ngân sách, giảm số người, hoặc hỏi khung giờ khác nhé.`
        : 'Hiện tại mình chưa thấy dữ liệu phòng để tư vấn chính xác. Bạn thử tải lại trang hoặc liên hệ nhân viên nhé.',
      quickReplies: ROOM_FALLBACK_QUICK_REPLIES,
      mode: 'FRONTEND_DB_FALLBACK',
    }
  }

  const selectedRooms = candidates.slice(0, 3)
  const bestRoom = selectedRooms[0]
  const otherRooms = selectedRooms.slice(1).map(roomSummary).join('; ')
  const timeHint = /\b\d{1,2}h\b/.test(normalized) || normalized.includes('toi nay') || normalized.includes('hom nay')
    ? ' Bạn bấm đặt phòng để kiểm tra lịch trống chính xác theo khung giờ vừa chọn nhé.'
    : ''
  const alternatives = otherRooms ? ` Các lựa chọn khác: ${otherRooms}.` : ''

  return {
    content: `${buildRoomAdvice(bestRoom, peopleCount, maxPrice)}${alternatives}${timeHint}`,
    quickReplies: ROOM_FALLBACK_QUICK_REPLIES,
    mode: 'FRONTEND_DB_FALLBACK',
  }
}

function matchReply(message: string): ChatbotReply {
  const normalized = normalize(message)

  if (normalized.includes('lien he') || normalized.includes('hotline') || normalized.includes('nhan vien')) {
    return SUPPORT_REPLY
  }

  const asksOpeningHours =
    normalized.includes('gio mo') ||
    normalized.includes('mo cua') ||
    normalized.includes('dong cua') ||
    normalized.includes('may gio') ||
    normalized.includes('hoat dong luc nao') ||
    normalized.includes('gio hoat dong')

  if (asksOpeningHours) {
    return {
      content:
        'Studio mở cửa từ **08:00 đến 24:00 mỗi ngày**. Bạn có thể đặt phòng online theo lịch trống của từng phòng. Nếu muốn chắc khung giờ cụ thể, bạn hỏi mình kiểu: **"Tối nay 18h-20h còn phòng nào cho 4 người?"** nhé.',
      quickReplies: [
        { id: 'qr-hours-book', label: 'Đặt phòng', message: 'Tôi muốn đặt phòng thì làm thế nào?' },
        { id: 'qr-hours-check', label: 'Kiểm tra lịch', message: 'Tối nay 18h-20h còn phòng nào cho 4 người?' },
      ],
    }
  }

  const asksBookingGuide =
    normalized.includes('toi muon dat phong') ||
    normalized.includes('muon dat phong') ||
    normalized.includes('dat phong thi lam the nao') ||
    normalized.includes('cach dat phong') ||
    normalized.includes('huong dan dat phong') ||
    normalized.includes('quy trinh dat phong')

  if (asksBookingGuide) {
    return {
      content:
        'Để đặt phòng, bạn làm theo 4 bước nhé:\n1. Chọn phòng phù hợp với số người, ngân sách và thiết bị cần dùng.\n2. Chọn ngày và khung giờ còn trống.\n3. Kiểm tra tổng tiền, nhập mã giảm giá nếu có.\n4. Xác nhận đặt phòng rồi thanh toán đặt cọc hoặc thanh toán toàn bộ qua SePay.\n\nNếu bạn cho mình biết số người và khung giờ, mình có thể gợi ý phòng phù hợp trước.',
      quickReplies: [
        { id: 'qr-guide-room', label: 'Gợi ý phòng', message: 'Band 4 người nên chọn phòng nào?' },
        { id: 'qr-guide-time', label: 'Kiểm tra giờ', message: 'Tối nay 18h-20h còn phòng nào cho 4 người?' },
      ],
    }
  }

  const peopleCount = extractPeopleCount(normalized)
  const asksRoom =
    normalized.includes('phong') ||
    normalized.includes('band') ||
    normalized.includes('studio') ||
    normalized.includes('rehearsal') ||
    normalized.includes('tap band')
  const onlyPeopleCount = peopleCount != null && normalized.replace(/\d{1,3}\s*(?:nguoi|ng|khach|thanh vien|ban)\b/, '').replace(/(?:cho|band|nhom|to)\s*\d{1,3}\b/, '').trim().length === 0
  const asksAvailability =
    normalized.includes('con trong') ||
    normalized.includes('trong khong') ||
    normalized.includes('toi nay') ||
    normalized.includes('hom nay') ||
    normalized.includes('ngay mai') ||
    /\b\d{1,2}h\b/.test(normalized)
  const asksEquipment =
    normalized.includes('thiet bi') ||
    normalized.includes('micro') ||
    normalized.includes('mic') ||
    normalized.includes('mixer') ||
    normalized.includes('amp') ||
    normalized.includes('guitar') ||
    normalized.includes('trong') ||
    normalized.includes('keyboard') ||
    normalized.includes('piano')
  const asksCoupon =
    normalized.includes('coupon') ||
    normalized.includes('ma giam gia') ||
    normalized.includes('voucher') ||
    normalized.includes('khuyen mai')

  if ((asksRoom || onlyPeopleCount) && peopleCount) {
    return {
      content:
        `Với band **${peopleCount} người**, bạn nên chọn phòng có sức chứa từ ${peopleCount} người trở lên. Nếu muốn mình lọc chính xác phòng còn trống, hãy gửi thêm khung giờ, ví dụ: **"Tối nay 18h-20h còn phòng nào cho ${peopleCount} người?"**`,
      quickReplies: ROOM_FALLBACK_QUICK_REPLIES,
    }
  }

  if ((asksRoom || asksAvailability) && asksAvailability) {
    return {
      content:
        'Mình đã hiểu bạn muốn kiểm tra phòng trống theo khung giờ này. Để tư vấn sát hơn, bạn cho mình thêm **số người** hoặc loại phòng mong muốn nhé, ví dụ: **"Tối nay 18h-20h phòng cho 4 người còn trống không?"**',
      quickReplies: ROOM_FALLBACK_QUICK_REPLIES,
    }
  }

  if (asksRoom && asksEquipment) {
    return {
      content:
        'Mình hiểu bạn đang tìm phòng theo thiết bị. Bạn có thể hỏi: **"Phòng nào có micro và mixer?"**, **"Phòng nào có trống?"** hoặc **"Phòng nào đủ setup band?"** để mình lọc theo nhu cầu cụ thể hơn.',
      quickReplies: ROOM_FALLBACK_QUICK_REPLIES,
    }
  }

  if (asksCoupon) {
    return {
      content:
        'Mã giảm giá sẽ được nhập ở bước checkout, ngay trước khi bạn xác nhận thanh toán. Nếu bạn đã có mã cụ thể, cứ gửi mã đó hoặc nhập trực tiếp trong ô **Mã giảm giá** để hệ thống kiểm tra còn hạn, điều kiện đơn tối thiểu và số tiền được giảm nhé.',
      quickReplies: [
        { id: 'qr-coupon-1', label: 'Cách nhập mã', message: 'Nhập mã giảm giá ở đâu?' },
        { id: 'qr-coupon-2', label: 'Đi đặt phòng', message: 'Tôi muốn đặt phòng và áp mã giảm giá' },
      ],
    }
  }

  for (const rule of RESPONSE_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(normalize(keyword)))) {
      return rule.reply
    }
  }

  return DEFAULT_REPLY
}

function shouldPreferRuleFallback(message: string) {
  const normalized = normalize(message)
  return normalized.includes('lam the nao') ||
    normalized.includes('lam sao') ||
    normalized.includes('cach') ||
    normalized.includes('huong dan') ||
    normalized.includes('quy trinh') ||
    normalized.includes('dat phong nhu the nao') ||
    normalized.includes('gia thue') ||
    normalized.includes('gia phong') ||
    normalized.includes('bang gia') ||
    normalized.includes('chi phi') ||
    normalized.includes('phi thue') ||
    normalized.includes('gia cac phong') ||
    normalized.includes('thanh toan') ||
    normalized.includes('dat coc') ||
    normalized.includes('sepay') ||
    normalized.includes('gio mo') ||
    normalized.includes('mo cua') ||
    normalized.includes('dong cua') ||
    normalized.includes('may gio') ||
    normalized.includes('hoat dong luc nao') ||
    normalized.includes('gio hoat dong') ||
    normalized.includes('coupon') ||
    normalized.includes('ma giam gia') ||
    normalized.includes('voucher') ||
    normalized.includes('huy') ||
    normalized.includes('doi lich') ||
    normalized.includes('lien he') ||
    normalized.includes('hotline') ||
    normalized.includes('nhan vien')
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const CHATBOT_WELCOME: ChatbotReply = {
  content:
    'Xin chào! Mình là **BandBot** — luôn sẵn sàng giúp bạn khám phá studio, đặt lịch tập và giải đáp thắc mắc nhanh.',
  quickReplies: [
    { id: 'w-1', label: 'Đặt phòng ngay', message: 'Tôi muốn đặt phòng' },
    { id: 'w-2', label: 'Xem giá phòng', message: 'Giá các phòng thế nào?' },
    { id: 'w-3', label: 'Giờ mở cửa', message: 'Studio mở cửa lúc mấy giờ?' },
    { id: 'w-4', label: 'Chính sách hủy', message: 'Hủy lịch như thế nào?' },
  ],
}

export async function sendChatbotMessage(
  message: string,
  options: ChatbotSendOptions = {},
): Promise<ChatbotReply> {
  const trimmed = message.trim()
  if (!trimmed) {
    return { content: 'Bạn gõ câu hỏi nhé — mình sẵn sàng hỗ trợ!' }
  }

  try {
    return await sendBackendChatbotMessage(trimmed, options)
  } catch {
    if (isAskingPrice(normalize(trimmed))) {
      try {
        const priceDbFallback = await buildPriceDbFallbackReply()
        if (priceDbFallback) return priceDbFallback
      } catch {
        // Continue to room fallback or static rules.
      }
    }
    if (shouldPreferRuleFallback(trimmed)) {
      await delay(650 + Math.min(trimmed.length * 12, 900))
      return matchReply(trimmed)
    }
    try {
      const roomDbFallback = await buildRoomDbFallbackReply(trimmed)
      if (roomDbFallback) return roomDbFallback
    } catch {
      // Keep the chatbot responsive even if both AI and room APIs are temporarily unavailable.
    }
    await delay(650 + Math.min(trimmed.length * 12, 900))
    return matchReply(trimmed)
  }
}
