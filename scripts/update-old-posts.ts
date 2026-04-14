import OpenAI from "openai";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ADMIN_BLOG_URL =
  process.env.ADMIN_BLOG_API_URL?.trim() || "http://localhost:3001/api/admin/blog";
const UPDATE_URL =
  process.env.BLOG_UPDATE_API_URL?.trim() || "http://localhost:3001/api/admin/blog/update";
const REVALIDATE_BASE_URL =
  process.env.REVALIDATE_BASE_URL?.trim() || "http://localhost:3001";
const API_KEY = process.env.SEO_CONTENT_API_SECRET?.trim() || "";
const UPDATE_LIMIT = Number(process.env.UPDATE_POSTS_LIMIT || "5");
const STALE_DAYS = Number(process.env.UPDATE_POSTS_STALE_DAYS || "30");
const INCLUDE_DRAFTS = process.env.UPDATE_INCLUDE_DRAFTS === "true";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  status?: "draft" | "published";
  last_updated_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type BlogResponse = {
  posts?: BlogPost[];
};

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isOlderThanDays(post: BlogPost, days: number): boolean {
  const lastTouch =
    parseDate(post.last_updated_at) || parseDate(post.updated_at) || parseDate(post.created_at);
  if (!lastTouch) return true;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return lastTouch.getTime() < cutoff;
}

async function getOldPosts(): Promise<BlogPost[]> {
  const res = await fetch(ADMIN_BLOG_URL);
  const data = (await res.json()) as BlogResponse;
  const posts = data?.posts || [];
  return posts
    .filter((post) => (INCLUDE_DRAFTS ? true : post.status === "published"))
    .filter((post) => isOlderThanDays(post, STALE_DAYS));
}

async function updateContent(title: string, content: string): Promise<string> {
  const prompt = `
You are an SEO expert.

Improve and update this blog post while preserving its meaning.

Title: ${title}

Content:
${content}

Requirements:
- Keep existing structure but improve clarity and depth
- Add new sections if helpful
- Add internal links:
  - /services
  - /services/cape-town (if relevant)
- Improve SEO and readability
- Keep HTML format
- Do NOT remove important existing content
- Output only clean HTML
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
  });

  return res.choices[0].message.content || content;
}

function cleanHTML(html: string): string {
  return html.replace(/```html/g, "").replace(/```/g, "").trim();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function revalidatePost(slug: string): Promise<void> {
  try {
    const path = encodeURIComponent(`/blog/${slug}`);
    await fetch(`${REVALIDATE_BASE_URL}/api/revalidate?path=${path}`);
  } catch (error) {
    console.warn(`Revalidate failed for ${slug}:`, error);
  }
}

async function run() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY.");
    process.exit(1);
  }
  if (!API_KEY) {
    console.error("Missing SEO_CONTENT_API_SECRET.");
    process.exit(1);
  }
  if (!Number.isFinite(UPDATE_LIMIT) || UPDATE_LIMIT <= 0) {
    console.error("UPDATE_POSTS_LIMIT must be a positive number.");
    process.exit(1);
  }

  const posts = await getOldPosts();
  let updated = 0;
  console.log(
    `Found ${posts.length} stale ${INCLUDE_DRAFTS ? "published/draft" : "published"} posts (>${STALE_DAYS}d old).`
  );

  for (const post of posts.slice(0, UPDATE_LIMIT)) {
    try {
      console.log(`Updating: ${post.slug}`);

      const newContentRaw = await updateContent(post.title, post.content);
      const newContent = cleanHTML(newContentRaw);

      const res = await fetch(UPDATE_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: newContent,
          status: post.status || "published",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.log(`Failed: ${post.slug}`, data);
      } else {
        console.log(`Updated: ${post.slug}`);
        updated++;
        await revalidatePost(post.slug);
      }

      await delay(1200);
    } catch (err) {
      console.log(`Error: ${post.slug}`, err);
    }
  }

  console.log(`\nDone. Updated ${updated} posts.`);
}

run();
