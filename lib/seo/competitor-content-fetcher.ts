import { load } from "cheerio";

export type CompetitorPageData = {
  title: string;
  description: string;
  headings: string[];
  wordCount: number;
  faq: string[];
  internalLinks: number;
};

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
  return normalizeText(text)
    .split(/\s+/)
    .filter(Boolean).length;
}

function classifyHeading(text: string): string {
  const normalized = normalizeText(text).toLowerCase();
  if (!normalized) return "SECTION_OTHER";
  if (/price|cost|quote|rate|budget|fee/.test(normalized)) return "SECTION_PRICING";
  if (/faq|question|ask/.test(normalized)) return "SECTION_FAQ";
  if (/how|process|step|works|workflow/.test(normalized)) return "SECTION_PROCESS";
  if (/why|benefit|advantage|value/.test(normalized)) return "SECTION_BENEFITS";
  if (/book|schedule|availability|slot/.test(normalized)) return "SECTION_BOOKING";
  if (/trust|review|guarantee|quality|safety/.test(normalized)) return "SECTION_TRUST";
  if (/service|what we do|coverage|included/.test(normalized)) return "SECTION_SERVICE_SCOPE";
  return "SECTION_OTHER";
}

function classifyFaqIntent(text: string): string {
  const normalized = normalizeText(text).toLowerCase();
  if (/price|cost|fee|quote|pay/.test(normalized)) return "FAQ_PRICING";
  if (/how long|time|duration|quick|same day/.test(normalized)) return "FAQ_TIMING";
  if (/what includes|included|scope|covered/.test(normalized)) return "FAQ_SCOPE";
  if (/book|schedule|availability|slot/.test(normalized)) return "FAQ_BOOKING";
  if (/safe|trusted|insurance|background|quality/.test(normalized)) return "FAQ_TRUST";
  return "FAQ_GENERAL";
}

function isInternalHref(href: string, pageUrl: URL): boolean {
  const normalized = href.trim();
  if (!normalized || normalized.startsWith("#")) return false;
  if (normalized.startsWith("mailto:") || normalized.startsWith("tel:")) return false;
  if (normalized.toLowerCase().startsWith("javascript:")) return false;

  try {
    const parsed = new URL(normalized, pageUrl.origin);
    return parsed.origin === pageUrl.origin;
  } catch {
    return false;
  }
}

function extractFaqItems(html: string): string[] {
  const $ = load(html);
  const faq = new Set<string>();

  // FAQPage schema support
  $('script[type="application/ld+json"]').each((_, element) => {
    const content = $(element).text();
    if (!content) return;
    try {
      const parsed = JSON.parse(content) as unknown;
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const maybeMain = (item as any)?.mainEntity;
        const entities = Array.isArray(maybeMain) ? maybeMain : [];
        for (const entity of entities) {
          const question = normalizeText(String(entity?.name ?? ""));
          if (question) faq.add(classifyFaqIntent(question));
        }
      }
    } catch {
      // Ignore invalid JSON-LD blocks.
    }
  });

  // Visual FAQ sections
  const faqContainers = $('section[id*="faq" i], div[id*="faq" i], section[class*="faq" i], div[class*="faq" i]');
  faqContainers.find("h2, h3, h4, summary, dt").each((_, element) => {
    const text = normalizeText($(element).text());
    if (text && /\?|faq|question/i.test(text)) {
      faq.add(classifyFaqIntent(text));
    }
  });

  $("h2, h3").each((_, heading) => {
    const headingText = normalizeText($(heading).text());
    if (!/faq|frequently asked|questions/i.test(headingText)) return;
    $(heading)
      .nextUntil("h2, h3")
      .find("h3, h4, summary, li, dt")
      .each((__, element) => {
        const text = normalizeText($(element).text());
        if (text && /\?/.test(text)) faq.add(classifyFaqIntent(text));
      });
  });

  return Array.from(faq).slice(0, 20);
}

export async function fetchCompetitorPage(url: string): Promise<CompetitorPageData> {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    throw new Error("URL is required");
  }

  const parsedUrl = new URL(trimmedUrl);
  const response = await fetch(parsedUrl.toString(), {
    method: "GET",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (compatible; ShaleanSEOAnalyzer/1.0; +https://shalean.co.za)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch competitor page: ${response.status}`);
  }

  const html = await response.text();
  const $ = load(html);

  const title = normalizeText($("title").first().text());
  const description = normalizeText($('meta[name="description"]').attr("content") ?? "");

  const headings = $("h1, h2, h3")
    .toArray()
    .map((el) => classifyHeading($(el).text()))
    .filter(Boolean)
    .slice(0, 60);

  const bodyText = normalizeText($("body").text());
  const wordCount = countWords(bodyText);

  const faq = extractFaqItems(html);

  const internalLinks = $("a[href]")
    .toArray()
    .map((el) => $(el).attr("href") ?? "")
    .filter((href) => isInternalHref(href, parsedUrl)).length;

  return {
    title,
    description,
    headings,
    wordCount,
    faq,
    internalLinks,
  };
}
