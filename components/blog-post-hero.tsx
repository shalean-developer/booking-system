import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

interface BlogPost {
  title: string;
  category_name?: string;
  published_at: string | null;
  read_time: number;
  featured_image: string | null;
  featured_image_alt: string | null;
}

interface BlogPostHeroProps {
  post: BlogPost;
}

export function BlogPostHero({ post }: BlogPostHeroProps) {
  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <ol className="flex items-center gap-3 text-sm">
            <li>
              <Link href="/" className="text-gray-600 hover:text-primary transition-colors duration-200">Home</Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/blog" className="text-gray-600 hover:text-primary transition-colors duration-200">Blog</Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium truncate">{post.title}</li>
          </ol>
        </div>
      </nav>

      {/* Article Hero */}
      <section className="py-12 md:py-14 bg-gradient-to-b from-white to-gray-50/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            {post.category_name && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1">
                {post.category_name}
              </Badge>
            )}
          </div>
          <h1 className="mb-6 text-4xl md:text-[2.75rem] font-bold text-gray-900 leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-5 text-gray-600 mb-10">
            <span className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Draft'}
            </span>
            <span className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              {post.read_time} min read
            </span>
          </div>
          {post.featured_image && post.featured_image.trim() !== '' ? (
            <div className="relative aspect-[16/9] md:aspect-[21/9] max-h-[420px] rounded-xl overflow-hidden shadow-lg border border-gray-200">
              <Image
                src={post.featured_image}
                alt={post.featured_image_alt || post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 85vw, 960px"
              />
            </div>
          ) : (
            <div className="relative aspect-[16/9] max-h-[420px] rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <span className="text-primary/60 text-lg font-medium">No Featured Image</span>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
