const {
  fetchOrders,
  postCancelOrder,
  postPayOrder,
  postRefundOrder,
  postRescheduleOrder,
} = require('../../../utils/mvp/api');
const { diffDays, formatDate, parseDate } = require('../../../utils/mvp/date');
const { normalizeOrders } = require('../../../utils/mvp/normalize');
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
      { key: 'CHECKED_IN', label: '已入住' },
      { key: 'RESCHEDULED', label: '已改期' },
      { key: 'REFUNDED', label: '已退款' },
      { key: 'COMPLETED', label: '已完成' },
      { key: 'CANCELLED', label: '已取消' },
      { key: 'NO_SHOW', label: '已失约' },
    ],
    rescheduleCalendarVisible: false,
    rescheduleTargetOrderId: '',
    rescheduleDateRangeValue: [],
    rescheduleMinDate: new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
  },

  onShow() {
    this.loadOrders();
  },

  async loadOrders() {
    try {
      this.setData({ loading: true, errorMessage: '' });
      const orders = normalizeOrders(await fetchOrders());
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
    const normalizedOrders = normalizeOrders(orders);
    const filteredOrders =
      activeStatus === 'ALL'
        ? normalizedOrders
        : normalizedOrders.filter((order) => order.status === activeStatus);
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

    this.setData({
      rescheduleCalendarVisible: true,
      rescheduleTargetOrderId: id,
      rescheduleDateRangeValue: [
        parseDate(order.checkInDate).getTime(),
        parseDate(order.checkOutDate).getTime(),
      ],
    });
  },

  async onRefund(event) {
    const { id } = event.currentTarget.dataset;
    try {
      const confirmed = await this.confirmRefund();
      if (!confirmed) {
        return;
      }

      const order = await postRefundOrder(id, '用户在小程序发起退款');
      track('order_refund_request_submit', { orderId: order.id, amount: order.totalAmount });
      wx.showToast({ title: '退款申请已提交', icon: 'success' });
      this.loadOrders();
    } catch (error) {
      wx.showToast({ title: error.message || '退款失败', icon: 'none' });
    }
  },

  onRescheduleCalendarClose() {
    this.setData({
      rescheduleCalendarVisible: false,
      rescheduleTargetOrderId: '',
      rescheduleDateRangeValue: [],
    });
  },

  async onRescheduleCalendarConfirm(event) {
    const value = event.detail && event.detail.value;
    if (!Array.isArray(value) || value.length < 2) {
      wx.showToast({ title: '请选择改期日期', icon: 'none' });
      return;
    }

    const order = this.data.orders.find((item) => item.id === this.data.rescheduleTargetOrderId);
    if (!order) {
      this.onRescheduleCalendarClose();
      wx.showToast({ title: '订单不存在', icon: 'none' });
      return;
    }

    const nextCheckInDate = formatDate(new Date(value[0]));
    const nextCheckOutDate = formatDate(new Date(value[1]));
    const nights = diffDays(nextCheckInDate, nextCheckOutDate);
    if (nights <= 0) {
      wx.showToast({ title: '退房日期需晚于入住日期', icon: 'none' });
      return;
    }
    if (nights !== order.nights) {
      wx.showToast({ title: `改期需保持${order.nights}晚`, icon: 'none' });
      return;
    }
    if (nextCheckInDate === order.checkInDate && nextCheckOutDate === order.checkOutDate) {
      wx.showToast({ title: '改期日期不能与原订单一致', icon: 'none' });
      return;
    }

    this.setData({ rescheduleCalendarVisible: false });

    try {
      const payload = {
        checkInDate: nextCheckInDate,
        checkOutDate: nextCheckOutDate,
        reason: `用户在小程序发起改期：${order.checkInDate}→${nextCheckInDate}`,
      };
      const updatedOrder = await postRescheduleOrder(order.id, payload);
      track('order_reschedule_request_submit', {
        orderId: updatedOrder.id,
        fromCheckInDate: order.checkInDate,
        toCheckInDate: payload.checkInDate,
      });
      wx.showToast({ title: '改期申请已提交', icon: 'success' });
      this.onRescheduleCalendarClose();
      this.loadOrders();
    } catch (error) {
      wx.showToast({ title: error.message || '改期失败', icon: 'none' });
    }
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
