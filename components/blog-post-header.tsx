import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BlogPostHeader() {
  return (
    <header className="bg-white border-b shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="text-2xl font-bold text-primary">Shalean</div>
            <span className="text-sm text-gray-500">Cleaning Services</span>
          </Link>
          <Button variant="outline" asChild className="hover:bg-primary/5 hover:border-primary/20 transition-all duration-200">
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
