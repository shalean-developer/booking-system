import 'server-only';

import { load } from 'cheerio';
import { marketingTrackingPublicBaseUrl } from '@/lib/marketing/tracking-base-url';

const TRACK_PATH_OPEN = '/api/email/open';
const TRACK_PATH_CLICK = '/api/email/click';

/**
 * Injects open pixel and rewrites anchor hrefs through the click tracker.
 */
export function wrapEmailHtmlForTracking(html: string, logId: string): string {
  const base = marketingTrackingPublicBaseUrl();
  const openUrl = `${base}${TRACK_PATH_OPEN}?id=${encodeURIComponent(logId)}`;

  const $ = load(html);
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim() || '';
    if (!href || href.startsWith('#') || href.toLowerCase().startsWith('mailto:')) return;
    if (href.toLowerCase().startsWith('javascript:')) return;
    if (href.includes(TRACK_PATH_CLICK)) return;
    try {
      const u = new URL(href, base);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
      const wrapped = `${base}${TRACK_PATH_CLICK}?${new URLSearchParams({
        id: logId,
        url: u.href,
      }).toString()}`;
      $(el).attr('href', wrapped);
    } catch {
      /* keep original */
    }
  });

  const pixel = `<img src="${openUrl}" alt="" width="1" height="1" style="display:block;width:1px;height:1px;border:0" />`;
  if ($('body').length) {
    $('body').append(pixel);
  } else {
    $.root().append(pixel);
  }

  return $.html();
}
