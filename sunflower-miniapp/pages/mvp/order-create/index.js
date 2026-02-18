const {
  fetchProfile,
  fetchRoomDetail,
  postCreateOrder,
  postPayOrder,
} = require('../../../utils/mvp/api');
const { diffDays, getDefaultBookingDate } = require('../../../utils/mvp/date');
const { track } = require('../../../utils/mvp/tracker');

Page({
  data: {
    loading: true,
    errorMessage: '',
    submitting: false,
    room: null,
    checkInDate: '',
    checkOutDate: '',
    nights: 1,
    totalAmount: 0,
    form: {
      guestName: '',
      guestPhone: '',
      arrivalTime: '18:00',
      remark: '',
    },
  },

  onLoad(options) {
    const { checkIn, checkOut } = getDefaultBookingDate();
    this.roomId = options.roomId;
    this.setData({
      checkInDate: options.checkInDate || checkIn,
      checkOutDate: options.checkOutDate || checkOut,
    });
    this.loadPageData();
  },

  async loadPageData() {
    if (!this.roomId) {
      this.setData({
        loading: false,
        errorMessage: '缺少房型信息，请返回上一页重新选择',
      });
      return;
    }

    try {
      this.setData({ loading: true, errorMessage: '' });
      const [profile, roomDetail] = await Promise.all([
        fetchProfile(),
        fetchRoomDetail(this.roomId, this.data.checkInDate),
      ]);

      const nights = Math.max(diffDays(this.data.checkInDate, this.data.checkOutDate), 1);
      const totalAmount = roomDetail.calendar.slice(0, nights).reduce((sum, item) => sum + item.price, 0);
      this.setData({
        room: roomDetail,
        nights,
        totalAmount,
        form: {
          ...this.data.form,
          guestPhone: profile.phone || '',
        },
      });
    } catch (error) {
      this.setData({
        room: null,
        errorMessage: error.message || '订单页加载失败，请稍后重试',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  retryLoadPageData() {
    this.loadPageData();
  },

  onInput(event) {
    const { field } = event.currentTarget.dataset;
    this.setData({
      [`form.${field}`]: event.detail.value,
    });
  },

  validateForm() {
    const { guestName, guestPhone } = this.data.form;
    if (!guestName.trim()) {
      wx.showToast({ title: '请填写入住人姓名', icon: 'none' });
      return false;
    }

    if (!/^1\d{10}$/.test(guestPhone.trim())) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      return false;
    }

    return true;
  },

  async submitOrder() {
    if (!this.validateForm()) {
      return;
    }

    try {
      this.setData({ submitting: true });
      const order = await postCreateOrder({
        roomId: this.roomId,
        checkInDate: this.data.checkInDate,
        checkOutDate: this.data.checkOutDate,
        source: 'direct',
        ...this.data.form,
      });
      track('order_create', {
        orderId: order.id,
        roomId: order.roomId,
        amount: order.totalAmount,
      });

      wx.showModal({
        title: '订单已创建',
        content: `订单号 ${order.orderNo}，应付 ¥${order.totalAmount}`,
        confirmText: '立即支付',
        cancelText: '稍后支付',
        success: async (result) => {
          if (result.confirm) {
            await this.payOrder(order.id);
          } else {
            wx.redirectTo({ url: '/pages/mvp/order-list/index' });
          }
        },
      });
    } catch (error) {
      wx.showToast({ title: error.message || '订单创建失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  async payOrder(orderId) {
    try {
      const paidOrder = await postPayOrder(orderId);
      track('order_pay_success', {
        orderId: paidOrder.id,
        amount: paidOrder.totalAmount,
      });
      wx.showToast({ title: '支付成功', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/mvp/order-list/index' });
      }, 500);
    } catch (error) {
      wx.showToast({ title: error.message || '支付失败', icon: 'none' });
    }
  },
});
