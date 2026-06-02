#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const miniappDir = process.env.SUNFLOWER_MINIAPP_DIR
  ? path.resolve(process.env.SUNFLOWER_MINIAPP_DIR)
  : path.join(rootDir, 'sunflower-miniapp');

const checks = [];

function addCheck(relativePath, description, pattern) {
  checks.push({
    relativePath,
    description,
    pattern,
  });
}

function readMiniappFile(relativePath) {
  const filePath = path.join(miniappDir, relativePath);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`cannot read ${formatPath(relativePath)}: ${error.message}`);
  }
}

function formatPath(relativePath) {
  if (miniappDir === path.join(rootDir, 'sunflower-miniapp')) {
    return `sunflower-miniapp/${relativePath}`;
  }
  return path.join(miniappDir, relativePath);
}

function matches(content, pattern) {
  if (pattern instanceof RegExp) {
    return pattern.test(content);
  }
  return content.includes(pattern);
}

function fail(message) {
  console.error(`[miniapp-behavior-wiring] ERROR: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`[miniapp-behavior-wiring] PASS: ${message}`);
}

addCheck('utils/mvp/api.js', 'WeChat login uses wx.login', /wx\.login\s*\(/);
addCheck('utils/mvp/api.js', 'requests are sent through wx.request', /wx\.request\s*\(/);
addCheck('utils/mvp/api.js', 'wechatLogin calls the backend login endpoint', "/api/auth/wechat/login");
addCheck('utils/mvp/api.js', 'postBindPhone calls the bind-phone endpoint', "/api/auth/bind-phone");
addCheck(
  'utils/mvp/api.js',
  'postCreateOrder submits authenticated order creation',
  /async function postCreateOrder[\s\S]*request\('\/api\/orders'[\s\S]*method: 'POST'[\s\S]*requireAuth: true/,
);
addCheck(
  'utils/mvp/api.js',
  'postPayOrder prepares payment for an order',
  /async function postPayOrder[\s\S]*\/api\/orders\/\$\{orderId\}\/pay[\s\S]*method: 'POST'[\s\S]*requireAuth: true/,
);
addCheck(
  'utils/mvp/api.js',
  'postConfirmPayOrder confirms payment result',
  /async function postConfirmPayOrder[\s\S]*\/api\/orders\/\$\{orderId\}\/pay\/confirm[\s\S]*method: 'POST'[\s\S]*requireAuth: true/,
);
addCheck(
  'utils/mvp/api.js',
  'fetchOrders loads authenticated order list',
  /async function fetchOrders[\s\S]*request\('\/api\/orders'[\s\S]*requireAuth: true/,
);
addCheck('utils/mvp/api.js', 'postCancelOrder calls the cancel endpoint', /\/api\/orders\/\$\{orderId\}\/cancel/);
addCheck(
  'utils/mvp/api.js',
  'postRescheduleOrder calls the reschedule endpoint',
  /\/api\/orders\/\$\{orderId\}\/reschedule/,
);
addCheck('utils/mvp/api.js', 'postRefundOrder calls the refund endpoint', /\/api\/orders\/\$\{orderId\}\/refund/);

addCheck('utils/mvp/payment.js', 'payment flow prepares payment through API', /postPayOrder\(orderId\)/);
addCheck('utils/mvp/payment.js', 'real payment mode invokes wx.requestPayment', /wx\.requestPayment\s*\(/);
addCheck('utils/mvp/payment.js', 'mock mode bypass is explicit', "paymentMode !== 'MOCK_WECHAT_PAY'");
addCheck('utils/mvp/payment.js', 'payment flow confirms order payment', /postConfirmPayOrder\(orderId\)/);

addCheck('pages/mvp/home/index.js', 'home bootstraps WeChat login', /ensureWechatLogin\(\)/);
addCheck('pages/mvp/home/index.js', 'home loads content API data', /fetchHomeData\(\)/);
addCheck('pages/mvp/home/index.js', 'home can navigate to booking', "/pages/mvp/booking/index");
addCheck('pages/mvp/home/index.js', 'home can navigate to room detail', "/pages/mvp/room-detail/index?roomId=");
addCheck('pages/mvp/home/index.js', 'home can navigate to order center', "/pages/mvp/order-list/index");
addCheck('pages/mvp/home/index.wxml', 'home retry button is wired', 'bindtap="retryBootstrap"');
addCheck('pages/mvp/home/index.wxml', 'home booking button is wired', 'bindtap="goBooking"');
addCheck('pages/mvp/home/index.wxml', 'home order-center button is wired', 'bindtap="goOrderCenter"');
addCheck('pages/mvp/home/index.wxml', 'home room cards are wired', 'bindtap="goRoomDetail"');
addCheck('pages/mvp/home/index.wxml', 'home profile avatar chooser is wired', 'bindchooseavatar="onProfilePromptChooseAvatar"');
addCheck('pages/mvp/home/index.wxml', 'home profile save button is wired', 'bindtap="saveProfilePrompt"');

addCheck('pages/mvp/login/index.js', 'login page can call wechatLogin', /wechatLogin\(\)/);
addCheck('pages/mvp/login/index.js', 'login page can load profile after token', /fetchProfile\(\)/);
addCheck('pages/mvp/login/index.js', 'login page can clear local auth token', /clearAuthToken\(\)/);
addCheck('pages/mvp/login/index.js', 'login page can override API base URL', /setApiBaseUrl\(/);
addCheck('pages/mvp/login/index.wxml', 'login button is wired', 'bindtap="loginWithWechat"');
addCheck('pages/mvp/login/index.wxml', 'clear login button is wired', 'bindtap="clearLoginState"');
addCheck('pages/mvp/login/index.wxml', 'API base switch button is wired', 'bindtap="useReleaseApiBaseUrl"');
addCheck('pages/mvp/login/index.wxml', 'API base reset button is wired', 'bindtap="resetApiBaseUrl"');

addCheck('pages/mvp/booking/index.js', 'booking loads rooms from API', /fetchRooms\(\{[\s\S]*checkInDate[\s\S]*keyword/);
addCheck(
  'pages/mvp/booking/index.js',
  'booking date confirmation reloads room search data',
  /onDateRangeConfirm[\s\S]*dateRangeValue: \[value\[0\], value\[1\]\],[\s\S]*\},\s*\(\)\s*=>\s*\{\s*this\.loadRooms\(\);/,
);
addCheck('pages/mvp/booking/index.js', 'booking can navigate to room detail', "/pages/mvp/room-detail/index?roomId=");
addCheck('pages/mvp/booking/index.wxml', 'booking date picker is wired', 'bindtap="openDateCalendar"');
addCheck('pages/mvp/booking/index.wxml', 'booking search input is wired', 'bindinput="onKeywordInput"');
addCheck('pages/mvp/booking/index.wxml', 'booking search button is wired', 'bindtap="onSearch"');
addCheck('pages/mvp/booking/index.wxml', 'booking room detail button is wired', 'bindtap="goRoomDetail"');
addCheck('pages/mvp/booking/index.wxml', 'booking calendar confirm is wired', 'bind:confirm="onDateRangeConfirm"');

addCheck('pages/mvp/room-detail/index.js', 'room detail loads detail API data', /fetchRoomDetail\(this\.roomId/);
addCheck('pages/mvp/room-detail/index.js', 'room detail recalculates after date change', /onDateRangeConfirm[\s\S]*this\.loadDetail\(\)/);
addCheck('pages/mvp/room-detail/index.js', 'room detail can navigate to order creation', "/pages/mvp/order-create/index?roomId=");
addCheck('pages/mvp/room-detail/index.wxml', 'room detail date picker is wired', 'bindtap="openDateCalendar"');
addCheck('pages/mvp/room-detail/index.wxml', 'room detail order button is wired', 'bindtap="goCreateOrder"');
addCheck('pages/mvp/room-detail/index.wxml', 'room detail calendar confirm is wired', 'bind:confirm="onDateRangeConfirm"');

addCheck('pages/mvp/order-create/index.js', 'order create loads profile', /fetchProfile\(\)/);
addCheck('pages/mvp/order-create/index.js', 'order create loads selected room detail', /fetchRoomDetail\(this\.roomId/);
addCheck('pages/mvp/order-create/index.js', 'order create binds WeChat phone code', /postBindPhone\(\{ phoneCode \}\)/);
addCheck('pages/mvp/order-create/index.js', 'order create submits order API payload', /postCreateOrder\(\{/);
addCheck('pages/mvp/order-create/index.js', 'order create confirm action calls payment helper', /submitOrder[\s\S]*await this\.payOrder\(order\.id\)/);
addCheck('pages/mvp/order-create/index.js', 'order create starts payment flow after order creation', /payOrderByFlow\(orderId\)/);
addCheck('pages/mvp/order-create/index.js', 'order create returns to order list after payment', "/pages/mvp/order-list/index");
addCheck('pages/mvp/order-create/index.wxml', 'phone authorization button is wired', /open-type="getPhoneNumber"[\s\S]*bind:?getphonenumber="bindPhoneWithWechat"/);
addCheck('pages/mvp/order-create/index.wxml', 'guest form inputs are wired', 'bindinput="onInput"');
addCheck('pages/mvp/order-create/index.wxml', 'submit order button is wired', 'bindtap="submitOrder"');

addCheck('pages/mvp/order-list/index.js', 'order list fetches orders', /fetchOrders\(\)/);
addCheck('pages/mvp/order-list/index.js', 'order list pay action uses payment flow', /async onPay[\s\S]*payOrderByFlow\(id\)/);
addCheck('pages/mvp/order-list/index.js', 'order list cancel action calls cancel API', /async onCancel[\s\S]*postCancelOrder\(id\)/);
addCheck('pages/mvp/order-list/index.js', 'order list refund action confirms then calls refund API', /async onRefund[\s\S]*confirmRefund\(\)[\s\S]*postRefundOrder\(id/);
addCheck('pages/mvp/order-list/index.js', 'order list reschedule action calls reschedule API', /onRescheduleCalendarConfirm[\s\S]*postRescheduleOrder\(order\.id, payload\)/);
addCheck('pages/mvp/order-list/index.wxml', 'order status filter is wired', 'bindtap="onStatusChange"');
addCheck('pages/mvp/order-list/index.wxml', 'order pay button is wired', 'bindtap="onPay"');
addCheck('pages/mvp/order-list/index.wxml', 'order cancel button is wired', 'bindtap="onCancel"');
addCheck('pages/mvp/order-list/index.wxml', 'order reschedule button is wired', 'bindtap="onReschedule"');
addCheck('pages/mvp/order-list/index.wxml', 'order refund button is wired', 'bindtap="onRefund"');
addCheck('pages/mvp/order-list/index.wxml', 'reschedule calendar confirm is wired', 'bind:confirm="onRescheduleCalendarConfirm"');

function main() {
  const fileCache = new Map();
  const touchedFiles = new Set();

  checks.forEach((check) => {
    if (!fileCache.has(check.relativePath)) {
      try {
        fileCache.set(check.relativePath, readMiniappFile(check.relativePath));
      } catch (error) {
        fail(error.message);
        return;
      }
    }

    const content = fileCache.get(check.relativePath);
    touchedFiles.add(check.relativePath);
    if (!matches(content, check.pattern)) {
      fail(`${formatPath(check.relativePath)} is missing wiring: ${check.description}`);
    }
  });

  if (process.exitCode) {
    return;
  }

  pass(`${checks.length} key behavior wiring checks passed across ${touchedFiles.size} files`);
}

main();
