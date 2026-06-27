import {
  CustomerCard,
  CustomerPageHeader,
  CustomerPageShell,
} from '@/components/customer/CustomerPageShell'

const faqs = [
  {
    question: 'Làm thế nào để đặt phòng?',
    answer: 'Chọn phòng trong Room Catalog, bấm Đặt ngay, chọn ngày giờ và xác nhận thông tin đặt phòng.',
  },
  {
    question: 'Tôi có thể hủy lịch không?',
    answer: 'Bạn có thể hủy trước 2 giờ theo chính sách của từng phòng.',
  },
  {
    question: 'Tôi thanh toán bằng cách nào?',
    answer: 'Bạn có thể thanh toán chuyển khoản, ví điện tử hoặc thanh toán tại quầy tùy lựa chọn ở bước xác nhận.',
  },
  {
    question: 'Tôi cần hỗ trợ kỹ thuật thì liên hệ ai?',
    answer: 'Liên hệ hotline hoặc email hỗ trợ để được đội ngũ studio phản hồi nhanh nhất.',
  },
]

export default function CustomerSupportPage() {
  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="Trợ giúp và hỗ trợ"
        description="Tìm câu trả lời nhanh hoặc liên hệ đội ngũ Band Room khi bạn cần hỗ trợ."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <CustomerCard>
          <h2 className="font-display text-xl font-bold text-[#1A1C1E]">Câu hỏi thường gặp</h2>
          <div className="mt-5 grid gap-4">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-5">
                <h3 className="font-display text-base font-bold text-[#1A1C1E]">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5C5348]">{faq.answer}</p>
              </article>
            ))}
          </div>
        </CustomerCard>

        <CustomerCard>
          <h2 className="font-display text-xl font-bold text-[#1A1C1E]">Liên hệ hỗ trợ</h2>
          <div className="mt-5 space-y-3 text-sm leading-6 text-[#5C5348]">
            <p>
              <span className="font-semibold text-[#1A1C1E]">Hotline:</span> 0900 000 000
            </p>
            <p>
              <span className="font-semibold text-[#1A1C1E]">Email:</span>{' '}
              <a href="mailto:support@bandroom.local" className="text-[#FF7518] hover:text-[#E6640F]">
                support@bandroom.local
              </a>
            </p>
          </div>
          <a
            href="mailto:support@bandroom.local"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-[#FF7518] px-5 font-display text-sm font-semibold text-white transition hover:bg-[#E6640F]"
          >
            Liên hệ hỗ trợ
          </a>
        </CustomerCard>
      </div>
    </CustomerPageShell>
  )
}
