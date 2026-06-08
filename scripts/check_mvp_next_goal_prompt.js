#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const promptPath = path.join(rootDir, 'docs', 'MVP-Next-Goal-Prompt.md');
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

const requiredCurrentFacts = [
  'Current as of 2026-06-08 Round 109',
  'Round 99',
  'scripts/check_mvp_regression.sh',
  'Round 100',
  'scripts/check_production_readonly_audit.sh',
  'Round 96',
  'Round 97',
  'Round 107',
  'sunflower.cloud',
  'GoDaddy',
  'HTML lander',
  'api.sunflower.cloud',
  'api.xiangrikui.cloud',
  'Round 108',
  'Round 109',
  'node scripts/check_admin_web_entry_readiness.js',
  'No unresolved evidence counts changed',
  '32 unresolved required',
  '8 launch evidence entries',
  '12 miniapp manual QA checks',
  '12 admin-web manual QA checks',
  '`BACKEND-8080-HARDENING` passed',
  'Round 91',
  'deployment_lane=nonprod-mock-payment',
  'd10d11e',
  'does not prove real payment/refund or admin-web/Nginx refresh',
  'explicit user approval',
  'node scripts/check_deployment_approval_preflight.js',
];

const requiredCommands = [
  'git status --short --branch --untracked-files=all',
  'scripts/check_mvp_regression.sh',
  'scripts/check_production_readonly_audit.sh',
  'node scripts/check_mvp_launch_evidence.js --strict',
  'node scripts/check_miniapp_manual_qa.js --strict',
  'node scripts/check_admin_web_entry_readiness.js',
  'node scripts/check_admin_web_manual_qa.js --strict',
  'node scripts/check_mvp_closeout_readiness.js --strict',
  'node scripts/check_mvp_handoff_packet.js',
  'node scripts/check_mvp_external_approval_packet.js',
];

const requiredLanes = [
  'MINIAPP-PREVIEW-DOMAIN',
  'ADMIN-PROD-QA',
  'BACKEND-8080-HARDENING',
  'CURRENT-BRANCH-DEPLOYED',
  'WECHAT-PAYMENT-REFUND',
  'EVIDENCE-WAIVER',
];

const requiredSafetyText = [
  'open-source-reference-first',
  '不要自动 workflow_dispatch 或部署',
  '明确批准',
  '真实支付',
  '真实退款',
  '修改生产数据',
  '修改阿里云安全组/防火墙',
  '不提交密钥',
  '真实 AppID',
  'project.private.config.json',
  'touristappid',
  'keep the full objective',
];

const staleText = [
  'Current as of 2026-06-02',
  'Current as of 2026-06-08 Round 104',
  'Current as of 2026-06-08 Round 108',
  'Round 47',
  '33 unresolved',
  '33 项',
  '9 launch',
  '9 pending',
  '0.0.0.0:8080',
  'ahead of origin',
  '8d9b11d',
  'BACKEND-8080-HARDENING` is pending',
  '本地 main ahead',
  '仍缺 33',
  'Round 47 的',
];

function fail(message) {
  console.error(`[next-goal-prompt] ERROR: ${message}`);
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
    fail(`next goal prompt is missing ${label}: ${snippet}`);
  }
}

function requireExcludes(text, snippet) {
  if (text.includes(snippet) || searchableText(text).includes(snippet)) {
    fail(`next goal prompt still contains stale text: ${snippet}`);
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
  const prompt = readText(promptPath);
  const unresolved = ledgers.flatMap(unresolvedRequiredItems);

  requireIncludes(prompt, `${unresolved.length} unresolved required`, 'unresolved count');
  requireIncludes(prompt, `MVP is not complete`, 'non-completion statement');
  requireIncludes(prompt, `不要无休止优化`, 'finite goal boundary');
  requireIncludes(prompt, `每轮只选一个 approval lane`, 'single-lane instruction');

  for (const fact of requiredCurrentFacts) {
    requireIncludes(prompt, fact, 'current fact');
  }

  for (const lane of requiredLanes) {
    requireIncludes(prompt, lane, 'approval lane');
  }

  for (const command of requiredCommands) {
    requireIncludes(prompt, command, 'command');
  }

  for (const safety of requiredSafetyText) {
    requireIncludes(prompt, safety, 'safety text');
  }

  for (const stale of staleText) {
    requireExcludes(prompt, stale);
  }

  console.log(
    `[next-goal-prompt] PASS: next goal prompt covers ${unresolved.length} unresolved required item(s), ${requiredCurrentFacts.length} current fact(s), ${requiredLanes.length} approval lane(s), ${requiredCommands.length} command(s), and ${requiredSafetyText.length} safety boundary item(s)`,
  );
}

main();
