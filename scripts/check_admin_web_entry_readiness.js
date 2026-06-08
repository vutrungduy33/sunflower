#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const qaPath = path.join(rootDir, 'docs', 'Admin-Web-Manual-QA.json');
const DEFAULT_TIMEOUT_MS = 8000;

let passCount = 0;
let warnCount = 0;

function log(level, message) {
  console.log(`[admin-entry-readiness] ${level}: ${message}`);
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
  console.error(`[admin-entry-readiness] ERROR: ${message}`);
  process.exitCode = 1;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`cannot read ${path.relative(rootDir, filePath)}: ${error.message}`);
    return null;
  }
}

function normalizeBaseUrl(rawUrl, fieldName) {
  if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    fail(`environment.${fieldName} must be a non-empty URL`);
    return null;
  }

  try {
    return new URL(rawUrl);
  } catch (error) {
    fail(`environment.${fieldName} must be a valid URL: ${error.message}`);
    return null;
  }
}

function buildUrl(baseUrl, suffix) {
  const url = new URL(baseUrl.href);
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/${suffix.replace(/^\/+/, '')}`;
  return url;
}

function requestText(url, timeoutMs) {
  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.request(url, {
      method: 'GET',
      timeout: timeoutMs,
    }, (response) => {
      const chunks = [];

      response.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          body: Buffer.concat(chunks).toString('utf8'),
          contentType: response.headers['content-type'] || '',
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

function requireStatusOk(result, url, label) {
  if (result.statusCode >= 200 && result.statusCode < 400) {
    pass(`${label} returned HTTP ${result.statusCode}`);
    return;
  }

  fail(`${label} ${url.href} returned HTTP ${result.statusCode} ${result.statusMessage || ''}`.trim());
}

async function checkAdminHtml(adminUrl, timeoutMs) {
  const result = await requestText(adminUrl, timeoutMs);
  requireStatusOk(result, adminUrl, 'admin web entry');

  if (/text\/html/i.test(result.contentType) && /sunflower-admin-web|<div id="root"/i.test(result.body)) {
    pass('admin web entry returns the expected HTML shell');
  } else {
    fail(`admin web entry did not look like the admin HTML shell; content-type=${result.contentType || '<missing>'}`);
  }
}

async function checkHealthz(adminUrl, timeoutMs) {
  const healthzUrl = buildUrl(adminUrl, '/healthz');
  const result = await requestText(healthzUrl, timeoutMs);
  requireStatusOk(result, healthzUrl, 'admin web healthz');

  if (/\bok\b/i.test(result.body)) {
    pass('admin web healthz body is ok');
  } else {
    fail('admin web healthz body did not contain ok');
  }
}

async function checkApiHealth(apiUrl, timeoutMs) {
  const healthUrl = buildUrl(apiUrl, '/health');
  const result = await requestText(healthUrl, timeoutMs);
  requireStatusOk(result, healthUrl, 'admin API health');

  if (/"status"\s*:\s*"UP"/.test(result.body)) {
    pass('admin API health body reports UP');
  } else {
    fail('admin API health body did not report status UP');
  }
}

function warnIfTemporaryHttp(url, label) {
  if (url.protocol === 'http:') {
    warn(`${label} still uses HTTP; HTTPS/domain evidence remains required before final MVP launch`);
  }
}

async function main() {
  const qa = readJson(qaPath);
  if (!qa || !qa.environment) {
    fail('Admin-Web-Manual-QA.json must include environment metadata');
    return;
  }

  const adminUrl = normalizeBaseUrl(qa.environment.adminEntryUrl, 'adminEntryUrl');
  const apiUrl = normalizeBaseUrl(qa.environment.apiEntryUrl, 'apiEntryUrl');
  if (!adminUrl || !apiUrl) {
    return;
  }

  warnIfTemporaryHttp(adminUrl, 'admin entry');
  warnIfTemporaryHttp(apiUrl, 'admin API entry');

  await checkAdminHtml(adminUrl, DEFAULT_TIMEOUT_MS);
  await checkHealthz(adminUrl, DEFAULT_TIMEOUT_MS);
  await checkApiHealth(apiUrl, DEFAULT_TIMEOUT_MS);

  if (!process.exitCode) {
    log('INFO', `completed with ${passCount} pass(es), ${warnCount} warning(s)`);
  }
}

main().catch((error) => {
  fail(error.message);
});
