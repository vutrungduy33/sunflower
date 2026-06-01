#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const evidencePath = path.join(rootDir, 'docs', 'MVP-Launch-Evidence.json');
const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');

const VALID_STATUSES = new Set(['passed', 'pending', 'blocked', 'waived']);

function fail(message) {
  console.error(`[mvp-evidence] ERROR: ${message}`);
  process.exit(1);
}

function readEvidence() {
  try {
    return JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  } catch (error) {
    fail(`cannot read ${evidencePath}: ${error.message}`);
  }
}

function assertString(entry, field) {
  if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
    fail(`${entry.id || '<missing id>'} must include non-empty ${field}`);
  }
}

function validateEvidence(data) {
  if (!data || !Array.isArray(data.entries)) {
    fail('evidence file must contain an entries array');
  }

  const ids = new Set();

  for (const entry of data.entries) {
    assertString(entry, 'id');
    assertString(entry, 'area');
    assertString(entry, 'requirement');
    assertString(entry, 'status');
    assertString(entry, 'evidence');
    assertString(entry, 'nextAction');

    if (ids.has(entry.id)) {
      fail(`duplicate evidence id: ${entry.id}`);
    }
    ids.add(entry.id);

    if (!VALID_STATUSES.has(entry.status)) {
      fail(`${entry.id} has invalid status '${entry.status}'`);
    }

    if (typeof entry.requiredForMvp !== 'boolean') {
      fail(`${entry.id} requiredForMvp must be boolean`);
    }
  }
}

function groupCounts(entries) {
  const counts = {
    passed: 0,
    pending: 0,
    blocked: 0,
    waived: 0,
  };

  for (const entry of entries) {
    counts[entry.status] += 1;
  }

  return counts;
}

function printSummary(entries) {
  const required = entries.filter((entry) => entry.requiredForMvp);
  const counts = groupCounts(required);
  const unresolved = required.filter(
    (entry) => entry.status !== 'passed' && entry.status !== 'waived'
  );

  console.log('[mvp-evidence] Required evidence summary');
  console.log(`[mvp-evidence] total=${required.length} passed=${counts.passed} waived=${counts.waived} pending=${counts.pending} blocked=${counts.blocked}`);

  if (unresolved.length > 0) {
    console.log('[mvp-evidence] unresolved required entries:');
    for (const entry of unresolved) {
      console.log(`- ${entry.id} [${entry.status}] ${entry.requirement}`);
      console.log(`  next: ${entry.nextAction}`);
    }
  } else {
    console.log('[mvp-evidence] all required evidence entries are passed or waived');
  }

  return unresolved;
}

const data = readEvidence();
validateEvidence(data);
const unresolved = printSummary(data.entries);

if (strict && unresolved.length > 0) {
  fail(`MVP launch evidence is incomplete: ${unresolved.length} required entr${unresolved.length === 1 ? 'y' : 'ies'} unresolved`);
}
