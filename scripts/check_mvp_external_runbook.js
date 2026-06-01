#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const runbookPath = path.join(rootDir, 'docs', 'MVP-External-Validation-Runbook.md');
const launchEvidencePath = path.join(rootDir, 'docs', 'MVP-Launch-Evidence.json');
const miniappQaPath = path.join(rootDir, 'docs', 'Miniapp-Manual-QA.json');
const adminQaPath = path.join(rootDir, 'docs', 'Admin-Web-Manual-QA.json');

function fail(message) {
  console.error(`[external-runbook] ERROR: ${message}`);
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
    return JSON.parse(readText(filePath));
  } catch (error) {
    fail(`cannot parse ${filePath}: ${error.message}`);
  }
}

function requiredIdsFromEntries(entries) {
  if (!Array.isArray(entries)) {
    fail('expected entries/checks array');
  }

  return entries
    .filter((entry) => entry.requiredForMvp && entry.status !== 'passed' && entry.status !== 'waived')
    .map((entry) => entry.id)
    .sort();
}

function assertMarkers(runbook, ids, markerPrefix) {
  const missing = ids.filter((id) => !runbook.includes(`<!-- ${markerPrefix}:${id} -->`));
  if (missing.length > 0) {
    fail(`runbook missing ${markerPrefix} marker(s): ${missing.join(', ')}`);
  }
  console.log(`[external-runbook] PASS: ${markerPrefix} markers cover ${ids.length} unresolved required item(s)`);
}

function assertRequiredText(runbook, snippets) {
  const missing = snippets.filter((snippet) => !runbook.includes(snippet));
  if (missing.length > 0) {
    fail(`runbook missing required safety text: ${missing.join(' | ')}`);
  }
}

function assertRequiredTerms(runbook, groups) {
  const missingGroups = groups.filter((group) => group.some((term) => !runbook.includes(term)));
  if (missingGroups.length > 0) {
    fail(`runbook missing required safety term group(s): ${missingGroups.map((group) => group.join('+')).join(' | ')}`);
  }
}

const runbook = readText(runbookPath);
const launchEvidence = readJson(launchEvidencePath);
const miniappQa = readJson(miniappQaPath);
const adminQa = readJson(adminQaPath);

const launchIds = requiredIdsFromEntries(launchEvidence.entries);
const miniappIds = requiredIdsFromEntries(miniappQa.checks);
const adminIds = requiredIdsFromEntries(adminQa.checks);

assertMarkers(runbook, launchIds, 'evidence');
assertMarkers(runbook, miniappIds, 'miniapp');
assertMarkers(runbook, adminIds, 'admin');

assertRequiredText(runbook, [
  'Stop for explicit user approval',
  'Do not commit real AppID',
  'real payment requires explicit user approval',
  'real refund requires explicit user approval',
  'pushing `main`, merging, or `workflow_dispatch` requires',
]);

assertRequiredTerms(runbook, [
  ['security group', 'firewall', 'explicit user approval'],
]);

console.log('[external-runbook] PASS: required safety text present');
console.log('[external-runbook] INFO: external validation runbook coverage check completed');
