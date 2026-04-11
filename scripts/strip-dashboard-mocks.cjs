const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../components/admin/DashboardPages.tsx');
let s = fs.readFileSync(p, 'utf8');
const a = s.indexOf('export const ALL_BOOKINGS:');
const b = s.indexOf('\nconst formatZAR');
if (a < 0 || b < 0) {
  console.error('markers not found', a, b);
  process.exit(1);
}
s = s.slice(0, a) + s.slice(b + 1);
fs.writeFileSync(p, s);
console.log('ok');
