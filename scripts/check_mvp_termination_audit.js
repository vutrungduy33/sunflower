#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const auditPath = path.join(rootDir, 'docs', 'MVP-Closeout-Audit.md');
const progressPath = path.join(rootDir, 'docs', 'MVP-Progress.md');
const archivedProgressDir = path.join(rootDir, 'docs', 'archive', 'mvp-progress');
const projectStatePath = path.join(rootDir, 'docs', 'Project-State.md');
const completionStatuses = new Set(['passed', 'waived']);

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

const requiredCriteria = [
  'Backend tests pass and core API health check is usable.',
  'Admin-web lint/test/build pass and main operations are usable.',
  'Miniapp main user path has explicit verification record and key JS has no syntax errors.',
  'GitHub automatic deployment pipeline is preserved/explainable, and production smoke is recorded.',
  '`docs/Project-State.md`, `docs/MVP-Readiness.md`, and `docs/Decision-Log.md` reflect current facts.',
  'Worktree is clean and final round has committed code.',
];

const requiredProgressText = [
  'Round 50: Goal Termination Criteria Audit',
  'Status: completed',
  'node scripts/check_mvp_launch_evidence.js --strict',
  'node scripts/check_miniapp_manual_qa.js --strict',
  'node scripts/check_admin_web_manual_qa.js --strict',
  'node scripts/check_mvp_closeout_readiness.js --strict',
];

function fail(message) {
  console.error(`[termination-audit] ERROR: ${message}`);
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

function normalize(text) {
  return text.replace(/\s+/g, ' ');
}

function requireIncludes(text, expected, label) {
  if (!text.includes(expected)) {
    fail(`missing ${label}: ${expected}`);
  }
}

function readProgressCorpus() {
  const texts = [readText(progressPath)];
  try {
    const archivedFiles = fs
      .readdirSync(archivedProgressDir)
      .filter((fileName) => /^MVP-Progress-Rounds-.*\.md$/.test(fileName))
      .sort();

    for (const fileName of archivedFiles) {
      texts.push(readText(path.join(archivedProgressDir, fileName)));
    }
  } catch (error) {
    fail(`cannot read archived progress directory ${archivedProgressDir}: ${error.message}`);
  }

  return texts.join('\n');
}

function unresolvedRequiredItems(ledger) {
  const data = readJson(ledger.path);
  const items = data[ledger.collectionKey];

  if (!Array.isArray(items)) {
    fail(`${ledger.name} ledger must contain array '${ledger.collectionKey}'`);
  }

  return items.filter((item) => item.requiredForMvp && !completionStatuses.has(item.status));
}

function main() {
  const audit = readText(auditPath);
  const normalizedAudit = normalize(audit);
  const progress = readProgressCorpus();
  const projectState = readText(projectStatePath);
  const unresolvedByLedger = Object.fromEntries(
    ledgers.map((ledger) => [ledger.name, unresolvedRequiredItems(ledger).length]),
  );
  const unresolvedTotal = Object.values(unresolvedByLedger).reduce((total, count) => total + count, 0);

  const requiredAuditText = [
    'Round 50 completion audit result: **not complete**',
    'manual/external evidence is collected or explicitly waived',
    'strict closeout commands pass',
    `${unresolvedByLedger.launch} launch evidence entries`,
    `${unresolvedByLedger.miniapp} miniapp manual QA checks`,
    `${unresolvedByLedger['admin-web']} admin-web manual QA checks`,
    `${unresolvedTotal} unresolved required items`,
    'current-branch deployment evidence not complete',
    'real WeChat evidence not complete',
    'manual operational evidence not complete',
    'User Goal Termination Criteria Audit',
  ];

  const requiredStateText = [
    'Round 50 audited the original goal termination criteria',
    `${unresolvedTotal} unresolved required items`,
    'approval/evidence gated',
  ];

  for (const criterion of requiredCriteria) {
    requireIncludes(audit, criterion, 'termination criterion');
  }

  for (const text of requiredAuditText) {
    requireIncludes(normalizedAudit, text, 'audit conclusion text');
  }

  for (const text of requiredProgressText) {
    requireIncludes(progress, text, 'progress verification text');
  }

  for (const text of requiredStateText) {
    requireIncludes(projectState, text, 'project-state summary text');
  }

  console.log(
    `[termination-audit] PASS: closeout audit covers ${requiredCriteria.length} termination criteria and current ${unresolvedTotal}-item incomplete-evidence boundary`,
  );
}

main();
