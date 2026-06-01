#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');

const ledgers = [
  {
    name: 'launch',
    label: 'MVP launch evidence',
    path: path.join(rootDir, 'docs', 'MVP-Launch-Evidence.json'),
    collectionKey: 'entries',
    requiredDescription: 'required launch evidence entries',
  },
  {
    name: 'miniapp',
    label: 'Miniapp manual QA',
    path: path.join(rootDir, 'docs', 'Miniapp-Manual-QA.json'),
    collectionKey: 'checks',
    requiredDescription: 'required miniapp manual QA checks',
  },
  {
    name: 'admin-web',
    label: 'Admin-web manual QA',
    path: path.join(rootDir, 'docs', 'Admin-Web-Manual-QA.json'),
    collectionKey: 'checks',
    requiredDescription: 'required admin-web manual QA checks',
  },
];

const COMPLETION_STATUSES = new Set(['passed', 'waived']);
const VALID_STATUSES = new Set(['passed', 'pending', 'blocked', 'waived']);
const REQUIRED_LAUNCH_IDS = [
  'AUTO-BACKEND',
  'AUTO-ADMIN-WEB',
  'AUTO-MINIAPP',
  'PROD-SMOKE',
  'WECHAT-DOMAIN',
  'WECHAT-PREVIEW-LOGIN',
  'WECHAT-PHONE',
  'MINIAPP-BOOKING-PATH',
  'WECHAT-REAL-PAYMENT',
  'WECHAT-REAL-REFUND',
  'ADMIN-PROD-QA',
  'BACKEND-8080-HARDENING',
  'CURRENT-BRANCH-DEPLOYED',
];

function fail(message) {
  console.error(`[mvp-closeout] ERROR: ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`cannot read ${filePath}: ${error.message}`);
  }
}

function getItems(ledger, data) {
  const items = data[ledger.collectionKey];
  if (!Array.isArray(items)) {
    fail(`${ledger.label} must contain array '${ledger.collectionKey}'`);
  }
  return items;
}

function validateItem(ledger, item) {
  if (!item || typeof item !== 'object') {
    fail(`${ledger.label} contains a non-object item`);
  }

  if (typeof item.id !== 'string' || item.id.trim() === '') {
    fail(`${ledger.label} contains an item without id`);
  }

  if (!VALID_STATUSES.has(item.status)) {
    fail(`${ledger.label} ${item.id} has invalid status '${item.status}'`);
  }

  if (typeof item.requiredForMvp !== 'boolean') {
    fail(`${ledger.label} ${item.id} requiredForMvp must be boolean`);
  }

  if (typeof item.evidence !== 'string' || item.evidence.trim() === '') {
    fail(`${ledger.label} ${item.id} must include non-empty evidence`);
  }

  if (typeof item.nextAction !== 'string' || item.nextAction.trim() === '') {
    fail(`${ledger.label} ${item.id} must include non-empty nextAction`);
  }
}

function summarizeLedger(ledger) {
  const data = readJson(ledger.path);
  const items = getItems(ledger, data);
  const ids = new Set();

  for (const item of items) {
    validateItem(ledger, item);
    if (ids.has(item.id)) {
      fail(`${ledger.label} contains duplicate id ${item.id}`);
    }
    ids.add(item.id);
  }

  if (ledger.name === 'launch') {
    for (const requiredId of REQUIRED_LAUNCH_IDS) {
      if (!ids.has(requiredId)) {
        fail(`${ledger.label} is missing required closeout id ${requiredId}`);
      }
    }
  }

  const required = items.filter((item) => item.requiredForMvp);
  const counts = {
    passed: 0,
    waived: 0,
    pending: 0,
    blocked: 0,
  };

  for (const item of required) {
    counts[item.status] += 1;
  }

  const unresolved = required.filter((item) => !COMPLETION_STATUSES.has(item.status));

  return {
    ledger,
    required,
    counts,
    unresolved,
  };
}

function printSummary(summaries) {
  console.log('[mvp-closeout] MVP closeout readiness summary');

  let unresolvedTotal = 0;
  for (const summary of summaries) {
    const { ledger, required, counts, unresolved } = summary;
    unresolvedTotal += unresolved.length;

    console.log(
      `[mvp-closeout] ${ledger.name}: total=${required.length} passed=${counts.passed} waived=${counts.waived} pending=${counts.pending} blocked=${counts.blocked}`,
    );

    if (unresolved.length > 0) {
      console.log(`[mvp-closeout] ${ledger.name} unresolved ${ledger.requiredDescription}:`);
      for (const item of unresolved) {
        console.log(`- ${item.id} [${item.status}] ${item.requirement}`);
        console.log(`  next: ${item.nextAction}`);
      }
    }
  }

  if (unresolvedTotal === 0) {
    console.log('[mvp-closeout] all required closeout evidence entries are passed or waived');
  } else {
    console.log(`[mvp-closeout] unresolved required closeout items: ${unresolvedTotal}`);
  }

  return unresolvedTotal;
}

const summaries = ledgers.map(summarizeLedger);
const unresolvedTotal = printSummary(summaries);

if (strict && unresolvedTotal > 0) {
  fail(`MVP closeout is not ready: ${unresolvedTotal} required item${unresolvedTotal === 1 ? '' : 's'} unresolved`);
}
