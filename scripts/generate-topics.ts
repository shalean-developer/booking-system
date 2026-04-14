import OpenAI from "openai";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type BlogPost = { slug: string };
type BlogResponse = { posts?: BlogPost[] };
export type Topic = { title: string; slug: string };

const TOPICS_COUNT = Number(process.env.TOPICS_COUNT || "10");

export async function getExistingSlugs(): Promise<string[]> {
  try {
    const res = await fetch("http://localhost:3001/api/admin/blog");
    const data = (await res.json()) as BlogResponse;
    return data?.posts?.map((p) => p.slug) || [];
  } catch {
    return [];
  }
}

function sanitizeTopics(topics: Topic[], existingSlugs: string[]): Topic[] {
  const seen = new Set<string>();
  return topics
    .map((topic) => ({
      title: String(topic.title || "").trim(),
      slug: String(topic.slug || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, ""),
    }))
    .filter((topic) => topic.title && topic.slug)
    .filter((topic) => {
      if (existingSlugs.includes(topic.slug)) return false;
      if (seen.has(topic.slug)) return false;
      seen.add(topic.slug);
      return true;
    });
}

export async function generateTopics(
  existingSlugs: string[],
  count = TOPICS_COUNT
): Promise<Topic[]> {
  const prompt = `
You are an SEO expert for a home cleaning service in South Africa.

Generate ${count} high-ranking blog post ideas.

Requirements:
- Focus on cleaning services, home care, pricing, and tips
- Target cities like Cape Town, Johannesburg, Durban
- Avoid duplicates of these slugs:
${existingSlugs.join(", ")}

Return JSON array:
[
  {
    "title": "...",
    "slug": "..."
  }
]
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const content = res.choices[0].message.content || "[]";

  try {
    const parsed = JSON.parse(content) as Topic[];
    return sanitizeTopics(parsed, existingSlugs);
  } catch {
    console.error("Failed to parse AI response:", content);
    return [];
  }
}

async function run() {
  console.log("Fetching existing posts...");
  const existingSlugs = await getExistingSlugs();

  console.log("Generating new topics...");
  const topics = await generateTopics(existingSlugs);

  console.log("\nNew Topics:\n");
  topics.forEach((t, i) => {
    console.log(`${i + 1}. ${t.title} (${t.slug})`);
  });

  return topics;
}

if (process.argv[1]?.endsWith("generate-topics.ts")) {
  run();
}
