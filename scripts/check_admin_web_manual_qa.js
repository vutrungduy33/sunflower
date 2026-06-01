#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const qaPath = path.join(rootDir, 'docs', 'Admin-Web-Manual-QA.json');
const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');
const VALID_STATUSES = new Set(['passed', 'pending', 'blocked', 'waived']);

function fail(message) {
  console.error(`[admin-web-qa] ERROR: ${message}`);
  process.exit(1);
}

function readQaLedger() {
  try {
    return JSON.parse(fs.readFileSync(qaPath, 'utf8'));
  } catch (error) {
    fail(`cannot read ${qaPath}: ${error.message}`);
  }
}

function assertString(entry, field) {
  if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
    fail(`${entry.id || '<missing id>'} must include non-empty ${field}`);
  }
}

function validateCheck(check) {
  assertString(check, 'id');
  assertString(check, 'area');
  assertString(check, 'route');
  assertString(check, 'requirement');
  assertString(check, 'status');
  assertString(check, 'evidence');
  assertString(check, 'nextAction');

  if (!VALID_STATUSES.has(check.status)) {
    fail(`${check.id} has invalid status '${check.status}'`);
  }

  if (typeof check.requiredForMvp !== 'boolean') {
    fail(`${check.id} requiredForMvp must be boolean`);
  }

  if (!Array.isArray(check.relatedApis) || check.relatedApis.length === 0) {
    fail(`${check.id} must include at least one related API`);
  }

  for (const api of check.relatedApis) {
    if (typeof api !== 'string' || api.trim() === '') {
      fail(`${check.id} relatedApis must be non-empty strings`);
    }
  }
}

function validateQaLedger(data) {
  if (!data || data.schemaVersion !== 1) {
    fail('QA ledger schemaVersion must be 1');
  }

  if (!data.environment || typeof data.environment !== 'object') {
    fail('QA ledger must include environment metadata');
  }

  if (!Array.isArray(data.checks)) {
    fail('QA ledger must contain a checks array');
  }

  const ids = new Set();
  for (const check of data.checks) {
    validateCheck(check);
    if (ids.has(check.id)) {
      fail(`duplicate check id: ${check.id}`);
    }
    ids.add(check.id);
  }
}

function groupRequiredChecks(checks) {
  const required = checks.filter((check) => check.requiredForMvp);
  const counts = {
    passed: 0,
    pending: 0,
    blocked: 0,
    waived: 0,
  };

  for (const check of required) {
    counts[check.status] += 1;
  }

  return {
    counts,
    required,
    unresolved: required.filter((check) => check.status !== 'passed' && check.status !== 'waived'),
  };
}

function printSummary(checks) {
  const { counts, required, unresolved } = groupRequiredChecks(checks);

  console.log('[admin-web-qa] Required manual QA summary');
  console.log(`[admin-web-qa] total=${required.length} passed=${counts.passed} waived=${counts.waived} pending=${counts.pending} blocked=${counts.blocked}`);

  if (unresolved.length > 0) {
    console.log('[admin-web-qa] unresolved required checks:');
    for (const check of unresolved) {
      console.log(`- ${check.id} [${check.status}] ${check.requirement}`);
      console.log(`  route: ${check.route}`);
      console.log(`  next: ${check.nextAction}`);
    }
  } else {
    console.log('[admin-web-qa] all required admin manual QA checks are passed or waived');
  }

  return unresolved;
}

const data = readQaLedger();
validateQaLedger(data);
const unresolved = printSummary(data.checks);

if (strict && unresolved.length > 0) {
  fail(`admin-web manual QA is incomplete: ${unresolved.length} required check${unresolved.length === 1 ? '' : 's'} unresolved`);
}
