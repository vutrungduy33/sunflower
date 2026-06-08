#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const miniappDir = path.join(rootDir, 'sunflower-miniapp');
const projectConfigPath = path.join(miniappDir, 'project.config.json');
const privateConfigPath = path.join(miniappDir, 'project.private.config.json');
const privateConfigExamplePath = path.join(miniappDir, 'project.private.config.example.json');
const runtimeConfigPath = path.join(miniappDir, 'utils', 'mvp', 'runtime-config.js');
const apiUtilPath = path.join(miniappDir, 'utils', 'mvp', 'api.js');
const manualQaPath = path.join(rootDir, 'docs', 'Miniapp-Manual-QA.json');
const expectedAppId = 'touristappid';
const requiredManualQaIds = [
  'MINIAPP-DOMAIN-HTTPS',
  'MINIAPP-APPID-PREVIEW',
  'MINIAPP-WX-LOGIN',
  'MINIAPP-PHONE-BIND',
  'MINIAPP-HOME-CONTENT',
  'MINIAPP-ROOM-BROWSE',
  'MINIAPP-ORDER-CREATE',
  'MINIAPP-MOCK-PAYMENT',
  'MINIAPP-REAL-PAYMENT',
  'MINIAPP-ORDER-LIST-ACTIONS',
  'MINIAPP-REFUND',
  'MINIAPP-ERROR-STATES',
];

let passCount = 0;

function fail(message) {
  console.error(`[miniapp-external-preflight] ERROR: ${message}`);
  process.exitCode = 1;
}

function warn(message) {
  console.warn(`[miniapp-external-preflight] WARN: ${message}`);
}

function pass(message) {
  passCount += 1;
  console.log(`[miniapp-external-preflight] PASS: ${message}`);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`cannot read JSON ${path.relative(rootDir, filePath)}: ${error.message}`);
    return null;
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

function git(args, options = {}) {
  try {
    return childProcess.execFileSync('git', args, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });
  } catch (error) {
    const output = `${error.stdout || ''}${error.stderr || ''}`.trim();
    throw new Error(output || error.message);
  }
}

function isTracked(relativePath) {
  const output = git(['ls-files', '--', relativePath]);
  return output.trim() !== '';
}

function checkIgnored(relativePath) {
  try {
    git(['check-ignore', '-q', relativePath]);
    return true;
  } catch (error) {
    return false;
  }
}

function checkCommittedProjectConfig() {
  const projectConfig = readJson(projectConfigPath);
  if (!projectConfig) {
    return;
  }

  if (projectConfig.appid !== expectedAppId) {
    fail('sunflower-miniapp/project.config.json must keep placeholder appid in Git');
    return;
  }

  pass('committed project.config.json keeps placeholder appid');
}

function checkPrivateConfigBoundary() {
  const relativePrivateConfig = 'sunflower-miniapp/project.private.config.json';
  const privateExists = fs.existsSync(privateConfigPath);

  if (isTracked(relativePrivateConfig)) {
    fail('sunflower-miniapp/project.private.config.json must not be tracked; use the ignored local file for real AppID overrides');
  } else {
    pass('project.private.config.json is not tracked by Git');
  }

  if (!checkIgnored(relativePrivateConfig)) {
    fail('sunflower-miniapp/project.private.config.json must be ignored by .gitignore');
  } else {
    pass('project.private.config.json is ignored by Git');
  }

  if (privateExists) {
    const privateConfig = readJson(privateConfigPath);
    if (privateConfig && privateConfig.appid && privateConfig.appid === expectedAppId) {
      warn('local project.private.config.json appid is still touristappid; real preview/login QA needs a local real AppID');
    }
    if (privateConfig && privateConfig.appid && privateConfig.appid !== expectedAppId) {
      pass('local private config contains a non-placeholder appid without exposing it');
    }
  } else {
    warn('local project.private.config.json is absent; create it from project.private.config.example.json before real preview QA');
  }
}

function checkPrivateConfigExample() {
  const example = readJson(privateConfigExamplePath);
  if (!example) {
    return;
  }

  if (example.appid !== '<your-local-wechat-appid>') {
    fail('project.private.config.example.json must keep a placeholder appid');
  }

  if (!example.setting || example.setting.urlCheck !== true) {
    fail('project.private.config.example.json should enable urlCheck for legal-domain preview QA');
  }

  pass('private config example is safe and points operators to local AppID override');
}

function checkRuntimeOverrideSupport() {
  const runtimeContent = readText(runtimeConfigPath);
  const apiContent = readText(apiUtilPath);

  if (!runtimeContent.includes('DEFAULT_API_BASE_URL')) {
    fail('runtime-config.js must expose DEFAULT_API_BASE_URL');
  }

  if (!apiContent.includes('SUNFLOWER_API_BASE_URL')) {
    fail('utils/mvp/api.js must support SUNFLOWER_API_BASE_URL storage override');
  }

  if (!apiContent.includes('wx.getStorageSync')) {
    fail('utils/mvp/api.js must read the API base override from WeChat storage');
  }

  pass('miniapp API base override support is present');
}

function checkManualQaLedger() {
  const data = readJson(manualQaPath);
  if (!data || !Array.isArray(data.checks)) {
    return;
  }

  const ids = new Set(data.checks.map((check) => check.id));
  const missing = requiredManualQaIds.filter((id) => !ids.has(id));
  if (missing.length > 0) {
    fail(`Miniapp-Manual-QA.json is missing required external QA ids: ${missing.join(', ')}`);
    return;
  }

  const domain = data.checks.find((check) => check.id === 'MINIAPP-DOMAIN-HTTPS');
  const appid = data.checks.find((check) => check.id === 'MINIAPP-APPID-PREVIEW');
  if (!domain.nextAction.includes('HTTPS')) {
    fail('MINIAPP-DOMAIN-HTTPS nextAction must mention HTTPS domain evidence');
  }
  if (!domain.nextAction.includes('scripts/check_miniapp_https_domain.js')) {
    fail('MINIAPP-DOMAIN-HTTPS nextAction must point operators to scripts/check_miniapp_https_domain.js');
  }
  if (!appid.nextAction.toLowerCase().includes('appid')) {
    fail('MINIAPP-APPID-PREVIEW nextAction must mention AppID handling');
  }

  pass('manual QA ledger includes required miniapp external evidence ids');
}

function main() {
  checkCommittedProjectConfig();
  checkPrivateConfigBoundary();
  checkPrivateConfigExample();
  checkRuntimeOverrideSupport();
  checkManualQaLedger();

  if (process.exitCode) {
    return;
  }

  pass(`miniapp external QA preflight completed with ${passCount} checks`);
}

main();
