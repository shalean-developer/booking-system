import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { BlogEditorForm } from '../_components/blog-editor-form';

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-dynamic';

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, content, meta_description, keywords, featured_image, status')
    .eq('id', id)
    .maybeSingle();

  if (error || !post) {
    notFound();
  }

  return (
    <BlogEditorForm
      mode="edit"
      postId={post.id}
      initialValues={{
        title: post.title ?? '',
        slug: post.slug ?? '',
        content: post.content ?? '',
        meta_description: post.meta_description ?? '',
        keywords: post.keywords ?? '',
        featured_image: post.featured_image ?? '',
        status: post.status === 'published' ? 'published' : 'draft',
      }}
    />
  );
}
