'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { stringifyStructuredData } from '@/lib/structured-data-validator';

interface BreadcrumbItem {
  label?: string;
  name?: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  // Normalize items to use 'label' (support both 'name' and 'label')
  const normalizedItems = items.map(item => ({
    label: item.label || item.name || '',
    href: item.href
  }));

  // Generate BreadcrumbList structured data
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": normalizedItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `https://shalean.co.za${item.href}`
    }))
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyStructuredData(breadcrumbStructuredData) }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <Link 
              href="/" 
              className="hover:text-primary transition-colors flex items-center gap-1"
              aria-label="Home"
            >
              <Home className="h-4 w-4" />
            </Link>
          </li>
          {normalizedItems.map((item, index) => (
            <li key={index} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              {index === normalizedItems.length - 1 ? (
                <span className="text-gray-900 font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link 
                  href={item.href}
                  className="hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
