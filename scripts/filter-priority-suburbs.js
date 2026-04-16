/**
 * filter-priority-suburbs.js
 *
 * Filters suburbs-australia.json down to the high-traffic priority list,
 * ready for Sonnet-quality content generation.
 *
 * USAGE:
 *   node scripts/filter-priority-suburbs.js
 *
 * INPUT:  scripts/data/suburbs-australia.json  (full 17k list)
 *         scripts/data/suburbs-priority-list.json  (curated ~85 suburbs)
 * OUTPUT: scripts/data/suburbs-priority.json  (priority suburbs with pricing data)
 *
 * THEN RUN:
 *   node scripts/generate-suburb-content.js --input scripts/data/suburbs-priority.json --model sonnet
 */

const fs   = require('fs');
const path = require('path');

const fullPath     = path.resolve('scripts/data/suburbs-australia.json');
const priorityPath = path.resolve('scripts/data/suburbs-priority-list.json');
const outputPath   = path.resolve('scripts/data/suburbs-priority.json');

const full     = JSON.parse(fs.readFileSync(fullPath,     'utf-8'));
const priority = JSON.parse(fs.readFileSync(priorityPath, 'utf-8'));

// Build a lookup: "SUBURB_STATE" -> priority entry
const priorityMap = new Map();
for (const p of priority) {
  priorityMap.set(`${p.suburb.toUpperCase()}_${p.state.toUpperCase()}`, true);
}

// Filter full list to priority matches
const matched   = [];
const unmatched = [];

for (const p of priority) {
  const key = `${p.suburb.toUpperCase()}_${p.state.toUpperCase()}`;
  const found = full.find(s =>
    s.suburb.toUpperCase() === p.suburb.toUpperCase() &&
    s.state.toUpperCase()  === p.state.toUpperCase()
  );
  if (found) {
    matched.push(found);
  } else {
    unmatched.push(`${p.suburb}, ${p.state}`);
  }
}

fs.writeFileSync(outputPath, JSON.stringify(matched, null, 2));

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Priority Suburb Filter');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Priority list:  ${priority.length} suburbs`);
console.log(`  Matched:        ${matched.length} suburbs`);
if (unmatched.length > 0) {
  console.log(`  Not found (${unmatched.length}):`);
  unmatched.forEach(u => console.log(`    - ${u}`));
  console.log(`  Check spelling vs suburbs-australia.json for unmatched entries.`);
}
console.log(`  Output: ${outputPath}`);
console.log('');
console.log('  Next step -- generate Sonnet-quality content:');
console.log('  node scripts/generate-suburb-content.js --input scripts/data/suburbs-priority.json --model sonnet');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
