export type ProgrammaticPageSnapshot = {
  url: string;
  title?: string;
  description?: string;
  introText?: string;
  hasSchema: boolean;
  hasFAQ: boolean;
  wordCount: number;
  internalLinks: number;
  duplicatePatternKey?: string;
};

export type AuditIssue =
  | "missing_title"
  | "missing_description"
  | "missing_schema"
  | "missing_faq"
  | "low_word_count"
  | "no_internal_links"
  | "duplicate_pattern";

export type AuditResult = {
  hasTitle: boolean;
  hasDescription: boolean;
  hasSchema: boolean;
  hasFAQ: boolean;
  wordCount: number;
  internalLinks: number;
  issues: AuditIssue[];
  score: number;
};

export function auditPage(page: ProgrammaticPageSnapshot): AuditResult {
  const hasTitle = Boolean(page.title && page.title.trim().length > 0);
  const hasDescription = Boolean(page.description && page.description.trim().length > 0);
  const hasSchema = page.hasSchema;
  const hasFAQ = page.hasFAQ;
  const wordCount = page.wordCount;
  const internalLinks = page.internalLinks;

  const issues: AuditIssue[] = [];

  if (!hasTitle) issues.push("missing_title");
  if (!hasDescription) issues.push("missing_description");
  if (!hasSchema) issues.push("missing_schema");
  if (!hasFAQ) issues.push("missing_faq");
  if (wordCount < 600) issues.push("low_word_count");
  if (internalLinks <= 0) issues.push("no_internal_links");
  if (page.duplicatePatternKey) issues.push("duplicate_pattern");

  let score = 100;
  for (const issue of issues) {
    if (issue === "missing_title") score -= 18;
    else if (issue === "missing_description") score -= 12;
    else if (issue === "missing_schema") score -= 18;
    else if (issue === "missing_faq") score -= 10;
    else if (issue === "low_word_count") score -= 22;
    else if (issue === "no_internal_links") score -= 14;
    else if (issue === "duplicate_pattern") score -= 16;
  }

  return {
    hasTitle,
    hasDescription,
    hasSchema,
    hasFAQ,
    wordCount,
    internalLinks,
    issues,
    score: Math.max(0, Math.min(100, score)),
  };
}
