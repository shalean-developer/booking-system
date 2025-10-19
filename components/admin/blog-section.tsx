'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Eye, EyeOff, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import type { BlogPostWithDetails, BlogCategory, BlogTag } from '@/lib/blog-client';
import { generateSlug, calculateReadTime } from '@/lib/blog-client';
import { RichTextEditor } from './rich-text-editor';

type PostFormData = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  featured_image_alt: string;
  category_id: string;
  status: 'draft' | 'published';
  meta_title: string;
  meta_description: string;
  read_time: number;
  published_at: string;
};

export function BlogSection() {
  const [posts, setPosts] = useState<BlogPostWithDetails[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadingFeatured, setIsUploadingFeatured] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPostWithDetails | null>(null);
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    featured_image_alt: '',
    category_id: '',
    status: 'draft',
    meta_title: '',
    meta_description: '',
    read_time: 5,
    published_at: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Load posts
      const postsRes = await fetch('/api/admin/blog/posts');
      const postsData = await postsRes.json();
      setPosts(postsData.posts || []);

      // Load categories
      const categoriesRes = await fetch('/api/admin/blog/categories');
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData.categories || []);

      // Load tags
      const tagsRes = await fetch('/api/admin/blog/tags');
      const tagsData = await tagsRes.json();
      setTags(tagsData.tags || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load blog data');
    } finally {
      setLoading(false);
    }
  }

  function handleTitleChange(title: string) {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
      meta_title: title.substring(0, 60),
    }));
  }

  function handleContentChange(content: string) {
    setFormData(prev => ({
      ...prev,
      content,
      read_time: calculateReadTime(content),
    }));
  }

  const handleFeaturedImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, WebP, and GIF files are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    setIsUploadingFeatured(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/blog/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      setFormData(prev => ({
        ...prev,
        featured_image: result.imageUrl,
      }));
      toast.success('Featured image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload featured image');
    } finally {
      setIsUploadingFeatured(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  function openNewPostForm() {
    setEditingPost(null);
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      featured_image: '',
      featured_image_alt: '',
      category_id: categories[0]?.id || '',
      status: 'draft',
      meta_title: '',
      meta_description: '',
      read_time: 5,
      published_at: new Date().toISOString().split('T')[0],
    });
    setIsFormOpen(true);
  }

  async function openEditForm(post: BlogPostWithDetails) {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      featured_image: post.featured_image || '',
      featured_image_alt: post.featured_image_alt || '',
      category_id: post.category_id || '',
      status: post.status,
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      read_time: post.read_time,
      published_at: post.published_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    });
    setIsFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const url = editingPost
        ? `/api/admin/blog/posts/${editingPost.id}`
        : '/api/admin/blog/posts';
      
      const method = editingPost ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save post');

      toast.success(editingPost ? 'Post updated!' : 'Post created!');
      setIsFormOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save post');
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete post');

      toast.success('Post deleted!');
      loadData();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Loading blog posts...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blog Posts</h2>
          <p className="text-gray-600">Manage your blog content</p>
        </div>
        <Button onClick={openNewPostForm}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Posts Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Published
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No blog posts yet. Create your first post!
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{post.title}</div>
                    <div className="text-sm text-gray-500">/{post.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {post.category_name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {post.status === 'published' ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <Eye className="h-3 w-3 mr-1" />
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Draft
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditForm(post)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Post Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? 'Edit Post' : 'New Blog Post'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
            </div>

            {/* Slug */}
            <div>
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                https://shalean.co.za/blog/{formData.slug}
              </p>
            </div>

            {/* Excerpt */}
            <div>
              <Label htmlFor="excerpt">Excerpt (160 characters)</Label>
              <textarea
                id="excerpt"
                className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-md"
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                maxLength={160}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.excerpt.length}/160 characters
              </p>
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">Content *</Label>
              <RichTextEditor
                content={formData.content}
                onChange={handleContentChange}
                placeholder="Write your blog post content here..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Read time: {formData.read_time} min
              </p>
            </div>

            {/* Featured Image */}
            <div className="space-y-4">
              <div>
                <Label>Featured Image</Label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <Input
                      value={formData.featured_image}
                      onChange={(e) =>
                        setFormData({ ...formData, featured_image: e.target.value })
                      }
                      placeholder="/images/blog/..."
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFeaturedImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploadingFeatured}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploadingFeatured}
                      className="whitespace-nowrap"
                    >
                      {isUploadingFeatured ? (
                        <Upload className="h-4 w-4 animate-pulse mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="featured_image_alt">Image Alt Text</Label>
                <Input
                  id="featured_image_alt"
                  value={formData.featured_image_alt}
                  onChange={(e) =>
                    setFormData({ ...formData, featured_image_alt: e.target.value })
                  }
                  placeholder="Describe the image for SEO..."
                />
              </div>
              {formData.featured_image && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <img 
                        src={formData.featured_image} 
                        alt={formData.featured_image_alt || 'Featured image'}
                        className="max-w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, featured_image: '' })}
                      className="ml-4"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Category and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'published') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SEO Meta Tags */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">SEO Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="meta_title">Meta Title (60 characters)</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) =>
                      setFormData({ ...formData, meta_title: e.target.value })
                    }
                    maxLength={60}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.meta_title.length}/60 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="meta_description">
                    Meta Description (160 characters)
                  </Label>
                  <textarea
                    id="meta_description"
                    className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.meta_description}
                    onChange={(e) =>
                      setFormData({ ...formData, meta_description: e.target.value })
                    }
                    maxLength={160}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.meta_description.length}/160 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="published_at">Publish Date</Label>
                  <Input
                    id="published_at"
                    type="date"
                    value={formData.published_at}
                    onChange={(e) =>
                      setFormData({ ...formData, published_at: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPost ? 'Update Post' : 'Create Post'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

