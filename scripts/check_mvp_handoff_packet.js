#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packetPath = path.join(rootDir, 'docs', 'MVP-Handoff-Packet.md');
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

const requiredCommands = [
  'scripts/check_mvp_regression.sh',
  'node scripts/check_mvp_closeout_readiness.js',
  'node scripts/check_mvp_closeout_readiness.js --strict',
  'node scripts/check_mvp_launch_evidence.js --strict',
  'node scripts/check_miniapp_manual_qa.js --strict',
  'node scripts/check_admin_web_manual_qa.js --strict',
  'node scripts/generate_mvp_external_evidence_template.js',
  'node scripts/check_mvp_external_evidence_template.js',
  'node scripts/check_mvp_external_approval_packet.js',
  'node scripts/check_mvp_next_approval_request.js',
  'node scripts/check_deployment_approval_preflight.js',
  'scripts/check_production_readonly_audit.sh',
];

const requiredSafetyText = [
  'Do not push',
  'workflow_dispatch',
  'real payment',
  'real refund',
  'security-group/firewall',
  'project.private.config.json',
  'touristappid',
  'Do not commit',
];

function fail(message) {
  console.error(`[mvp-handoff] ERROR: ${message}`);
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

function searchableText(text) {
  return text.replace(/\n\s*>\s*/g, ' ').replace(/\s+/g, ' ');
}

function unresolvedRequiredItems(ledger) {
  const data = readJson(ledger.path);
  const items = data[ledger.collectionKey];

  if (!Array.isArray(items)) {
    fail(`${ledger.name} ledger must contain array '${ledger.collectionKey}'`);
  }

  return items
    .filter((item) => item.requiredForMvp && !completionStatuses.has(item.status))
    .map((item) => ({ ledger: ledger.name, id: item.id }));
}

function requireIncludes(packet, expected, label) {
  if (!packet.includes(expected)) {
    fail(`handoff packet is missing ${label}: ${expected}`);
  }
}

function requireMatches(packet, pattern, label) {
  if (!pattern.test(packet)) {
    fail(`handoff packet is missing ${label}: ${pattern}`);
  }
}

function main() {
  const packet = searchableText(readText(packetPath));
  const unresolved = ledgers.flatMap(unresolvedRequiredItems);

  for (const item of unresolved) {
    requireIncludes(packet, item.id, `${item.ledger} unresolved id`);
  }

  for (const command of requiredCommands) {
    requireIncludes(packet, command, 'command');
  }

  for (const text of requiredSafetyText) {
    requireIncludes(packet, text, 'safety boundary');
  }

  requireMatches(packet, new RegExp(`${unresolved.length}\\s+unresolved\\s+required\\s+items`), 'unresolved count');
  requireIncludes(packet, 'The MVP goal is still open', 'open-goal statement');
  requireMatches(packet, /not\s+proof\s+that\s+the\s+MVP\s+is\s+complete/, 'non-completion statement');

  console.log(
    `[mvp-handoff] PASS: handoff packet covers ${unresolved.length} unresolved required item(s), ${requiredCommands.length} commands, and ${requiredSafetyText.length} safety boundaries`,
  );
}

main();
