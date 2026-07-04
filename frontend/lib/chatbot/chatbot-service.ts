import type { ChatbotReply } from './types'

const RESPONSE_RULES: Array<{ keywords: string[]; reply: ChatbotReply }> = [
  {
    keywords: ['đặt phòng', 'dat phong', 'booking', 'đặt lịch', 'book'],
    reply: {
      content:
        'Bạn có thể đặt phòng trong vài bước: chọn studio → chọn ngày & khung giờ trống → xác nhận. Vào **Đặt phòng** hoặc trang chủ phần Room Catalog để bắt đầu nhé!',
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
        'Giá phụ thuộc loại phòng và khung giờ (thường tính theo giờ). Studio rehearsal từ ~350.000đ/giờ, phòng thu âm cao hơn. Bạn chọn phòng cụ thể để xem giá chính xác trên lịch trống.',
      quickReplies: [
        { id: 'qr-types', label: 'Các loại phòng', message: 'Có những loại phòng nào?' },
      ],
    },
  },
  {
    keywords: ['loại phòng', 'phòng nào', 'studio', 'thu âm', 'rehearsal'],
    reply: {
      content:
        'BandSpace có rehearsal room, vocal booth, live room và phòng thu chuyên sâu — mỗi phòng kèm thiết bị khác nhau (trống, amp, micro, mixer). Bạn cho mình biết band mấy người để gợi ý phòng phù hợp!',
    },
  },
  {
    keywords: ['hủy', 'huy', 'cancel', 'đổi lịch', 'doi lich'],
    reply: {
      content:
        'Bạn có thể hủy hoặc đổi lịch trước giờ tập theo chính sách từng phòng (thường trước 2 giờ). Vào **Lịch của tôi** hoặc liên hệ hotline nếu cần hỗ trợ gấp.',
    },
  },
  {
    keywords: ['thanh toán', 'payment', 'vnpay', 'chuyển khoản', 'tiền mặt'],
    reply: {
      content:
        'Hỗ trợ chuyển khoản, ví điện tử và thanh toán tại quầy tùy bước checkout. Sau khi đặt, bạn sẽ thấy hướng dẫn thanh toán chi tiết trên màn hình xác nhận.',
    },
  },
  {
    keywords: ['giờ mở', 'mở cửa', 'open', 'đóng cửa', 'giờ hoạt động'],
    reply: {
      content: 'Studio mở cửa từ **08:00 – 24:00** mỗi ngày. Khung giờ đặt online theo lịch trống real-time trên từng phòng.',
    },
  },
  {
    keywords: ['thiết bị', 'nhạc cụ', 'micro', 'amp', 'trống'],
    reply: {
      content:
        'Mỗi phòng có gói thiết bị cơ bản; bạn có thể thêm thuê guitar, micro, pedal trong bước đặt phòng. Ghi chú nhu cầu setup để nhân viên chuẩn bị trước.',
    },
  },
  {
    keywords: ['hướng dẫn', 'chi tiết', 'cách đặt', 'làm sao'],
    reply: {
      content:
        '**4 bước đặt phòng:**\n1. Chọn phòng phù hợp\n2. Chọn ngày & giờ trống\n3. Thêm ghi chú / thiết bị (nếu cần)\n4. Xác nhận & thanh toán\n\nCần mình dẫn tới trang đặt phòng không?',
      quickReplies: [
        { id: 'qr-go-book', label: 'Đi tới đặt phòng', message: 'Link đặt phòng ở đâu?' },
      ],
    },
  },
  {
    keywords: ['link', 'ở đâu', 'trang', 'đường dẫn'],
    reply: {
      content:
        'Đăng nhập tài khoản khách → menu **Đặt phòng** (`/rooms`) hoặc từ trang chủ chọn **Đặt ngay** trên thẻ phòng.',
    },
  },
  {
    keywords: ['xin chào', 'hello', 'hi', 'chào', 'hey'],
    reply: {
      content: 'Chào bạn! Mình là **BandBot** — trợ lý ảo của BandSpace. Hôm nay bạn muốn đặt phòng, hỏi giá hay cần hỗ trợ gì?',
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

const SUPPORT_REPLY: ChatbotReply = {
  content:
    'Bạn có thể liên hệ qua hotline **1900 xxxx** hoặc email **support@bandspace.vn**. Hoặc vào **Trợ giúp** (`/customer/support`) để xem FAQ.',
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function matchReply(message: string): ChatbotReply {
  const normalized = normalize(message)

  if (normalized.includes('lien he') || normalized.includes('hotline') || normalized.includes('nhan vien')) {
    return SUPPORT_REPLY
  }

  for (const rule of RESPONSE_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(normalize(keyword)))) {
      return rule.reply
    }
  }

  return DEFAULT_REPLY
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

export async function sendChatbotMessage(message: string): Promise<ChatbotReply> {
  const trimmed = message.trim()
  if (!trimmed) {
    return { content: 'Bạn gõ câu hỏi nhé — mình sẵn sàng hỗ trợ!' }
  }

  await delay(650 + Math.min(trimmed.length * 12, 900))
  return matchReply(trimmed)
}
