import 'server-only';

import { load } from 'cheerio';

export function htmlToPlainText(html: string): string {
  const $ = load(html);
  $('script, style').remove();
  const text = $('body').length ? $('body').text() : $.root().text();
  return text.replace(/\s+/g, ' ').trim();
}
