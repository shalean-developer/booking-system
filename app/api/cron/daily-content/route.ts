import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const API_SECRET = process.env.SEO_CONTENT_API_SECRET!;

// protect route
function isAuthorized(req: Request) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${API_SECRET}`;
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

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Running Vercel cron job...");

    const topic = await generateTopic();
    const content = await generateContent(topic.title);

    // call your own API
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/content/create`,
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

    return NextResponse.json({
      success: true,
      topic,
      result: data
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
