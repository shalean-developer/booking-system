interface BlogPostContentProps {
  content: string;
}

export function BlogPostContent({ content }: BlogPostContentProps) {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <article 
          className="blog-prose"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
}
