import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const staticSupabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      })
    : null;

export type ServiceLocationPageStatus = 'draft' | 'published';

export interface ServiceLocationPage {
  id: string;
  slug: string;
  title: string;
  hero_subtitle: string | null;
  city: string;
  region: string | null;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  featured_image: string | null;
  status: ServiceLocationPageStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getPublishedLocationPageBySlug(
  slug: string
): Promise<ServiceLocationPage | null> {
  try {
    if (!staticSupabase) {
      console.warn('Skipping location page fetch: Supabase env not configured');
      return null;
    }
    const { data, error } = await staticSupabase
      .from('service_location_pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') {
        console.warn('service_location_pages table missing; run migration 20260414140000');
        return null;
      }
      console.error('Error fetching service location page:', error);
      return null;
    }
    return data as ServiceLocationPage | null;
  } catch (e) {
    console.error('getPublishedLocationPageBySlug:', e);
    return null;
  }
}

export async function getPublishedLocationSlugs(): Promise<string[]> {
  try {
    if (!staticSupabase) return [];
    const { data, error } = await staticSupabase
      .from('service_location_pages')
      .select('slug')
      .eq('status', 'published');

    if (error || !data) return [];
    return data.map((row: { slug: string }) => row.slug).filter(Boolean);
  } catch {
    return [];
  }
}

export type ServiceLocationSummary = {
  slug: string;
  title: string;
  city: string;
};

/** For hub pages (e.g. /services) to link to programmatic SEO pages */
export async function getPublishedLocationPagesSummary(): Promise<ServiceLocationSummary[]> {
  try {
    if (!staticSupabase) return [];
    const { data, error } = await staticSupabase
      .from('service_location_pages')
      .select('slug, title, city')
      .eq('status', 'published')
      .order('city', { ascending: true });

    if (error || !data) return [];
    return data as ServiceLocationSummary[];
  } catch {
    return [];
  }
}
