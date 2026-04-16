/**
 * build-map.js
 * Generates a suburb-level progress map for TPW-88.
 * Downloads the postcodes CSV (has lat/lng), matches against
 * the in-progress JSON, renders every suburb as a dot on a Leaflet map.
 */

require('dotenv').config();
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const IN_PROGRESS    = 'scripts/output/suburb-content-IN-PROGRESS.json';
const PRIORITY_FILE  = 'scripts/data/suburbs-priority.json';
const PRIORITY_CP    = 'scripts/output/.checkpoint-suburbs-priority.json';
const PRIORITY_DONE  = 'scripts/output/suburb-content-2026-04-10T03-00-34.json'; // completed Sonnet run
const OUTPUT_HTML    = 'suburb-map.html';
const CSV_URL        = 'https://raw.githubusercontent.com/matthewproctor/australianpostcodes/master/australian_postcodes.csv';

function downloadCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseCSV(raw) {
  const lines   = raw.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  const rows    = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { values.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    values.push(cur.trim());
    const row = {};
    headers.forEach((h, idx) => row[h] = values[idx] || '');
    rows.push(row);
  }
  return rows;
}

const VALID_STATES = new Set(['NSW','VIC','QLD','SA','WA','TAS','NT','ACT']);
const VALID_TYPES  = new Set(['Delivery Area', '']);

async function main() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Building suburb-level progress map...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Load completed suburbs (main run)
  console.log('  Loading completed suburbs...');
  const doneRaw  = JSON.parse(fs.readFileSync(path.resolve(IN_PROGRESS), 'utf-8'));
  const doneSet  = new Set(doneRaw.map(s => `${s.suburb.toUpperCase()}_${s.state}`));
  console.log(`  ${doneSet.size.toLocaleString()} suburbs completed so far`);

  // Load priority suburbs list and checkpoint
  const priorityAll = JSON.parse(fs.readFileSync(path.resolve(PRIORITY_FILE), 'utf-8'));
  const prioritySet = new Set(priorityAll.map(s => `${s.suburb.toUpperCase()}_${s.state}`));
  let priorityDoneSet = new Set();
  // First try completed output file, then fall back to checkpoint
  if (fs.existsSync(path.resolve(PRIORITY_DONE))) {
    const done = JSON.parse(fs.readFileSync(path.resolve(PRIORITY_DONE), 'utf-8'));
    priorityDoneSet = new Set(done.filter(r => r.content).map(r => `${r.suburb.toUpperCase()}_${r.state}`));
  } else if (fs.existsSync(path.resolve(PRIORITY_CP))) {
    const cp = JSON.parse(fs.readFileSync(path.resolve(PRIORITY_CP), 'utf-8'));
    priorityDoneSet = new Set(Object.keys(cp.completed));
  }
  console.log(`  ${priorityAll.length} priority suburbs tracked (${priorityDoneSet.size} done on Sonnet run)`);

  // Download postcode data with coordinates
  console.log('  Downloading coordinates dataset...');
  const raw  = await downloadCSV(CSV_URL);
  const rows = parseCSV(raw);
  console.log(`  ${rows.length.toLocaleString()} postcode records downloaded`);

  // Build suburb point list
  const seen   = new Set();
  const points = [];

  for (const row of rows) {
    const suburb   = (row.locality || '').trim().toUpperCase();
    const state    = (row.state    || '').trim().toUpperCase();
    const lat      = parseFloat(row.lat  || row.latitude  || '');
    const lng      = parseFloat(row.long || row.longitude || row.lng || '');
    const type     = (row.type || '').trim();

    if (!suburb || !state || isNaN(lat) || isNaN(lng)) continue;
    if (!VALID_STATES.has(state)) continue;
    if (type && !VALID_TYPES.has(type)) continue;
    if (lat === 0 && lng === 0) continue;
    if (lat < -44 || lat > -10 || lng < 112 || lng > 154) continue; // outside Australia

    const key = `${suburb}_${state}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const done         = doneSet.has(key);
    const isPriority   = prioritySet.has(key);
    const priorityDone = priorityDoneSet.has(key);
    points.push({ suburb, state, lat, lng, done, isPriority, priorityDone });
  }

  const totalDone    = points.filter(p => p.done).length;
  const totalPending = points.filter(p => !p.done).length;
  const pct          = ((totalDone / points.length) * 100).toFixed(1);

  console.log(`  ${points.length.toLocaleString()} mappable suburbs found`);
  console.log(`  ${totalDone.toLocaleString()} done, ${totalPending.toLocaleString()} pending (${pct}%)`);
  console.log('  Building HTML map...');

  const totalPriority     = priorityAll.length;
  const totalPriorityDone = priorityDoneSet.size;

  // Split into done/pending/priority for efficient rendering
  const donePts     = points.filter(p =>  p.done && !p.isPriority).map(p => [p.lat, p.lng, p.suburb, p.state]);
  const pendingPts  = points.filter(p => !p.done && !p.isPriority).map(p => [p.lat, p.lng, p.suburb, p.state]);
  const priDonePts  = points.filter(p =>  p.priorityDone).map(p => [p.lat, p.lng, p.suburb, p.state]);
  const priPendPts  = points.filter(p =>  p.isPriority && !p.priorityDone).map(p => [p.lat, p.lng, p.suburb, p.state]);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TPW-88 — Suburb Progress Map</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0d1b2e; font-family: 'Segoe UI', system-ui, sans-serif; color: #e8edf5; }

  #header {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    background: #0f172a; border-bottom: 1px solid rgba(255,255,255,0.08);
    padding: 12px 24px; display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
  }
  #header h1 { font-size: 15px; font-weight: 700; color: #f8fafc; }
  #header .sub { font-size: 12px; color: #7f96b2; }

  .stats { display: flex; gap: 20px; margin-left: auto; flex-wrap: wrap; }
  .stat { text-align: center; }
  .stat-val { font-size: 18px; font-weight: 700; color: #f8fafc; }
  .stat-lbl { font-size: 10px; color: #7f96b2; text-transform: uppercase; letter-spacing: 0.06em; }

  .pill {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 99px; padding: 4px 12px; font-size: 12px;
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot-green        { background: #00e676; box-shadow: 0 0 6px #00e676; }
  .dot-grey         { background: #334155; }
  .dot-gold         { background: #ffd700; box-shadow: 0 0 6px #ffd700; }
  .dot-gold-outline { background: transparent; border: 2px solid #ffd700; width: 10px; height: 10px; }
  .dot-pulse  { background: #54a0ff; animation: pulse 1.5s infinite; }
  @keyframes pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(84,160,255,0.5); }
    50%      { box-shadow: 0 0 0 6px rgba(84,160,255,0); }
  }

  #map { position: fixed; top: 60px; left: 0; right: 0; bottom: 40px; }

  #progress-bar {
    position: fixed; bottom: 0; left: 0; right: 0; height: 40px; z-index: 1000;
    background: #0f172a; border-top: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; padding: 0 24px; gap: 12px;
  }
  #bar-outer {
    flex: 1; height: 10px; background: rgba(255,255,255,0.06);
    border-radius: 99px; overflow: hidden;
  }
  #bar-inner {
    height: 100%; border-radius: 99px;
    background: linear-gradient(90deg, #00b894, #00e676);
    width: ${pct}%;
  }
  #bar-label { font-size: 12px; font-weight: 700; color: #00e676; white-space: nowrap; }
  #bar-eta   { font-size: 11px; color: #7f96b2; white-space: nowrap; }

  .leaflet-tooltip {
    background: #1e293b !important; border: 1px solid rgba(255,255,255,0.12) !important;
    color: #e8edf5 !important; font-size: 12px !important; font-family: inherit !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important; border-radius: 6px !important;
    padding: 4px 8px !important;
  }
  .leaflet-tooltip-top:before { border-top-color: rgba(255,255,255,0.12) !important; }
</style>
</head>
<body>

<div id="header">
  <div>
    <h1>TPW-88 — Suburb Content Generation</h1>
    <div class="sub">AgedCare Compare &mdash; Every dot is a suburb page &mdash; Updated ${new Date().toLocaleDateString('en-AU', {day:'numeric',month:'short',year:'numeric'})}</div>
  </div>
  <div class="stats">
    <div class="stat"><div class="stat-val" style="color:#00e676">${totalDone.toLocaleString()}</div><div class="stat-lbl">Done</div></div>
    <div class="stat"><div class="stat-val" style="color:#7f96b2">${totalPending.toLocaleString()}</div><div class="stat-lbl">Pending</div></div>
    <div class="stat"><div class="stat-val">${points.length.toLocaleString()}</div><div class="stat-lbl">Total</div></div>
  </div>
  <div class="pill"><div class="dot dot-green"></div> Done (Haiku)</div>
  <div class="pill"><div class="dot dot-gold"></div> Priority done (Sonnet) ${totalPriorityDone}/${totalPriority}</div>
  <div class="pill"><div class="dot dot-gold-outline"></div> Priority pending</div>
  <div class="pill"><div class="dot dot-pulse"></div> In Progress (QLD)</div>
  <div class="pill"><div class="dot dot-grey"></div> Pending</div>
</div>

<div id="map"></div>

<div id="progress-bar">
  <div id="bar-outer"><div id="bar-inner"></div></div>
  <div id="bar-label">${pct}% complete</div>
  <div id="bar-eta">Est. completion: tonight ~10-11pm AEST</div>
</div>

<script>
const map = L.map('map', {
  center: [-25.5, 134.5],
  zoom: 5,
  preferCanvas: true,
  zoomControl: true,
  attributionControl: false
});

// Dark tile layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  subdomains: 'abcd'
}).addTo(map);

// Add labels on top
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  subdomains: 'abcd',
  pane: 'shadowPane'
}).addTo(map);

const donePts    = ${JSON.stringify(donePts)};
const pendingPts = ${JSON.stringify(pendingPts)};
const priDonePts = ${JSON.stringify(priDonePts)};
const priPendPts = ${JSON.stringify(priPendPts)};

function getRadius() {
  const z = map.getZoom();
  if (z >= 12) return 6;
  if (z >= 10) return 4;
  if (z >= 8)  return 3;
  return 2;
}

const doneLayer    = L.layerGroup().addTo(map);
const pendingLayer = L.layerGroup().addTo(map);
const priDoneLayer = L.layerGroup().addTo(map);
const priPendLayer = L.layerGroup().addTo(map);

function drawCircles() {
  const r  = getRadius();
  const r2 = Math.max(r + 2, 5); // priority dots slightly bigger

  doneLayer.clearLayers();
  pendingLayer.clearLayers();
  priDoneLayer.clearLayers();
  priPendLayer.clearLayers();

  // Pending first (underneath)
  for (const [lat, lng, suburb, state] of pendingPts) {
    L.circleMarker([lat, lng], {
      radius: r,
      fillColor: '#334155',
      color: 'transparent',
      fillOpacity: 0.7,
      interactive: true
    }).bindTooltip(\`\${suburb}, \${state} — pending\`, { direction: 'top', opacity: 0.95 })
      .addTo(pendingLayer);
  }

  // Done (bright green)
  for (const [lat, lng, suburb, state] of donePts) {
    L.circleMarker([lat, lng], {
      radius: r,
      fillColor: '#00e676',
      color: 'transparent',
      fillOpacity: 0.85,
      interactive: true
    }).bindTooltip(\`<strong>\${suburb}, \${state}</strong><br>Content generated (Haiku)\`, { direction: 'top', opacity: 0.95 })
      .addTo(doneLayer);
  }

  // Priority pending (gold outline)
  for (const [lat, lng, suburb, state] of priPendPts) {
    L.circleMarker([lat, lng], {
      radius: r2,
      fillColor: 'transparent',
      color: '#ffd700',
      weight: 2,
      fillOpacity: 0,
      interactive: true
    }).bindTooltip(\`<strong>\${suburb}, \${state}</strong><br>Priority — Sonnet run pending\`, { direction: 'top', opacity: 0.95 })
      .addTo(priPendLayer);
  }

  // Priority done (solid gold, on top of everything)
  for (const [lat, lng, suburb, state] of priDonePts) {
    L.circleMarker([lat, lng], {
      radius: r2,
      fillColor: '#ffd700',
      color: '#fff8',
      weight: 1,
      fillOpacity: 0.95,
      interactive: true
    }).bindTooltip(\`<strong>\${suburb}, \${state}</strong><br>Priority — Sonnet content done\`, { direction: 'top', opacity: 0.95 })
      .addTo(priDoneLayer);
  }
}

// Draw on load and redraw on zoom
drawCircles();
map.on('zoomend', drawCircles);

</script>
</body>
</html>`;

  fs.writeFileSync(path.resolve(OUTPUT_HTML), html);
  console.log(`  Done. Output: ${OUTPUT_HTML}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
