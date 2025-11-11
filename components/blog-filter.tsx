'use client';

import { useState, useMemo, createContext, useContext } from 'react';
import type { BlogPostWithDetails } from '@/lib/blog-server';

interface BlogFilterContextType {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  filteredPosts: BlogPostWithDetails[];
  featuredPost: BlogPostWithDetails | undefined;
  topReads: BlogPostWithDetails[];
  gridPosts: BlogPostWithDetails[];
  totalPages: number;
}

const BlogFilterContext = createContext<BlogFilterContextType | null>(null);

export function useBlogFilter() {
  const context = useContext(BlogFilterContext);
  if (!context) {
    throw new Error('useBlogFilter must be used within BlogFilterProvider');
  }
  return context;
}

interface BlogFilterProviderProps {
  allPosts: BlogPostWithDetails[];
  categories: string[];
  children: React.ReactNode;
}

export function BlogFilterProvider({ allPosts, categories, children }: BlogFilterProviderProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter posts by category
  const filteredPosts = useMemo(() => {
    if (!selectedCategory) {
      return allPosts;
    }
    return allPosts.filter((post) => post.category_name === selectedCategory);
  }, [allPosts, selectedCategory]);

  // Sort filtered posts by published_at (newest first)
  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
      const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [filteredPosts]);

  // Calculate featured post, top reads, and grid posts
  // Show first post as featured, next 2 as top reads, rest in grid
  // This ensures more posts appear in the grid
  const featuredPost = sortedPosts.length > 0 ? sortedPosts[0] : undefined;
  const topReads = sortedPosts.slice(1, 3); // Only 2 posts in top reads (indices 1-2)
  const additionalPosts = sortedPosts.slice(3); // Posts 4+ go to grid (index 3+)
  const gridPageSize = 6;
  const startIndex = (currentPage - 1) * gridPageSize;
  
  // Show posts in grid starting from index 3
  const gridPosts = additionalPosts.slice(startIndex, startIndex + gridPageSize);
  
  const totalPages = Math.max(1, Math.ceil(additionalPosts.length / gridPageSize));

  // Reset to page 1 when category changes
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <BlogFilterContext.Provider
      value={{
        selectedCategory,
        setSelectedCategory: handleCategoryChange,
        currentPage,
        setCurrentPage,
        filteredPosts,
        featuredPost,
        topReads,
        gridPosts,
        totalPages,
      }}
    >
      {children}
    </BlogFilterContext.Provider>
  );
}

interface CategoryButtonsProps {
  categories: string[];
}

export function CategoryButtons({ categories }: CategoryButtonsProps) {
  const { selectedCategory, setSelectedCategory } = useBlogFilter();

  // Always show at least the "All" button - ensure it's visible
  return (
    <div className="w-full" style={{ display: 'block' }}>
      <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 overflow-hidden" style={{ display: 'inline-flex' }}>
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
            selectedCategory === null
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:text-gray-900'
          }`}
          style={{ display: 'inline-block' }}
        >
          All
        </button>
        {categories && categories.length > 0 && categories.map((category) => (
          <div key={category} className="flex items-center" style={{ display: 'flex' }}>
            <div className="h-5 w-px bg-gray-300" />
            <button
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {category}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Pagination() {
  const { totalPages, currentPage, setCurrentPage } = useBlogFilter();

  if (totalPages <= 1) return null;

  return (
    <nav className="mt-12 flex justify-center">
      <ul className="flex items-center gap-2 text-sm font-medium">
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((num) => (
          <li key={num}>
            <button
              type="button"
              onClick={() => setCurrentPage(num)}
              className={`h-10 w-10 rounded-full border transition ${
                num === currentPage
                  ? 'border-primary bg-primary text-white shadow-lg'
                  : 'border-emerald-100 bg-white text-gray-600 hover:border-primary/40 hover:text-primary'
              }`}
            >
              {num}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

