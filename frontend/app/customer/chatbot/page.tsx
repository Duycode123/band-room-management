import CloudflareChatbotClient from '@/components/customer/CloudflareChatbotClient'
import { CustomerPageHeader, CustomerPageShell } from '@/components/customer/CustomerPageShell'

export default function CustomerChatbotPage() {
  return (
    <CustomerPageShell>
      <CustomerPageHeader
        eyebrow="Cloudflare AI"
        title="Chatbot tu van phong"
        description="Hoi nhanh ve phong phu hop, gia theo gio, suc chua va khung gio con trong."
      />
      <CloudflareChatbotClient />
    </CustomerPageShell>
  )
}
