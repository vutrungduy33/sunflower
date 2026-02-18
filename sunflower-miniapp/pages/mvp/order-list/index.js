const {
  fetchOrders,
  postCancelOrder,
  postPayOrder,
  postRefundOrder,
  postRescheduleOrder,
} = require('../../../utils/mvp/api');
const { addDays, formatDate } = require('../../../utils/mvp/date');
const { track } = require('../../../utils/mvp/tracker');

Page({
  data: {
    loading: true,
    errorMessage: '',
    orders: [],
    filteredOrders: [],
    activeStatus: 'ALL',
    statusOptions: [
      { key: 'ALL', label: '全部' },
      { key: 'PENDING_PAYMENT', label: '待支付' },
      { key: 'CONFIRMED', label: '待入住' },
      { key: 'RESCHEDULED', label: '已改期' },
      { key: 'REFUNDED', label: '已退款' },
      { key: 'COMPLETED', label: '已完成' },
      { key: 'CANCELLED', label: '已取消' },
    ],
  },

  onShow() {
    this.loadOrders();
  },

  async loadOrders() {
    try {
      this.setData({ loading: true, errorMessage: '' });
      const orders = await fetchOrders();
      this.setData({ orders }, () => {
        this.applyFilter();
      });
    } catch (error) {
      this.setData({
        orders: [],
        filteredOrders: [],
        errorMessage: error.message || '订单加载失败，请稍后重试',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  retryLoadOrders() {
    this.loadOrders();
  },

  onStatusChange(event) {
    this.setData({ activeStatus: event.currentTarget.dataset.status }, () => {
      this.applyFilter();
    });
  },

  applyFilter() {
    const { orders, activeStatus } = this.data;
    const filteredOrders =
      activeStatus === 'ALL' ? orders : orders.filter((order) => order.status === activeStatus);
    this.setData({ filteredOrders });
  },

  async onPay(event) {
    const { id } = event.currentTarget.dataset;
    try {
      const order = await postPayOrder(id);
      track('order_pay_success', { orderId: order.id, amount: order.totalAmount });
      wx.showToast({ title: '支付成功', icon: 'success' });
      this.loadOrders();
    } catch (error) {
      wx.showToast({ title: error.message || '支付失败', icon: 'none' });
    }
  },

  async onCancel(event) {
    const { id } = event.currentTarget.dataset;
    try {
      await postCancelOrder(id);
      wx.showToast({ title: '订单已取消', icon: 'none' });
      this.loadOrders();
    } catch (error) {
      wx.showToast({ title: error.message || '取消失败', icon: 'none' });
    }
  },

  async onReschedule(event) {
    const { id } = event.currentTarget.dataset;
    const order = this.data.orders.find((item) => item.id === id);
    if (!order) {
      wx.showToast({ title: '订单不存在', icon: 'none' });
      return;
    }

    try {
      const shiftDays = await this.selectRescheduleDays();
      if (!shiftDays) {
        return;
      }

      const payload = {
        checkInDate: formatDate(addDays(order.checkInDate, shiftDays)),
        checkOutDate: formatDate(addDays(order.checkOutDate, shiftDays)),
        reason: `用户在小程序发起改期，顺延${shiftDays}天`,
      };
      const updatedOrder = await postRescheduleOrder(id, payload);
      track('order_reschedule_success', {
        orderId: updatedOrder.id,
        fromCheckInDate: order.checkInDate,
        toCheckInDate: payload.checkInDate,
      });
      wx.showToast({ title: '改期成功', icon: 'success' });
      this.loadOrders();
    } catch (error) {
      wx.showToast({ title: error.message || '改期失败', icon: 'none' });
    }
  },

  async onRefund(event) {
    const { id } = event.currentTarget.dataset;
    try {
      const confirmed = await this.confirmRefund();
      if (!confirmed) {
        return;
      }

      const order = await postRefundOrder(id, '用户在小程序发起退款');
      track('order_refund_success', { orderId: order.id, amount: order.totalAmount });
      wx.showToast({ title: '退款成功', icon: 'success' });
      this.loadOrders();
    } catch (error) {
      wx.showToast({ title: error.message || '退款失败', icon: 'none' });
    }
  },

  selectRescheduleDays() {
    return new Promise((resolve, reject) => {
      wx.showActionSheet({
        itemList: ['顺延 1 天', '顺延 2 天', '顺延 3 天'],
        success: (result) => resolve(result.tapIndex + 1),
        fail: (error) => {
          const message = (error && error.errMsg) || '';
          if (message.includes('cancel')) {
            resolve(0);
            return;
          }
          reject(new Error(message || '改期选择失败'));
        },
      });
    });
  },

  confirmRefund() {
    return new Promise((resolve, reject) => {
      wx.showModal({
        title: '申请退款',
        content: '确认发起退款申请？',
        confirmText: '确认退款',
        cancelText: '取消',
        success: (result) => resolve(!!result.confirm),
        fail: (error) => reject(new Error((error && error.errMsg) || '退款确认失败')),
      });
    });
  },

  goBooking() {
    wx.redirectTo({ url: '/pages/mvp/booking/index' });
  },
});
