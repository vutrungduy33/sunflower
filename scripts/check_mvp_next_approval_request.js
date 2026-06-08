#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const requestPath = path.join(rootDir, 'docs', 'MVP-Next-Approval-Request.md');

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

const completionStatuses = new Set(['passed', 'waived']);

const requiredLanes = [
  'MINIAPP-PREVIEW-DOMAIN',
  'WECHAT-PAYMENT-REFUND',
  'ADMIN-PROD-QA',
  'BACKEND-8080-HARDENING',
  'CURRENT-BRANCH-DEPLOYED',
  'EVIDENCE-WAIVER',
];

const requiredSafetyText = [
  'no `push main`',
  'no merge',
  'no `workflow_dispatch`',
  'no production deploy',
  'no security-group/firewall mutation',
  'no real payment',
  'no real refund',
  'no live production data mutation',
  'Do not record or commit',
  'real AppID values',
  'auth tokens or cookies',
  'phone numbers',
  'merchant credentials',
  'private keys',
  'full order/payment/refund identifiers',
];

const requiredCommands = [
  'node scripts/check_mvp_external_approval_packet.js',
  'node scripts/check_mvp_next_approval_request.js',
  'node scripts/check_mvp_closeout_readiness.js',
  'node scripts/check_deployment_approval_preflight.js',
  'node scripts/check_workflow_dispatch_lane_matrix.js',
  'bash scripts/check_nonprod_mock_payment_deploy_lane.sh',
  'node scripts/check_nonprod_dispatch_readiness.js',
  'scripts/dispatch_nonprod_mock_payment_deploy.sh --dry-run',
  'scripts/check_production_readonly_audit.sh',
  'node scripts/check_mvp_launch_evidence.js --strict',
  'node scripts/check_miniapp_manual_qa.js --strict',
  'node scripts/check_admin_web_manual_qa.js --strict',
  'node scripts/check_mvp_closeout_readiness.js --strict',
  'node scripts/check_mvp_handoff_packet.js',
];

const requiredNonprodDeployText = [
  'deployment_lane=nonprod-mock-payment',
  'target=auto',
  'target=backend',
  '.env.nonprod-mock.example',
  'does not refresh admin-web/Nginx',
  'does not prove real payment/refund',
  'reduced-scope evidence',
];

const requiredCurrentText = [
  'Current as of 2026-06-08 Round 113',
  'Round 111',
  'Round 112',
  'HEAD checked: `c78fb9b5a645`',
  'Changed files since base: 0',
  'Predicted push-to-main deploy target: `none`',
  'no branch delta',
];

const staleText = [
  'Current as of 2026-06-08 Round 100',
  'Round 100 goal',
  'HEAD checked: `5a836f4704b7`',
  'Changed files since base: 39',
  'Predicted push-to-main deploy target: `all`',
  'Impact counts: backend 4 files, admin-web 3 files, ingress 3 files',
  'predates the current Round 100',
];

function fail(message) {
  console.error(`[next-approval] ERROR: ${message}`);
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

function searchableText(text) {
  return text.replace(/\s+/g, ' ');
}

function requireIncludes(text, snippet, label) {
  if (!text.includes(snippet) && !searchableText(text).includes(snippet)) {
    fail(`next approval request is missing ${label}: ${snippet}`);
  }
}

function requireExcludes(text, snippet) {
  if (text.includes(snippet) || searchableText(text).includes(snippet)) {
    fail(`next approval request still contains stale text: ${snippet}`);
  }
}

function unresolvedRequiredItems(ledger) {
  const data = readJson(ledger.path);
  const items = data[ledger.collectionKey];

  if (!Array.isArray(items)) {
    fail(`${ledger.path} must contain array '${ledger.collectionKey}'`);
  }

  return items
    .filter((item) => item.requiredForMvp && !completionStatuses.has(item.status))
    .map((item) => ({ ledger: ledger.name, id: item.id }));
}

function main() {
  const request = readText(requestPath);
  const unresolved = ledgers.flatMap(unresolvedRequiredItems);

  requireIncludes(request, 'not proof that the MVP is complete', 'non-completion statement');
  requireIncludes(request, `Unresolved required items: ${unresolved.length}`, 'unresolved count');
  requireIncludes(request, 'Approval Reply Template', 'approval reply template');
  requireIncludes(request, 'Current Deployment Preflight Snapshot', 'deployment preflight snapshot');
  requireIncludes(request, 'Rerun `node scripts/check_deployment_approval_preflight.js` after any new commit', 'rerun reminder');
  requireIncludes(request, 'keep the MVP goal open', 'open-goal reminder');

  for (const lane of requiredLanes) {
    requireIncludes(request, `\`${lane}\``, 'approval lane');
  }

  for (const item of unresolved) {
    requireIncludes(request, `\`${item.id}\``, `${item.ledger} unresolved id`);
  }

  for (const text of requiredSafetyText) {
    requireIncludes(request, text, 'safety text');
  }

  for (const command of requiredCommands) {
    requireIncludes(request, command, 'validation command');
  }

  for (const text of requiredNonprodDeployText) {
    requireIncludes(request, text, 'nonprod deploy boundary');
  }

  for (const text of requiredCurrentText) {
    requireIncludes(request, text, 'current text');
  }

  for (const text of staleText) {
    requireExcludes(request, text);
  }

  console.log(
    `[next-approval] PASS: next approval request covers ${requiredLanes.length} lane(s), ${unresolved.length} unresolved item(s), ${requiredSafetyText.length} safety text item(s), ${requiredCommands.length} command(s), ${requiredNonprodDeployText.length} nonprod deploy boundary item(s), and ${requiredCurrentText.length} current text item(s)`,
  );
}

main();
