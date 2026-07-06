export type SiteNavItem = {
  label: string
  href: string
}

/** Header nav — action-oriented, no About (lives in footer + bottom section) */
export const publicNavItems: SiteNavItem[] = [
  { label: 'Phòng tập', href: '/rooms' },
  { label: 'Thiết bị', href: '/#features' },
  { label: 'Quy trình', href: '/#process' },
  { label: 'Hỗ trợ', href: '/customer/support' },
]

/** Footer explore — includes brand story */
export const footerExploreLinks: SiteNavItem[] = [
  { label: 'Phòng tập', href: '/rooms' },
  { label: 'Thiết bị', href: '/#features' },
  { label: 'Quy trình', href: '/#process' },
  { label: 'Về chúng tôi', href: '/#about' },
]

export const footerSupportLinks: SiteNavItem[] = [
  { label: 'Trung tâm hỗ trợ', href: '/customer/support' },
  { label: 'Chính sách đặt phòng', href: '/customer/support' },
  { label: 'Chính sách hủy lịch', href: '/customer/support' },
]

export const footerLegalLinks: SiteNavItem[] = [
  { label: 'Điều khoản sử dụng', href: '/#about' },
  { label: 'Chính sách bảo mật', href: '/#about' },
]

/** Same-page anchors for homepage header (smooth scroll without path prefix) */
export function homepageNavItems(): SiteNavItem[] {
  return publicNavItems.map((item) =>
    item.href.startsWith('/#') ? { ...item, href: item.href.slice(1) } : item,
  )
}

export const SUPPORT_EMAIL = 'support@bandroom.local'
export const SUPPORT_HOTLINE = '0900 000 000'

/** When already on the target page, nav should scroll to top instead of reloading. */
export function shouldScrollToTop(pathname: string, href: string) {
  const targetPath = href.split('?')[0]?.split('#')[0] ?? href
  return Boolean(targetPath && pathname === targetPath)
}

export function scrollToPageTop(behavior: ScrollBehavior = 'smooth') {
  window.scrollTo({ top: 0, behavior })
}
