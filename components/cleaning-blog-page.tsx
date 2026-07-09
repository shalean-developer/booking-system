'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Search,
  Clock,
  Calendar,
  ArrowRight,
  User,
  ChevronRight,
  BookOpen,
  TrendingUp,
  Mail,
  Check,
  Star,
  Home,
  Package,
  Waves,
  Leaf,
  DoorOpen,
  Tag,
  X,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BlogListingPayload, BlogListingPost } from '@/lib/blog-listing';

const POSTS_PER_PAGE = 6;

function iconForSlug(slug: string): React.ElementType {
  const s = slug.toLowerCase();
  if (s.includes('airbnb')) return Star;
  if (s.includes('sustainability') || s.includes('eco')) return Leaf;
  if (s.includes('deep')) return Waves;
  if (s.includes('move')) return DoorOpen;
  if (s.includes('tip') || s.includes('cleaning')) return Home;
  return BookOpen;
}

function categoryColorClass(slug: string | null): string {
  if (!slug) return 'text-gray-600 bg-gray-50 border-gray-200';
  const s = slug.toLowerCase();
  if (s.includes('airbnb')) return 'text-amber-600 bg-amber-50 border-amber-200';
  if (s.includes('sustainability') || s.includes('eco')) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (s.includes('deep')) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
  if (s.includes('move')) return 'text-purple-600 bg-purple-50 border-purple-200';
  if (s.includes('tip') || s.includes('cleaning')) return 'text-blue-600 bg-blue-50 border-blue-200';
  return 'text-blue-600 bg-blue-50 border-blue-200';
}

// ─── NavBar ────────────────────────────────────────────────────────────────

function NavBar({ onQuoteClick }: { onQuoteClick: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = [
    { id: 'services', label: 'Services', href: '/#services' },
    { id: 'blog', label: 'Blog', href: '/blog' },
    { id: 'about', label: 'About', href: '/about' },
    { id: 'contact', label: 'Contact', href: '/contact' },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase leading-none tracking-widest text-gray-400">
              Shalean
            </p>
            <p className="text-sm font-bold leading-tight text-gray-900">Cleaning Services</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={cn(
                'text-sm font-semibold transition-colors',
                link.id === 'blog' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={onQuoteClick}
            className="rounded-xl border-2 border-blue-200 px-4 py-2 text-sm font-bold text-blue-600 transition-all hover:bg-blue-50"
          >
            Get Free Quote
          </button>
          <button
            type="button"
            onClick={onQuoteClick}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md"
          >
            Book a Service
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X className="h-4 w-4 text-gray-600" /> : <Menu className="h-4 w-4 text-gray-600" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100 bg-white md:hidden"
          >
            <div className="space-y-3 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="block w-full py-1.5 text-left text-sm font-semibold text-gray-600"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onQuoteClick}
                  className="flex-1 rounded-xl border-2 border-blue-200 py-2.5 text-sm font-bold text-blue-600 transition-all hover:bg-blue-50"
                >
                  Free Quote
                </button>
                <button
                  type="button"
                  onClick={onQuoteClick}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-bold text-white shadow-sm"
                >
                  Book Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── BlogHero ──────────────────────────────────────────────────────────────

type HeroCategory = { slug: string; label: string; icon: React.ElementType };

function BlogHero({
  searchQuery,
  onSearchChange,
  activeCategorySlug,
  onCategoryChange,
  heroCategories,
}: {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  activeCategorySlug: string;
  onCategoryChange: (slug: string) => void;
  heroCategories: HeroCategory[];
}) {
  return (
    <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 pb-16 pt-14 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            Cape Town&apos;s #1 Cleaning Blog
          </span>
        </div>

        <h1 className="mb-3 max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
          Expert Cleaning Tips
          <br />
          <span className="text-blue-200">for Cape Town Homes</span>
        </h1>
        <p className="mb-8 max-w-xl text-sm leading-relaxed text-blue-200 sm:text-base">
          Practical guides, pro secrets, and sustainability tips from Cape Town&apos;s trusted cleaning
          professionals.
        </p>

        <div className="relative mb-6 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles, tips, guides…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-2xl bg-white py-4 pl-11 pr-12 text-sm font-medium text-gray-800 shadow-lg outline-none placeholder:text-gray-400"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300"
              aria-label="Clear search"
            >
              <X className="h-3 w-3 text-gray-600" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {heroCategories.map((cat) => {
            const CatIcon = cat.icon;
            const isActive = activeCategorySlug === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => onCategoryChange(cat.slug)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                  isActive
                    ? 'bg-white text-blue-700 shadow-md'
                    : 'border border-white/25 bg-white/15 text-white hover:bg-white/25',
                )}
              >
                <CatIcon className="h-3 w-3" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── FeaturedPostCard ──────────────────────────────────────────────────────

function FeaturedPostCard({
  post,
  onBookingTag,
}: {
  post: BlogListingPost;
  onBookingTag: (tag: string) => void;
}) {
  const colorCls = categoryColorClass(post.categorySlug);
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:flex-row"
    >
      <Link href={`/blog/${post.slug}`} className="relative flex-shrink-0 overflow-hidden lg:w-[60%]">
        {post.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imageUrl} alt={post.imageAlt} className="h-60 w-full object-cover lg:h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" aria-hidden />
          </>
        ) : (
          <div className="flex h-60 items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 lg:min-h-[280px]">
            <BookOpen className="h-14 w-14 text-blue-400" aria-hidden />
          </div>
        )}
        <span className={cn('absolute left-4 top-4 rounded-full border px-3 py-1 text-xs font-bold', colorCls)}>
          {post.categoryLabel}
        </span>
        <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
          <Star className="h-2.5 w-2.5" />
          <span>Featured</span>
        </span>
      </Link>

      <div className="flex flex-col justify-between p-6 lg:w-[40%] lg:p-8">
        <div>
          <h2 className="mb-3 text-xl font-extrabold leading-tight text-gray-900">{post.title}</h2>
          <p className="mb-5 text-sm leading-relaxed text-gray-500">{post.excerpt}</p>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            {post.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onBookingTag(tag)}
                className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 transition-all hover:bg-blue-600 hover:text-white"
              >
                <Tag className="h-2.5 w-2.5" />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{post.author}</span>
            </span>
            {post.dateLabel ? (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{post.dateLabel}</span>
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{post.readTimeLabel}</span>
            </span>
          </div>

          <Link
            href={`/blog/${post.slug}`}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md"
          >
            <span>Read Full Article</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

// ─── SidebarTrending ───────────────────────────────────────────────────────

function SidebarTrending({
  onQuoteClick,
  trendingPosts,
}: {
  onQuoteClick: () => void;
  trendingPosts: BlogListingPost[];
}) {
  return (
    <aside className="sticky top-[73px] hidden w-[300px] flex-shrink-0 self-start space-y-4 xl:block">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-extrabold text-gray-900">Trending Now</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {trendingPosts.length === 0 ? (
            <p className="px-5 py-6 text-center text-xs text-gray-400">More articles coming soon.</p>
          ) : (
            trendingPosts.map((post, idx) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-gray-50"
              >
                <div className="relative flex-shrink-0">
                  {post.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={post.imageUrl} alt={post.imageAlt} className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
                      <BookOpen className="h-6 w-6 text-blue-400" aria-hidden />
                    </div>
                  )}
                  <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[9px] font-extrabold text-white">
                    {idx + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                    <TrendingUp className="h-2 w-2" />
                    <span>Trending</span>
                  </span>
                  <p className="line-clamp-2 text-xs font-bold leading-snug text-gray-800 transition-colors group-hover:text-blue-600">
                    {post.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="h-2.5 w-2.5" />
                    <span>{post.readTimeLabel.replace(' read', '')}</span>
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <h4 className="mb-1 text-sm font-extrabold text-white">Ready to Book?</h4>
        <p className="mb-4 text-xs leading-relaxed text-blue-200">
          Get a free, no-obligation quote in under 2 minutes.
        </p>
        <button
          type="button"
          onClick={onQuoteClick}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-xs font-extrabold text-blue-700 transition-all hover:shadow-lg"
        >
          <span>Get Free Quote</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </aside>
  );
}

// ─── BlogCard ──────────────────────────────────────────────────────────────

function BlogCard({
  post,
  index,
  onBookingTag,
}: {
  post: BlogListingPost;
  index: number;
  onBookingTag: (tag: string) => void;
}) {
  const colorCls = categoryColorClass(post.categorySlug);
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <Link href={`/blog/${post.slug}`} className="relative h-48 overflow-hidden">
        {post.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={post.imageUrl}
            alt={post.imageAlt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
            <BookOpen className="h-12 w-12 text-blue-400" aria-hidden />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" aria-hidden />
        <span
          className={cn('absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-bold', colorCls)}
        >
          {post.categoryLabel}
        </span>
        {post.trending ? (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-extrabold uppercase text-white">
            <TrendingUp className="h-2 w-2" />
            <span>Hot</span>
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/blog/${post.slug}`}>
          <h3 className="mb-2 line-clamp-2 text-sm font-extrabold leading-snug text-gray-900 transition-colors group-hover:text-blue-600">
            {post.title}
          </h3>
        </Link>
        <p className="mb-4 line-clamp-2 flex-1 text-xs leading-relaxed text-gray-500">{post.excerpt}</p>

        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {post.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onBookingTag(tag)}
              className="flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 transition-all hover:bg-blue-600 hover:text-white"
            >
              <Tag className="h-2 w-2" />
              <span>{tag}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <User className="h-2.5 w-2.5" />
              <span>{post.author}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              <span>{post.readTimeLabel}</span>
            </span>
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="group/btn flex items-center gap-1 text-[10px] font-bold text-blue-600 transition-colors hover:text-indigo-700"
          >
            <span>Read</span>
            <ChevronRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

// ─── NewsletterCTA ─────────────────────────────────────────────────────────

function NewsletterCTA() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.includes('@')) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setError(data.error || 'Could not subscribe. Try again.');
        return;
      }
      setSubscribed(true);
      setEmail('');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'Weekly cleaning tips straight to your inbox',
    'Exclusive subscriber discounts (up to 15% off)',
    'First access to new services and seasonal deals',
  ];

  return (
    <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-emerald-600 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5">
          <div className="flex -space-x-1.5">
            {['bg-amber-400', 'bg-pink-400', 'bg-blue-300', 'bg-emerald-400'].map((color, i) => (
              <div key={i} className={cn('h-5 w-5 rounded-full border-2 border-white/50', color)} />
            ))}
          </div>
          <span className="text-[11px] font-bold text-white">Join Cape Town homeowners on our list</span>
        </div>

        <h2 className="mb-2 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
          Get Cleaning Tips Delivered Weekly
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-blue-100 sm:text-base">
          No fluff. Just expert advice from Cape Town&apos;s most trusted cleaning team — plus
          subscriber-only offers.
        </p>

        <AnimatePresence mode="wait">
          {subscribed ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-white/30 bg-white/20 p-6"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500">
                <Check className="h-6 w-6 text-white" />
              </div>
              <p className="mb-1 text-base font-extrabold text-white">You&apos;re in!</p>
              <p className="text-sm text-blue-100">Check your inbox — your first tip is on its way.</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mx-auto mb-5 flex max-w-lg flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
                  <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
                    className="flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={loading}
                  className="flex flex-shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-blue-700 shadow-lg transition-all hover:shadow-xl disabled:opacity-70"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  <span>{loading ? 'Subscribing…' : 'Subscribe Free'}</span>
                </button>
              </div>
              {error ? <p className="mb-4 text-sm text-amber-200">{error}</p> : null}

              <ul className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
                {benefits.map((b) => (
                  <li key={b} className="flex items-center gap-1.5 text-xs font-medium text-blue-100">
                    <Check className="h-3 w-3 flex-shrink-0 text-emerald-400" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function CleaningBlogPage({
  posts,
  categories,
  featuredPostId,
  trendingPostIds,
  onNavigateToQuote,
}: BlogListingPayload & { onNavigateToQuote?: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategorySlug, setActiveCategorySlug] = useState('all');
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const heroCategories = useMemo((): HeroCategory[] => {
    return [
      { slug: 'all', label: 'All Articles', icon: BookOpen },
      ...categories.map((c) => ({
        slug: c.slug,
        label: c.name,
        icon: iconForSlug(c.slug),
      })),
    ];
  }, [categories]);

  const trendingPosts = useMemo(() => {
    return trendingPostIds.map((id) => posts.find((p) => p.id === id)).filter(Boolean) as BlogListingPost[];
  }, [posts, trendingPostIds]);

  const featuredPost = useMemo(() => {
    if (!featuredPostId) return undefined;
    return posts.find((p) => p.id === featuredPostId);
  }, [posts, featuredPostId]);

  const baseForGrid = useMemo(() => {
    if (activeCategorySlug === 'all' && !debouncedQuery && featuredPostId) {
      return posts.filter((p) => p.id !== featuredPostId);
    }
    return posts;
  }, [posts, activeCategorySlug, debouncedQuery, featuredPostId]);

  const filteredPosts = useMemo(() => {
    return baseForGrid.filter((p) => {
      const matchesCategory =
        activeCategorySlug === 'all' || (p.categorySlug !== null && p.categorySlug === activeCategorySlug);
      const q = debouncedQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [baseForGrid, activeCategorySlug, debouncedQuery]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  const handleBookingTag = (_tag: string) => {
    if (onNavigateToQuote) onNavigateToQuote();
  };
  const handleQuoteClick = () => {
    if (onNavigateToQuote) onNavigateToQuote();
  };

  const sectionHeading = () => {
    if (activeCategorySlug === 'all' && !debouncedQuery) return 'Latest Articles';
    if (debouncedQuery) return `Search: "${debouncedQuery}"`;
    return categories.find((c) => c.slug === activeCategorySlug)?.name ?? 'Articles';
  };

  const showFeatured =
    Boolean(featuredPost) && activeCategorySlug === 'all' && !debouncedQuery && posts.length > 0;

  const showNoArticlesEmpty =
    filteredPosts.length === 0 && !(showFeatured && posts.length === 1);

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <NavBar onQuoteClick={handleQuoteClick} />

      <BlogHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategorySlug={activeCategorySlug}
        onCategoryChange={(slug) => {
          setActiveCategorySlug(slug);
          setVisibleCount(POSTS_PER_PAGE);
        }}
        heroCategories={heroCategories}
      />

      <main className="mx-auto max-w-7xl px-4 py-10 pb-16 sm:px-6">
        <div className="flex items-start gap-8">
          <div className="min-w-0 flex-1 space-y-8">
            {showFeatured && featuredPost ? (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Star className="h-4 w-4 text-blue-600" />
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-500">
                    Featured Article
                  </h2>
                </div>
                <FeaturedPostCard post={featuredPost} onBookingTag={handleBookingTag} />
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-gray-900">{sectionHeading()}</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <div className="flex max-w-[60%] items-center gap-1 overflow-x-auto pb-0.5 xl:hidden">
                {heroCategories
                  .filter((c) => c.slug !== 'all')
                  .map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => {
                          setActiveCategorySlug(cat.slug);
                          setVisibleCount(POSTS_PER_PAGE);
                        }}
                        className={cn(
                          'flex flex-shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all',
                          activeCategorySlug === cat.slug
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-blue-300',
                        )}
                      >
                        <CatIcon className="h-2.5 w-2.5" />
                        <span className="hidden sm:inline">{cat.label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <AnimatePresence>
              {showNoArticlesEmpty ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-gray-200 bg-white p-12 text-center"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                    <Search className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="mb-1 text-sm font-bold text-gray-700">No articles found</p>
                  <p className="text-xs text-gray-400">Try a different search term or select another category.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategorySlug('all');
                    }}
                    className="mt-4 text-xs font-bold text-blue-600 hover:underline"
                  >
                    Clear filters
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visiblePosts.map((post, idx) => (
                  <BlogCard key={post.id} post={post} index={idx} onBookingTag={handleBookingTag} />
                ))}
              </div>
            ) : showFeatured && posts.length === 1 ? (
              <p className="text-center text-sm text-gray-500">More articles coming soon.</p>
            ) : null}

            {hasMore ? (
              <div className="pt-2 text-center">
                <p className="mb-3 text-xs text-gray-400">
                  <span>Showing </span>
                  <strong className="text-gray-700">{visiblePosts.length}</strong>
                  <span> of </span>
                  <strong className="text-gray-700">{filteredPosts.length}</strong>
                  <span> articles</span>
                </p>
                <button
                  type="button"
                  onClick={() => setVisibleCount((v) => v + POSTS_PER_PAGE)}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-8 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:border-blue-400 hover:text-blue-600"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Load More Articles</span>
                </button>
              </div>
            ) : null}

            {!hasMore && filteredPosts.length > 0 && visibleCount > POSTS_PER_PAGE ? (
              <div className="pt-2 text-center">
                <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span>All {filteredPosts.length} articles loaded</span>
                </p>
              </div>
            ) : null}
          </div>

          <SidebarTrending onQuoteClick={handleQuoteClick} trendingPosts={trendingPosts} />
        </div>
      </main>

      <NewsletterCTA />

      <footer className="border-t border-gray-200 bg-white px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-700">Shalean Cleaning Services</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 Shalean. Cape Town&apos;s trusted cleaning professionals.</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-emerald-500" />
              <span>Vetted Cleaners</span>
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-emerald-500" />
              <span>Fully Insured</span>
            </span>
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3 text-blue-500" />
              <span>Cape Town</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function CleaningBlogPageWithRouter(props: BlogListingPayload) {
  const router = useRouter();
  return <CleaningBlogPage {...props} onNavigateToQuote={() => router.push('/booking/quote')} />;
}
