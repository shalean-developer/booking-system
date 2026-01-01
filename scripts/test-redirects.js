#!/usr/bin/env node

/**
 * Redirect Testing Script
 * 
 * Tests redirects from next.config.js to identify:
 * - Redirect chains (A → B → C)
 * - Redirects that don't work
 * - Destinations that themselves redirect
 * 
 * Usage: node scripts/test-redirects.js [baseUrl]
 * Example: node scripts/test-redirects.js https://shalean.co.za
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const baseUrl = process.argv[2] || 'https://shalean.co.za';
const maxRedirects = 5;
const timeout = 10000;

const results = {
  total: 0,
  valid: 0,
  chains: [],
  broken: [],
  errors: []
};

/**
 * Fetch URL with redirect following
 */
function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD',
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RedirectTester/1.0)',
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
 * Follow redirect chain
 */
async function followRedirectChain(sourceUrl, redirects) {
  const chain = [sourceUrl];
  let currentUrl = sourceUrl;
  const visited = new Set([sourceUrl]);
  
  for (let i = 0; i < maxRedirects; i++) {
    try {
      const response = await fetchUrl(currentUrl);
      
      if (response.statusCode >= 300 && response.statusCode < 400 && response.location) {
        const nextUrl = new URL(response.location, currentUrl).href;
        
        // Check for loops
        if (visited.has(nextUrl)) {
          return {
            chain,
            finalUrl: nextUrl,
            error: 'Redirect loop detected',
            isChain: chain.length > 1
          };
        }
        
        visited.add(nextUrl);
        chain.push(nextUrl);
        currentUrl = nextUrl;
      } else if (response.statusCode === 200) {
        return {
          chain,
          finalUrl: currentUrl,
          statusCode: 200,
          isChain: chain.length > 1
        };
      } else {
        return {
          chain,
          finalUrl: currentUrl,
          statusCode: response.statusCode,
          isChain: chain.length > 1
        };
      }
    } catch (error) {
      return {
        chain,
        finalUrl: currentUrl,
        error: error.message,
        isChain: chain.length > 1
      };
    }
  }
  
  return {
    chain,
    finalUrl: currentUrl,
    error: `Max redirects exceeded (${maxRedirects})`,
    isChain: true
  };
}

/**
 * Check if destination is itself a redirect source
 */
function isDestinationInRedirects(destination, redirects) {
  return redirects.some(r => {
    const source = r.source.replace(/:\w+/g, '*'); // Replace params with wildcard
    const dest = destination.replace(/https?:\/\/[^/]+/, ''); // Remove domain
    return source === dest || dest.startsWith(source.replace('*', ''));
  });
}

/**
 * Parse redirects from next.config.js (simplified - requires manual input)
 */
function parseRedirects() {
  // This is a placeholder - in practice, you'd parse next.config.js
  // For now, we'll read the file and extract redirect patterns
  const configPath = path.join(process.cwd(), 'next.config.js');
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // Simple regex to extract redirects (this is basic - may need refinement)
  const redirectRegex = /source:\s*['"]([^'"]+)['"][\s\S]*?destination:\s*['"]([^'"]+)['"]/g;
  const redirects = [];
  let match;
  
  while ((match = redirectRegex.exec(configContent)) !== null) {
    const source = match[1];
    let destination = match[2];
    
    // Handle template variables in destination
    destination = destination.replace(/:path\*/g, '').replace(/:\w+/g, '');
    
    redirects.push({
      source,
      destination: destination.startsWith('http') ? destination : `${baseUrl}${destination}`
    });
  }
  
  return redirects;
}

/**
 * Test a single redirect
 */
async function testRedirect(redirect, allRedirects) {
  const sourceUrl = redirect.source.startsWith('http') 
    ? redirect.source 
    : `${baseUrl}${redirect.source}`;
  
  const result = await followRedirectChain(sourceUrl, allRedirects);
  
  if (result.error) {
    results.broken.push({
      source: redirect.source,
      destination: redirect.destination,
      error: result.error,
      chain: result.chain
    });
    return { valid: false, ...result };
  }
  
  if (result.isChain && result.chain.length > 2) {
    results.chains.push({
      source: redirect.source,
      destination: redirect.destination,
      chain: result.chain,
      finalUrl: result.finalUrl
    });
  }
  
  if (result.statusCode === 200) {
    results.valid++;
    return { valid: true, ...result };
  } else {
    results.broken.push({
      source: redirect.source,
      destination: redirect.destination,
      statusCode: result.statusCode,
      chain: result.chain
    });
    return { valid: false, ...result };
  }
}

/**
 * Generate report
 */
function generateReport() {
  const report = {
    summary: {
      total: results.total,
      valid: results.valid,
      chains: results.chains.length,
      broken: results.broken.length,
      errors: results.errors.length
    },
    chains: results.chains,
    broken: results.broken,
    errors: results.errors
  };
  
  const reportPath = path.join(process.cwd(), 'redirect-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n=== Redirect Test Report ===');
  console.log(`Total redirects tested: ${results.total}`);
  console.log(`Valid (200): ${results.valid}`);
  console.log(`Redirect chains (A→B→C): ${results.chains.length}`);
  console.log(`Broken: ${results.broken.length}`);
  
  if (results.chains.length > 0) {
    console.log('\n=== Redirect Chains Found ===');
    results.chains.slice(0, 10).forEach(item => {
      console.log(`  ${item.source}`);
      console.log(`    Expected: ${item.destination}`);
      console.log(`    Actual chain: ${item.chain.join(' → ')}`);
    });
    if (results.chains.length > 10) {
      console.log(`  ... and ${results.chains.length - 10} more`);
    }
  }
  
  if (results.broken.length > 0) {
    console.log('\n=== Broken Redirects ===');
    results.broken.slice(0, 10).forEach(item => {
      console.log(`  ${item.source} → ${item.destination}`);
      if (item.error) {
        console.log(`    Error: ${item.error}`);
      } else {
        console.log(`    Status: ${item.statusCode}`);
      }
    });
    if (results.broken.length > 10) {
      console.log(`  ... and ${results.broken.length - 10} more`);
    }
  }
  
  console.log(`\nFull report saved to: ${reportPath}`);
  
  return report;
}

/**
 * Main execution
 */
async function main() {
  console.log('Parsing redirects from next.config.js...');
  
  try {
    const redirects = parseRedirects();
    console.log(`Found ${redirects.length} redirects to test`);
    results.total = redirects.length;
    
    console.log('Testing redirects (this may take a while)...');
    
    // Test in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < redirects.length; i += batchSize) {
      const batch = redirects.slice(i, i + batchSize);
      await Promise.all(batch.map(redirect => testRedirect(redirect, redirects)));
      
      const processed = Math.min(i + batchSize, redirects.length);
      process.stdout.write(`\rProcessed: ${processed}/${redirects.length} (${((processed/redirects.length)*100).toFixed(1)}%)`);
    }
    
    process.stdout.write('\n');
    generateReport();
    
    if (results.chains.length > 0 || results.broken.length > 0) {
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

module.exports = { testRedirect, followRedirectChain, parseRedirects };

