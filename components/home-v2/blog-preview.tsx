"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const brandBlue = "#2B59FF";

const posts = [
  {
    title:
      "Habits that keep your home cleaner between professional visits",
    excerpt:
      "Simple daily routines that stretch the results of every booking — without turning weekends into chores.",
    author: "Shalean Team",
    date: "Mar 12, 2026",
    img: "/image/more-than-clean-services.jpg",
    href: "/blog",
  },
  {
    title:
      "How we approach eco-friendly cleaning — and what we learned",
    excerpt:
      "What worked in real homes across South Africa, from products to scheduling and staff training.",
    author: "Shalean Team",
    date: "Feb 2, 2026",
    img: "/image/more-than-clean-homes.jpg",
    href: "/blog/eco-friendly-cleaning-south-africa",
  },
];

export function BlogPreview() {
  return (
    <section className="px-6 bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Practical guides from our cleaning experts
          </h2>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-bold shrink-0 w-fit transition hover:gap-2"
            style={{ color: brandBlue }}
          >
            View all articles <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
        <div className="flex flex-col gap-8 md:gap-10">
          {posts.map((post, idx) => (
            <motion.div
              key={post.href}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
            >
              <Link
                href={post.href}
                className="group grid md:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:grid-cols-[minmax(0,1fr)_400px] gap-0 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6 md:p-8 lg:p-10 flex flex-col justify-center order-2 md:order-1">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 group-hover:underline decoration-2 underline-offset-4 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-slate-600 mt-3 leading-relaxed">{post.excerpt}</p>
                  <p className="text-slate-400 text-sm mt-4">
                    {post.author} · {post.date}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 text-sm font-bold mt-5 w-fit"
                    style={{ color: brandBlue }}
                  >
                    Read article <ArrowRight className="w-4 h-4" aria-hidden />
                  </span>
                </div>
                <div className="relative aspect-[16/10] md:aspect-auto md:min-h-full min-h-[200px] order-1 md:order-2">
                  <Image
                    src={post.img}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
