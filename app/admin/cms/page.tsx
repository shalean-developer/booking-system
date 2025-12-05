'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { StatCard } from '@/components/admin/shared/stat-card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, TrendingUp, Eye } from 'lucide-react';
import Link from 'next/link';

export default function AdminCMSPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/blog/stats');
      const data = await response.json();
      if (data.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching CMS stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Management"
        description="Manage your blog content and track performance"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'CMS' },
        ]}
        actions={
          <Button asChild>
            <Link href="/admin/blog/new">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Link>
          </Button>
        }
      />

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Posts"
            value={stats.total || 0}
            icon={BookOpen}
          />
          <StatCard
            title="Published"
            value={stats.published || 0}
            icon={Eye}
            iconColor="text-green-600"
          />
          <StatCard
            title="Drafts"
            value={stats.drafts || 0}
            icon={BookOpen}
            iconColor="text-yellow-600"
          />
          <StatCard
            title="Total Views"
            value={stats.totalViews || 0}
            icon={TrendingUp}
            iconColor="text-blue-600"
          />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 bg-white border rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button asChild className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/admin/blog/new">
                <Plus className="h-4 w-4 mr-2" />
                Create New Post
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start border border-input bg-background hover:bg-accent hover:text-accent-foreground">
              <Link href="/admin/blog">
                <BookOpen className="h-4 w-4 mr-2" />
                View All Posts
              </Link>
            </Button>
          </div>
        </div>

        <div className="p-6 bg-white border rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Tips</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Write engaging titles that capture attention</li>
            <li>• Use relevant keywords for SEO</li>
            <li>• Include high-quality images</li>
            <li>• Optimize for mobile reading</li>
            <li>• Share on social media after publishing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

