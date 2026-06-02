#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packetPath = path.join(rootDir, 'docs', 'MVP-External-Approval-Packet.md');
const launchEvidencePath = path.join(rootDir, 'docs', 'MVP-Launch-Evidence.json');
const miniappQaPath = path.join(rootDir, 'docs', 'Miniapp-Manual-QA.json');
const adminQaPath = path.join(rootDir, 'docs', 'Admin-Web-Manual-QA.json');

const requiredLanes = [
  'MINIAPP-PREVIEW-DOMAIN',
  'WECHAT-PAYMENT-REFUND',
  'ADMIN-PROD-QA',
  'BACKEND-8080-HARDENING',
  'CURRENT-BRANCH-DEPLOYED',
  'EVIDENCE-WAIVER',
];

const requiredSafetyText = [
  'Stop and request explicit user approval',
  'push` to `main`',
  'workflow_dispatch',
  'security-group/firewall',
  'Real payment requires explicit user approval',
  'Real refund requires explicit user approval',
  'Do not record or commit',
  'real AppID values',
  'auth tokens',
  'phone numbers',
  'merchant credentials',
  'raw screenshots with personal data',
  'full order/payment/refund identifiers',
  'Rollback/restoration plan',
];

const requiredCommands = [
  'node scripts/check_miniapp_manual_qa.js --strict',
  'node scripts/check_admin_web_manual_qa.js --strict',
  'node scripts/check_mvp_launch_evidence.js --strict',
  'node scripts/check_mvp_closeout_readiness.js --strict',
  'node scripts/check_mvp_handoff_packet.js',
  'node scripts/check_deployment_approval_preflight.js',
  'node scripts/check_workflow_dispatch_lane_matrix.js',
  'bash scripts/check_nonprod_mock_payment_deploy_lane.sh',
  'scripts/check_production_readonly_audit.sh',
  'RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh',
];

const requiredNonprodDeployText = [
  'deployment_lane=nonprod-mock-payment',
  'target=auto',
  'target=backend',
  '.env.nonprod-mock.example',
  'deploys only ECS-2 backend',
  'does not refresh admin-web or Nginx',
  'not real payment/refund evidence',
];

function fail(message) {
  console.error(`[external-approval] ERROR: ${message}`);
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

function unresolvedRequiredIds(filePath, collectionKey) {
  const data = readJson(filePath);
  const items = data[collectionKey];

  if (!Array.isArray(items)) {
    fail(`${filePath} must contain array '${collectionKey}'`);
  }

  return items
    .filter((item) => item.requiredForMvp && item.status !== 'passed' && item.status !== 'waived')
    .map((item) => item.id);
}

function searchableText(text) {
  return text.replace(/\s+/g, ' ');
}

function requireIncludes(packet, snippet, label) {
  if (!packet.includes(snippet) && !searchableText(packet).includes(snippet)) {
    fail(`approval packet is missing ${label}: ${snippet}`);
  }
}

function main() {
  const packet = readText(packetPath);
  const unresolvedLaunch = unresolvedRequiredIds(launchEvidencePath, 'entries');
  const unresolvedMiniapp = unresolvedRequiredIds(miniappQaPath, 'checks');
  const unresolvedAdmin = unresolvedRequiredIds(adminQaPath, 'checks');
  const expectedUnresolvedCount = unresolvedLaunch.length + unresolvedMiniapp.length + unresolvedAdmin.length;

  for (const lane of requiredLanes) {
    requireIncludes(packet, `<!-- approval-lane:${lane} -->`, 'approval lane marker');
  }

  for (const id of [...unresolvedLaunch, ...unresolvedMiniapp, ...unresolvedAdmin]) {
    requireIncludes(packet, `\`${id}\``, 'unresolved evidence id');
  }

  for (const text of requiredSafetyText) {
    requireIncludes(packet, text, 'safety text');
  }

  for (const command of requiredCommands) {
    requireIncludes(packet, command, 'validation command');
  }

  for (const text of requiredNonprodDeployText) {
    requireIncludes(packet, text, 'nonprod deploy boundary');
  }

  requireIncludes(packet, `Unresolved required items: ${expectedUnresolvedCount}`, 'unresolved count');
  requireIncludes(packet, 'Approval Request Template', 'approval template');
  requireIncludes(packet, 'Sensitive data that must stay out of Git', 'template sensitive-data field');
  requireIncludes(packet, 'Abort conditions', 'template abort field');
  requireIncludes(packet, 'Until then, keep the goal open', 'open-goal reminder');

  console.log(
    `[external-approval] PASS: approval packet covers ${requiredLanes.length} lane(s), ${expectedUnresolvedCount} unresolved item(s), ${requiredSafetyText.length} safety text item(s), ${requiredCommands.length} command(s), and ${requiredNonprodDeployText.length} nonprod deploy boundary item(s)`,
  );
}

main();
