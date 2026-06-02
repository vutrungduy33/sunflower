#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const workflowPath = path.join(rootDir, '.github', 'workflows', 'deploy-backend.yml');

let passCount = 0;

function log(level, message) {
  console.log(`[workflow-lane-matrix] ${level}: ${message}`);
}

function fail(message) {
  console.error(`[workflow-lane-matrix] ERROR: ${message}`);
  process.exit(1);
}

function pass(message) {
  passCount += 1;
  log('PASS', message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(`${message}; expected ${expected}, got ${actual}`);
  }
}

function assertThrows(fn, expectedPattern, message) {
  try {
    fn();
  } catch (error) {
    if (!expectedPattern.test(error.message)) {
      fail(`${message}; unexpected error: ${error.message}`);
    }
    return;
  }

  fail(`${message}; expected an error`);
}

function resolveDispatch({ target = 'auto', lane = 'production', manualImageTag = '' }) {
  const requestedTarget = String(target || 'auto');
  const deploymentLane = String(lane || 'production').toLowerCase().replace(/\s+/g, '');
  const hasManualImageTag = manualImageTag !== '';
  let backendChanged = false;
  let adminWebChanged = false;
  let ingressChanged = false;
  let deployTarget = 'none';

  if (deploymentLane !== 'production' && deploymentLane !== 'nonprod-mock-payment') {
    throw new Error(`Unsupported deployment lane: ${deploymentLane}`);
  }

  if (deploymentLane === 'nonprod-mock-payment') {
    switch (requestedTarget) {
      case 'auto':
      case 'backend':
        backendChanged = true;
        break;
      default:
        throw new Error(`nonprod-mock-payment lane only supports target auto or backend; got ${requestedTarget}`);
    }
  } else {
    switch (requestedTarget) {
      case 'auto':
      case 'all':
      case 'bootstrap':
        backendChanged = true;
        adminWebChanged = true;
        ingressChanged = true;
        break;
      case 'backend':
        backendChanged = true;
        break;
      case 'admin-web':
        adminWebChanged = true;
        break;
      case 'nginx':
        ingressChanged = true;
        break;
      default:
        throw new Error(`Unsupported workflow target: ${requestedTarget}`);
    }
  }

  switch (requestedTarget) {
    case 'auto':
      deployTarget = deploymentLane === 'nonprod-mock-payment' ? 'backend' : 'all';
      break;
    default:
      deployTarget = requestedTarget;
      break;
  }

  return {
    deployTarget,
    deploymentLane,
    backendChanged,
    adminWebChanged,
    ingressChanged,
    shouldBuildBackend: backendChanged && !hasManualImageTag,
    shouldBuildAdminWeb: adminWebChanged && !hasManualImageTag,
    deployBackendHost: deployTarget === 'backend' || deployTarget === 'all' || deployTarget === 'bootstrap',
    deployWebHost: deployTarget === 'admin-web' || deployTarget === 'nginx' || deployTarget === 'all' || deployTarget === 'bootstrap',
  };
}

function resolvePush({ backendChanged = false, adminWebChanged = false, ingressChanged = false }) {
  let deployTarget = 'none';

  if (backendChanged && adminWebChanged) {
    deployTarget = 'all';
  } else if (backendChanged) {
    deployTarget = 'backend';
  } else if (adminWebChanged) {
    deployTarget = 'admin-web';
  } else if (ingressChanged) {
    deployTarget = 'nginx';
  }

  return {
    deployTarget,
    deploymentLane: 'production',
    backendChanged,
    adminWebChanged,
    ingressChanged,
    shouldBuildBackend: backendChanged,
    shouldBuildAdminWeb: adminWebChanged,
    deployBackendHost: deployTarget === 'backend' || deployTarget === 'all',
    deployWebHost: deployTarget === 'admin-web' || deployTarget === 'nginx' || deployTarget === 'all',
  };
}

function assertDispatchCase(input, expected, label) {
  const actual = resolveDispatch(input);
  for (const [key, value] of Object.entries(expected)) {
    assertEqual(actual[key], value, `${label}: ${key}`);
  }
  pass(label);
}

function assertPushCase(input, expected, label) {
  const actual = resolvePush(input);
  for (const [key, value] of Object.entries(expected)) {
    assertEqual(actual[key], value, `${label}: ${key}`);
  }
  pass(label);
}

function checkWorkflowContainsLaneInput() {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  const snippets = [
    'deployment_lane:',
    'default: production',
    '- nonprod-mock-payment',
    'nonprod-mock-payment lane only supports target auto or backend',
    'DEPLOYMENT_LANE: ${{ needs.detect-targets.outputs.deployment_lane }}',
    'package-deploy-bundle:',
    'deploy_bundle_artifact_name',
    'Download backend deployment bundle artifact',
    'Download web deployment bundle artifact',
    'needs.package-deploy-bundle.result == \'success\'',
  ];

  for (const snippet of snippets) {
    if (!workflow.includes(snippet)) {
      fail(`workflow is missing required lane snippet: ${snippet}`);
    }
  }

  for (const stepName of ['Checkout backend deployment bundle source', 'Checkout web deployment bundle source']) {
    if (workflow.includes(stepName)) {
      fail(`self-hosted deploy job must not use actions/checkout step: ${stepName}`);
    }
  }

  pass('workflow contains explicit deployment lane input, runner env wiring, and artifact deployment bundle');
}

function main() {
  checkWorkflowContainsLaneInput();

  assertDispatchCase(
    { target: 'auto', lane: 'production' },
    {
      deployTarget: 'all',
      deploymentLane: 'production',
      backendChanged: true,
      adminWebChanged: true,
      ingressChanged: true,
      shouldBuildBackend: true,
      shouldBuildAdminWeb: true,
      deployBackendHost: true,
      deployWebHost: true,
    },
    'production auto dispatch resolves to all',
  );

  assertDispatchCase(
    { target: 'backend', lane: 'production', manualImageTag: 'old-sha' },
    {
      deployTarget: 'backend',
      shouldBuildBackend: false,
      shouldBuildAdminWeb: false,
      deployBackendHost: true,
      deployWebHost: false,
    },
    'production backend rollback skips builds',
  );

  assertDispatchCase(
    { target: 'nginx', lane: 'production' },
    {
      deployTarget: 'nginx',
      backendChanged: false,
      adminWebChanged: false,
      ingressChanged: true,
      deployBackendHost: false,
      deployWebHost: true,
    },
    'production nginx dispatch runs web host only',
  );

  assertDispatchCase(
    { target: 'auto', lane: 'nonprod-mock-payment' },
    {
      deployTarget: 'backend',
      deploymentLane: 'nonprod-mock-payment',
      backendChanged: true,
      adminWebChanged: false,
      ingressChanged: false,
      shouldBuildBackend: true,
      shouldBuildAdminWeb: false,
      deployBackendHost: true,
      deployWebHost: false,
    },
    'nonprod auto dispatch resolves backend-only',
  );

  assertDispatchCase(
    { target: 'backend', lane: 'nonprod-mock-payment' },
    {
      deployTarget: 'backend',
      deploymentLane: 'nonprod-mock-payment',
      backendChanged: true,
      adminWebChanged: false,
      ingressChanged: false,
      deployBackendHost: true,
      deployWebHost: false,
    },
    'nonprod backend dispatch remains backend-only',
  );

  for (const target of ['admin-web', 'nginx', 'all', 'bootstrap']) {
    assertThrows(
      () => resolveDispatch({ target, lane: 'nonprod-mock-payment' }),
      /only supports target auto or backend/,
      `nonprod ${target} dispatch is rejected`,
    );
    pass(`nonprod ${target} dispatch is rejected`);
  }

  assertPushCase(
    { backendChanged: true, adminWebChanged: true, ingressChanged: true },
    {
      deployTarget: 'all',
      deploymentLane: 'production',
      shouldBuildBackend: true,
      shouldBuildAdminWeb: true,
      deployBackendHost: true,
      deployWebHost: true,
    },
    'push event remains production all deploy when backend and admin change',
  );

  assertPushCase(
    { backendChanged: true, adminWebChanged: false, ingressChanged: false },
    {
      deployTarget: 'backend',
      deploymentLane: 'production',
      shouldBuildBackend: true,
      shouldBuildAdminWeb: false,
      deployBackendHost: true,
      deployWebHost: false,
    },
    'push backend-only event remains production backend deploy',
  );

  pass(`workflow dispatch lane matrix completed with ${passCount} checks`);
}

main();
