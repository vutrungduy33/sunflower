const { fetchOrders, postCancelOrder, postPayOrder } = require('../../../utils/mvp/api');
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

  goBooking() {
    wx.redirectTo({ url: '/pages/mvp/booking/index' });
  },
});
