/**
 * Upsell Engine V1 — single prioritized trigger for Basic → Premium (booking flow).
 */

export type UpsellTrigger = 'high_hours' | 'minimum_edge' | 'hesitation';

export interface UpsellContext {
  hours: number;
  isMinimumApplied?: boolean;
  timeOnPage?: number;
}

/**
 * Priority: high_hours → minimum_edge (3h + min) → hesitation (time on step).
 */
export function getUpsellTrigger(ctx: UpsellContext): UpsellTrigger | null {
  if (ctx.hours >= 5) return 'high_hours';
  if (ctx.hours === 3 && ctx.isMinimumApplied) return 'minimum_edge';
  if ((ctx.timeOnPage ?? 0) > 20) return 'hesitation';
  return null;
}

export interface UpsellContent {
  title: string;
  body?: string;
  cta: string;
}

export function getUpsellContent(trigger: UpsellTrigger): UpsellContent {
  switch (trigger) {
    case 'high_hours':
      return {
        title: 'Long job?',
        body: 'Premium can send a team.',
        cta: 'Upgrade to Premium →',
      };
    case 'minimum_edge':
      return {
        title: 'At minimum time',
        body: 'Premium adds depth + team options.',
        cta: 'Upgrade →',
      };
    case 'hesitation':
      return {
        title: 'Need more time?',
        body: 'See Premium options.',
        cta: 'Upgrade to Premium →',
      };
    default: {
      const _exhaustive: never = trigger;
      return _exhaustive;
    }
  }
}
