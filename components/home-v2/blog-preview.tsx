"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SectionHeading, Card, ShaleanButtonLink } from "@/components/shalean-ui";

const posts = [
  {
    title: "Complete Guide to Deep Cleaning Your Cape Town Home",
    category: "Deep Cleaning",
    readTime: "5 min read",
    img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
    excerpt:
      "Everything you need to know about scheduling a professional deep clean, what's covered, and how to prepare your home.",
  },
  {
    title: "How Much Does Cleaning Cost in Cape Town?",
    category: "Pricing Guide",
    readTime: "4 min read",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    excerpt:
      "A transparent breakdown of cleaning service costs across Cape Town suburbs, including seasonal pricing factors.",
  },
  {
    title: "Airbnb Cleaning Checklist for Hosts",
    category: "Airbnb",
    readTime: "6 min read",
    img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80",
    excerpt:
      "The complete turnaround checklist top-rated Cape Town Airbnb hosts use to maintain 5-star cleanliness ratings.",
  },
];

export function BlogPreview() {
  return (
    <section className="px-6 bg-slate-50 py-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <SectionHeading subtitle="Practical cleaning advice from the Cape Town experts.">
            Cleaning Guides & Tips
          </SectionHeading>
          <ShaleanButtonLink
            href="/blog"
            variant="outline"
            className="whitespace-nowrap self-start sm:self-auto"
          >
            View All Articles <ArrowRight className="w-4 h-4" />
          </ShaleanButtonLink>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post, idx) => (
            <motion.div key={idx} whileHover={{ y: -4 }}>
              <Link href="/blog">
                <Card className="h-full flex flex-col hover:border-blue-200 transition-all cursor-pointer p-0 overflow-hidden">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={post.img}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-3 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed flex-grow">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold mt-4">
                      Read More <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
