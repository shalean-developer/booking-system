import { promises as fs } from "fs";
import path from "path";

export type PageOptimizationState = {
  introVariationBoost?: number;
  faqBoost?: number;
  internalLinksBoost?: number;
  lastUpdatedAt?: string;
  appliedFixes?: string[];
};

export type OptimizerConfig = {
  autoImprovePages: boolean;
  pages: Record<string, PageOptimizationState>;
};

const DEFAULT_CONFIG: OptimizerConfig = {
  autoImprovePages: false,
  pages: {},
};

const CONFIG_PATH = path.join(process.cwd(), "data", "seo-optimizer-config.json");

async function ensureDataDirectory() {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
}

export async function getOptimizerConfig(): Promise<OptimizerConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as OptimizerConfig;
    return {
      autoImprovePages: Boolean(parsed.autoImprovePages),
      pages: parsed.pages ?? {},
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveOptimizerConfig(config: OptimizerConfig): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
}

export async function applyQuickFix(url: string, fixId: string): Promise<OptimizerConfig> {
  const config = await getOptimizerConfig();
  const existing = config.pages[url] ?? {};
  const appliedFixes = new Set(existing.appliedFixes ?? []);
  appliedFixes.add(fixId);

  const next: PageOptimizationState = {
    ...existing,
    appliedFixes: Array.from(appliedFixes),
    lastUpdatedAt: new Date().toISOString(),
  };

  if (fixId === "expand-intro-local-context") {
    next.introVariationBoost = (next.introVariationBoost ?? 0) + 1;
  }
  if (fixId === "expand-faq") {
    next.faqBoost = (next.faqBoost ?? 0) + 2;
  }
  if (fixId === "add-internal-links") {
    next.internalLinksBoost = (next.internalLinksBoost ?? 0) + 2;
  }

  config.pages[url] = next;
  await saveOptimizerConfig(config);
  return config;
}

export async function setAutoImprovePages(enabled: boolean): Promise<OptimizerConfig> {
  const config = await getOptimizerConfig();
  config.autoImprovePages = enabled;
  await saveOptimizerConfig(config);
  return config;
}
