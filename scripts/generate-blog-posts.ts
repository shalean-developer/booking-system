import OpenAI from "openai";
import { config as loadEnv } from "dotenv";
import { generateTopics, type Topic } from "./generate-topics";

loadEnv({ path: ".env.local" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const API_URL =
  process.env.BLOG_POSTS_API_URL || process.env.CONTENT_API_URL || "http://localhost:3001/api/create-post";

const API_KEY = process.env.SEO_CONTENT_API_SECRET!;
const TOPICS_COUNT = Number(process.env.TOPICS_COUNT || "10");

// Fallback topics if AI topic generation fails
const fallbackTopics: Topic[] = [
  {
    title: "How Much Does Home Cleaning Cost in Cape Town?",
    slug: "cleaning-cost-cape-town",
  },
  {
    title: "Standard Cleaning vs Deep Cleaning: What’s the Difference?",
    slug: "standard-vs-deep-cleaning",
  },
  {
    title: "Move-Out Cleaning Checklist South Africa",
    slug: "move-out-cleaning-checklist",
  },
];

function detectLocation(title: string) {
  const lower = title.toLowerCase();

  if (lower.includes("cape town")) return "cape-town";
  if (lower.includes("johannesburg")) return "johannesburg";
  if (lower.includes("durban")) return "durban";

  return null;
}

async function getExistingPosts() {
  const res = await fetch("http://localhost:3001/api/admin/blog");
  const data = await res.json();
  return data?.posts || [];
}

// Generate Blog Content with AI
async function generateAIContent(title: string, relatedLinks: string) {
  const locationSlug = detectLocation(title);

  const prompt = `
Write a detailed, SEO-optimized blog post.

Title: ${title}

Requirements:
- 800–1200 words
- Use HTML formatting (h1, h2, h3, p, ul, li)
- Include introduction, multiple sections, and conclusion
- Target South Africa audience
- Include practical tips
- Reference related articles naturally: ${relatedLinks}

INTERNAL LINKING RULES:
- Add 2–3 natural internal links inside the content
- Use these links:
  - /services (anchor: "cleaning services")
${locationSlug ? `
- Include a link to /services/${locationSlug} (anchor: "cleaning services in ${locationSlug.replace("-", " ")}")
` : ""}
  - /blog (anchor: "cleaning tips")

- Links must be embedded naturally inside paragraphs (not listed separately)
- Use proper HTML <a href="...">anchor text</a>

CONVERSION:
- End with a strong CTA section encouraging users to book a cleaning service
- Include a final link to /services

IMPORTANT:
- Do NOT use markdown
- Output ONLY clean HTML
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}

function cleanHTML(html: string) {
  return html
    .replace(/```html/g, "")
    .replace(/```/g, "")
    .trim();
}

function generateFallbackContent(title: string) {
  return `
    <h1>${title}</h1>
    <p>Keeping your home clean in South Africa can be simple with the right plan and consistent habits.</p>
    <h2>Why this topic matters</h2>
    <p>Many households struggle to keep up with cleaning while balancing work, family, and daily responsibilities.</p>
    <h2>Practical tips</h2>
    <ul>
      <li>Create a weekly checklist for high-traffic areas.</li>
      <li>Focus on kitchens and bathrooms first for hygiene impact.</li>
      <li>Use eco-friendly products where possible.</li>
      <li>Schedule deep cleaning for neglected areas monthly.</li>
    </ul>
    <h2>How professional cleaners help</h2>
    <p>Professional cleaning services save time, improve consistency, and reduce stress in busy homes.</p>
    <h2>Conclusion</h2>
    <p>With a practical routine and occasional expert support, your home can stay cleaner and healthier year-round.</p>
    <p><strong>Ready to get started?</strong> <a href="/services">Book a cleaning service today</a>.</p>
  `.trim();
}

function shouldUseFallback(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("insufficient_quota") ||
    message.includes("rate limit") ||
    message.includes("429")
  );
}

function isDuplicateResponse(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  const text = `${String(record.error ?? "")} ${String(record.code ?? "")}`.toLowerCase();
  return text.includes("duplicate") || text.includes("already exists") || text.includes("23505");
}

// Meta generator
function generateMeta(title: string, locationSlug: string | null) {
  const locationLabel = locationSlug ? locationSlug.replace("-", " ") : "south africa";
  return {
    description: `${title} - Complete guide for homeowners in ${locationLabel}.`,
    keywords: `home cleaning ${locationLabel}, cleaning services ${locationLabel}, ${title.toLowerCase()}`,
  };
}

// delay helper
function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// MAIN
async function run() {
  if (!Number.isFinite(TOPICS_COUNT) || TOPICS_COUNT <= 0) {
    console.error("TOPICS_COUNT must be a positive number.");
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  const existingPostsAtStart = await getExistingPosts();
  const existingSlugs = existingPostsAtStart
    .map((post: { slug?: string }) => post.slug)
    .filter((slug: string | undefined): slug is string => Boolean(slug));

  let topics: Topic[] = [];
  try {
    console.log(`Generating ${TOPICS_COUNT} blog topics...`);
    topics = await generateTopics(existingSlugs, TOPICS_COUNT);
  } catch (error) {
    if (shouldUseFallback(error)) {
      console.log("OpenAI unavailable for topic generation, using fallback topics.");
      topics = [];
    } else {
      throw error;
    }
  }

  if (topics.length === 0) {
    console.log("Using fallback topic set.");
    topics = fallbackTopics
      .filter((topic) => !existingSlugs.includes(topic.slug))
      .slice(0, TOPICS_COUNT);
  }

  for (const topic of topics) {
    try {
      console.log(`Generating: ${topic.title}`);

      let content: string | null = null;
      try {
        const existingPosts = await getExistingPosts();
        const relatedLinks = existingPosts
          .slice(0, 2)
          .map((p: { slug: string; title: string }) => `<a href="/blog/${p.slug}">${p.title}</a>`)
          .join(", ");

        const rawContent = await generateAIContent(topic.title, relatedLinks);
        content = cleanHTML(rawContent ?? "");
      } catch (error) {
        if (shouldUseFallback(error)) {
          console.log(`OpenAI unavailable for ${topic.slug}, using fallback content.`);
          content = generateFallbackContent(topic.title);
        } else {
          throw error;
        }
      }

      const locationSlug = detectLocation(topic.title);
      const meta = generateMeta(topic.title, locationSlug);

      const payload = {
        title: topic.title,
        slug: topic.slug,
        content,
        meta_description: meta.description,
        keywords: meta.keywords,
        published: true,
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = await res.text();
      }

      if (!res.ok) {
        if (isDuplicateResponse(data)) {
          console.log(`Skipped (exists): ${topic.slug}`);
          skipped++;
        } else {
          console.log(`Failed: ${topic.slug}`, data);
          failed++;
        }
      } else {
        console.log(`Created: ${topic.slug}`);
        created++;
      }

      await delay(1000);
    } catch (err) {
      console.log(`Error: ${topic.slug}`, err);
      failed++;
    }
  }

  console.log("\nDone.");
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
}

run();
