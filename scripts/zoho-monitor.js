/**
 * TPW-93: Zoho Webhook Health Monitor
 * Checks that the Zoho CRM webhook is alive and responding.
 * A 404 or connection failure means leads are being silently dropped.
 *
 * We POST a clearly-flagged test payload. Any response except 404/5xx/timeout
 * means the endpoint is alive. Exit code 1 triggers GitHub Actions alert.
 */

const https = require('https');
const http = require('http');

const WEBHOOK_URL = process.env.ZOHO_WEBHOOK_URL;

if (!WEBHOOK_URL) {
  console.error('ERROR: ZOHO_WEBHOOK_URL environment variable not set.');
  console.error('Add it as a GitHub secret and reference it in the workflow.');
  process.exit(1);
}

function checkWebhook(url) {
  return new Promise((resolve) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return resolve({ status: 'invalid-url', ok: false, error: e.message });
    }

    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const testPayload = JSON.stringify({
      _monitor: true,
      _source: 'zoho-health-monitor',
      _timestamp: new Date().toISOString(),
      _note: 'Automated health check - not a real lead submission'
    });

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testPayload),
        'User-Agent': 'AgedCare-Monitor/1.0'
      },
      timeout: 15000
    };

    const req = protocol.request(options, (res) => {
      // Drain the response body
      res.resume();
      const status = res.statusCode;
      // 404 = endpoint missing (webhook broken)
      // 5xx = server error
      // Anything else (200, 201, 400, 422) = endpoint exists and is responding
      const ok = status !== 404 && status < 500;
      resolve({ status, ok });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'timeout', ok: false, error: 'Request timed out after 15s' });
    });

    req.on('error', (err) => {
      resolve({ status: 'connection-error', ok: false, error: err.message });
    });

    req.write(testPayload);
    req.end();
  });
}

async function main() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Zoho Webhook Health Check`);
  console.log(`Endpoint: ${WEBHOOK_URL}`);
  console.log('---');

  const result = await checkWebhook(WEBHOOK_URL);

  if (result.ok) {
    console.log(`STATUS: HEALTHY`);
    console.log(`Response code: ${result.status}`);
    console.log('Zoho webhook is alive and responding.');
    process.exit(0);
  } else {
    console.error(`STATUS: DOWN`);
    console.error(`Response: ${result.status}`);
    if (result.error) console.error(`Error: ${result.error}`);
    console.error('');
    console.error('IMPACT: Lead submissions from AgedCare Compare may be failing silently.');
    console.error('ACTION: Check Zoho webhook config and contact Mehrnaz (MehrnazH@trilogycare.com.au)');
    process.exit(1);
  }
}

main();
