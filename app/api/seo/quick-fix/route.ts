import { NextResponse } from "next/server";
import {
  applyQuickFix,
  applyQuickFixPatch,
  getQuickFixFlagsForUrl,
  setAutoImprovePages,
  type SeoQuickFixId,
} from "@/lib/seo/quick-fix-state";
import { computeQuickFixMetrics } from "@/lib/seo/quick-fix-impact";
import type { SeoContentPatch } from "@/lib/seo/ai-optimizer";
import { applySeoPatch } from "@/lib/seo/patch-engine";

const VALID_FIX_IDS: SeoQuickFixId[] = [
  "expand-intro-local-context",
  "expand-faq",
  "add-internal-links",
  "add-jsonld-schema",
  "add-service-keywords",
  "maintain-and-refresh",
];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const action = String(formData.get("action") ?? "apply-fix");

    if (action === "toggle-auto-improve") {
      const enabled = String(formData.get("enabled") ?? "false") === "true";
      const config = await setAutoImprovePages(enabled);
      return NextResponse.json({ ok: true, config });
    }

    const url = String(formData.get("url") ?? "");
    const fixId = String(formData.get("fixId") ?? "") as SeoQuickFixId;
    if (!url || !fixId) {
      return NextResponse.json({ error: "Missing url or fixId" }, { status: 400 });
    }
    if (!VALID_FIX_IDS.includes(fixId)) {
      return NextResponse.json({ error: `Unsupported fixId: ${fixId}` }, { status: 400 });
    }

    const beforeFlags = await getQuickFixFlagsForUrl(url);
    const beforeMetrics = computeQuickFixMetrics(url, beforeFlags);
    const result = await applyQuickFix(url, fixId);
    const patchRaw = formData.get("patch");
    let patchResult: Awaited<ReturnType<typeof applyQuickFixPatch>> | SeoContentPatch | null = null;
    if (typeof patchRaw === "string" && patchRaw.trim().length > 0) {
      const patch = JSON.parse(patchRaw) as SeoContentPatch;
      patchResult = await applyQuickFixPatch(url, patch);
      try {
        const pageSlug = new URL(url).pathname.replace(/^\//, "");
        patchResult = await applySeoPatch({ slug: pageSlug, url }, patch);
      } catch {
        // Keep quick-fix patch state fallback if URL parsing or DB patch fails.
      }
    }
    const afterMetrics = computeQuickFixMetrics(url, result.flags);
    const htmlChanged =
      beforeMetrics && afterMetrics ? beforeMetrics.htmlFingerprint !== afterMetrics.htmlFingerprint : null;

    return NextResponse.json({
      ok: true,
      result,
      patchResult,
      impact: {
        htmlChanged,
        before: beforeMetrics,
        after: afterMetrics,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to apply SEO quick fix" },
      { status: 500 }
    );
  }
}
