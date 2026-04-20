type OpportunityPage = {
  impressions?: number | null;
  ctr?: number | null;
  position?: number | null;
  contentScore?: number | null;
};

export function getOpportunityScore(page: OpportunityPage): number {
  let score = 0;

  const impressions = page.impressions ?? 0;
  const ctr = page.ctr ?? 0;
  const position = page.position ?? 0;
  const contentScore = page.contentScore ?? 100;

  if (impressions > 200) score += 40;
  if (ctr < 0.02) score += 30;
  if (position >= 5 && position <= 20) score += 20;
  if (contentScore < 70) score += 10;

  return Math.max(0, Math.min(100, score));
}

export function getPriorityPages<T extends OpportunityPage>(pages: T[]): T[] {
  return [...pages]
    .sort((a, b) => getOpportunityScore(b) - getOpportunityScore(a))
    .slice(0, 20);
}

