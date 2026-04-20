import { createServiceClient } from "@/lib/supabase-server";
import type { SeoContentPatch } from "@/lib/seo/ai-optimizer";

export type SeoPageIdentity = {
  slug: string;
  url?: string;
};

type SeoPatchRow = {
  id?: string | number;
  page_slug: string;
  patch_json?: SeoContentPatch | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export function normalizeSeoPatch(patch: SeoContentPatch | null | undefined): SeoContentPatch {
  if (!patch || typeof patch !== "object") return {};
  const out: SeoContentPatch = {};
  if (typeof patch.title === "string" && patch.title.trim()) out.title = patch.title.trim();
  if (typeof patch.metaDescription === "string" && patch.metaDescription.trim()) {
    out.metaDescription = patch.metaDescription.trim();
  }
  if (typeof patch.intro === "string" && patch.intro.trim()) out.intro = patch.intro.trim();
  if (Array.isArray(patch.faq)) {
    out.faq = patch.faq
      .filter((item) => item && typeof item.question === "string" && typeof item.answer === "string")
      .map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      }))
      .filter((item) => item.question.length > 0 && item.answer.length > 0)
      .slice(0, 20);
  }
  if (Array.isArray(patch.internalLinks)) {
    out.internalLinks = Array.from(
      new Set(
        patch.internalLinks
          .filter((href) => typeof href === "string")
          .map((href) => href.trim())
          .filter(Boolean)
      )
    ).slice(0, 30);
  }
  return out;
}

export function mergeSeoContent<T extends object>(originalContent: T, patch: SeoContentPatch | null | undefined): T {
  const safePatch = normalizeSeoPatch(patch);
  return {
    ...originalContent,
    ...safePatch,
  };
}

export async function getSeoPatch(pageSlug: string): Promise<SeoContentPatch | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("seo_patches")
      .select("id,page_slug,patch_json,created_at,updated_at")
      .eq("page_slug", pageSlug)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    const row = data as SeoPatchRow | null;
    return normalizeSeoPatch(row?.patch_json);
  } catch {
    return null;
  }
}

export async function applySeoPatch(page: SeoPageIdentity, patch: SeoContentPatch): Promise<SeoContentPatch> {
  const safePatch = normalizeSeoPatch(patch);
  const existing = await getSeoPatch(page.slug);
  const merged = normalizeSeoPatch({
    ...(existing ?? {}),
    ...safePatch,
  });

  const supabase = createServiceClient();
  await supabase.from("seo_patches").upsert(
    {
      page_slug: page.slug,
      patch_json: merged,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "page_slug" }
  );

  return merged;
}

