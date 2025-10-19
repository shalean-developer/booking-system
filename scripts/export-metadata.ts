/**
 * Metadata Export Script
 * 
 * Exports all page metadata to CSV for review and validation
 * Run with: node scripts/export-metadata.js
 */

const fs = require('fs');
const path = require('path');
const { getAllPageKeys, getSeoConfig } = require('../lib/seo-config');

// Interface for metadata export row

function validateLength(text: string, maxLength: number, fieldName: string) {
  if (text.length > maxLength) {
    return `ERROR: ${text.length} chars (max: ${maxLength})`;
  } else if (text.length > maxLength * 0.9) {
    return `WARNING: ${text.length} chars (recommended: ≤${Math.floor(maxLength * 0.9)})`;
  }
  return `OK: ${text.length} chars`;
}

function exportMetadata() {
  console.log('🚀 Starting metadata export...\n');

  const pageKeys = getAllPageKeys();
  const rows: any[] = [];

  // Process each page
  pageKeys.forEach((pageKey: string) => {
    try {
      const config = getSeoConfig(pageKey);
      
      const row = {
        pageSlug: pageKey,
        title: config.title,
        description: config.description,
        canonicalUrl: config.canonical,
        ogImageUrl: config.ogImage.url,
        ogImageAlt: config.ogImage.alt,
        generatedFlag: 'No',
        titleLength: config.title.length,
        descriptionLength: config.description.length,
        titleWarning: validateLength(config.title, 60, 'Title'),
        descriptionWarning: validateLength(config.description, 160, 'Description'),
      };

      rows.push(row);
      
      console.log(`✅ Processed: ${pageKey}`);
      console.log(`   Title: "${config.title}" (${config.title.length} chars)`);
      console.log(`   Description: "${config.description}" (${config.description.length} chars)`);
      console.log('');
    } catch (error) {
      console.error(`❌ Error processing ${pageKey}:`, error);
    }
  });

  // Generate CSV content
  const csvHeader = [
    'Page Slug',
    'Title',
    'Meta Description',
    'Canonical URL',
    'OG Image URL',
    'OG Image Alt Text',
    'Generated Flag',
    'Title Length',
    'Description Length',
    'Title Validation',
    'Description Validation'
  ].join(',');

  const csvRows = rows.map(row => [
    row.pageSlug,
    `"${row.title.replace(/"/g, '""')}"`,
    `"${row.description.replace(/"/g, '""')}"`,
    row.canonicalUrl,
    row.ogImageUrl,
    `"${row.ogImageAlt.replace(/"/g, '""')}"`,
    row.generatedFlag,
    row.titleLength,
    row.descriptionLength,
    `"${row.titleWarning}"`,
    `"${row.descriptionWarning}"`
  ].join(','));

  const csvContent = [csvHeader, ...csvRows].join('\n');

  // Write CSV file
  const outputPath = path.join(process.cwd(), 'metadata-export.csv');
  fs.writeFileSync(outputPath, csvContent, 'utf8');

  // Generate summary
  const totalPages = rows.length;
  const titleErrors = rows.filter(row => row.titleWarning.includes('ERROR')).length;
  const titleWarnings = rows.filter(row => row.titleWarning.includes('WARNING')).length;
  const descriptionErrors = rows.filter(row => row.descriptionWarning.includes('ERROR')).length;
  const descriptionWarnings = rows.filter(row => row.descriptionWarning.includes('WARNING')).length;

  console.log('📊 EXPORT SUMMARY:');
  console.log(`   Total pages: ${totalPages}`);
  console.log(`   Title errors: ${titleErrors}`);
  console.log(`   Title warnings: ${titleWarnings}`);
  console.log(`   Description errors: ${descriptionErrors}`);
  console.log(`   Description warnings: ${descriptionWarnings}`);
  console.log('');
  console.log(`📄 CSV exported to: ${outputPath}`);
  console.log('');
  
  if (titleErrors > 0 || descriptionErrors > 0) {
    console.log('⚠️  ISSUES FOUND:');
    rows.forEach(row => {
      if (row.titleWarning.includes('ERROR') || row.descriptionWarning.includes('ERROR')) {
        console.log(`   ${row.pageSlug}:`);
        if (row.titleWarning.includes('ERROR')) console.log(`     - ${row.titleWarning}`);
        if (row.descriptionWarning.includes('ERROR')) console.log(`     - ${row.descriptionWarning}`);
      }
    });
  } else {
    console.log('✅ All metadata validation passed!');
  }
}

// Run the export
if (require.main === module) {
  exportMetadata();
}

export { exportMetadata };
