const fs = require('fs');

const content = fs.readFileSync('lib/seo-config.ts', 'utf8');
const lines = content.split('\n');

let issues = 0;

lines.forEach((line, index) => {
  const match = line.match(/description:\s*["']([^"']+)["']/);
  if (match) {
    const desc = match[1];
    const len = desc.length;
    const status = len >= 120 && len <= 160 ? '✅' : len < 120 ? '⚠️' : '❌';
    
    if (len < 120 || len > 160) {
      console.log(`${status} Line ${index + 1}: ${len} chars`);
      console.log(`   "${desc}"`);
      issues++;
    }
  }
});

if (issues === 0) {
  console.log('✅ All SEO_CONFIG descriptions are 120-160 characters!');
  process.exit(0);
} else {
  console.log(`\n❌ Found ${issues} descriptions with issues.`);
  process.exit(1);
}



