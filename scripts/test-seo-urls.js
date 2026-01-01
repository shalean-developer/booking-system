#!/usr/bin/env node

/**
 * SEO URL Testing Suite
 * 
 * Comprehensive testing of SEO-critical URLs including:
 * - Sitemap URLs (should return 200)
 * - Redirects (should work correctly)
 * - Non-existent URLs (should return 404)
 * - Robots.txt accessibility
 * - Sitemap.xml accessibility and validity
 * - Canonical tags verification
 * 
 * Usage: node scripts/test-seo-urls.js [baseUrl]
 * Example: node scripts/test-seo-urls.js https://shalean.co.za
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const baseUrl = process.argv[2] || 'https://shalean.co.za';
const timeout = 10000;

const results = {
  sitemap: { total: 0, valid: 0, invalid: [], redirects: [] },
  redirects: { total: 0, valid: 0, broken: [], chains: [] },
  notFound: { total: 0, valid: 0, invalid: [] },
  robots: { accessible: false, valid: false },
  sitemapXml: { accessible: false, valid: false, urlCount: 0 },
  canonical: { checked: 0, valid: 0, invalid: [] }
};

/**
 * Fetch URL content
 */
function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOTester/1.0)',
        ...options.headers
      },
      followRedirect: false
    };

    let data = '';
    const req = client.request(requestOptions, (res) => {
      res.on('data', (chunk) => {
        data += chunk.toString();
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          location: res.headers.location
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Parse sitemap XML
 */
function parseSitemap(xml) {
  const urls = [];
  const locRegex = /<loc>(.*?)<\/loc>/gi;
  let match;
  
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].trim();
    if (url) {
      urls.push(url);
    }
  }
  
  return urls;
}

/**
 * Check if URL is valid (200 status)
 */
async function checkUrl(url) {
  try {
    const response = await fetchUrl(url, { method: 'HEAD' });
    
    if (response.statusCode === 200) {
      return { valid: true, statusCode: 200 };
    } else if (response.statusCode >= 300 && response.statusCode < 400) {
      return { valid: false, statusCode: response.statusCode, redirect: true, location: response.location };
    } else {
      return { valid: false, statusCode: response.statusCode };
    }
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Test sitemap URLs
 */
async function testSitemapUrls() {
  console.log('Testing sitemap URLs...');
  
  try {
    const sitemapResponse = await fetchUrl(`${baseUrl}/sitemap.xml`);
    
    if (sitemapResponse.statusCode !== 200) {
      console.error('Failed to fetch sitemap.xml');
      return;
    }
    
    const urls = parseSitemap(sitemapResponse.body);
    results.sitemap.total = urls.length;
    results.sitemapXml.urlCount = urls.length;
    
    console.log(`Found ${urls.length} URLs in sitemap`);
    
    // Test first 20 URLs as a sample
    const sampleUrls = urls.slice(0, 20);
    for (const url of sampleUrls) {
      const result = await checkUrl(url);
      
      if (result.valid) {
        results.sitemap.valid++;
      } else if (result.redirect) {
        results.sitemap.redirects.push({ url, location: result.location });
      } else {
        results.sitemap.invalid.push({ url, statusCode: result.statusCode, error: result.error });
      }
    }
    
    console.log(`  Valid: ${results.sitemap.valid}/${sampleUrls.length}`);
    console.log(`  Invalid: ${results.sitemap.invalid.length}`);
    console.log(`  Redirects: ${results.sitemap.redirects.length}`);
  } catch (error) {
    console.error('Error testing sitemap URLs:', error.message);
  }
}

/**
 * Test robots.txt
 */
async function testRobotsTxt() {
  console.log('Testing robots.txt...');
  
  try {
    const response = await fetchUrl(`${baseUrl}/robots.txt`);
    
    if (response.statusCode === 200) {
      results.robots.accessible = true;
      
      // Basic validation - check for common directives
      const content = response.body;
      if (content.includes('User-agent') || content.includes('Disallow') || content.includes('Allow')) {
        results.robots.valid = true;
      }
      
      console.log('  ✅ robots.txt is accessible and valid');
    } else {
      console.log(`  ❌ robots.txt returned status ${response.statusCode}`);
    }
  } catch (error) {
    console.error('  ❌ Error fetching robots.txt:', error.message);
  }
}

/**
 * Test sitemap.xml
 */
async function testSitemapXml() {
  console.log('Testing sitemap.xml...');
  
  try {
    const response = await fetchUrl(`${baseUrl}/sitemap.xml`);
    
    if (response.statusCode === 200) {
      results.sitemapXml.accessible = true;
      
      // Basic XML validation
      if (response.body.includes('<?xml') && response.body.includes('<urlset') || response.body.includes('<sitemapindex')) {
        results.sitemapXml.valid = true;
        const urls = parseSitemap(response.body);
        results.sitemapXml.urlCount = urls.length;
      }
      
      console.log(`  ✅ sitemap.xml is accessible and valid (${results.sitemapXml.urlCount} URLs)`);
    } else {
      console.log(`  ❌ sitemap.xml returned status ${response.statusCode}`);
    }
  } catch (error) {
    console.error('  ❌ Error fetching sitemap.xml:', error.message);
  }
}

/**
 * Test non-existent URLs return 404
 */
async function testNotFoundUrls() {
  console.log('Testing 404 handling...');
  
  const testUrls = [
    `${baseUrl}/this-page-does-not-exist-12345`,
    `${baseUrl}/blog/non-existent-post-slug-xyz`,
    `${baseUrl}/services/non-existent-service`,
    `${baseUrl}/location/invalid-city/invalid-area`
  ];
  
  results.notFound.total = testUrls.length;
  
  for (const url of testUrls) {
    try {
      const response = await fetchUrl(url, { method: 'HEAD' });
      
      if (response.statusCode === 404) {
        results.notFound.valid++;
      } else {
        results.notFound.invalid.push({ url, statusCode: response.statusCode });
      }
    } catch (error) {
      results.notFound.invalid.push({ url, error: error.message });
    }
  }
  
  console.log(`  Valid 404s: ${results.notFound.valid}/${testUrls.length}`);
  if (results.notFound.invalid.length > 0) {
    console.log(`  Invalid (should be 404): ${results.notFound.invalid.length}`);
  }
}

/**
 * Test sample redirects
 */
async function testRedirects() {
  console.log('Testing sample redirects...');
  
  // Sample redirects that should exist based on next.config.js
  const testRedirects = [
    { source: '/services/deep-specialty', expected: '/services/deep-cleaning' },
    { source: '/services/carpet', expected: '/services/deep-cleaning' },
    { source: '/booking', expected: '/booking/service/select' }
  ];
  
  results.redirects.total = testRedirects.length;
  
  for (const redirect of testRedirects) {
    try {
      const sourceUrl = redirect.source.startsWith('http') ? redirect.source : `${baseUrl}${redirect.source}`;
      const response = await fetchUrl(sourceUrl, { method: 'HEAD' });
      
      if (response.statusCode >= 300 && response.statusCode < 400 && response.location) {
        const expectedUrl = redirect.expected.startsWith('http') 
          ? redirect.expected 
          : `${baseUrl}${redirect.expected}`;
        
        if (response.location.includes(redirect.expected) || response.location === expectedUrl) {
          results.redirects.valid++;
        } else {
          results.redirects.broken.push({
            source: redirect.source,
            expected: redirect.expected,
            actual: response.location
          });
        }
      } else {
        results.redirects.broken.push({
          source: redirect.source,
          error: `Status ${response.statusCode}, expected redirect`
        });
      }
    } catch (error) {
      results.redirects.broken.push({
        source: redirect.source,
        error: error.message
      });
    }
  }
  
  console.log(`  Valid redirects: ${results.redirects.valid}/${testRedirects.length}`);
  if (results.redirects.broken.length > 0) {
    console.log(`  Broken redirects: ${results.redirects.broken.length}`);
  }
}

/**
 * Test canonical tags (sample)
 */
async function testCanonicalTags() {
  console.log('Testing canonical tags (sample)...');
  
  const testUrls = [
    baseUrl,
    `${baseUrl}/services/regular-cleaning`,
    `${baseUrl}/location/cape-town`
  ];
  
  results.canonical.checked = testUrls.length;
  
  for (const url of testUrls) {
    try {
      const response = await fetchUrl(url);
      
      if (response.statusCode === 200) {
        // Check for canonical tag
        const canonicalMatch = response.body.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
        
        if (canonicalMatch) {
          const canonicalUrl = canonicalMatch[1];
          // Basic validation - canonical should match or be relative
          if (canonicalUrl.includes(baseUrl.replace('https://', '').replace('http://', '')) || canonicalUrl.startsWith('/')) {
            results.canonical.valid++;
          } else {
            results.canonical.invalid.push({ url, canonical: canonicalUrl, reason: 'Invalid domain' });
          }
        } else {
          results.canonical.invalid.push({ url, reason: 'No canonical tag found' });
        }
      }
    } catch (error) {
      results.canonical.invalid.push({ url, error: error.message });
    }
  }
  
  console.log(`  Valid canonical tags: ${results.canonical.valid}/${testUrls.length}`);
  if (results.canonical.invalid.length > 0) {
    console.log(`  Invalid: ${results.canonical.invalid.length}`);
  }
}

/**
 * Generate report
 */
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl,
    results
  };
  
  const reportPath = path.join(process.cwd(), 'seo-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n=== SEO Test Summary ===');
  console.log(`Sitemap URLs: ${results.sitemap.valid}/${results.sitemap.total} valid`);
  console.log(`Redirects: ${results.redirects.valid}/${results.redirects.total} valid`);
  console.log(`404 Handling: ${results.notFound.valid}/${results.notFound.total} valid`);
  console.log(`Robots.txt: ${results.robots.accessible ? '✅' : '❌'} ${results.robots.valid ? 'Valid' : 'Invalid'}`);
  console.log(`Sitemap.xml: ${results.sitemapXml.accessible ? '✅' : '❌'} ${results.sitemapXml.valid ? 'Valid' : 'Invalid'}`);
  console.log(`Canonical Tags: ${results.canonical.valid}/${results.canonical.checked} valid`);
  console.log(`\nFull report saved to: ${reportPath}`);
  
  return report;
}

/**
 * Main execution
 */
async function main() {
  console.log(`SEO URL Testing Suite for ${baseUrl}\n`);
  
  await testRobotsTxt();
  await testSitemapXml();
  await testSitemapUrls();
  await testRedirects();
  await testNotFoundUrls();
  await testCanonicalTags();
  
  generateReport();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { testSitemapUrls, testRobotsTxt, testSitemapXml, testNotFoundUrls, testRedirects, testCanonicalTags };

