export type SerpResult = {
  title: string;
  url: string;
  position: number;
};

type SerpApiOrganicResult = {
  title?: string;
  link?: string;
  position?: number;
};

type SerpApiResponse = {
  organic_results?: SerpApiOrganicResult[];
};

const SERP_API_ENDPOINT = "https://serpapi.com/search.json";
const DEFAULT_LOCATION = "South Africa";
const DEFAULT_LANGUAGE = "en";
const DEFAULT_GOOGLE_DOMAIN = "google.co.za";
const MAX_ORGANIC_RESULTS = 3;

function toUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function getTopResults(keyword: string): Promise<SerpResult[]> {
  const query = keyword.trim();
  if (!query) return [];

  const apiKey = process.env.SERPAPI_KEY?.trim();
  if (!apiKey) {
    throw new Error("SERPAPI_KEY is missing");
  }

  const searchParams = new URLSearchParams({
    engine: "google",
    q: query,
    api_key: apiKey,
    gl: "za",
    hl: DEFAULT_LANGUAGE,
    location: DEFAULT_LOCATION,
    google_domain: DEFAULT_GOOGLE_DOMAIN,
    num: String(MAX_ORGANIC_RESULTS),
  });

  const response = await fetch(`${SERP_API_ENDPOINT}?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`SerpAPI request failed: ${response.status}`);
  }

  const data = (await response.json()) as SerpApiResponse;
  const organic = Array.isArray(data.organic_results) ? data.organic_results : [];

  // SerpAPI keeps ads in separate arrays; we only consume organic_results.
  return organic
    .map((item, index) => {
      const title = typeof item.title === "string" ? item.title.trim() : "";
      const rawUrl = typeof item.link === "string" ? item.link.trim() : "";
      const url = toUrl(rawUrl);
      if (!title || !url) return null;
      return {
        title,
        url,
        position: Number.isFinite(item.position) ? Number(item.position) : index + 1,
      } satisfies SerpResult;
    })
    .filter((item): item is SerpResult => Boolean(item))
    .sort((a, b) => a.position - b.position)
    .slice(0, MAX_ORGANIC_RESULTS);
}
