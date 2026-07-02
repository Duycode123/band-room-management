'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import BandRoomFooter from '@/components/layout/BandRoomFooter'
import BandRoomHeader from '@/components/layout/BandRoomHeader'
import {
  blogCategories,
  filterBlogPosts,
  getBlogPosts,
  type BlogCategory,
  type BlogFilters,
  type BlogPost,
} from '@/lib/public/mock-data'

export default function BlogPublicPage() {
  const [filters, setFilters] = useState<BlogFilters>({ search: '', category: 'all' })
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const posts = useMemo(() => getBlogPosts(), [])
  const filteredPosts = useMemo(() => filterBlogPosts(posts, filters), [posts, filters])
  const featuredPost = posts[0]

  return (
    <main className="min-h-screen bg-brand-bgGray text-on-surface">
      <BandRoomHeader />

      <section className="relative overflow-hidden bg-secondary text-white">
        <Image
          src="/images/band-room-hero.png"
          alt="BandHub Studio rehearsal room"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-58"
        />
        <div className="absolute inset-0 bg-[linear-gradient(108deg,rgba(4,42,22,0.97)_0%,rgba(4,42,22,0.82)_48%,rgba(4,42,22,0.34)_100%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <p className="font-display text-sm font-semibold uppercase text-primary-fixed">BandHub Journal</p>
          <h1 className="mt-3 font-display text-5xl font-bold tracking-tight sm:text-6xl">Blog</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/68">
            Kinh nghiệm tập band, chọn phòng và chuẩn bị thiết bị.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        {featuredPost && (
          <article className="mb-8 grid overflow-hidden rounded-3xl border border-outline-variant bg-white shadow-[var(--shadow-elevated)] lg:grid-cols-[1.08fr_0.92fr]">
            <div className="relative min-h-[280px] bg-surface-container">
              <Image
                src={featuredPost.thumbnail}
                alt={featuredPost.title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,42,22,0.62),transparent_58%)]" />
              <span className="absolute left-5 top-5 rounded-full bg-primary-container px-3 py-1 font-display text-xs font-bold text-on-primary-container">
                Bài nổi bật
              </span>
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <p className="font-display text-xs font-bold uppercase text-brand-orange">{featuredPost.categoryLabel}</p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-on-surface">{featuredPost.title}</h2>
              <p className="mt-4 text-base leading-7 text-on-surface-variant">{featuredPost.excerpt}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-on-surface-variant">
                <span>{featuredPost.author}</span>
                <span>•</span>
                <span>{featuredPost.publishedAt}</span>
                <span>•</span>
                <span>{featuredPost.readTime}</span>
              </div>
              <button type="button" onClick={() => setSelectedPost(featuredPost)} className="btn-warm mt-6 w-fit">
                Đọc bài nổi bật
              </button>
            </div>
          </article>
        )}

        <div className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <label>
              <span className="mb-2 block font-display text-xs font-bold uppercase text-on-surface-variant">Tìm bài viết</span>
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Tìm theo tiêu đề, chủ đề, thiết bị..."
                className="input-field"
              />
            </label>

            <button type="button" onClick={() => setFilters({ search: '', category: 'all' })} className="btn-secondary">
              Xóa bộ lọc
            </button>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {blogCategories.map((category) => {
              const active = filters.category === category.id

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setFilters((current) => ({ ...current, category: category.id as 'all' | BlogCategory }))}
                  className={[
                    'shrink-0 rounded-full border px-4 py-2 font-display text-sm font-semibold transition-colors',
                    active
                      ? 'border-brand-orange bg-brand-orange text-white shadow-[0_10px_26px_rgba(255,117,24,0.22)]'
                      : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-primary-container hover:text-on-surface',
                  ].join(' ')}
                >
                  {category.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-8">
          <p className="font-display text-xl font-bold text-on-surface">{filteredPosts.length} bài viết</p>
          <p className="mt-1 text-sm text-on-surface-variant">Dữ liệu mock có slug để sẵn sàng mở rộng `/blog/[slug]`.</p>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} onReadMore={setSelectedPost} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-outline-variant bg-white px-6 py-16 text-center shadow-[var(--shadow-card)]">
            <p className="font-display text-2xl font-bold text-on-surface">Không tìm thấy bài viết</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
              Thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
            </p>
          </div>
        )}
      </section>

      {selectedPost && <BlogPreviewModal post={selectedPost} onClose={() => setSelectedPost(null)} />}

      <BandRoomFooter />
    </main>
  )
}

function BlogCard({ post, onReadMore }: { post: BlogPost; onReadMore: (post: BlogPost) => void }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-outline-variant bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(26,28,30,0.12)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
        <Image
          src={post.thumbnail}
          alt={post.title}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,42,22,0.58),transparent_58%)]" />
        <span className="absolute left-4 top-4 rounded-full bg-primary-container px-3 py-1 font-display text-xs font-bold text-on-primary-container">
          {post.categoryLabel}
        </span>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap gap-3 text-xs font-medium text-on-surface-variant">
          <span>{post.author}</span>
          <span>•</span>
          <span>{post.publishedAt}</span>
          <span>•</span>
          <span>{post.readTime}</span>
        </div>
        <h2 className="mt-3 font-display text-2xl font-bold text-on-surface">{post.title}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-on-surface-variant">{post.excerpt}</p>
        <button
          type="button"
          onClick={() => onReadMore(post)}
          className="mt-6 inline-flex rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 font-display text-sm font-bold text-on-surface transition hover:border-brand-orange/40 hover:bg-primary-container hover:text-on-primary-container"
        >
          Đọc thêm
        </button>
      </div>
    </article>
  )
}

function BlogPreviewModal({ post, onClose }: { post: BlogPost; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-outline-variant bg-white shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
        <div className="relative aspect-[16/7] overflow-hidden bg-surface-container">
          <Image src={post.thumbnail} alt={post.title} fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,42,22,0.72),transparent_62%)]" />
          <span className="absolute left-5 top-5 rounded-full bg-primary-container px-3 py-1 font-display text-xs font-bold text-on-primary-container">
            {post.categoryLabel}
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap gap-3 text-xs font-medium text-on-surface-variant">
            <span>{post.author}</span>
            <span>•</span>
            <span>{post.publishedAt}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
          <h2 className="mt-3 font-display text-3xl font-bold text-on-surface">{post.title}</h2>
          <p className="mt-4 text-base leading-7 text-on-surface-variant">{post.excerpt}</p>
          <div className="mt-6 space-y-5">
            {post.content.map((section) => (
              <section key={section.heading} className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
                <h3 className="font-display text-lg font-bold text-on-surface">{section.heading}</h3>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">{section.body}</p>
              </section>
            ))}
          </div>
          <p className="hidden">
            Bài chi tiết sẽ dùng slug <span className="font-semibold text-on-surface">{post.slug}</span> khi CMS hoặc route `/blog/[slug]` được bổ sung.
          </p>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
