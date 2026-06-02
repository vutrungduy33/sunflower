#!/usr/bin/env node
'use strict';

const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const miniappDir = path.join(rootDir, 'sunflower-miniapp');
const apiModulePath = path.join(miniappDir, 'utils/mvp/api.js');
const paymentModulePath = path.join(miniappDir, 'utils/mvp/payment.js');

const passMessages = [];

function fail(message) {
  console.error(`[miniapp-payment-flow] ERROR: ${message}`);
  process.exit(1);
}

function pass(message) {
  passMessages.push(message);
  console.log(`[miniapp-payment-flow] PASS: ${message}`);
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

function clearPaymentModule() {
  delete require.cache[require.resolve(paymentModulePath)];
}

function stubApi(api) {
  require.cache[apiModulePath] = {
    id: apiModulePath,
    filename: apiModulePath,
    loaded: true,
    exports: api,
  };
}

function createWxPaymentStub(behavior = 'success') {
  const calls = [];
  return {
    calls,
    requestPayment(options = {}) {
      calls.push({ name: 'requestPayment', options });
      if (behavior === 'success') {
        options.success && options.success({ errMsg: 'requestPayment:ok' });
        return;
      }
      if (behavior === 'cancel') {
        options.fail && options.fail({ errMsg: 'requestPayment:fail cancel' });
        return;
      }
      options.fail && options.fail({ errMsg: 'requestPayment:fail invalid paySign' });
    },
  };
}

function loadPaymentFlow(api, wxBehavior = 'success') {
  global.wx = createWxPaymentStub(wxBehavior);
  stubApi(api);
  clearPaymentModule();
  return {
    payment: require(paymentModulePath),
    wx: global.wx,
  };
}

function createPaymentRequest() {
  return {
    timeStamp: 1790000000,
    nonceStr: 'nonce-for-replay',
    package: 'prepay_id=wx-replay-prepay',
    signType: 'RSA',
    paySign: 'pay-sign-for-replay',
  };
}

async function runMockPaymentScenario() {
  const apiCalls = [];
  const api = {
    postPayOrder: async (orderId) => {
      apiCalls.push(`postPayOrder:${orderId}`);
      return {
        paymentMode: 'MOCK_WECHAT_PAY',
      };
    },
    postConfirmPayOrder: async (orderId) => {
      apiCalls.push(`postConfirmPayOrder:${orderId}`);
      return {
        id: orderId,
        totalAmount: 388,
      };
    },
  };

  const { payment, wx } = loadPaymentFlow(api);
  const result = await payment.payOrderByFlow('order-mock');

  assertEqual(result.status, 'success', 'mock payment should return success after backend confirm');
  assertEqual(wx.calls.length, 0, 'mock payment should not call wx.requestPayment');
  assertIncludes(apiCalls, 'postPayOrder:order-mock', 'mock payment should prepare backend payment');
  assertIncludes(apiCalls, 'postConfirmPayOrder:order-mock', 'mock payment should confirm backend payment');
  pass('mock payment bypass confirms order without invoking wx.requestPayment');
}

async function runRealPaymentSuccessScenario() {
  const paymentRequest = createPaymentRequest();
  const apiCalls = [];
  const api = {
    postPayOrder: async (orderId) => {
      apiCalls.push(`postPayOrder:${orderId}`);
      return {
        paymentMode: 'WECHAT_PAY',
        paymentRequest,
      };
    },
    postConfirmPayOrder: async (orderId) => {
      apiCalls.push(`postConfirmPayOrder:${orderId}`);
      return {
        id: orderId,
        totalAmount: 488,
      };
    },
  };

  const { payment, wx } = loadPaymentFlow(api, 'success');
  const result = await payment.payOrderByFlow('order-real-success');

  assertEqual(result.status, 'success', 'real payment success should return success');
  assertEqual(wx.calls.length, 1, 'real payment should call wx.requestPayment once');
  const requestOptions = wx.calls[0].options;
  assertEqual(requestOptions.timeStamp, `${paymentRequest.timeStamp}`, 'requestPayment should stringify timeStamp');
  assertEqual(requestOptions.nonceStr, paymentRequest.nonceStr, 'requestPayment should pass nonceStr');
  assertEqual(requestOptions.package, paymentRequest.package, 'requestPayment should pass package');
  assertEqual(requestOptions.signType, paymentRequest.signType, 'requestPayment should pass signType');
  assertEqual(requestOptions.paySign, paymentRequest.paySign, 'requestPayment should pass paySign');
  assertIncludes(
    apiCalls,
    'postConfirmPayOrder:order-real-success',
    'real payment success should confirm backend order state',
  );
  pass('real payment success invokes wx.requestPayment and confirms backend order');
}

async function runRealPaymentCancelScenario() {
  const apiCalls = [];
  const api = {
    postPayOrder: async (orderId) => {
      apiCalls.push(`postPayOrder:${orderId}`);
      return {
        paymentMode: 'WECHAT_PAY',
        paymentRequest: createPaymentRequest(),
      };
    },
    postConfirmPayOrder: async (orderId) => {
      apiCalls.push(`postConfirmPayOrder:${orderId}`);
      return { id: orderId };
    },
  };

  const { payment, wx } = loadPaymentFlow(api, 'cancel');
  const result = await payment.payOrderByFlow('order-real-cancel');

  assertEqual(result.status, 'cancelled', 'payment cancel should return cancelled status');
  assertEqual(result.message, '你已取消支付', 'payment cancel should expose user-facing cancel message');
  assertEqual(wx.calls.length, 1, 'cancel scenario should still call wx.requestPayment');
  assert(
    !apiCalls.includes('postConfirmPayOrder:order-real-cancel'),
    'cancelled payment should not confirm backend order',
  );
  pass('real payment cancellation returns cancelled and skips backend confirm');
}

async function runRealPaymentFailureScenario() {
  const apiCalls = [];
  const api = {
    postPayOrder: async (orderId) => {
      apiCalls.push(`postPayOrder:${orderId}`);
      return {
        paymentMode: 'WECHAT_PAY',
        paymentRequest: createPaymentRequest(),
      };
    },
    postConfirmPayOrder: async (orderId) => {
      apiCalls.push(`postConfirmPayOrder:${orderId}`);
      return { id: orderId };
    },
  };

  const { payment, wx } = loadPaymentFlow(api, 'fail');
  const result = await payment.payOrderByFlow('order-real-fail');

  assertEqual(result.status, 'failed', 'payment failure should return failed status');
  assertIncludes(
    [result.message],
    'requestPayment:fail invalid paySign',
    'payment failure should preserve requestPayment error message',
  );
  assertEqual(wx.calls.length, 1, 'failure scenario should call wx.requestPayment once');
  assert(
    !apiCalls.includes('postConfirmPayOrder:order-real-fail'),
    'failed payment should not confirm backend order',
  );
  pass('real payment failure returns failed and skips backend confirm');
}

async function runBackendConfirmationPendingScenario() {
  const api = {
    postPayOrder: async () => ({
      paymentMode: 'WECHAT_PAY',
      paymentRequest: createPaymentRequest(),
    }),
    postConfirmPayOrder: async () => {
      throw new Error('微信支付结果尚未同步');
    },
  };

  const { payment, wx } = loadPaymentFlow(api, 'success');
  const result = await payment.payOrderByFlow('order-confirming');

  assertEqual(result.status, 'confirming', 'confirm failure should return confirming status');
  assertEqual(result.message, '微信支付结果尚未同步', 'confirming status should preserve backend message');
  assertEqual(wx.calls.length, 1, 'confirming scenario should still complete requestPayment first');
  pass('backend confirmation failure returns confirming so the page can refresh order list later');
}

async function main() {
  await runMockPaymentScenario();
  await runRealPaymentSuccessScenario();
  await runRealPaymentCancelScenario();
  await runRealPaymentFailureScenario();
  await runBackendConfirmationPendingScenario();

  console.log(`[miniapp-payment-flow] INFO: completed ${passMessages.length} replay scenario(s)`);
}

main().catch((error) => fail(error && error.stack ? error.stack : error.message));
