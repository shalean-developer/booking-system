import { SocialShareButtons } from "@/components/social-share-buttons";

interface BlogPostContentProps {
  content: string;
  title?: string;
  url?: string;
}

export function BlogPostContent({ content, title = "", url = "" }: BlogPostContentProps) {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <article 
          className="blog-prose"
          dangerouslySetInnerHTML={{ __html: content }}
        />
        
        {/* Social Share Buttons */}
        {url && title && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-4">Share this article:</p>
            <SocialShareButtons 
              url={url}
              title={title}
              showLabel={false}
            />
          </div>
        )}
      </div>
    </section>
  );
}
