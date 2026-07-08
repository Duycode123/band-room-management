import Link from 'next/link'
import {
  PublicContentHeader,
  PublicContentPage,
  PublicContentSection,
} from '@/components/public/PublicContentPage'

export default function AboutPage() {
  return (
    <PublicContentPage>
      <PublicContentHeader
        eyebrow="Về chúng tôi"
        title="Band Room — không gian tập nhạc cho mọi ban nhạc"
        description="Chúng tôi xây dựng hệ thống đặt phòng tập trực tuyến để ban nhạc, nghệ sĩ và người sáng tạo có thể tập luyện thuận tiện, minh bạch và chuyên nghiệp."
      />

      <PublicContentSection title="Sứ mệnh">
        <p>
          Band Room kết nối người chơi nhạc với các phòng studio được trang bị đầy đủ, giúp việc đặt lịch, thanh toán
          và sử dụng phòng diễn ra suôn sẻ trên một nền tảng duy nhất.
        </p>
        <p>
          Mục tiêu của chúng tôi là giảm thời gian chờ đợi, tăng tính minh bạch về lịch trống và nâng cao trải nghiệm
          tập luyện cho cộng đồng âm nhạc tại Việt Nam.
        </p>
      </PublicContentSection>

      <PublicContentSection title="Chúng tôi cung cấp gì">
        <ul className="list-disc space-y-2 pl-5">
          <li>Danh mục phòng tập với thông tin rõ ràng về sức chứa, thiết bị và giá</li>
          <li>Đặt phòng trực tuyến theo khung giờ, xác nhận nhanh và lịch sử đặt phòng</li>
          <li>Hỗ trợ khách hàng trong giờ vận hành studio</li>
          <li>Chính sách đặt phòng, hủy lịch và bảo mật được công bố công khai</li>
        </ul>
      </PublicContentSection>

      <PublicContentSection title="Liên hệ">
        <p>
          Bạn có câu hỏi về dịch vụ hoặc muốn hợp tác? Ghé{' '}
          <Link href="/customer/support" className="font-semibold text-brand-orange hover:underline">
            trung tâm hỗ trợ
          </Link>{' '}
          hoặc khám phá{' '}
          <Link href="/rooms" className="font-semibold text-brand-orange hover:underline">
            danh sách phòng tập
          </Link>
          .
        </p>
      </PublicContentSection>
    </PublicContentPage>
  )
}
