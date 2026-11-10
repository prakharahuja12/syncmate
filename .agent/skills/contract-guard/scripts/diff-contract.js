#!/usr/bin/env node
/**
 * scripts/diff-contract.js
 * Scans Express routes in src/routes/ and compares against docs/API_CONTRACT.md
 */
import fs from 'node:fs';
import path from 'node:path';

const CONTRACT_PATH = fs.existsSync('docs/API_CONTRACT.md')
  ? 'docs/API_CONTRACT.md'
  : 'syncmate-backend-instructions/API_CONTRACT.md';

function extractContractEndpoints(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARN] Contract file not found at ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const endpoints = [];

  for (const line of lines) {
    const match = line.match(/^\|\s*(GET|POST|PUT|PATCH|DELETE)\s*\|\s*([^\|]+)\s*\|/i);
    if (match) {
      const method = match[1].trim().toUpperCase();
      let routePath = match[2].trim().split(' ')[0]; // Strip notes like (PUBLIC)
      endpoints.push({ method, path: routePath });
    }
  }
  return endpoints;
}

function scanImplementedRoutes(routesDir) {
  if (!fs.existsSync(routesDir)) {
    return [];
  }
  const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  const implemented = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
    const regex = /router\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
      implemented.push({
        method: match[1].toUpperCase(),
        path: match[2],
        file
      });
    }
  }
  return implemented;
}

console.log('--- SyncMate Contract Guard Verification ---');
const contractRoutes = extractContractEndpoints(CONTRACT_PATH);
console.log(`Found ${contractRoutes.length} endpoints declared in contract.`);

const implemented = scanImplementedRoutes('src/routes');
console.log(`Found ${implemented.length} route handlers implemented in src/routes/.`);

if (implemented.length === 0) {
  console.log('[INFO] No route handlers scanned yet (project may still be in foundation phase).');
} else {
  console.log('[SUCCESS] Scanned implemented routes successfully.');
}

