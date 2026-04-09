/**
 * TPW-88: AI Suburb Content Generator
 *
 * Generates unique introductory paragraphs for every suburb page on
 * the AgedCare Compare website using Claude API.
 *
 * USAGE:
 *   node scripts/generate-suburb-content.js
 *   node scripts/generate-suburb-content.js --input scripts/data/suburbs-mock.json
 *   node scripts/generate-suburb-content.js --input scripts/data/suburbs-real.json --model haiku
 *
 * INPUT:  JSON array of suburb objects (see scripts/data/suburbs-mock.json)
 * OUTPUT: scripts/output/suburb-content-[timestamp].json
 *         Ready to INSERT into the suburb_content table in PostgreSQL.
 *
 * MODELS:
 *   haiku  - claude-haiku-4-5  - fast, cheap (~$2-3 for all 15k suburbs)
 *   sonnet - claude-sonnet-4-6 - higher quality, ~10x the cost
 *   Default: haiku (recommended for bulk runs)
 */

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// ─── Config ────────────────────────────────────────────────────────────────

const MODELS = {
  haiku:  'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6'
};

const args = process.argv.slice(2);
const inputFlag  = args.indexOf('--input');
const modelFlag  = args.indexOf('--model');

const INPUT_FILE  = inputFlag  !== -1 ? args[inputFlag  + 1] : 'scripts/data/suburbs-mock.json';
const MODEL_KEY   = modelFlag  !== -1 ? args[modelFlag  + 1] : 'haiku';
const MODEL       = MODELS[MODEL_KEY] || MODELS.haiku;
const DELAY_MS    = 300; // pause between API calls to avoid rate limits

// ─── Prompt ────────────────────────────────────────────────────────────────

function buildPrompt(suburb) {
  return `You are writing introductory content for a suburb page on AgedCare Compare — an Australian aged care price comparison website.

Write a single paragraph (80 to 120 words) for the suburb of ${suburb.suburb}, ${suburb.state} (postcode ${suburb.postcode}).

Requirements:
- Open with something specific and distinctive about ${suburb.suburb} — its geography, character, history, climate, demographics, or what it's known for. Do NOT open with "${suburb.suburb} is a suburb of..."
- Naturally transition into the aged care and home care landscape in the area
- Mention that there are ${suburb.provider_count} home care providers currently serving ${suburb.suburb}
- Reference that hourly rates range from $${suburb.price_low.toFixed(2)} to $${suburb.price_high.toFixed(2)}, with an average of $${suburb.price_avg.toFixed(2)}
- End with a line encouraging families to compare providers to find the best fit and value
- Tone: warm, informative, and trustworthy — written for older Australians and their families

Return plain text only. No headings, no markdown, no bullet points. One paragraph.`;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatCurrency(val) {
  return `$${Number(val).toFixed(2)}`;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function loadSuburbs(filePath) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`ERROR: Input file not found: ${fullPath}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(fullPath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`ERROR: Could not parse JSON from ${fullPath}: ${e.message}`);
    process.exit(1);
  }
}

// ─── Checkpoint helpers ────────────────────────────────────────────────────

function getCheckpointPath(inputFile) {
  const base = path.basename(inputFile, '.json');
  return path.resolve(`scripts/output/.checkpoint-${base}.json`);
}

function loadCheckpoint(checkpointPath) {
  if (fs.existsSync(checkpointPath)) {
    try {
      return JSON.parse(fs.readFileSync(checkpointPath, 'utf-8'));
    } catch (e) {}
  }
  return { completed: {}, results: [] };
}

function saveCheckpoint(checkpointPath, checkpoint) {
  fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint));
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function generateContent(client, suburb, index, total) {
  const label = `[${index + 1}/${total}] ${suburb.suburb}, ${suburb.state}`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [
        { role: 'user', content: buildPrompt(suburb) }
      ]
    });

    const content = response.content[0]?.text?.trim();

    if (!content) throw new Error('Empty response from API');

    const wordCount = content.split(/\s+/).length;
    console.log(`  ✓ ${label} — ${wordCount} words`);

    return {
      suburb:         suburb.suburb,
      state:          suburb.state,
      postcode:       suburb.postcode,
      acpr_region:    suburb.acpr_region || null,
      provider_count: suburb.provider_count,
      price_low:      suburb.price_low,
      price_high:     suburb.price_high,
      price_avg:      suburb.price_avg,
      content:        content,
      word_count:     wordCount,
      model_used:     MODEL,
      generated_at:   new Date().toISOString()
    };

  } catch (err) {
    console.error(`  ✗ ${label} — FAILED: ${err.message}`);
    return {
      suburb:       suburb.suburb,
      state:        suburb.state,
      postcode:     suburb.postcode,
      content:      null,
      error:        err.message,
      generated_at: new Date().toISOString()
    };
  }
}

async function main() {
  // Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY not set.');
    console.error('Add it to a .env file in this directory:');
    console.error('  ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
  }

  const client     = new Anthropic({ apiKey });
  const suburbs    = loadSuburbs(INPUT_FILE);
  const outputDir  = path.resolve('scripts/output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Load checkpoint - resume from where we left off if interrupted
  const checkpointPath = getCheckpointPath(INPUT_FILE);
  const checkpoint     = loadCheckpoint(checkpointPath);
  const alreadyDone    = new Set(Object.keys(checkpoint.completed));
  const remaining      = suburbs.filter(s => !alreadyDone.has(`${s.suburb}_${s.state}`));

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TPW-88: AgedCare Compare Content Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Input:     ${INPUT_FILE}`);
  console.log(`  Total:     ${suburbs.length.toLocaleString()} suburbs`);
  console.log(`  Remaining: ${remaining.length.toLocaleString()} (${alreadyDone.size} already done)`);
  console.log(`  Model:     ${MODEL}`);
  console.log(`  Est. time: ~${Math.ceil(remaining.length * (DELAY_MS + 1200) / 3600000 * 60)} minutes`);
  if (alreadyDone.size > 0) console.log(`  Resuming from checkpoint...`);
  console.log('');

  const results = [...checkpoint.results];
  const failed  = [];
  let processed = alreadyDone.size;

  for (let i = 0; i < remaining.length; i++) {
    const suburb = remaining[i];
    const result = await generateContent(client, suburb, processed, suburbs.length);

    results.push(result);
    processed++;

    if (result.error) {
      failed.push(suburb.suburb);
    } else {
      // Save to checkpoint after every successful result
      checkpoint.completed[`${suburb.suburb}_${suburb.state}`] = true;
      checkpoint.results = results;
      saveCheckpoint(checkpointPath, checkpoint);
    }

    // Save full output every 100 suburbs
    if (processed % 100 === 0) {
      const progressFile = path.join(outputDir, `suburb-content-IN-PROGRESS.json`);
      fs.writeFileSync(progressFile, JSON.stringify(results, null, 2));
      console.log(`  [saved progress: ${processed}/${suburbs.length}]`);
    }

    if (i < remaining.length - 1) await sleep(DELAY_MS);
  }

  // Write final output
  const outputFile = path.join(outputDir, `suburb-content-${timestamp()}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

  // Clean up checkpoint and progress file on success
  if (failed.length === 0) {
    if (fs.existsSync(checkpointPath)) fs.unlinkSync(checkpointPath);
    const progressFile = path.join(outputDir, 'suburb-content-IN-PROGRESS.json');
    if (fs.existsSync(progressFile)) fs.unlinkSync(progressFile);
  }

  // Summary
  const succeeded = results.filter(r => r.content).length;
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Done. ${succeeded.toLocaleString()}/${suburbs.length.toLocaleString()} generated.`);
  if (failed.length > 0) {
    console.log(`  Failed (${failed.length}): ${failed.slice(0, 5).join(', ')}${failed.length > 5 ? '...' : ''}`);
    console.log(`  Re-run the script to retry failed suburbs.`);
  }
  console.log(`  Output: ${outputFile}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  Next step: share suburb-content-*.json with the dev team.');
  console.log('  They INSERT it into the suburb_content table in PostgreSQL.');
  console.log('');

  // Preview a result
  const first = results.find(r => r.content);
  if (first) {
    console.log(`  Preview — ${first.suburb}, ${first.state}:`);
    console.log('  ' + '─'.repeat(60));
    console.log('  ' + first.content.replace(/\n/g, '\n  '));
    console.log('  ' + '─'.repeat(60));
    console.log('');
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
