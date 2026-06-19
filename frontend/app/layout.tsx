import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BandHub Studio',
  description: 'Đặt phòng tập nhạc trực tuyến dễ dàng',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
