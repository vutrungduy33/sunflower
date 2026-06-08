#!/usr/bin/env node
'use strict';

const dns = require('dns').promises;
const https = require('https');
const net = require('net');

const DEFAULT_PATH = '/api/health';
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MIN_VALID_DAYS = 14;
const DEFAULT_EXPECT_BODY = '"status":"UP"';

let passCount = 0;
let warnCount = 0;

function log(level, message) {
  console.log(`[miniapp-https-domain] ${level}: ${message}`);
}

function pass(message) {
  passCount += 1;
  log('PASS', message);
}

function warn(message) {
  warnCount += 1;
  log('WARN', message);
}

function fail(message) {
  console.error(`[miniapp-https-domain] ERROR: ${message}`);
  process.exitCode = 1;
}

function printUsage() {
  console.log([
    'Usage:',
    '  node scripts/check_miniapp_https_domain.js [--path=/api/health] [--timeout-ms=8000] [--min-valid-days=14] [--expect-body=\'"status":"UP"\'] https://api.example.com',
    '',
    'Notes:',
    '  - Hostnames without a scheme are treated as https://<host>.',
    '  - The check is read-only: DNS lookup, HTTPS request, TLS certificate inspection.',
    '  - Successful TLS handshake uses Node certificate and hostname validation.',
    '  - The default /api/health check requires a backend health response, not just a 200 HTML page.',
  ].join('\n'));
}

function parseArgs(argv) {
  const options = {
    path: DEFAULT_PATH,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    minValidDays: DEFAULT_MIN_VALID_DAYS,
    expectBody: DEFAULT_EXPECT_BODY,
    targets: [],
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
    if (arg.startsWith('--path=')) {
      options.path = arg.slice('--path='.length) || DEFAULT_PATH;
      continue;
    }
    if (arg.startsWith('--timeout-ms=')) {
      options.timeoutMs = Number(arg.slice('--timeout-ms='.length));
      continue;
    }
    if (arg.startsWith('--min-valid-days=')) {
      options.minValidDays = Number(arg.slice('--min-valid-days='.length));
      continue;
    }
    if (arg.startsWith('--expect-body=')) {
      options.expectBody = arg.slice('--expect-body='.length);
      continue;
    }
    options.targets.push(arg);
  }

  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
    fail('--timeout-ms must be a positive number');
  }
  if (!Number.isFinite(options.minValidDays) || options.minValidDays < 0) {
    fail('--min-valid-days must be a non-negative number');
  }
  if (!options.path.startsWith('/')) {
    options.path = `/${options.path}`;
  }

  return options;
}

function normalizeTarget(rawTarget, defaultPath) {
  const withScheme = /^https?:\/\//i.test(rawTarget) ? rawTarget : `https://${rawTarget}`;
  const url = new URL(withScheme);

  if (url.protocol !== 'https:') {
    throw new Error(`miniapp request domain must use https, got ${url.protocol}`);
  }

  if (url.pathname === '/' && !rawTarget.includes('/api/')) {
    url.pathname = defaultPath;
  }

  return url;
}

async function resolveHost(hostname) {
  const addresses = await dns.lookup(hostname, { all: true });
  if (addresses.length === 0) {
    throw new Error('DNS lookup returned no addresses');
  }

  return addresses.map((entry) => `${entry.address}/IPv${entry.family}`);
}

function requestHttps(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: `${url.pathname}${url.search}`,
      method: 'GET',
      servername: net.isIP(url.hostname) ? undefined : url.hostname,
      rejectUnauthorized: true,
      timeout: timeoutMs,
    }, (response) => {
      const chunks = [];
      const certificate = response.socket ? response.socket.getPeerCertificate() : null;
      response.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          certificate,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });

    request.on('timeout', () => {
      request.destroy(new Error(`request timed out after ${timeoutMs}ms`));
    });
    request.on('error', reject);
    request.end();
  });
}

function certificateSummary(certificate) {
  if (!certificate || Object.keys(certificate).length === 0) {
    return {
      subject: '<missing>',
      issuer: '<missing>',
      validTo: '<missing>',
      daysRemaining: -1,
    };
  }

  const validToDate = new Date(certificate.valid_to);
  const daysRemaining = Math.floor((validToDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  return {
    subject: certificate.subject && certificate.subject.CN ? certificate.subject.CN : '<unknown>',
    issuer: certificate.issuer && certificate.issuer.CN ? certificate.issuer.CN : '<unknown>',
    validTo: certificate.valid_to || '<unknown>',
    daysRemaining,
  };
}

function bodyMatchesExpected(body, expected) {
  if (!expected) {
    return true;
  }

  if (expected === DEFAULT_EXPECT_BODY) {
    return /"status"\s*:\s*"UP"/.test(body);
  }

  return body.includes(expected);
}

function compactPreview(body) {
  return body.replace(/\s+/g, ' ').slice(0, 120);
}

async function checkTarget(rawTarget, options) {
  let url;
  try {
    url = normalizeTarget(rawTarget, options.path);
  } catch (error) {
    fail(`${rawTarget}: ${error.message}`);
    return;
  }

  log('INFO', `checking ${url.href}`);

  try {
    const addresses = await resolveHost(url.hostname);
    pass(`${url.hostname} resolves to ${addresses.join(', ')}`);
  } catch (error) {
    fail(`${url.hostname} DNS lookup failed: ${error.message}`);
    return;
  }

  let result;
  try {
    result = await requestHttps(url, options.timeoutMs);
  } catch (error) {
    fail(`${url.href} HTTPS/TLS request failed: ${error.message}`);
    return;
  }

  const cert = certificateSummary(result.certificate);
  pass(`${url.hostname} TLS certificate is trusted for this hostname; issuer=${cert.issuer}; subject=${cert.subject}; valid_to=${cert.validTo}`);

  if (cert.daysRemaining < options.minValidDays) {
    fail(`${url.hostname} certificate expires too soon: ${cert.daysRemaining} day(s) remaining, minimum ${options.minValidDays}`);
  } else {
    pass(`${url.hostname} certificate validity window is acceptable: ${cert.daysRemaining} day(s) remaining`);
  }

  if (result.statusCode >= 200 && result.statusCode < 400) {
    pass(`${url.href} returned HTTP ${result.statusCode}`);
  } else {
    fail(`${url.href} returned HTTP ${result.statusCode} ${result.statusMessage || ''}`.trim());
  }

  if (bodyMatchesExpected(result.body, options.expectBody)) {
    pass(`${url.href} response body matches expected marker`);
  } else {
    fail(`${url.href} response body did not match expected marker ${JSON.stringify(options.expectBody)}; preview=${JSON.stringify(compactPreview(result.body))}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.targets.length === 0) {
    printUsage();
    process.exit(1);
  }

  for (const target of options.targets) {
    await checkTarget(target, options);
  }

  if (process.exitCode) {
    return;
  }

  log('INFO', `completed with ${passCount} pass(es), ${warnCount} warning(s)`);
}

main().catch((error) => {
  fail(error.message);
});
