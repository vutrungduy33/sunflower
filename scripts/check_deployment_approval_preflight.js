#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const workflowPath = path.join(rootDir, '.github', 'workflows', 'deploy-backend.yml');
const launchEvidencePath = path.join(rootDir, 'docs', 'MVP-Launch-Evidence.json');
const expectedDispatchTargets = ['auto', 'backend', 'admin-web', 'nginx', 'all', 'bootstrap'];
const expectedDeploymentLanes = ['production', 'nonprod-mock-payment'];
const backendPatterns = [
  /^sunflower-backend\//,
  /^docker-compose\.backend\.yml$/,
  /^\.env\.prod\.example$/,
  /^\.env\.empty$/,
  /^\.env\.runtime-overlay\.empty$/,
  /^\.env\.nonprod-mock\.example$/,
  /^scripts\/deploy_backend\.sh$/,
  /^scripts\/deploy_lib\.sh$/,
  /^scripts\/validate_prod_env\.sh$/,
  /^scripts\/check_nonprod_mock_payment_deploy_lane\.sh$/,
  /^scripts\/start_backend_with_mvp_seed\.sh$/,
  /^scripts\/sync_deploy_bundle\.sh$/,
  /^scripts\/execute_runner_deploy\.sh$/,
  /^scripts\/sql\//,
  /^\.github\/workflows\/deploy-backend\.yml$/,
];
const adminWebPatterns = [
  /^sunflower-admin-web\//,
  /^docker-compose\.web\.yml$/,
  /^\.env\.prod\.web\.example$/,
  /^\.env\.empty$/,
  /^\.env\.runtime-overlay\.empty$/,
  /^scripts\/deploy_admin_web\.sh$/,
  /^scripts\/deploy_lib\.sh$/,
  /^scripts\/start_admin_web\.sh$/,
  /^scripts\/sync_deploy_bundle\.sh$/,
  /^scripts\/execute_runner_deploy\.sh$/,
  /^\.github\/workflows\/deploy-backend\.yml$/,
];
const ingressPatterns = [
  /^deploy\/nginx\//,
  /^docker-compose\.web\.yml$/,
  /^\.env\.prod\.web\.example$/,
  /^\.env\.empty$/,
  /^\.env\.runtime-overlay\.empty$/,
  /^scripts\/deploy_prod\.sh$/,
  /^scripts\/bootstrap_prod\.sh$/,
  /^scripts\/deploy_lib\.sh$/,
  /^scripts\/reload_host_nginx\.sh$/,
  /^scripts\/validate_prod_env\.sh$/,
  /^scripts\/sync_deploy_bundle\.sh$/,
  /^scripts\/execute_runner_deploy\.sh$/,
  /^\.github\/workflows\/deploy-backend\.yml$/,
];

let passCount = 0;

function log(level, message) {
  console.log(`[deploy-approval-preflight] ${level}: ${message}`);
}

function fail(message) {
  console.error(`[deploy-approval-preflight] ERROR: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  passCount += 1;
  log('PASS', message);
}

function info(message) {
  log('INFO', message);
}

function warn(message) {
  log('WARN', message);
}

function git(args, options = {}) {
  try {
    return childProcess.execFileSync('git', args, {
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

function gitOrEmpty(args) {
  try {
    return git(args);
  } catch (error) {
    return '';
  }
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    fail(`cannot read ${path.relative(rootDir, filePath)}: ${error.message}`);
    return '';
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`cannot read JSON ${path.relative(rootDir, filePath)}: ${error.message}`);
    return null;
  }
}

function splitLines(output) {
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => pattern.test(filePath));
}

function classifyChangedFiles(files) {
  const backend = files.filter((file) => matchesAny(file, backendPatterns));
  const adminWeb = files.filter((file) => matchesAny(file, adminWebPatterns));
  const ingress = files.filter((file) => matchesAny(file, ingressPatterns));
  let predictedTarget = 'none';

  if (backend.length > 0 && adminWeb.length > 0) {
    predictedTarget = 'all';
  } else if (backend.length > 0) {
    predictedTarget = 'backend';
  } else if (adminWeb.length > 0) {
    predictedTarget = 'admin-web';
  } else if (ingress.length > 0) {
    predictedTarget = 'nginx';
  }

  return {
    backend,
    adminWeb,
    ingress,
    predictedTarget,
  };
}

function checkWorkflowShape() {
  const workflow = readText(workflowPath);
  const requiredSnippets = [
    'workflow_dispatch:',
    'push:',
    'branches:',
    '- main',
    'paths:',
    'deployment_lane:',
    'DEPLOYMENT_LANE:',
    'deploy-backend-host:',
    'deploy-web-host:',
    'self-hosted',
    'ecs-backend',
    'ecs-web',
    'package-deploy-bundle:',
    'deploy_bundle_artifact_name',
    'Download backend deployment bundle artifact',
    'Download web deployment bundle artifact',
  ];

  for (const snippet of requiredSnippets) {
    if (!workflow.includes(snippet)) {
      fail(`deployment workflow is missing required snippet: ${snippet}`);
    }
  }

  for (const target of expectedDispatchTargets) {
    if (!workflow.includes(`- ${target}`)) {
      fail(`workflow_dispatch target options must include ${target}`);
    }
  }

  for (const lane of expectedDeploymentLanes) {
    if (!workflow.includes(`- ${lane}`)) {
      fail(`workflow_dispatch deployment_lane options must include ${lane}`);
    }
  }

  if (!workflow.includes('deployment_lane="production"')) {
    fail('deployment workflow must default push/non-dispatch runs to production lane');
  }
  if (!workflow.includes('nonprod-mock-payment lane only supports target auto or backend')) {
    fail('deployment workflow must reject nonprod-mock-payment targets that do not map to backend-only deploys');
  }
  for (const stepName of ['Checkout backend deployment bundle source', 'Checkout web deployment bundle source']) {
    if (workflow.includes(stepName)) {
      fail(`self-hosted deploy job must not use actions/checkout step: ${stepName}`);
    }
  }

  pass('deployment workflow exposes push main, workflow_dispatch targets, and explicit deployment lanes');
}

function checkLaunchEvidenceBoundary() {
  const data = readJson(launchEvidencePath);
  if (!data || !Array.isArray(data.entries)) {
    return;
  }

  const entry = data.entries.find((item) => item.id === 'CURRENT-BRANCH-DEPLOYED');
  if (!entry) {
    fail('MVP launch evidence must include CURRENT-BRANCH-DEPLOYED');
    return;
  }

  if (entry.status !== 'pending' && entry.status !== 'waived' && entry.status !== 'passed') {
    fail(`CURRENT-BRANCH-DEPLOYED has invalid status ${entry.status}`);
  }
  if (!/approval|push|merge|workflow_dispatch/i.test(`${entry.nextAction || ''}`)) {
    fail('CURRENT-BRANCH-DEPLOYED nextAction must mention approval before push/merge/workflow_dispatch');
  }

  pass('launch evidence records current-branch deployment approval boundary');
}

function resolveBaseRef() {
  const candidates = ['origin/main', 'main'];
  for (const candidate of candidates) {
    const mergeBase = gitOrEmpty(['merge-base', 'HEAD', candidate]);
    if (mergeBase) {
      return {
        baseRef: candidate,
        mergeBase,
      };
    }
  }

  fail('could not resolve merge-base against origin/main or main');
  return {
    baseRef: '',
    mergeBase: '',
  };
}

function checkGitState() {
  const branch = gitOrEmpty(['branch', '--show-current']) || '<detached>';
  const head = gitOrEmpty(['rev-parse', '--short=12', 'HEAD']);
  const status = gitOrEmpty(['status', '--short', '--untracked-files=all']);
  const dirty = status.trim() !== '';
  const { baseRef, mergeBase } = resolveBaseRef();
  const changedOutput = mergeBase ? gitOrEmpty(['diff', '--name-only', `${mergeBase}..HEAD`]) : '';
  const changedFiles = splitLines(changedOutput);
  const classification = classifyChangedFiles(changedFiles);

  info(`current branch: ${branch}`);
  info(`HEAD: ${head}`);
  info(`comparison base: ${baseRef || '<unresolved>'}${mergeBase ? ` (${mergeBase.slice(0, 12)})` : ''}`);
  info(`changed files since base: ${changedFiles.length}`);
  info(`predicted push-to-main deploy target from path rules: ${classification.predictedTarget}`);

  if (dirty) {
    fail('worktree must be clean before deployment approval');
  } else {
    pass('worktree is clean for deployment approval review');
  }

  if (branch === 'main') {
    warn('current branch is main; pushing deployment-relevant changes can trigger production deployment');
  } else {
    pass('current branch is not main; local work will not trigger push-to-main deployment without merge/push approval');
  }

  if (changedFiles.length === 0) {
    warn('no branch delta detected against base; deployment may be unnecessary unless workflow_dispatch uses an explicit target');
  }

  if (classification.backend.length > 0) {
    info(`backend-impact files: ${classification.backend.length}`);
  }
  if (classification.adminWeb.length > 0) {
    info(`admin-web-impact files: ${classification.adminWeb.length}`);
  }
  if (classification.ingress.length > 0) {
    info(`ingress-impact files: ${classification.ingress.length}`);
  }

  pass('deployment impact classified from workflow path rules');
}

function main() {
  checkWorkflowShape();
  checkLaunchEvidenceBoundary();
  checkGitState();

  if (process.exitCode) {
    return;
  }

  pass(`deployment approval preflight completed with ${passCount} checks`);
}

main();
