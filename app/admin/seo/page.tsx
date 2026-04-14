import { createServiceClient } from "@/lib/supabase-server";
import { headers } from "next/headers";

type RecentPost = {
  title: string | null;
  slug: string | null;
  created_at: string | null;
};

type TopPost = {
  slug: string | null;
  views: number | null;
};

type GscRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

export const dynamic = "force-dynamic";

export default async function SeoDashboard() {
  const supabase = createServiceClient();

  const { count: totalBlogs } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true });

  const { count: publishedBlogs } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  const { count: locations } = await supabase
    .from("service_location_pages")
    .select("*", { count: "exact", head: true });

  const { data: recentPosts } = await supabase
    .from("blog_posts")
    .select("title, slug, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: topPosts } = await supabase.rpc("top_posts");
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost || requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const siteUrl = host
    ? `${protocol}://${host}`
    : process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let gscRows: GscRow[] = [];
  let gscError: string | null = null;

  if (!siteUrl) {
    gscError = "Set NEXT_PUBLIC_SITE_URL to load Search Console keywords.";
  } else {
    try {
      const res = await fetch(`${siteUrl}/api/seo/search-console`, {
        cache: "no-store"
      });
      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (!isJson) {
        gscError = "Search Console endpoint returned non-JSON response.";
      } else {
        const gsc = await res.json();

        if (!res.ok) {
          gscError = gsc?.error || "Failed to load Search Console data.";
        } else {
          gscRows = (gsc?.rows as GscRow[] | undefined) ?? [];
        }
      }
    } catch (error) {
      gscError = "Could not reach Search Console API endpoint.";
    }
  }

  const byClicks = [...gscRows].sort((a, b) => (b.clicks ?? 0) - (a.clicks ?? 0));
  const byPosition = [...gscRows].sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
  const quickWins = [...gscRows]
    .filter((row) => (row.impressions ?? 0) >= 500 && (row.ctr ?? 0) < 0.03)
    .sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">SEO Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Total Blogs</p>
          <p className="text-2xl font-bold">{totalBlogs ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Published</p>
          <p className="text-2xl font-bold">{publishedBlogs ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Location Pages</p>
          <p className="text-2xl font-bold">{locations ?? 0}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-medium">Recent Posts</h2>
        <div className="space-y-2">
          {(recentPosts as RecentPost[] | null)?.map((post, index) => (
            <div key={post.slug ?? `${post.created_at ?? "post"}-${index}`} className="flex justify-between gap-3">
              <span className="truncate">{post.title ?? "Untitled"}</span>
              {post.slug ? (
                <a
                  href={`/blog/${post.slug}`}
                  className="text-sm text-blue-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-medium">Top Posts</h2>
        <div className="space-y-2">
          {(topPosts as TopPost[] | null)?.map((post) => (
            <div key={post.slug ?? "unknown"}>
              {post.slug ?? "unknown"} ({post.views ?? 0} views)
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-medium">Top Keywords</h2>

        <div className="space-y-4">
          {gscError ? (
            <p className="text-sm text-amber-700">{gscError}</p>
          ) : gscRows.length === 0 ? (
            <p className="text-sm text-gray-500">No keyword data available yet.</p>
          ) : (
            <>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Sorted by Clicks</p>
                <div className="space-y-2">
                  {byClicks.map((row) => (
                    <div
                      key={`clicks-${row.keys?.[0] ?? "unknown-keyword"}`}
                      className="grid grid-cols-12 gap-3 text-sm"
                    >
                      <span className="col-span-5 truncate">{row.keys?.[0] ?? "unknown"}</span>
                      <span className="col-span-2 text-gray-600">{row.clicks ?? 0} clicks</span>
                      <span className="col-span-2 text-gray-600">{row.impressions ?? 0} impressions</span>
                      <span className="col-span-1 text-gray-600">
                        {((row.ctr ?? 0) * 100).toFixed(1)}%
                      </span>
                      <span className="col-span-2 text-gray-600">Pos {Math.round(row.position ?? 0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Sorted by Best Position</p>
                <div className="space-y-2">
                  {byPosition.slice(0, 10).map((row) => (
                    <div
                      key={`position-${row.keys?.[0] ?? "unknown-keyword"}`}
                      className="grid grid-cols-12 gap-3 text-sm"
                    >
                      <span className="col-span-6 truncate">{row.keys?.[0] ?? "unknown"}</span>
                      <span className="col-span-2 text-gray-600">Pos {Math.round(row.position ?? 0)}</span>
                      <span className="col-span-2 text-gray-600">{row.clicks ?? 0} clicks</span>
                      <span className="col-span-2 text-gray-600">
                        {((row.ctr ?? 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-medium">Quick Wins</h2>
        <p className="mb-3 text-xs text-gray-500">
          High impressions and low CTR terms to prioritize in titles/meta descriptions.
        </p>

        <div className="space-y-2">
          {quickWins.length === 0 ? (
            <p className="text-sm text-gray-500">No quick-win terms found in the current top keyword set.</p>
          ) : (
            quickWins.map((row) => (
              <div key={`quick-${row.keys?.[0] ?? "unknown-keyword"}`} className="grid grid-cols-12 gap-3 text-sm">
                <span className="col-span-6 truncate">{row.keys?.[0] ?? "unknown"}</span>
                <span className="col-span-3 text-gray-600">{row.impressions ?? 0} impressions</span>
                <span className="col-span-3 text-gray-600">{((row.ctr ?? 0) * 100).toFixed(1)}% CTR</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
