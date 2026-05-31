const { postConfirmPayOrder, postPayOrder } = require('./api');

function invokeWechatPayment(paymentRequest = {}) {
  return new Promise((resolve, reject) => {
    wx.requestPayment({
      timeStamp: `${paymentRequest.timeStamp || ''}`,
      nonceStr: `${paymentRequest.nonceStr || ''}`,
      package: `${paymentRequest.package || ''}`,
      signType: `${paymentRequest.signType || 'RSA'}`,
      paySign: `${paymentRequest.paySign || ''}`,
      success: resolve,
      fail: (error) => reject(error || new Error('支付失败')),
    });
  });
}

function isPaymentCancelled(error) {
  const message = `${(error && error.errMsg) || (error && error.message) || ''}`.toLowerCase();
  return message.includes('cancel');
}

async function payOrderByFlow(orderId) {
  const prepareResult = await postPayOrder(orderId);
  const paymentMode = `${(prepareResult && prepareResult.paymentMode) || ''}`.trim();

  if (paymentMode !== 'MOCK_WECHAT_PAY') {
    try {
      await invokeWechatPayment((prepareResult && prepareResult.paymentRequest) || {});
    } catch (error) {
      if (isPaymentCancelled(error)) {
        return {
          status: 'cancelled',
          prepareResult,
          message: '你已取消支付',
        };
      }
      return {
        status: 'failed',
        prepareResult,
        message: (error && error.errMsg) || (error && error.message) || '支付失败，请稍后重试',
      };
    }
  }

  try {
    const order = await postConfirmPayOrder(orderId);
    return {
      status: 'success',
      prepareResult,
      order,
    };
  } catch (error) {
    return {
      status: 'confirming',
      prepareResult,
      message: (error && error.message) || '支付结果确认中，请稍后在订单列表查看',
    };
  }
}

module.exports = {
  payOrderByFlow,
};
