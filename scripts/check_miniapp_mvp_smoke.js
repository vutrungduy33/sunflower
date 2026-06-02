#!/usr/bin/env node

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const miniappDir = path.join(rootDir, 'sunflower-miniapp');

const requiredPages = [
  'pages/mvp/home/index',
  'pages/mvp/login/index',
  'pages/mvp/booking/index',
  'pages/mvp/map/index',
  'pages/mvp/discover/index',
  'pages/mvp/mine/index',
  'pages/mvp/room-detail/index',
  'pages/mvp/order-create/index',
  'pages/mvp/order-list/index',
];

const requiredUtilityFiles = [
  'utils/mvp/api.js',
  'utils/mvp/date.js',
  'utils/mvp/env.js',
  'utils/mvp/normalize.js',
  'utils/mvp/payment.js',
  'utils/mvp/runtime-config.js',
  'utils/mvp/tracker.js',
];

const requiredApiExports = [
  'wechatLogin',
  'ensureWechatLogin',
  'fetchHomeData',
  'fetchRooms',
  'fetchRoomDetail',
  'fetchProfile',
  'patchProfile',
  'postBindPhone',
  'postCreateOrder',
  'postPayOrder',
  'postConfirmPayOrder',
  'fetchOrders',
  'fetchOrderDetail',
  'postCancelOrder',
  'postRescheduleOrder',
  'postRefundOrder',
  'fetchPoiList',
  'fetchTravelNotes',
  'uploadProfileAvatar',
  'postLogout',
];

const requiredPaymentExports = ['payOrderByFlow'];

const requiredNormalizeExports = [
  'normalizeHomeData',
  'normalizeProfile',
  'normalizeRoomList',
  'normalizeRoomDetail',
  'normalizeOrder',
  'normalizeOrders',
];

function fail(message) {
  console.error(`[miniapp-mvp-smoke] ERROR: ${message}`);
  process.exitCode = 1;
}

function warn(message) {
  console.warn(`[miniapp-mvp-smoke] WARN: ${message}`);
}

function pass(message) {
  console.log(`[miniapp-mvp-smoke] PASS: ${message}`);
}

function readJson(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`cannot read JSON ${relativePath}: ${error.message}`);
    return null;
  }
}

function checkNodeSyntax(relativePath) {
  const filePath = path.join(miniappDir, relativePath);
  try {
    childProcess.execFileSync(process.execPath, ['--check', filePath], {
      cwd: rootDir,
      stdio: 'pipe',
    });
  } catch (error) {
    const output = `${error.stdout || ''}${error.stderr || ''}`.trim();
    fail(`syntax check failed for sunflower-miniapp/${relativePath}${output ? `\n${output}` : ''}`);
  }
}

function checkFile(relativePath) {
  const filePath = path.join(miniappDir, relativePath);
  if (!fs.existsSync(filePath)) {
    fail(`missing sunflower-miniapp/${relativePath}`);
  }
}

function checkExports(relativePath, expectedExports) {
  const modulePath = path.join(miniappDir, relativePath);
  let moduleExports = {};
  try {
    moduleExports = require(modulePath);
  } catch (error) {
    fail(`cannot require sunflower-miniapp/${relativePath}: ${error.message}`);
    return;
  }

  expectedExports.forEach((exportName) => {
    if (typeof moduleExports[exportName] !== 'function') {
      fail(`sunflower-miniapp/${relativePath} must export function ${exportName}`);
    }
  });
}

function checkAppPages() {
  const appJson = readJson('sunflower-miniapp/app.json');
  if (!appJson) {
    return;
  }

  if (!Array.isArray(appJson.pages)) {
    fail('sunflower-miniapp/app.json must contain pages array');
    return;
  }

  if (appJson.pages[0] !== 'pages/mvp/home/index') {
    fail('sunflower-miniapp/app.json first page must remain pages/mvp/home/index');
  }

  requiredPages.forEach((page) => {
    if (!appJson.pages.includes(page)) {
      fail(`sunflower-miniapp/app.json is missing MVP page ${page}`);
      return;
    }

    ['js', 'json', 'wxml', 'wxss'].forEach((extension) => {
      checkFile(`${page}.${extension}`);
    });
  });
}

function checkProjectConfig() {
  const projectConfig = readJson('sunflower-miniapp/project.config.json');
  if (!projectConfig) {
    return;
  }

  if (projectConfig.appid !== 'touristappid') {
    fail('sunflower-miniapp/project.config.json appid must stay touristappid in git');
  }
}

function checkRuntimeConfig() {
  const runtimeConfig = require(path.join(miniappDir, 'utils/mvp/runtime-config.js'));
  const apiBase = `${runtimeConfig.DEFAULT_API_BASE_URL || ''}`.trim();
  if (!apiBase) {
    fail('DEFAULT_API_BASE_URL must not be empty');
    return;
  }

  if (!/^https:\/\//.test(apiBase)) {
    warn(`DEFAULT_API_BASE_URL is ${apiBase}; this is acceptable for local/devtools validation only, not production WeChat preview`);
  }
}

function main() {
  checkAppPages();
  checkProjectConfig();
  requiredPages.forEach((page) => checkNodeSyntax(`${page}.js`));
  requiredUtilityFiles.forEach(checkNodeSyntax);
  checkExports('utils/mvp/api.js', requiredApiExports);
  checkExports('utils/mvp/payment.js', requiredPaymentExports);
  checkExports('utils/mvp/normalize.js', requiredNormalizeExports);
  checkRuntimeConfig();

  if (process.exitCode) {
    return;
  }

  pass('MVP pages, utility syntax, exports, project appid, and runtime config checked');
}

main();
