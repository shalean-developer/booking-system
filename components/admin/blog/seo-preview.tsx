'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SEOPreviewProps {
  metaTitle: string;
  slug: string;
  metaDescription: string;
  siteUrl?: string;
}

export function SEOPreview({
  metaTitle,
  slug,
  metaDescription,
  siteUrl = 'https://shalean.co.za',
}: SEOPreviewProps) {
  const url = `${siteUrl}/blog/${slug}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Google Snippet Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm text-gray-500">
            {url}
          </div>
          <div className="text-xl text-blue-600 hover:underline cursor-pointer">
            {metaTitle || 'Your post title will appear here'}
          </div>
          <div className="text-sm text-gray-600 line-clamp-2">
            {metaDescription || 'Your meta description will appear here. This is how your post will look in Google search results.'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

