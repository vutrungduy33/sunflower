#!/usr/bin/env node
'use strict';

const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const miniappDir = path.join(rootDir, 'sunflower-miniapp');
const apiModulePath = path.join(miniappDir, 'utils/mvp/api.js');
const paymentModulePath = path.join(miniappDir, 'utils/mvp/payment.js');
const trackerModulePath = path.join(miniappDir, 'utils/mvp/tracker.js');

const passMessages = [];

function fail(message) {
  console.error(`[miniapp-user-flow] ERROR: ${message}`);
  process.exit(1);
}

function pass(message) {
  passMessages.push(message);
  console.log(`[miniapp-user-flow] PASS: ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(values, expected, message) {
  if (!values.includes(expected)) {
    fail(`${message}: expected ${JSON.stringify(expected)} in ${JSON.stringify(values)}`);
  }
}

function createWxStub() {
  const calls = [];
  const storage = {};
  return {
    calls,
    storage,
    showToast(options = {}) {
      calls.push({ name: 'showToast', options });
    },
    showModal(options = {}) {
      calls.push({ name: 'showModal', options });
      if (typeof options.success === 'function') {
        options.success({ confirm: true, cancel: false });
      }
    },
    redirectTo(options = {}) {
      calls.push({ name: 'redirectTo', options });
    },
    navigateTo(options = {}) {
      calls.push({ name: 'navigateTo', options });
    },
    switchTab(options = {}) {
      calls.push({ name: 'switchTab', options });
    },
    getStorageSync(key) {
      return storage[key];
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    removeStorageSync(key) {
      delete storage[key];
    },
  };
}

function installPageHarness() {
  const pages = [];
  global.Page = (definition) => {
    pages.push(definition);
  };
  global.getApp = () => ({
    globalData: {},
  });
  return pages;
}

function clearModule(relativePath) {
  delete require.cache[require.resolve(path.join(miniappDir, relativePath))];
}

function stubModule(modulePath, exportsValue) {
  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports: exportsValue,
  };
}

function loadPage(relativePath, stubs = {}) {
  const pages = installPageHarness();
  global.wx = createWxStub();
  stubModule(apiModulePath, stubs.api || {});
  stubModule(paymentModulePath, stubs.payment || {});
  stubModule(trackerModulePath, stubs.tracker || { track() {} });
  clearModule(relativePath);
  require(path.join(miniappDir, relativePath));

  if (pages.length !== 1) {
    fail(`${relativePath} should register exactly one Page, got ${pages.length}`);
  }

  const page = pages[0];
  page.data = JSON.parse(JSON.stringify(page.data || {}));
  page.setData = function setData(patch, callback) {
    Object.entries(patch || {}).forEach(([key, value]) => {
      const parts = key.split('.');
      let target = this.data;
      while (parts.length > 1) {
        const part = parts.shift();
        target[part] = target[part] && typeof target[part] === 'object' ? target[part] : {};
        target = target[part];
      }
      target[parts[0]] = value;
    });
    if (typeof callback === 'function') {
      callback.call(this);
    }
  };

  return {
    page,
    wx: global.wx,
  };
}

async function runLoginAndHomeScenario() {
  const apiCalls = [];
  const api = {
    ensureWechatLogin: async () => {
      apiCalls.push('ensureWechatLogin');
      return {
        token: 'token-for-replay',
        reusedToken: false,
        isNewUser: true,
        profile: {
          nickName: '',
          avatarUrl: '',
          needsProfileCompletion: true,
        },
      };
    },
    fetchHomeData: async () => {
      apiCalls.push('fetchHomeData');
      return {
        banners: [{ id: 'banner-1' }],
        services: [{ id: 'svc-1', name: '接驳' }],
        featuredRooms: [{ id: 'room-1', tags: ['海景'] }],
        memberBenefits: ['延迟退房'],
      };
    },
    isLogoutRequired: () => false,
    patchProfile: async (payload) => {
      apiCalls.push(`patchProfile:${payload.nickName}`);
      return {};
    },
    uploadProfileAvatar: async (filePath) => {
      apiCalls.push(`uploadProfileAvatar:${filePath}`);
      return {};
    },
  };
  const trackCalls = [];
  const tracker = {
    track: (event, payload) => trackCalls.push({ event, payload }),
  };

  const { page, wx } = loadPage('pages/mvp/home/index.js', { api, tracker });
  await page.bootstrap();

  assertEqual(apiCalls[0], 'ensureWechatLogin', 'home should start with login bootstrap');
  assertIncludes(apiCalls, 'fetchHomeData', 'home should load content after login');
  assertEqual(page.data.banners.length, 1, 'home should render normalized banners');
  assertEqual(page.data.showProfilePrompt, true, 'new user should see profile prompt');
  assertIncludes(
    trackCalls.map((call) => call.event),
    'wx_login_success',
    'home should track new login success',
  );

  page.goBooking();
  page.goOrderCenter();
  const urls = wx.calls
    .filter((call) => ['redirectTo', 'navigateTo'].includes(call.name))
    .map((call) => call.options.url);
  assertIncludes(urls, '/pages/mvp/booking/index', 'home should navigate to booking');
  assertIncludes(urls, '/pages/mvp/order-list/index', 'home should navigate to order center');

  pass('home login bootstrap, content load, profile prompt, and navigation replayed');
}

async function runOrderCreateScenario() {
  const apiCalls = [];
  const api = {
    fetchProfile: async () => {
      apiCalls.push('fetchProfile');
      return {
        phone: '',
        isPhoneBound: false,
      };
    },
    fetchRoomDetail: async (roomId) => {
      apiCalls.push(`fetchRoomDetail:${roomId}`);
      return {
        id: roomId,
        title: '海景房',
        calendar: [
          { date: '2026-06-10', price: 388, stock: 2 },
          { date: '2026-06-11', price: 388, stock: 2 },
        ],
      };
    },
    postBindPhone: async (payload) => {
      apiCalls.push(`postBindPhone:${payload.phoneCode}`);
      return {
        phone: '13800138000',
        isPhoneBound: true,
      };
    },
    postCreateOrder: async (payload) => {
      apiCalls.push(`postCreateOrder:${payload.roomId}:${payload.guestPhone}`);
      return {
        id: 'order-1',
        orderNo: 'SO202606100001',
        roomId: payload.roomId,
        totalAmount: 388,
      };
    },
  };
  const paymentCalls = [];
  const trackCalls = [];
  const payment = {
    payOrderByFlow: async (orderId) => {
      paymentCalls.push(orderId);
      return {
        status: 'success',
        order: {
          id: orderId,
          totalAmount: 388,
        },
      };
    },
  };
  const tracker = {
    track: (event, payload) => trackCalls.push({ event, payload }),
  };

  const { page, wx } = loadPage('pages/mvp/order-create/index.js', { api, payment, tracker });
  page.onLoad({ roomId: 'room-1', checkInDate: '2026-06-10', checkOutDate: '2026-06-11' });
  await flushAsync();

  assertIncludes(apiCalls, 'fetchProfile', 'order create should load profile');
  assertIncludes(apiCalls, 'fetchRoomDetail:room-1', 'order create should load room detail');
  assertEqual(page.data.totalAmount, 388, 'order create should calculate one-night total amount');

  await page.submitOrder();
  assertEqual(paymentCalls.length, 0, 'unbound phone should block order submission');
  assertIncludes(
    wx.calls.filter((call) => call.name === 'showToast').map((call) => call.options.title),
    '请先绑定微信手机号',
    'order create should explain missing phone binding',
  );

  await page.bindPhoneWithWechat({ detail: { code: 'phone-code-1' } });
  assertIncludes(apiCalls, 'postBindPhone:phone-code-1', 'phone binding should submit WeChat phone code');
  assertEqual(page.data.profile.isPhoneBound, true, 'phone binding should update profile state');
  assertEqual(page.data.form.guestPhone, '13800138000', 'phone binding should hydrate order form phone');

  page.onInput({ currentTarget: { dataset: { field: 'guestName' } }, detail: { value: '陈小葵' } });
  await page.submitOrder();
  await flushAsync();

  assertIncludes(
    apiCalls,
    'postCreateOrder:room-1:13800138000',
    'order create should submit room and bound phone',
  );
  assertIncludes(paymentCalls, 'order-1', 'order create should pay immediately after modal confirmation');
  assertIncludes(
    trackCalls.map((call) => call.event),
    'order_create',
    'order create should track order creation',
  );
  assertIncludes(
    trackCalls.map((call) => call.event),
    'order_pay_success',
    'order create should track payment success',
  );
  assertIncludes(
    wx.calls.filter((call) => call.name === 'redirectTo').map((call) => call.options.url),
    '/pages/mvp/order-list/index',
    'successful payment should redirect to order list',
  );

  pass('order creation validates phone, binds phone code, submits order, and handles payment success');
}

async function runOrderListScenario() {
  const apiCalls = [];
  const orders = [
    {
      id: 'order-unpaid',
      status: 'PENDING_PAYMENT',
      bookingStatus: 'PENDING_PAYMENT',
      paymentStatus: 'UNPAID',
      checkInDate: '2026-06-10',
      checkOutDate: '2026-06-11',
      nights: 1,
      totalAmount: 388,
    },
    {
      id: 'order-paid',
      status: 'CONFIRMED',
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      checkInDate: '2026-06-12',
      checkOutDate: '2026-06-13',
      nights: 1,
      totalAmount: 488,
    },
  ];
  const api = {
    fetchOrders: async () => {
      apiCalls.push('fetchOrders');
      return orders;
    },
    postCancelOrder: async (orderId) => {
      apiCalls.push(`postCancelOrder:${orderId}`);
      return {};
    },
    postRefundOrder: async (orderId, reason) => {
      apiCalls.push(`postRefundOrder:${orderId}:${reason}`);
      return {
        id: orderId,
        totalAmount: 488,
      };
    },
    postRescheduleOrder: async (orderId, payload) => {
      apiCalls.push(`postRescheduleOrder:${orderId}:${payload.checkInDate}:${payload.checkOutDate}`);
      return {
        id: orderId,
      };
    },
  };
  const payment = {
    payOrderByFlow: async (orderId) => {
      apiCalls.push(`payOrderByFlow:${orderId}`);
      return {
        status: 'success',
        order: {
          id: orderId,
          totalAmount: 388,
        },
      };
    },
  };
  const trackCalls = [];
  const tracker = {
    track: (event, payload) => trackCalls.push({ event, payload }),
  };

  const { page, wx } = loadPage('pages/mvp/order-list/index.js', { api, payment, tracker });
  await page.loadOrders();
  assertEqual(page.data.filteredOrders.length, 2, 'order list should load all orders by default');

  page.onStatusChange({ currentTarget: { dataset: { status: 'CONFIRMED' } } });
  assertEqual(page.data.filteredOrders.length, 1, 'order list should filter by status');
  assertEqual(page.data.filteredOrders[0].id, 'order-paid', 'order list should keep confirmed order after filter');

  await page.onPay({ currentTarget: { dataset: { id: 'order-unpaid' } } });
  assertIncludes(apiCalls, 'payOrderByFlow:order-unpaid', 'order list pay action should use payment flow');

  await page.onCancel({ currentTarget: { dataset: { id: 'order-unpaid' } } });
  assertIncludes(apiCalls, 'postCancelOrder:order-unpaid', 'order list cancel action should call cancel API');

  await page.onRefund({ currentTarget: { dataset: { id: 'order-paid' } } });
  assertIncludes(
    apiCalls,
    'postRefundOrder:order-paid:用户在小程序发起退款',
    'order list refund action should submit refund reason',
  );

  await page.onReschedule({ currentTarget: { dataset: { id: 'order-paid' } } });
  await page.onRescheduleCalendarConfirm({
    detail: {
      value: [
        new Date('2026-06-14T00:00:00').getTime(),
        new Date('2026-06-15T00:00:00').getTime(),
      ],
    },
  });
  assertIncludes(
    apiCalls,
    'postRescheduleOrder:order-paid:2026-06-14:2026-06-15',
    'order list reschedule action should submit same-night date change',
  );
  assertIncludes(
    trackCalls.map((call) => call.event),
    'order_pay_success',
    'order list should track payment success',
  );
  assertIncludes(
    trackCalls.map((call) => call.event),
    'order_refund_request_submit',
    'order list should track refund request',
  );
  assertIncludes(
    trackCalls.map((call) => call.event),
    'order_reschedule_request_submit',
    'order list should track reschedule request',
  );

  const toastTitles = wx.calls.filter((call) => call.name === 'showToast').map((call) => call.options.title);
  assertIncludes(toastTitles, '订单已取消', 'cancel action should show success feedback');
  assertIncludes(toastTitles, '退款申请已提交', 'refund action should show success feedback');
  assertIncludes(toastTitles, '改期申请已提交', 'reschedule action should show success feedback');

  pass('order list loads, filters, pays, cancels, refunds, and reschedules through page methods');
}

function flushAsync() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function main() {
  await runLoginAndHomeScenario();
  await runOrderCreateScenario();
  await runOrderListScenario();

  console.log(`[miniapp-user-flow] INFO: completed ${passMessages.length} replay scenario(s)`);
}

main().catch((error) => fail(error && error.stack ? error.stack : error.message));
