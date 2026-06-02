#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const qaPath = path.join(rootDir, 'docs', 'Admin-Web-Manual-QA.json');
const qaDocPath = path.join(rootDir, 'docs', 'Admin-Web-MVP-QA.md');
const readmePath = path.join(rootDir, 'sunflower-admin-web', 'README.md');
const envConfigPath = path.join(rootDir, 'sunflower-admin-web', 'src', 'config', 'env.ts');
const httpServicePath = path.join(rootDir, 'sunflower-admin-web', 'src', 'services', 'http.ts');
const requiredCheckIds = [
  'ADMIN-AUTH-LOGIN',
  'ADMIN-AUTH-ACTIVATE',
  'ADMIN-AUTH-RESET-CHANGE',
  'ADMIN-WORKSPACE-HEALTH',
  'ADMIN-ROOM-LIST-EDIT',
  'ADMIN-ROOM-SHELF',
  'ADMIN-PRICING-CALENDAR',
  'ADMIN-PRICING-BATCH',
  'ADMIN-ORDER-LIST-DETAIL',
  'ADMIN-ORDER-OPS',
  'ADMIN-AFTER-SALE',
  'ADMIN-ERROR-STATES',
];
const highRiskCheckIds = new Set([
  'ADMIN-ROOM-LIST-EDIT',
  'ADMIN-ROOM-SHELF',
  'ADMIN-PRICING-BATCH',
  'ADMIN-ORDER-OPS',
  'ADMIN-AFTER-SALE',
]);
const forbiddenEvidencePatterns = [
  /password/i,
  /bearer\s+[A-Za-z0-9._-]+/i,
  /cookie/i,
  /sms\s*code/i,
  /短信码/,
  /验证码[:：]\s*\d{4,8}/,
  /1[3-9]\d{9}/,
];

let passCount = 0;

function fail(message) {
  console.error(`[admin-web-external-preflight] ERROR: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  passCount += 1;
  console.log(`[admin-web-external-preflight] PASS: ${message}`);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`cannot read JSON ${path.relative(rootDir, filePath)}: ${error.message}`);
    return null;
  }
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    fail(`cannot read ${path.relative(rootDir, filePath)}: ${error.message}`);
    return '';
  }
}

function assertHttpsOrDocumentedHttp(url, fieldName) {
  if (typeof url !== 'string' || url.trim() === '') {
    fail(`environment.${fieldName} must be a non-empty URL`);
    return;
  }

  if (/^https:\/\//.test(url)) {
    return;
  }

  if (!/^http:\/\/47\.113\.223\.248/.test(url)) {
    fail(`environment.${fieldName} must be HTTPS or the documented temporary production IP entry`);
  }
}

function checkEnvironment(data) {
  if (!data.environment || typeof data.environment !== 'object') {
    fail('Admin-Web-Manual-QA.json must include environment metadata');
    return;
  }

  assertHttpsOrDocumentedHttp(data.environment.adminEntryUrl, 'adminEntryUrl');
  assertHttpsOrDocumentedHttp(data.environment.apiEntryUrl, 'apiEntryUrl');

  const notes = `${data.environment.notes || ''}`;
  if (!/HTTPS|domain/i.test(notes)) {
    fail('environment.notes must mention HTTPS/domain replacement for production readiness');
  }
  if (!/credential|凭证|password|密码/i.test(notes)) {
    fail('environment.notes must warn against committing credentials');
  }

  pass('manual QA environment records admin/API entry and credential/domain caveats');
}

function checkRequiredChecks(data) {
  if (!Array.isArray(data.checks)) {
    fail('Admin-Web-Manual-QA.json must contain checks array');
    return;
  }

  const ids = new Set(data.checks.map((check) => check.id));
  const missing = requiredCheckIds.filter((id) => !ids.has(id));
  if (missing.length > 0) {
    fail(`Admin-Web-Manual-QA.json is missing required ids: ${missing.join(', ')}`);
    return;
  }

  pass('manual QA ledger includes all required admin evidence ids');
}

function checkSensitiveEvidence(data) {
  for (const check of data.checks || []) {
    const evidence = `${check.evidence || ''}`;
    if (check.status !== 'passed' && check.status !== 'waived') {
      continue;
    }

    for (const pattern of forbiddenEvidencePatterns) {
      if (pattern.test(evidence)) {
        fail(`${check.id} resolved evidence may contain sensitive data; store only sanitized summaries`);
      }
    }
  }

  pass('resolved admin QA evidence does not match obvious sensitive-data patterns');
}

function checkHighRiskNextActions(data) {
  for (const check of data.checks || []) {
    if (!highRiskCheckIds.has(check.id)) {
      continue;
    }

    const nextAction = `${check.nextAction || ''}`;
    if (!/QA|approved|批准|safe|安全|user approval|用户/.test(nextAction)) {
      fail(`${check.id} nextAction must constrain live mutations to QA/approved/safe data`);
    }
    if (!/restore|restored|waiver|waived|accept|恢复|还原|豁免|接受/.test(nextAction)) {
      fail(`${check.id} nextAction must mention restoration, accepted change, or explicit waiver`);
    }
  }

  pass('high-risk admin QA checks require approved data and restoration or waiver notes');
}

function checkAuthAndRuntimeBoundaries() {
  const envConfig = readText(envConfigPath);
  const httpService = readText(httpServicePath);

  if (!/apiBaseUrl[\s\S]*VITE_API_BASE_URL[\s\S]*\|\| '\/api'/.test(envConfig)) {
    fail('admin env config must default to same-origin /api for production');
  }
  if (!httpService.includes('Authorization')) {
    fail('admin HTTP service must inject Authorization from session store');
  }
  if (!httpService.includes('clearAdminSession()')) {
    fail('admin HTTP service must clear session on unauthorized responses');
  }

  pass('admin runtime keeps same-origin API default and session cleanup wiring');
}

function checkDocsContainSafetyRules() {
  const qaDoc = readText(qaDocPath);
  const readme = readText(readmePath);

  const qaRequiredPhrases = [
    'dedicated QA admin account',
    'Do not commit phone numbers',
    'SMS codes',
    'bearer tokens',
    'cookies',
    'explicit user approval',
  ];
  for (const phrase of qaRequiredPhrases) {
    if (!qaDoc.includes(phrase)) {
      fail(`Admin-Web-MVP-QA.md must mention safety rule: ${phrase}`);
    }
  }

  if (!readme.includes('Production manual QA evidence is still tracked separately')) {
    fail('sunflower-admin-web/README.md must keep production manual QA caveat');
  }

  pass('admin QA docs include credential and live-data safety rules');
}

function main() {
  const data = readJson(qaPath);
  if (data) {
    checkEnvironment(data);
    checkRequiredChecks(data);
    checkSensitiveEvidence(data);
    checkHighRiskNextActions(data);
  }
  checkAuthAndRuntimeBoundaries();
  checkDocsContainSafetyRules();

  if (process.exitCode) {
    return;
  }

  pass(`admin-web external QA preflight completed with ${passCount} checks`);
}

main();
