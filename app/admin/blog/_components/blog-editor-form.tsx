'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

type FormStatus = 'draft' | 'published';

type BlogFormValues = {
  title: string;
  slug: string;
  content: string;
  meta_description: string;
  keywords: string;
  featured_image: string;
  status: FormStatus;
};

type BlogEditorFormProps = {
  mode: 'create' | 'edit';
  postId?: string;
  initialValues?: Partial<BlogFormValues>;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function textPreviewFromHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function BlogEditorForm({ mode, postId, initialValues }: BlogEditorFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [slug, setSlug] = useState(initialValues?.slug ?? '');
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [metaDescription, setMetaDescription] = useState(initialValues?.meta_description ?? '');
  const [keywords, setKeywords] = useState(initialValues?.keywords ?? '');
  const [featuredImage, setFeaturedImage] = useState(initialValues?.featured_image ?? '');
  const [status, setStatus] = useState<FormStatus>(initialValues?.status ?? 'draft');

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(title));
    }
  }, [title, slugTouched]);

  useEffect(() => {
    if (!metaDescription.trim()) {
      setMetaDescription(textPreviewFromHtml(content).slice(0, 160));
    }
  }, [content, metaDescription]);

  const wordCount = useMemo(() => content.split(/\s+/).filter(Boolean).length, [content]);
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast.error('Title, slug, and content are required');
      return;
    }

    setIsSubmitting(true);
    const endpoint = mode === 'create' ? '/api/admin/blog/create' : '/api/admin/blog/update';
    const method = mode === 'create' ? 'POST' : 'PUT';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...(postId ? { id: postId } : {}),
          title: title.trim(),
          slug: slugify(slug),
          content,
          meta_description: metaDescription.trim() || null,
          keywords: keywords.trim() || null,
          featured_image: featuredImage.trim() || null,
          status,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      toast.success(mode === 'create' ? 'Post created' : 'Post updated');
      router.push('/admin/blog');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save blog post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? 'Create New Blog Post' : 'Edit Blog Post'}
        description={mode === 'create' ? 'Add and publish content from the admin panel' : 'Update content, SEO, and publish state'}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Blog', href: '/admin/blog' },
          { label: mode === 'create' ? 'New Post' : 'Edit Post' },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
                <CardDescription>Title, URL slug, and HTML content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                    placeholder="url-friendly-slug"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Preview: /blog/{slug || 'your-slug'}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content (HTML)</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[380px] font-mono text-sm"
                    placeholder="<p>Write your post...</p>"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {wordCount} words • ~{readTime} min read
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Published</p>
                    <p className="text-xs text-muted-foreground">Toggle publish status</p>
                  </div>
                  <Switch checked={status === 'published'} onCheckedChange={(checked) => setStatus(checked ? 'published' : 'draft')} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    maxLength={160}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="cleaning, eco-friendly, cape town"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="featured_image">Featured Image URL</Label>
                  <Input
                    id="featured_image"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {mode === 'create' ? 'Create Post' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
