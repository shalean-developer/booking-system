'use client';

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryButtons, Pagination, useBlogFilter } from "@/components/blog-filter";
import { ArrowRight, Calendar, Clock, Search } from "lucide-react";

export function BlogContent({ categories }: { categories: string[] }) {
  const { featuredPost, topReads, gridPosts, filteredPosts } = useBlogFilter();
  const sortedPosts = filteredPosts;

  return (
    <>
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
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">The Latest</h2>
                  <div className="group block overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-lg transition hover:shadow-xl">
                    <div className="relative h-[300px]">
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
                    </div>
                    <div className="p-6">
                      <Link href={`/blog/${featuredPost.slug}`}>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-3 group-hover:text-primary transition">
                          {featuredPost.title}
                        </h2>
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                        {featuredPost.published_at && (
                          <span>
                            {new Date(featuredPost.published_at).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                        <span>Author</span>
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {featuredPost.excerpt || featuredPost.meta_description || 'Read our latest expert cleaning guide.'}
                      </p>
                      <Link
                        href={`/blog/${featuredPost.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition"
                      >
                        Read more
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>

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
                          <div
                            key={post.slug}
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
                              <Link href={`/blog/${post.slug}`}>
                                <h4 className="text-base font-semibold text-gray-900 line-clamp-2 mb-2">
                                  {post.title}
                                </h4>
                              </Link>
                              {post.published_at && (
                                <div className="text-xs text-gray-500 mb-2">
                                  {new Date(post.published_at).toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </div>
                              )}
                              <Link
                                href={`/blog/${post.slug}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition"
                              >
                                Read more
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
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
      <section className="border-y border-emerald-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Top Row: Heading and Search */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Browse by categories</h2>
            </div>
            <div className="relative w-full max-w-md flex-shrink-0">
              <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <input
                type="search"
                placeholder="Search blogs"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-500 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          {/* Category Buttons Row - Always visible */}
          <div className="mt-0">
            <CategoryButtons categories={categories || []} />
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {gridPosts.length === 0 ? (
            // Only show empty state if there are 3 or fewer posts total
            // (1 featured + 2 top reads = 3 posts, so grid would be empty)
            sortedPosts.length <= 3 ? (
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-12 text-center text-gray-600 shadow">
                <p className="text-lg font-medium mb-2">All our articles are featured above!</p>
                <p className="text-sm">Check back soon for more expert cleaning tips and guides.</p>
              </div>
            ) : (
              // If there are more than 3 posts but grid is empty, might be pagination issue
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-12 text-center text-gray-600 shadow">
                <p className="text-lg font-medium mb-2">No more articles to display.</p>
                <p className="text-sm">Check back soon for more expert cleaning tips and guides.</p>
              </div>
            )
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
                        {post.read_time || 5} min read
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
                      {post.excerpt || post.meta_description || 'Read our expert cleaning guide.'}
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
          <Pagination />
        </div>
      </section>
    </>
  );
}

