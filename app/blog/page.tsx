import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  ArrowRight,
  Calendar,
  Clock
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Shalean Cleaning Services",
  description: "Expert cleaning tips, guides, and industry insights from professional cleaners. Learn how to maintain a spotless home.",
};

export default function BlogPage() {
  const blogPosts = [
    {
      title: "10 Essential Deep Cleaning Tips for Every Home",
      excerpt: "Discover professional techniques to deep clean your home like an expert, from kitchen to bathroom. Transform your space with these proven methods.",
      category: "Cleaning Tips",
      readTime: "5 min read",
      image: "/images/deep-specialty.jpg",
      slug: "deep-cleaning-tips",
      date: "October 15, 2025"
    },
    {
      title: "The Benefits of Eco-Friendly Cleaning Products",
      excerpt: "Learn why switching to eco-friendly cleaning products is better for your health and the environment. Discover safe, effective alternatives.",
      category: "Sustainability",
      readTime: "4 min read",
      image: "/images/home-maintenance.jpg",
      slug: "eco-friendly-products",
      date: "October 12, 2025"
    },
    {
      title: "Complete Airbnb Turnover Cleaning Checklist",
      excerpt: "Master the art of Airbnb turnover with our comprehensive cleaning checklist for 5-star reviews. Ensure guest satisfaction every time.",
      category: "Airbnb Hosts",
      readTime: "6 min read",
      image: "/images/move-turnover.jpg",
      slug: "airbnb-cleaning-checklist",
      date: "October 10, 2025"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">Shalean</div>
              <span className="text-sm text-gray-500">Cleaning Services</span>
            </Link>
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Cleaning Insights & Tips
            </Badge>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
              Shalean <span className="text-primary">Blog</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Expert cleaning tips, industry insights, and practical guides from
              professional cleaners. Learn how to maintain a spotless space.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Card key={post.slug} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div className="h-48 relative bg-gradient-to-br from-primary/20 to-primary/40">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                    <Badge variant="outline" className="text-xs">{post.category}</Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </span>
                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0">
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Get cleaning tips and exclusive offers delivered to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button className="bg-primary hover:bg-primary/90 whitespace-nowrap">
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Need Professional Cleaning?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Let our expert team take care of your cleaning needs
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
            <Link href="/booking/service/select">
              Book a Service
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

