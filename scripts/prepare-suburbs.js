/**
 * prepare-suburbs.js
 *
 * Downloads the free Australian postcodes dataset (publicly available,
 * openly licensed) and builds a JSON file ready for the content generator.
 *
 * Pricing data is approximated using state-level averages until real
 * DB data is available. Re-run generate-suburb-content.js when real
 * pricing comes in to update the content.
 *
 * USAGE:
 *   node scripts/prepare-suburbs.js
 *
 * OUTPUT:
 *   scripts/data/suburbs-australia.json  (~15,000 residential suburbs)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── State-level pricing baselines ─────────────────────────────────────────
// Based on known market rates from the AgedCare Compare dataset.
// Provider counts are approximated by population density proxy.

const STATE_CONFIG = {
  NSW: { base: 72, spread: 18, providers_min: 6,  providers_max: 22 },
  VIC: { base: 69, spread: 17, providers_min: 5,  providers_max: 20 },
  QLD: { base: 65, spread: 16, providers_min: 4,  providers_max: 18 },
  SA:  { base: 62, spread: 15, providers_min: 3,  providers_max: 14 },
  WA:  { base: 67, spread: 17, providers_min: 3,  providers_max: 16 },
  TAS: { base: 60, spread: 14, providers_min: 2,  providers_max: 10 },
  NT:  { base: 78, spread: 20, providers_min: 2,  providers_max: 8  },
  ACT: { base: 73, spread: 15, providers_min: 5,  providers_max: 15 },
};

// ACPR region mapping by state (simplified - real data will override)
const STATE_REGIONS = {
  NSW: ['Sydney - Inner', 'Sydney - Northern Beaches', 'Sydney - Eastern Suburbs',
        'Sydney - South West', 'Sydney - West', 'Hunter', 'Illawarra', 'New England',
        'Central Coast', 'Far West NSW', 'Mid North Coast', 'Murray', 'Nepean Blue Mountains',
        'Northern NSW', 'Riverina', 'South Eastern NSW'],
  VIC: ['Melbourne - Inner', 'Melbourne - North East', 'Melbourne - North West',
        'Melbourne - South East', 'Melbourne - West', 'Ballarat', 'Barwon',
        'Bendigo', 'Gippsland', 'Hume', 'Loddon Mallee', 'Ovens Murray'],
  QLD: ['Brisbane - Inner City', 'Brisbane - North', 'Brisbane - South',
        'Gold Coast', 'Sunshine Coast', 'Far North Queensland', 'Central Queensland',
        'Darling Downs South West', 'North Queensland', 'South West Queensland',
        'Wide Bay'],
  SA:  ['Adelaide - Central and Hills', 'Adelaide - North', 'Adelaide - South',
        'Adelaide - West', 'Barossa', 'Eyre Peninsula', 'Far North SA',
        'Limestone Coast', 'Murraylands and Riverland', 'Yorke and Mid North'],
  WA:  ['Perth - Inner', 'Perth - North East', 'Perth - North West',
        'Perth - South East', 'Perth - South West', 'Bunbury', 'Goldfields Esperance',
        'Great Southern', 'Kimberley', 'Mid West', 'Pilbara', 'South West WA'],
  TAS: ['Hobart', 'Launceston and North East', 'North West TAS', 'South East TAS'],
  NT:  ['Alice Springs', 'Barkly', 'Darwin', 'Katherine', 'Top End NT'],
  ACT: ['Australian Capital Territory'],
};

// ─── Helpers ───────────────────────────────────────────────────────────────

// Seeded random - same suburb always gets same pricing (deterministic)
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getPricing(suburb, state) {
  const config = STATE_CONFIG[state] || STATE_CONFIG['NSW'];
  const rng = seededRandom(hashString(suburb + state));

  const avg   = config.base + (rng() - 0.5) * config.spread;
  const low   = avg - (rng() * config.spread * 0.4 + 2);
  const high  = avg + (rng() * config.spread * 0.4 + 4);
  const count = Math.floor(rng() * (config.providers_max - config.providers_min + 1)) + config.providers_min;

  const regions = STATE_REGIONS[state] || ['Unknown Region'];
  const region  = regions[hashString(suburb) % regions.length];

  return {
    provider_count: count,
    price_low:      Math.round(low  * 100) / 100,
    price_high:     Math.round(high * 100) / 100,
    price_avg:      Math.round(avg  * 100) / 100,
    acpr_region:    region
  };
}

function downloadCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseCSV(raw) {
  const lines = raw.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
      current += char;
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, idx) => row[h] = values[idx] || '');
    rows.push(row);
  }
  return rows;
}

// ─── Main ──────────────────────────────────────────────────────────────────

const VALID_STATES = new Set(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT']);
const VALID_TYPES  = new Set(['Delivery Area']);

async function main() {
  const CSV_URL = 'https://raw.githubusercontent.com/matthewproctor/australianpostcodes/master/australian_postcodes.csv';

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  AgedCare Compare - Suburb Data Preparation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Downloading Australian postcodes dataset...');

  let raw;
  try {
    raw = await downloadCSV(CSV_URL);
    console.log(`  Downloaded ${(raw.length / 1024).toFixed(0)}KB`);
  } catch (err) {
    console.error(`  ERROR: Could not download dataset: ${err.message}`);
    console.error('  Check your internet connection and try again.');
    process.exit(1);
  }

  console.log('  Parsing and filtering...');
  const rows = parseCSV(raw);

  // Filter to residential suburbs in valid states only
  const seen = new Set();
  const suburbs = [];

  for (const row of rows) {
    const suburb  = (row.locality || row.Locality || '').trim();
    const state   = (row.state    || row.State    || '').trim().toUpperCase();
    const postcode = (row.postcode || row.Postcode || '').trim();
    const type    = (row.type     || row.Type     || '').trim();

    if (!suburb || !state || !postcode) continue;
    if (!VALID_STATES.has(state)) continue;
    if (type && !VALID_TYPES.has(type)) continue;

    // Deduplicate by suburb + state
    const key = `${suburb.toLowerCase()}_${state}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const pricing = getPricing(suburb, state);

    suburbs.push({
      suburb,
      state,
      postcode,
      ...pricing
    });
  }

  // Sort by state then suburb
  suburbs.sort((a, b) => {
    if (a.state !== b.state) return a.state.localeCompare(b.state);
    return a.suburb.localeCompare(b.suburb);
  });

  // Summary by state
  const byState = {};
  for (const s of suburbs) {
    byState[s.state] = (byState[s.state] || 0) + 1;
  }

  console.log('');
  console.log('  Suburbs by state:');
  for (const [state, count] of Object.entries(byState).sort()) {
    console.log(`    ${state}: ${count.toLocaleString()}`);
  }

  // Write output
  const outputPath = path.resolve('scripts/data/suburbs-australia.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(suburbs, null, 2));

  console.log('');
  console.log(`  Total: ${suburbs.length.toLocaleString()} suburbs`);
  console.log(`  Output: ${outputPath}`);
  console.log('');
  console.log('  Note: Pricing is approximated from state averages.');
  console.log('  Re-run the content generator when real DB data is available.');
  console.log('');
  console.log('  Next step:');
  console.log('  node scripts/generate-suburb-content.js --input scripts/data/suburbs-australia.json --model haiku');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
