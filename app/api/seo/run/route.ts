import { NextResponse } from "next/server";
import { runSeoOptimizationCycle } from "@/lib/seo/orchestrator";

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  const headerKey = request.headers.get("x-api-key")?.trim();
  const querySecret = new URL(request.url).searchParams.get("secret")?.trim();
  const secret = process.env.SEO_CONTENT_API_SECRET?.trim();
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (secret && (bearer === secret || headerKey === secret)) return true;
  if (cronSecret && querySecret === cronSecret) return true;
  return false;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const summary = await runSeoOptimizationCycle({
      maxPagesPerRun: 20,
      skipRecentlyUpdatedDays: 7,
    });
    return NextResponse.json({
      ok: true,
      summary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Failed to run SEO optimization cycle" },
      { status: 500 }
    );
  }
}

