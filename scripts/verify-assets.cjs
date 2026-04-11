#!/usr/bin/env node

/**
 * Asset Verification Script
 * 
 * Runs before build to ensure critical assets exist.
 * This prevents deployment of broken sites with missing assets.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying critical assets...\n');

let hasErrors = false;

// List of critical assets to check
const criticalAssets = [
  {
    path: 'public/logo.png',
    name: 'Logo PNG',
    required: false, // Optional since we have SVG fallback
  },
  {
    path: 'public/logo.svg',
    name: 'Logo SVG',
    required: false, // Optional since we have PNG fallback
  },
  {
    path: 'public/favicon.ico',
    name: 'Favicon',
    required: true,
  },
  {
    path: 'public/manifest.json',
    name: 'Web Manifest',
    required: true,
  },
];

// Check each asset
criticalAssets.forEach((asset) => {
  const fullPath = path.join(process.cwd(), asset.path);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✅ ${asset.name}: Found (${sizeKB} KB)`);
  } else {
    if (asset.required) {
      console.error(`❌ ${asset.name}: MISSING (required) - ${asset.path}`);
      hasErrors = true;
    } else {
      console.warn(`⚠️  ${asset.name}: Not found (optional) - ${asset.path}`);
    }
  }
});

// Verify at least one logo format exists
const logoFormats = criticalAssets.filter(asset => 
  asset.path.includes('logo.')
);
const hasAnyLogo = logoFormats.some(asset => 
  fs.existsSync(path.join(process.cwd(), asset.path))
);

if (!hasAnyLogo) {
  console.error('\n❌ ERROR: No logo file found! At least one of logo.svg or logo.png must exist.');
  hasErrors = true;
}

// Print summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('❌ Asset verification FAILED');
  console.error('Please add the missing required assets before building.');
  process.exit(1);
} else {
  console.log('✅ All critical assets verified');
  console.log('Ready to build!');
  process.exit(0);
}

