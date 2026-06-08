#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const planPath = path.join(root, 'docs', 'Codeup-Yunxiao-Migration-Plan.md');

function fail(message) {
  console.error(`[codeup-yunxiao-plan] ERROR: ${message}`);
  process.exit(1);
}

function assertIncludes(text, needle, label = needle) {
  if (!text.includes(needle)) {
    fail(`Missing required plan content: ${label}`);
  }
}

if (!fs.existsSync(planPath)) {
  fail(`Migration plan is missing: ${planPath}`);
}

const plan = fs.readFileSync(planPath, 'utf8');

[
  'Codeup + Yunxiao Flow + Alibaba Cloud ECS',
  'ECS-local release',
  'sunflower-backend-prod',
  'sunflower-web-prod',
  'nonprod-mock-payment',
  'scripts/execute_runner_deploy.sh',
  'scripts/package_deploy_bundle.sh',
  'BACKEND_DEPLOY_PATH',
  'WEB_DEPLOY_PATH',
  'Do not put these in Yunxiao',
  'Production payment configuration is still incomplete',
  'Open-Source Reference Check',
].forEach((needle) => assertIncludes(plan, needle));

[
  '.env.prod contents',
  'database passwords',
  'WeChat Pay merchant secrets or certificates',
  'Tencent SMS credentials',
  'private SSH keys committed to the repository',
].forEach((needle) => assertIncludes(plan, needle, `secret boundary: ${needle}`));

const selectedRoutePattern =
  /Selected control plane: Alibaba Cloud Codeup[\s\S]*Selected artifact model: ECS-local artifacts/;
if (!selectedRoutePattern.test(plan)) {
  fail('Selected route summary must keep Codeup/Yunxiao and ECS-local artifact decisions together');
}

console.log('[codeup-yunxiao-plan] OK');
