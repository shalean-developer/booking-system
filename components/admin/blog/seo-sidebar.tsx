'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SEOSidebarProps {
  title: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  slug: string;
  content: string;
  wordCount: number;
  h2Count: number;
  hasInternalLink: boolean;
  hasExternalLink: boolean;
  hasImage: boolean;
  hasAltText: boolean;
}

export function SEOSidebar({
  title,
  metaTitle,
  metaDescription,
  focusKeyword,
  slug,
  content,
  wordCount,
  h2Count,
  hasInternalLink,
  hasExternalLink,
  hasImage,
  hasAltText,
}: SEOSidebarProps) {
  const checks = [
    {
      label: 'Title between 50–65 characters',
      passed: metaTitle.length >= 50 && metaTitle.length <= 65,
      value: `${metaTitle.length} characters`,
    },
    {
      label: 'Meta description 140–160 characters',
      passed: metaDescription.length >= 140 && metaDescription.length <= 160,
      value: `${metaDescription.length} characters`,
    },
    {
      label: 'Primary keyword in title',
      passed: focusKeyword && metaTitle.toLowerCase().includes(focusKeyword.toLowerCase()),
      value: focusKeyword || 'Not set',
    },
    {
      label: 'Primary keyword in first paragraph',
      passed: focusKeyword && content.toLowerCase().substring(0, 200).includes(focusKeyword.toLowerCase()),
      value: focusKeyword || 'Not set',
    },
    {
      label: 'Primary keyword in at least 1 H2',
      passed: focusKeyword && content.toLowerCase().includes(`<h2>`) && content.toLowerCase().includes(focusKeyword.toLowerCase()),
      value: focusKeyword || 'Not set',
    },
    {
      label: 'Primary keyword in URL slug',
      passed: focusKeyword && slug.toLowerCase().includes(focusKeyword.toLowerCase().replace(/\s+/g, '-')),
      value: focusKeyword || 'Not set',
    },
    {
      label: 'At least 3 H2s',
      passed: h2Count >= 3,
      value: `${h2Count} H2s`,
    },
    {
      label: 'Write 1000+ words minimum',
      passed: wordCount >= 1000,
      value: `${wordCount} words`,
    },
    {
      label: 'At least 1 internal link',
      passed: hasInternalLink,
      value: hasInternalLink ? 'Yes' : 'No',
    },
    {
      label: 'At least 1 external link',
      passed: hasExternalLink,
      value: hasExternalLink ? 'Yes' : 'No',
    },
    {
      label: 'Include image with alt text',
      passed: hasImage && hasAltText,
      value: hasImage ? (hasAltText ? 'Yes' : 'Missing alt text') : 'No image',
    },
  ];

  const passedCount = checks.filter(c => c.passed).length;
  const totalChecks = checks.length;
  const score = Math.round((passedCount / totalChecks) * 100);

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="text-lg">SEO Best Practices Checklist</CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <span className={cn('text-2xl font-bold', getScoreColor())}>
            {score}%
          </span>
          <span className="text-sm text-gray-500">
            ({passedCount}/{totalChecks} passed)
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.map((check, index) => (
          <div key={index} className="flex items-start gap-2">
            {check.passed ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{check.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{check.value}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

