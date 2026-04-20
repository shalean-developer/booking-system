import { promises as fs } from "fs";
import path from "path";
import type { AuditIssue } from "@/lib/seo/audit-engine";
import type { SeoContentPatch } from "@/lib/seo/ai-optimizer";

export type SeoQuickFixId =
  | "expand-intro-local-context"
  | "expand-faq"
  | "add-internal-links"
  | "add-jsonld-schema"
  | "add-service-keywords"
  | "maintain-and-refresh";

export type QuickFixSuggestionMapping = {
  issueType: AuditIssue;
  sourceModule: string;
  strategy: string;
  fixIds: SeoQuickFixId[];
};

export const QUICK_FIX_SUGGESTION_MAP: QuickFixSuggestionMapping[] = [
  {
    issueType: "low_word_count",
    sourceModule: "lib/growth/local-seo-content.ts",
    strategy: "Expand localized intro and content blocks with deterministic local copy",
    fixIds: ["expand-intro-local-context"],
  },
  {
    issueType: "missing_faq",
    sourceModule: "app/growth/local/[service]/[area]/page.tsx",
    strategy: "Inject FAQ module into rendered page sections",
    fixIds: ["expand-faq"],
  },
  {
    issueType: "no_internal_links",
    sourceModule: "app/growth/local/[service]/[area]/page.tsx",
    strategy: "Increase internal link groups rendered in local page template",
    fixIds: ["add-internal-links"],
  },
  {
    issueType: "missing_schema",
    sourceModule: "lib/growth/local-seo-schema.ts",
    strategy: "Enable JSON-LD graph generation for service and FAQ rich results",
    fixIds: ["add-jsonld-schema"],
  },
];

export type SeoQuickFixFlags = {
  expandContentBlocks: boolean;
  injectFaqModule: boolean;
  boostInternalLinks: boolean;
  enhanceJsonLd: boolean;
  emphasizeKeywords: boolean;
};

type PageQuickFixState = {
  appliedFixes: SeoQuickFixId[];
  contentPatch?: SeoContentPatch;
  lastUpdatedAt?: string;
};

type QuickFixConfig = {
  autoImprovePages: boolean;
  pages: Record<string, PageQuickFixState>;
};

const DEFAULT_CONFIG: QuickFixConfig = {
  autoImprovePages: false,
  pages: {},
};

const CONFIG_PATH = path.join(process.cwd(), "data", "seo-quick-fix-state.json");

async function ensureDataDirectory() {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
}

export async function getQuickFixConfig(): Promise<QuickFixConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as QuickFixConfig;
    return {
      autoImprovePages: Boolean(parsed.autoImprovePages),
      pages: parsed.pages ?? {},
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function saveQuickFixConfig(config: QuickFixConfig): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
}

export function toQuickFixFlags(
  appliedFixes: SeoQuickFixId[],
  autoImprovePages = false
): SeoQuickFixFlags {
  const applied = new Set(appliedFixes);
  return {
    expandContentBlocks:
      autoImprovePages || applied.has("expand-intro-local-context") || applied.has("add-service-keywords"),
    injectFaqModule: autoImprovePages || applied.has("expand-faq"),
    boostInternalLinks: autoImprovePages || applied.has("add-internal-links"),
    enhanceJsonLd: autoImprovePages || applied.has("add-jsonld-schema"),
    emphasizeKeywords: autoImprovePages || applied.has("add-service-keywords"),
  };
}

export async function getQuickFixFlagsForUrl(url: string): Promise<SeoQuickFixFlags> {
  const config = await getQuickFixConfig();
  const appliedFixes = config.pages[url]?.appliedFixes ?? [];
  return toQuickFixFlags(appliedFixes, config.autoImprovePages);
}

export async function getQuickFixPageStateForUrl(url: string): Promise<{
  flags: SeoQuickFixFlags;
  contentPatch?: SeoContentPatch;
  appliedFixes: SeoQuickFixId[];
}> {
  const config = await getQuickFixConfig();
  const pageState = config.pages[url];
  const appliedFixes = pageState?.appliedFixes ?? [];
  return {
    flags: toQuickFixFlags(appliedFixes, config.autoImprovePages),
    contentPatch: pageState?.contentPatch,
    appliedFixes,
  };
}

export async function applyQuickFix(url: string, fixId: SeoQuickFixId): Promise<{
  url: string;
  appliedFixes: SeoQuickFixId[];
  flags: SeoQuickFixFlags;
  updatedAt: string;
}> {
  const config = await getQuickFixConfig();
  const existing = config.pages[url] ?? { appliedFixes: [] };
  const appliedFixes = new Set<SeoQuickFixId>(existing.appliedFixes);
  appliedFixes.add(fixId);

  const updatedAt = new Date().toISOString();
  const nextFixes = Array.from(appliedFixes);
  config.pages[url] = { appliedFixes: nextFixes, lastUpdatedAt: updatedAt };
  await saveQuickFixConfig(config);

  return {
    url,
    appliedFixes: nextFixes,
    flags: toQuickFixFlags(nextFixes, config.autoImprovePages),
    updatedAt,
  };
}

export async function applyQuickFixPatch(url: string, patch: SeoContentPatch): Promise<{
  url: string;
  patch: SeoContentPatch;
  flags: SeoQuickFixFlags;
  appliedFixes: SeoQuickFixId[];
  updatedAt: string;
}> {
  const config = await getQuickFixConfig();
  const existing = config.pages[url] ?? { appliedFixes: [] };
  const updatedAt = new Date().toISOString();
  const mergedPatch: SeoContentPatch = {
    ...(existing.contentPatch ?? {}),
    ...patch,
  };
  config.pages[url] = {
    ...existing,
    contentPatch: mergedPatch,
    lastUpdatedAt: updatedAt,
  };
  await saveQuickFixConfig(config);
  return {
    url,
    patch: mergedPatch,
    flags: toQuickFixFlags(config.pages[url].appliedFixes, config.autoImprovePages),
    appliedFixes: config.pages[url].appliedFixes,
    updatedAt,
  };
}

export async function setAutoImprovePages(enabled: boolean): Promise<QuickFixConfig> {
  const config = await getQuickFixConfig();
  config.autoImprovePages = enabled;
  await saveQuickFixConfig(config);
  return config;
}
