/**
 * Normalizes mojibake in components/admin/DashboardPages.tsx (UTF-8 vs Latin-1 issues).
 */
import fs from 'fs';

const p = 'components/admin/DashboardPages.tsx';
let s = fs.readFileSync(p, 'utf8');

// Em dash shown as â€" (U+00E2 U+20AC U+2014 in wrong interpretation — script uses wrong char; common is E2 80 94 -> â€¦ no that's ellipsis)
// Existing fix: UTF-8 E2 80 94 read as cp1252 -> â€œ? Actually prior script used \u00E2\u20AC\u201D — keep:
const mojibakeEmDash = '\u00E2\u20AC\u201D';
const em = '\u2014';
if (s.includes(mojibakeEmDash)) {
  s = s.replaceAll(`'${mojibakeEmDash}'`, `'${em}'`);
}

// Bullet • (U+2022) mojibake as â€¢
const mojibakeBullet = '\u00E2\u20AC\u00A2';
if (s.includes(mojibakeBullet)) {
  s = s.replaceAll(mojibakeBullet, '\u2022');
}

// Middle dot: stray U+00C2 before U+00B7 displays as "Â·"
s = s.replace(/\u00C2\u00B7/g, '\u00B7');

// Section comments: drop garbled box-drawing lines, normalize section titles
const lines = s.split('\n');
const out = [];
for (const line of lines) {
  if (line.startsWith('//') && /â|Â/.test(line)) {
    const rest = line.slice(2);
    const mapped = [
      ['Mock Data', '// --- Mock Data ---'],
      ['Shared Components', '// --- Shared Components ---'],
      ['CUSTOMERS PAGE', '// --- CUSTOMERS PAGE ---'],
      ['CLEANERS PAGE', '// --- CLEANERS PAGE ---'],
      ['QUOTES PAGE', '// --- QUOTES PAGE ---'],
      ['PAYMENTS PAGE', '// --- PAYMENTS PAGE ---'],
      ['REPORTS PAGE', '// --- REPORTS PAGE ---'],
      ['SETTINGS PAGE', '// --- SETTINGS PAGE ---'],
    ];
    let replaced = false;
    for (const [key, repl] of mapped) {
      if (rest.includes(key)) {
        out.push(repl);
        replaced = true;
        break;
      }
    }
    if (replaced) continue;
    // Drop decorative-only garbled lines (no ASCII letters); keep real comments
    if (!/[a-zA-Z]/.test(rest)) continue;
  }
  out.push(line);
}
s = out.join('\n');

fs.writeFileSync(p, s);
console.log('Wrote', p);
