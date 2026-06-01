#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const templatePath = path.join(rootDir, 'docs', 'MVP-External-Evidence-Template.md');
const ledgers = [
  {
    name: 'launch',
    path: path.join(rootDir, 'docs', 'MVP-Launch-Evidence.json'),
    collectionKey: 'entries',
  },
  {
    name: 'miniapp',
    path: path.join(rootDir, 'docs', 'Miniapp-Manual-QA.json'),
    collectionKey: 'checks',
  },
  {
    name: 'admin-web',
    path: path.join(rootDir, 'docs', 'Admin-Web-Manual-QA.json'),
    collectionKey: 'checks',
  },
];

const REQUIRED_SAFETY_TEXT = [
  'Do not record or commit',
  'real AppID values',
  'auth tokens or cookies',
  'phone numbers or SMS codes',
  'merchant credentials',
  'raw screenshots with personal data',
  'full order/payment/refund identifiers',
  'explicit user approval first',
];

function fail(message) {
  console.error(`[external-evidence-template] ERROR: ${message}`);
  process.exit(1);
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    fail(`cannot read ${filePath}: ${error.message}`);
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`cannot read ${filePath}: ${error.message}`);
  }
}

function unresolvedRequiredIds(ledger) {
  const data = readJson(ledger.path);
  const items = data[ledger.collectionKey];
  if (!Array.isArray(items)) {
    fail(`${ledger.name} ledger must contain array '${ledger.collectionKey}'`);
  }

  return items
    .filter((item) => item.requiredForMvp && item.status !== 'passed' && item.status !== 'waived')
    .map((item) => item.id);
}

function main() {
  const template = readText(templatePath);
  const missing = [];
  let expectedCount = 0;

  for (const ledger of ledgers) {
    for (const id of unresolvedRequiredIds(ledger)) {
      expectedCount += 1;
      if (!template.includes(`<!-- template:${id} -->`)) {
        missing.push(`${ledger.name}:${id}`);
      }
    }
  }

  for (const requiredText of REQUIRED_SAFETY_TEXT) {
    if (!template.includes(requiredText)) {
      missing.push(`safety-text:${requiredText}`);
    }
  }

  if (!template.includes(`Unresolved required items: ${expectedCount}`)) {
    missing.push(`summary-count:${expectedCount}`);
  }

  if (missing.length > 0) {
    fail(`template is missing ${missing.length} required marker(s): ${missing.join(', ')}`);
  }

  console.log(`[external-evidence-template] PASS: template covers ${expectedCount} unresolved required item(s)`);
}

main();
