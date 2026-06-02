#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const auditPath = path.join(rootDir, 'docs', 'MVP-Closeout-Audit.md');
const progressPath = path.join(rootDir, 'docs', 'MVP-Progress.md');
const projectStatePath = path.join(rootDir, 'docs', 'Project-State.md');

const requiredCriteria = [
  'Backend tests pass and core API health check is usable.',
  'Admin-web lint/test/build pass and main operations are usable.',
  'Miniapp main user path has explicit verification record and key JS has no syntax errors.',
  'GitHub automatic deployment pipeline is preserved/explainable, and production smoke is recorded.',
  '`docs/Project-State.md`, `docs/MVP-Readiness.md`, and `docs/Decision-Log.md` reflect current facts.',
  'Worktree is clean and final round has committed code.',
];

const requiredAuditText = [
  'Round 50 completion audit result: **not complete**',
  'manual/external evidence is collected or explicitly waived',
  'strict closeout commands pass',
  '9 launch evidence entries',
  '12 miniapp manual QA checks',
  '12 admin-web manual QA checks',
  '33 unresolved required items',
  'current-branch deployment evidence not complete',
  'real WeChat evidence not complete',
  'manual operational evidence not complete',
  'User Goal Termination Criteria Audit',
];

const requiredProgressText = [
  'Round 50: Goal Termination Criteria Audit',
  'Status: completed',
  'node scripts/check_mvp_launch_evidence.js --strict',
  'node scripts/check_miniapp_manual_qa.js --strict',
  'node scripts/check_admin_web_manual_qa.js --strict',
  'node scripts/check_mvp_closeout_readiness.js --strict',
];

const requiredStateText = [
  'Round 50 audited the original goal termination criteria',
  '33 unresolved',
  'approval/evidence gated',
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

function normalize(text) {
  return text.replace(/\s+/g, ' ');
}

function requireIncludes(text, expected, label) {
  if (!text.includes(expected)) {
    fail(`missing ${label}: ${expected}`);
  }
}

function main() {
  const audit = readText(auditPath);
  const normalizedAudit = normalize(audit);
  const progress = readText(progressPath);
  const projectState = readText(projectStatePath);

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
    `[termination-audit] PASS: closeout audit covers ${requiredCriteria.length} termination criteria and current incomplete-evidence boundary`,
  );
}

main();
