#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const workflowPath = path.join(rootDir, '.github', 'workflows', 'deploy-backend.yml');
const approvalPath = path.join(rootDir, 'docs', 'MVP-Next-Approval-Request.md');
const handoffPath = path.join(rootDir, 'docs', 'MVP-Handoff-Packet.md');
const projectStatePath = path.join(rootDir, 'docs', 'Project-State.md');
const launchEvidencePath = path.join(rootDir, 'docs', 'MVP-Launch-Evidence.json');
const nonprodEnvPath = path.join(rootDir, '.env.nonprod-mock.example');

let passCount = 0;

function log(level, message) {
  console.log(`[nonprod-dispatch-readiness] ${level}: ${message}`);
}

function fail(message) {
  console.error(`[nonprod-dispatch-readiness] ERROR: ${message}`);
  process.exit(1);
}

function pass(message) {
  passCount += 1;
  log('PASS', message);
}

function info(message) {
  log('INFO', message);
}

function run(command, args, options = {}) {
  try {
    return childProcess.execFileSync(command, args, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    }).trim();
  } catch (error) {
    const output = `${error.stdout || ''}${error.stderr || ''}`.trim();
    throw new Error(output || error.message);
  }
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    fail(`cannot read ${path.relative(rootDir, filePath)}: ${error.message}`);
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`cannot parse ${path.relative(rootDir, filePath)}: ${error.message}`);
  }
}

function requireIncludes(text, snippet, label) {
  const normalizedText = text.replace(/\s+/g, ' ');
  const normalizedSnippet = snippet.replace(/\s+/g, ' ');
  if (!text.includes(snippet) && !normalizedText.includes(normalizedSnippet)) {
    fail(`${label} is missing required text: ${snippet}`);
  }
}

function checkGitState() {
  const branch = run('git', ['branch', '--show-current']) || '<detached>';
  const head = run('git', ['rev-parse', '--short=12', 'HEAD']);
  const status = run('git', ['status', '--short', '--untracked-files=all']);
  const aheadBehind = run('git', ['rev-list', '--left-right', '--count', 'origin/main...HEAD']);
  const allowDirty = process.env.ALLOW_DIRTY === '1';

  info(`branch=${branch} head=${head} origin/main...HEAD=${aheadBehind}`);

  if (branch !== 'main') {
    fail(`expected local main before deployment approval discussion, got ${branch}`);
  }
  if (status !== '' && !allowDirty) {
    fail('worktree must be clean before requesting nonprod dispatch approval');
  }
  if (status !== '' && allowDirty) {
    info('worktree is dirty; continuing because ALLOW_DIRTY=1 for static config validation');
  }

  pass(allowDirty ? 'current branch is ready for static approval review' : 'current branch and worktree are ready for approval review');
}

function checkWorkflowBoundary() {
  const workflow = readText(workflowPath);
  const required = [
    'deployment_lane:',
    'default: production',
    '- nonprod-mock-payment',
    'nonprod-mock-payment lane only supports target auto or backend',
    'DEPLOYMENT_LANE: ${{ needs.detect-targets.outputs.deployment_lane }}',
  ];

  for (const snippet of required) {
    requireIncludes(workflow, snippet, 'workflow');
  }

  pass('workflow exposes explicit backend-only nonprod dispatch boundary');
}

function checkDocsBoundary() {
  const approval = readText(approvalPath);
  const handoff = readText(handoffPath);
  const state = readText(projectStatePath);
  const required = [
    'deployment_lane=nonprod-mock-payment',
    'target=auto',
    'target=backend',
    'backend-only',
    'not real payment/refund evidence',
  ];

  for (const snippet of required) {
    requireIncludes(approval, snippet, 'next approval request');
    requireIncludes(handoff, snippet, 'handoff packet');
  }

  requireIncludes(state, 'recommended deploy-validation path', 'project state');
  requireIncludes(state, 'Plain `push main` uses the production lane', 'project state');
  pass('approval and handoff docs describe reduced-scope nonprod dispatch');
}

function checkLaunchEvidenceBoundary() {
  const data = readJson(launchEvidencePath);
  const entry = Array.isArray(data.entries)
    ? data.entries.find((item) => item.id === 'CURRENT-BRANCH-DEPLOYED')
    : null;

  if (!entry) {
    fail('CURRENT-BRANCH-DEPLOYED evidence entry is missing');
  }
  if (entry.status !== 'pending') {
    fail(`CURRENT-BRANCH-DEPLOYED must remain pending before dispatch evidence, got ${entry.status}`);
  }
  if (!/non-production\/mock-payment|risk acceptance|workflow_dispatch/i.test(`${entry.nextAction || ''}`)) {
    fail('CURRENT-BRANCH-DEPLOYED nextAction must describe dispatch approval and lane decision');
  }

  pass('current-branch deployment evidence remains pending with approval boundary');
}

function checkNonprodEnvShape() {
  const env = readText(nonprodEnvPath);
  const required = [
    'SUNFLOWER_DEPLOY_LANE=nonprod-mock-payment',
    'DEPLOY_NODE_ROLE=backend',
    'WECHAT_AUTH_MOCK_ENABLED=false',
    'WECHAT_MANUAL_PHONE_BIND_ENABLED=false',
    'WECHAT_PAY_MOCK_ENABLED=true',
    'WECHAT_PAY_API_V3_KEY=00000000000000000000000000000000',
  ];

  for (const snippet of required) {
    requireIncludes(env, snippet, '.env.nonprod-mock.example');
  }

  const forbiddenPatterns = [
    /^MYSQL_/m,
    /^AUTH_TOKEN_SECRET=/m,
    /^ADMIN_AUTH_TOKEN_SECRET=/m,
    /^WECHAT_APP_ID=/m,
    /^WECHAT_APP_SECRET=/m,
    /^ADMIN_SMS_/m,
    /^TENCENT_SMS_/m,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(env)) {
      fail(`.env.nonprod-mock.example must stay overlay-only and not define ${pattern}`);
    }
  }

  pass('nonprod mock env overlay preserves base DB/auth credentials and enables mock payment');
}

function runExistingGuards() {
  if (process.env.ALLOW_DIRTY === '1') {
    info('skipping clean-worktree deployment approval preflight because ALLOW_DIRTY=1');
  } else {
    run('node', ['scripts/check_deployment_approval_preflight.js'], { stdio: ['ignore', 'pipe', 'pipe'] });
  }
  run('node', ['scripts/check_workflow_dispatch_lane_matrix.js'], { stdio: ['ignore', 'pipe', 'pipe'] });
  run('bash', ['scripts/check_nonprod_mock_payment_deploy_lane.sh'], { stdio: ['ignore', 'pipe', 'pipe'] });
  pass('workflow lane matrix and nonprod env guards pass');
}

function main() {
  checkGitState();
  checkWorkflowBoundary();
  checkDocsBoundary();
  checkLaunchEvidenceBoundary();
  checkNonprodEnvShape();
  runExistingGuards();
  info(`nonprod dispatch readiness completed with ${passCount} checks`);
}

main();
