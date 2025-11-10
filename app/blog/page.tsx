import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { NewsletterForm } from "@/components/newsletter-form";
import { ArrowRight, Calendar, Clock, Search } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";
import { getPublishedPosts } from "@/lib/blog-server";

// Blog page metadata
export const metadata: Metadata = createMetadata(getSeoConfig("blog"));

// Revalidate every hour to show new posts
export const revalidate = 3600;

export default async function BlogPage() {
  const blogPosts = await getPublishedPosts();
  const categories = Array.from(
    new Set(
      blogPosts
        .map((post) => post.category_name)
        .filter((category): category is string => Boolean(category))
    )
  );
  const [featuredPost, ...remainingPosts] = blogPosts;
  const topReads = remainingPosts.slice(0, 3);
  const additionalPosts = remainingPosts.slice(3);
  const gridPageSize = 6;
  const gridPosts = additionalPosts.slice(0, gridPageSize);
  const totalGridPosts = additionalPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalGridPosts / gridPageSize));

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-white">
      {/* Header */}
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-16 sm:py-20">
          <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-100/70 via-white to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-12">
              <div className="max-w-3xl">
                <Badge className="mb-4 border-primary/30 bg-primary/10 text-primary">
                  Sustainable Cleaning Insights
                </Badge>
                <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
                  Fresh stories for a cleaner, greener lifestyle
                </h1>
                <p className="mt-4 text-lg text-gray-600 sm:text-xl">
                  Explore practical tips, expert advice, and inspiring stories from the Shalean community. Discover how sustainable habits can transform every space.
                </p>
              </div>

              {featuredPost ? (
                <div className="grid gap-8 lg:grid-cols-[1.7fr,1fr]">
                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="group relative block overflow-hidden rounded-3xl shadow-xl"
                  >
                    <div className="relative h-[420px]">
                      {featuredPost.featured_image && featuredPost.featured_image.trim() !== "" ? (
                        <Image
                          src={featuredPost.featured_image}
                          alt={featuredPost.featured_image_alt || featuredPost.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          priority
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                          <span className="text-primary/60 text-sm font-medium">
                            Image coming soon
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-end gap-4 p-8 text-white">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                        {featuredPost.category_name && (
                          <Badge className="border-white/20 bg-white/10 text-white">
                            {featuredPost.category_name}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {featuredPost.read_time} min read
                        </span>
                        {featuredPost.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(featuredPost.published_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
                        {featuredPost.title}
                      </h2>
                      <p className="max-w-2xl text-base text-white/80 sm:text-lg line-clamp-3">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-200">
                        Read latest article
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>

                  <Card className="rounded-3xl border border-emerald-100 bg-white/70 shadow-lg backdrop-blur">
                    <CardContent className="p-6 sm:p-8">
                      <div className="mb-6 flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-semibold text-gray-900">Top Reads</h3>
                          <p className="text-sm text-gray-500">
                            Curated highlights to jump-start your routine
                          </p>
                        </div>
                        <Badge className="border-primary/20 bg-primary/10 text-primary">
                          Trending
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-6">
                        {topReads.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            We&apos;re gathering stories for you. Check back soon!
                          </p>
                        ) : (
                          topReads.map((post) => (
                            <Link
                              key={post.slug}
                              href={`/blog/${post.slug}`}
                              className="group flex gap-4 rounded-2xl border border-transparent p-3 transition hover:border-emerald-100 hover:bg-emerald-50/40"
                            >
                              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-emerald-100">
                                {post.featured_image && post.featured_image.trim() !== "" ? (
                                  <Image
                                    src={post.featured_image}
                                    alt={post.featured_image_alt || post.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs text-primary/60">
                                    Coming soon
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <Badge variant="outline" className="mb-2 border-emerald-200 bg-emerald-50 text-emerald-700">
                                  {post.category_name || "Latest"}
                                </Badge>
                                <h4 className="text-base font-semibold text-gray-900 line-clamp-2">
                                  {post.title}
                                </h4>
                                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {post.read_time} min read
                                  </span>
                                  {post.published_at && (
                                    <span>{new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-emerald-200 bg-white/70 p-12 text-center text-gray-600 shadow">
                  We&apos;re getting our latest stories ready. Check back soon!
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Category Strip */}
        <section className="border-y border-emerald-100 bg-white/90 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Browse by categories</h2>
                <p className="text-sm text-gray-500">
                  Filter topics to match your current goals and routines.
                </p>
              </div>
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search blogs"
                  className="w-full rounded-full border border-emerald-100 bg-white px-12 py-3 text-sm text-gray-600 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
              >
                All articles
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className="rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {gridPosts.length === 0 ? (
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-12 text-center text-gray-600 shadow">
                Explore our featured stories above while we prepare more articles for you.
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {gridPosts.map((post) => {
                  const postTags =
                    post.tags && post.tags.length > 0
                      ? post.tags
                      : post.category_name
                      ? [post.category_name]
                      : [];
                  const formattedDate = post.published_at
                    ? new Date(post.published_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : null;
                  return (
                  <Card
                    key={post.slug}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white/80 shadow-lg transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
                  >
                    <div className="relative h-52 bg-emerald-100">
                      {post.featured_image && post.featured_image.trim() !== "" ? (
                        <Image
                          src={post.featured_image}
                          alt={post.featured_image_alt || post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-primary/60">
                          Visual coming soon
                        </div>
                      )}
                      {postTags.length > 0 && (
                        <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
                          {postTags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-primary shadow"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <CardContent className="flex flex-1 flex-col gap-4 p-6">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {post.category_name && (
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                            {post.category_name}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {post.read_time} min read
                        </span>
                      </div>
                      {formattedDate && (
                        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary/80">
                          <Calendar className="h-3.5 w-3.5" />
                          {formattedDate}
                        </span>
                      )}
                      <Link href={`/blog/${post.slug}`} className="group-hover:text-primary">
                        <h3 className="text-xl font-semibold text-gray-900 transition group-hover:text-primary">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="line-clamp-3 text-sm text-gray-600">
                        {post.excerpt}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <Button
                          variant="outline"
                          className="rounded-full border-primary/40 bg-primary/5 px-5 py-2 text-primary transition hover:bg-primary/10"
                          asChild
                        >
                          <Link href={`/blog/${post.slug}`} className="flex items-center gap-2 text-sm font-semibold">
                            Read more
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
                })}
              </div>
            )}
            {totalPages > 1 && (
              <nav className="mt-12 flex justify-center">
                <ul className="flex items-center gap-2 text-sm font-medium">
                  {[1, 2, 3].filter((num) => num <= totalPages).map((num) => (
                    <li key={num}>
                      <button
                        type="button"
                        className={`h-10 w-10 rounded-full border transition ${
                          num === 1
                            ? "border-primary bg-primary text-white shadow-lg"
                            : "border-emerald-100 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
                        }`}
                      >
                        {num}
                      </button>
                    </li>
                  ))}
                  {totalPages > 3 && (
                    <>
                      <li className="px-2 text-gray-400">...</li>
                      <li>
                        <button
                          type="button"
                          className="h-10 w-10 rounded-full border border-emerald-100 bg-white text-gray-600 transition hover:border-primary/40 hover:text-primary"
                        >
                          {totalPages}
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </nav>
            )}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="pb-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-primary via-emerald-500 to-emerald-400 text-white shadow-xl">
              <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
                <div className="flex flex-col gap-6 p-10 sm:p-12">
                  <Badge className="w-fit border-white/40 bg-white/10 text-white">
                    Subscribe &amp; stay updated
                  </Badge>
                  <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
                    Join thousands getting weekly eco-cleaning inspiration
                  </h2>
                  <p className="max-w-xl text-base text-white/80">
                    Receive curated routines, seasonal guides, and exclusive offers from the Shalean team. No clutter—just the insights you need for spotless spaces.
                  </p>
                  <div className="mt-2 max-w-md">
                    <NewsletterForm />
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                    We respect your inbox. Unsubscribe anytime.
                  </span>
                </div>
                <div className="relative hidden items-end justify-end pr-4 pb-0 sm:flex">
                  <div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-white/10 blur-3xl" />
                  <div className="relative mx-auto h-full max-h-[340px] w-full max-w-[360px] overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl">
                    <Image
                      src="/images/cleaning-team-hero.jpg"
                      alt="Shalean team member reviewing sustainable cleaning guide"
                      fill
                      className="object-cover"
                      priority={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

