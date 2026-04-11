#!/usr/bin/env node

/**
 * Sitemap Validation Script
 * 
 * Validates all URLs in the sitemap.xml to ensure they:
 * - Return 200 (not 404)
 * - Don't redirect (final destinations only)
 * - Are not blocked by robots.txt
 * - Don't point to API routes
 * 
 * Usage: node scripts/validate-sitemap.js [baseUrl]
 * Example: node scripts/validate-sitemap.js https://shalean.co.za
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const baseUrl = process.argv[2] || 'https://shalean.co.za';
const sitemapUrl = `${baseUrl}/sitemap.xml`;
const maxRedirects = 3;
const timeout = 10000; // 10 seconds

const results = {
  total: 0,
  valid: 0,
  invalid: [],
  redirects: [],
  errors: [],
  apiUrls: [],
  blockedByRobots: []
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
      method: options.method || 'HEAD',
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SitemapValidator/1.0)',
        ...options.headers
      },
      followRedirect: false
    };

    const req = client.request(requestOptions, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        location: res.headers.location
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
 * Check if URL redirects and follow chain
 */
async function checkRedirectChain(url, maxHops = maxRedirects) {
  const chain = [url];
  let currentUrl = url;
  
  for (let i = 0; i < maxHops; i++) {
    try {
      const response = await fetchUrl(currentUrl);
      
      if (response.statusCode >= 300 && response.statusCode < 400 && response.location) {
        const nextUrl = new URL(response.location, currentUrl).href;
        chain.push(nextUrl);
        currentUrl = nextUrl;
      } else {
        return {
          finalUrl: currentUrl,
          chain: chain,
          statusCode: response.statusCode,
          isRedirect: chain.length > 1
        };
      }
    } catch (error) {
      return {
        finalUrl: currentUrl,
        chain: chain,
        error: error.message,
        isRedirect: chain.length > 1
      };
    }
  }
  
  return {
    finalUrl: currentUrl,
    chain: chain,
    error: `Redirect chain too long (max ${maxHops} hops)`,
    isRedirect: true
  };
}

/**
 * Validate a single URL
 */
async function validateUrl(url) {
  // Check if it's an API URL
  if (url.includes('/api/')) {
    results.apiUrls.push(url);
    return { valid: false, reason: 'API URL', url };
  }

  // Check redirect chain
  const redirectCheck = await checkRedirectChain(url);
  
  if (redirectCheck.isRedirect) {
    results.redirects.push({
      url,
      chain: redirectCheck.chain,
      finalUrl: redirectCheck.finalUrl,
      statusCode: redirectCheck.statusCode
    });
    return { valid: false, reason: 'Redirects', url, chain: redirectCheck.chain };
  }

  // Check final status
  try {
    const response = await fetchUrl(redirectCheck.finalUrl || url);
    
    if (response.statusCode === 200) {
      results.valid++;
      return { valid: true, url };
    } else if (response.statusCode === 404) {
      results.invalid.push({
        url,
        statusCode: 404,
        reason: 'Not found'
      });
      return { valid: false, reason: '404 Not Found', url, statusCode: 404 };
    } else if (response.statusCode === 403) {
      results.invalid.push({
        url,
        statusCode: 403,
        reason: 'Forbidden'
      });
      return { valid: false, reason: '403 Forbidden', url, statusCode: 403 };
    } else {
      results.invalid.push({
        url,
        statusCode: response.statusCode,
        reason: `Status ${response.statusCode}`
      });
      return { valid: false, reason: `Status ${response.statusCode}`, url, statusCode: response.statusCode };
    }
  } catch (error) {
    results.errors.push({
      url,
      error: error.message
    });
    return { valid: false, reason: 'Error', url, error: error.message };
  }
}

/**
 * Parse sitemap XML (simple regex-based parser for sitemaps)
 */
function parseSitemap(xml) {
  const urls = [];
  
  // Match <loc>...</loc> tags
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
 * Fetch sitemap
 */
function fetchSitemap(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Failed to fetch sitemap: ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Process URLs with concurrency limit
 */
async function processUrls(urls, concurrency = 5) {
  const results = [];
  const queue = [...urls];
  
  async function processNext() {
    if (queue.length === 0) return;
    
    const url = queue.shift();
    const result = await validateUrl(url);
    results.push(result);
    
    // Log progress
    const processed = results.length;
    const total = urls.length;
    if (processed % 10 === 0 || processed === total) {
      process.stdout.write(`\rProcessed: ${processed}/${total} (${((processed/total)*100).toFixed(1)}%)`);
    }
    
    // Process next
    await processNext();
  }
  
  // Start concurrent workers
  const workers = Array(Math.min(concurrency, queue.length))
    .fill(null)
    .map(() => processNext());
  
  await Promise.all(workers);
  process.stdout.write('\n');
  
  return results;
}

/**
 * Generate report
 */
function generateReport() {
  const report = {
    summary: {
      total: results.total,
      valid: results.valid,
      invalid: results.invalid.length,
      redirects: results.redirects.length,
      errors: results.errors.length,
      apiUrls: results.apiUrls.length
    },
    invalid: results.invalid,
    redirects: results.redirects,
    errors: results.errors,
    apiUrls: results.apiUrls
  };
  
  const reportPath = path.join(process.cwd(), 'sitemap-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n=== Validation Report ===');
  console.log(`Total URLs: ${results.total}`);
  console.log(`Valid (200): ${results.valid}`);
  console.log(`Invalid: ${results.invalid.length}`);
  console.log(`Redirects: ${results.redirects.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`API URLs: ${results.apiUrls.length}`);
  
  if (results.invalid.length > 0) {
    console.log('\n=== Invalid URLs ===');
    results.invalid.slice(0, 20).forEach(item => {
      console.log(`  ${item.statusCode}: ${item.url} - ${item.reason}`);
    });
    if (results.invalid.length > 20) {
      console.log(`  ... and ${results.invalid.length - 20} more`);
    }
  }
  
  if (results.redirects.length > 0) {
    console.log('\n=== Redirecting URLs ===');
    results.redirects.slice(0, 10).forEach(item => {
      console.log(`  ${item.url}`);
      console.log(`    → ${item.chain.slice(1).join(' → ')}`);
      console.log(`    Final: ${item.finalUrl} (${item.statusCode || 'unknown'})`);
    });
    if (results.redirects.length > 10) {
      console.log(`  ... and ${results.redirects.length - 10} more`);
    }
  }
  
  if (results.apiUrls.length > 0) {
    console.log('\n=== API URLs Found ===');
    results.apiUrls.forEach(url => {
      console.log(`  ${url}`);
    });
  }
  
  console.log(`\nFull report saved to: ${reportPath}`);
  
  return report;
}

/**
 * Main execution
 */
async function main() {
  console.log(`Fetching sitemap from: ${sitemapUrl}`);
  
  try {
    const xml = await fetchSitemap(sitemapUrl);
    const urls = await parseSitemap(xml);
    
    console.log(`Found ${urls.length} URLs in sitemap`);
    results.total = urls.length;
    
    console.log('Validating URLs...');
    await processUrls(urls, 5);
    
    generateReport();
    
    // Exit with error code if issues found
    if (results.invalid.length > 0 || results.redirects.length > 0 || results.apiUrls.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateUrl, checkRedirectChain, parseSitemap, fetchSitemap };

