import {
  bookingRooms,
  roomCategories,
  type BookingRoom,
  type RoomAvailabilityStatus,
  type RoomCategory,
} from '@/components/booking/booking-data'

export type Room = BookingRoom
export type { RoomAvailabilityStatus, RoomCategory }

export type RoomCapacityFilter = 'all' | 'small' | 'medium' | 'large'
export type RoomPriceFilter = 'all' | 'budget' | 'standard' | 'premium'

export type RoomFilters = {
  search: string
  category: 'all' | RoomCategory
  capacity: RoomCapacityFilter
  availability: 'all' | RoomAvailabilityStatus
  price: RoomPriceFilter
}

export type GuideStep = {
  id: string
  title: string
  description: string
}

export type FAQItem = {
  id: string
  question: string
  answer: string
}

export type BlogCategory =
  | 'band-experience'
  | 'audio-equipment'
  | 'booking-guide'
  | 'bandhub-news'

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: BlogCategory
  categoryLabel: string
  publishedAt: string
  readTime: string
  thumbnail: string
  author: string
  content: BlogPostSection[]
}

export type BlogPostSection = {
  heading: string
  body: string
}

export type BlogFilters = {
  search: string
  category: 'all' | BlogCategory
}

export const publicRoomCategories = roomCategories

// TODO: Replace this mock source with GET /api/public/rooms when the backend endpoint is ready.
export function getRooms(): Room[] {
  return bookingRooms
}

export function filterRooms(rooms: Room[], filters: RoomFilters) {
  const query = filters.search.trim().toLowerCase()

  return rooms.filter((room) => {
    const capacity = getRoomCapacityNumber(room)
    const matchesSearch =
      !query ||
      [room.name, room.categoryLabel, room.type, room.description, room.location, ...room.equipments]
        .join(' ')
        .toLowerCase()
        .includes(query)
    const matchesCategory = filters.category === 'all' || room.category === filters.category
    const matchesAvailability = filters.availability === 'all' || room.availabilityStatus === filters.availability
    const matchesCapacity =
      filters.capacity === 'all' ||
      (filters.capacity === 'small' && capacity <= 4) ||
      (filters.capacity === 'medium' && capacity >= 5 && capacity <= 8) ||
      (filters.capacity === 'large' && capacity >= 9)
    const matchesPrice =
      filters.price === 'all' ||
      (filters.price === 'budget' && room.pricePerHour < 250000) ||
      (filters.price === 'standard' && room.pricePerHour >= 250000 && room.pricePerHour <= 500000) ||
      (filters.price === 'premium' && room.pricePerHour > 500000)

    return matchesSearch && matchesCategory && matchesAvailability && matchesCapacity && matchesPrice
  })
}

export const guideSteps: GuideStep[] = [
  {
    id: 'choose-room',
    title: 'Chọn phòng',
    description: 'Lọc phòng theo quy mô band, mục tiêu buổi tập, thiết bị sẵn có và ngân sách.',
  },
  {
    id: 'choose-time',
    title: 'Chọn ngày giờ',
    description: 'Xem lịch trống, chọn khung giờ phù hợp và kiểm tra thiết bị cần thuê thêm.',
  },
  {
    id: 'confirm-info',
    title: 'Xác nhận thông tin',
    description: 'Kiểm tra tên band, số người, ghi chú setup và thông tin liên hệ trước khi giữ chỗ.',
  },
  {
    id: 'payment',
    title: 'Thanh toán và nhận lịch',
    description: 'Hoàn tất thanh toán, nhận lịch đặt phòng và đến studio đúng khung giờ đã xác nhận.',
  },
]

export const faqItems: FAQItem[] = [
  {
    id: 'login-required',
    question: 'Có cần đăng nhập để đặt phòng không?',
    answer: 'Có. Tài khoản giúp BandHub lưu lịch đặt, gửi xác nhận và hỗ trợ bạn điều chỉnh booking nhanh hơn.',
  },
  {
    id: 'rent-equipment',
    question: 'Có thể thuê thêm thiết bị không?',
    answer: 'Có. Bạn có thể chọn thêm micro, guitar, pedal, tai nghe kiểm âm hoặc kỹ thuật viên tùy từng phòng.',
  },
  {
    id: 'cancel-booking',
    question: 'Có thể hủy lịch không?',
    answer: 'Có thể hủy theo chính sách của studio. Lịch càng gần giờ sử dụng thì điều kiện hoàn tiền có thể thay đổi.',
  },
  {
    id: 'payment-method',
    question: 'Thanh toán như thế nào?',
    answer: 'Bạn có thể thanh toán bằng chuyển khoản, ví điện tử hoặc thanh toán tại quầy nếu lịch cho phép.',
  },
]

export const blogCategories: Array<{ id: 'all' | BlogCategory; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'band-experience', label: 'Kinh nghiệm tập band' },
  { id: 'audio-equipment', label: 'Thiết bị âm thanh' },
  { id: 'booking-guide', label: 'Hướng dẫn đặt phòng' },
  { id: 'bandhub-news', label: 'Tin tức BandHub' },
]

// TODO: Replace this mock source with CMS/API data when blog publishing is available.
export function getBlogPosts(): BlogPost[] {
  return blogPosts.map((post) => ({
    ...post,
    author: post.author || 'BandHub Studio',
    content: post.content && post.content.length > 0 ? post.content : getBlogPostContent(post.slug),
  }))
}

export function filterBlogPosts(posts: BlogPost[], filters: BlogFilters) {
  const query = filters.search.trim().toLowerCase()

  return posts.filter((post) => {
    const matchesSearch =
      !query ||
      [post.title, post.excerpt, post.categoryLabel, post.author, ...post.content.map((section) => `${section.heading} ${section.body}`)]
        .join(' ')
        .toLowerCase()
        .includes(query)
    const matchesCategory = filters.category === 'all' || post.category === filters.category

    return matchesSearch && matchesCategory
  })
}

export function getAvailabilityLabel(status: RoomAvailabilityStatus) {
  if (status === 'FULL_TODAY') return 'Kín lịch hôm nay'
  if (status === 'ALMOST_FULL') return 'Sắp kín lịch'
  return 'Còn trống hôm nay'
}

function getRoomCapacityNumber(room: Room) {
  const [capacity] = room.capacity.match(/\d+/) ?? ['0']
  return Number(capacity)
}

function getBlogPostContent(slug: string): BlogPostSection[] {
  const contentBySlug: Record<string, BlogPostSection[]> = {
    'chuan-bi-buoi-tap-band-dau-tien': [
      {
        heading: 'Thống nhất setlist trước khi đến phòng',
        body: 'Band nên chốt danh sách bài, thứ tự tập và mục tiêu của buổi rehearsal trước khi đến studio. Khi mọi người đã biết cần tập phần nào, thời gian thuê phòng sẽ được dùng cho âm nhạc thay vì chỉnh lại kế hoạch.',
      },
      {
        heading: 'Kiểm tra dây, adapter và file cần dùng',
        body: 'Hãy chuẩn bị dây jack, capo, pedal, laptop, backing track và charger. Nếu cần thuê thêm micro hoặc thiết bị, hãy ghi chú trong booking để nhân viên chuẩn bị trước.',
      },
      {
        heading: 'Đến sớm 10-15 phút',
        body: 'Khoảng thời gian ngắn này đủ để check-in, chỉnh monitor cơ bản và xử lý lỗi nhỏ trước khi ca tập bắt đầu. Đây là thói quen đơn giản nhưng giúp buổi tập chuyên nghiệp hơn.',
      },
      {
        heading: 'Ghi chú sau buổi tập',
        body: 'Sau buổi tập, band nên ghi lại bài đã ổn, bài cần sửa và thiết bị cần đổi cho lần sau. Một ghi chú nhỏ giúp buổi kế tiếp mượt hơn rất nhiều.',
      },
    ],
    'chon-phong-tap-theo-quy-mo-band': [
      {
        heading: 'Nhóm nhỏ cần phòng gọn và monitor rõ',
        body: 'Band 2-4 người thường không cần phòng quá lớn. Ưu tiên phòng có âm lượng vừa, monitor rõ và setup nhanh để tiết kiệm chi phí.',
      },
      {
        heading: 'Band đầy đủ cần khoảng thở cho trống và ampli',
        body: 'Với band 5-8 người, hãy chọn phòng rehearsal có mixer nhiều kênh, drum kit ổn định và đủ line cho guitar, bass, keyboard, vocal.',
      },
      {
        heading: 'Live session cần ánh sáng và đường hình',
        body: 'Nếu vừa tập vừa quay video, hãy ưu tiên phòng premium hoặc live room có ánh sáng đẹp, bố trí sân khấu và không gian máy quay.',
      },
    ],
    'micro-shure-sm58-co-hop-voi-rehearsal': [
      {
        heading: 'SM58 hợp với môi trường rehearsal',
        body: 'Shure SM58 bền, ít hú và chịu âm lượng lớn tốt, nên rất phù hợp cho vocal trong phòng tập band.',
      },
      {
        heading: 'Khoảng cách micro quan trọng hơn bạn nghĩ',
        body: 'Giữ micro cách miệng khoảng 5-10 cm, hát thẳng trục và tránh chĩa mặt micro vào loa monitor để giảm feedback.',
      },
      {
        heading: 'Khi nào nên thuê micro condenser?',
        body: 'Nếu buổi tập có thu demo vocal hoặc acoustic session cần nhiều chi tiết, condenser sẽ hợp hơn, nhưng cần phòng và gain staging kỹ hơn.',
      },
    ],
    'bandhub-mo-them-khung-gio-toi': [
      {
        heading: 'Thêm khung giờ cho band sau giờ làm',
        body: 'Các ca tối 19:00-22:00 được mở thêm để những band đi làm, đi học ban ngày vẫn có khung tập ổn định trong tuần.',
      },
      {
        heading: 'Các phòng được ưu tiên',
        body: 'Studio A, Studio B và Amber Live Room sẽ có thêm lịch tối. Số slot mỗi ngày có giới hạn để đội kỹ thuật vẫn đảm bảo setup phòng.',
      },
      {
        heading: 'Nên đặt trước bao lâu?',
        body: 'Với khung tối, bạn nên đặt trước 2-3 ngày, đặc biệt nếu cần thuê thêm micro, pedal hoặc kỹ thuật viên hỗ trợ.',
      },
    ],
  }

  return contentBySlug[slug] ?? [
    {
      heading: 'Tổng quan',
      body: 'Bài viết này đang được biên tập từ dữ liệu mock và có thể chuyển sang CMS khi backend sẵn sàng.',
    },
  ]
}

type BlogPostDraft = Omit<BlogPost, 'author' | 'content'> & Partial<Pick<BlogPost, 'author' | 'content'>>

const blogPosts: BlogPostDraft[] = [
  {
    id: 'post-1',
    slug: 'chuan-bi-buoi-tap-band-dau-tien',
    title: 'Chuẩn bị gì cho buổi tập band đầu tiên?',
    excerpt: 'Checklist gọn để cả band vào phòng là có thể bắt đầu chơi ngay, không mất nửa giờ để tìm dây và set gain.',
    category: 'band-experience',
    categoryLabel: 'Kinh nghiệm tập band',
    publishedAt: '01/07/2026',
    readTime: '5 phút đọc',
    thumbnail: '/images/band-room-hero.png',
  },
  {
    id: 'post-2',
    slug: 'chon-phong-tap-theo-quy-mo-band',
    title: 'Cách chọn phòng tập theo quy mô band',
    excerpt: 'Band 3 người, 5 người hay 10 người sẽ cần diện tích, monitor và line setup rất khác nhau.',
    category: 'booking-guide',
    categoryLabel: 'Hướng dẫn đặt phòng',
    publishedAt: '28/06/2026',
    readTime: '4 phút đọc',
    thumbnail: '/images/band-room-hero.png',
  },
  {
    id: 'post-3',
    slug: 'micro-shure-sm58-co-hop-voi-rehearsal',
    title: 'Micro Shure SM58 có hợp với rehearsal không?',
    excerpt: 'Một góc nhìn thực tế về micro vocal phổ biến nhất trong phòng tập và cách dùng để vocal rõ hơn.',
    category: 'audio-equipment',
    categoryLabel: 'Thiết bị âm thanh',
    publishedAt: '24/06/2026',
    readTime: '6 phút đọc',
    thumbnail: '/images/band-room-hero.png',
  },
  {
    id: 'post-4',
    slug: 'bandhub-mo-them-khung-gio-toi',
    title: 'BandHub mở thêm khung giờ tối cho band đi làm',
    excerpt: 'Các khung 19:00-22:00 được bổ sung cho Studio A, Studio B và Amber Live Room từ tuần này.',
    category: 'bandhub-news',
    categoryLabel: 'Tin tức BandHub',
    publishedAt: '20/06/2026',
    readTime: '3 phút đọc',
    thumbnail: '/images/band-room-hero.png',
  },
]
