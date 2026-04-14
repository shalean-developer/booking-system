import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendCronAlert } from "@/lib/cron-alert";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const API_SECRET = process.env.SEO_CONTENT_API_SECRET;
const CRON_SECRET = process.env.CRON_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

// Vercel Cron cannot attach custom Authorization headers, so we accept a shared
// secret via query param for scheduled calls, while keeping Bearer auth for manual/API tests.
function isAuthorized(req: Request) {
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");

  const isManualAuthorized = Boolean(API_SECRET) && auth === `Bearer ${API_SECRET}`;
  const isCronAuthorized = Boolean(CRON_SECRET) && querySecret === CRON_SECRET;

  return isManualAuthorized || isCronAuthorized;
}

// generate topic
async function generateTopic() {
  const prompt = `
Generate ONE SEO blog topic for a cleaning service in South Africa.

Return JSON:
{ "title": "...", "slug": "..." }
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(res.choices[0].message.content!);
}

// generate content
async function generateContent(title: string) {
  const prompt = `
Write a 1000-word SEO blog post.

Title: ${title}

Requirements:
- HTML format only
- Include internal links to:
  /services
- South Africa audience
- Add CTA to book cleaning
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  return res.choices[0].message.content;
}

async function logCronRun({
  type,
  status,
  message,
  slug
}: {
  type: "blog" | "update";
  status: "success" | "failed";
  message: string;
  slug?: string;
}) {
  try {
    const supabase = createServiceClient();
    await supabase.from("cron_logs").insert({
      type,
      status,
      message,
      slug: slug ?? null
    });
  } catch (logError) {
    console.error("[Cron] Failed to write cron log:", logError);
  }
}

export async function GET(req: Request) {
  try {
    if (!API_SECRET) {
      return NextResponse.json(
        { error: "Missing SEO_CONTENT_API_SECRET environment variable" },
        { status: 500 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY environment variable" },
        { status: 500 }
      );
    }

    if (!CRON_SECRET) {
      return NextResponse.json(
        { error: "Missing CRON_SECRET environment variable" },
        { status: 500 }
      );
    }

    if (!SITE_URL) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SITE_URL environment variable" },
        { status: 500 }
      );
    }

    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Running Vercel cron job...");

    const topic = await generateTopic();
    const content = await generateContent(topic.title);

    // call your own API
    const res = await fetch(
      `${SITE_URL}/api/content/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_SECRET}`
        },
        body: JSON.stringify({
          type: "blog",
          title: topic.title,
          slug: topic.slug,
          content,
          meta_description: topic.title,
          keywords: topic.title.toLowerCase(),
          published: true
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Failed to publish blog content");
    }

    await logCronRun({
      type: "blog",
      status: "success",
      message: `Created blog: ${topic.title}`,
      slug: topic.slug
    });

    return NextResponse.json({
      success: true,
      topic,
      result: data
    });
  } catch (err: any) {
    const errorMessage = err?.message ?? "Unknown cron error";

    await logCronRun({
      type: "blog",
      status: "failed",
      message: errorMessage
    });

    // Alert only on failures to avoid noisy inbox spam.
    await sendCronAlert({
      type: "blog",
      status: "failed",
      message: errorMessage
    });

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
