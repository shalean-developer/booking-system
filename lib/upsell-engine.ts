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
  body: string;
  cta: string;
}

export function getUpsellContent(trigger: UpsellTrigger): UpsellContent {
  switch (trigger) {
    case 'high_hours':
      return {
        title: '⚡ This clean may need more than 1 cleaner',
        body: 'Upgrade to Premium for faster, more thorough results',
        cta: 'Upgrade to Premium',
      };
    case 'minimum_edge':
      return {
        title: "You're at the minimum booking",
        body: 'Upgrade for a deeper, full-home clean with a team',
        cta: 'Upgrade for better results',
      };
    case 'hesitation':
      return {
        title: 'Want better results?',
        body: 'Premium includes equipment and a more complete clean',
        cta: 'Upgrade to Premium',
      };
    default: {
      const _exhaustive: never = trigger;
      return _exhaustive;
    }
  }
}
