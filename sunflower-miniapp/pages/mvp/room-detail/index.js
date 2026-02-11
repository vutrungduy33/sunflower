const { fetchRoomDetail } = require('../../../utils/mvp/api');
const { addDays, diffDays, formatDate, getDefaultBookingDate } = require('../../../utils/mvp/date');

Page({
  data: {
    loading: true,
    room: null,
    calendar: [],
    checkInDate: '',
    checkOutDate: '',
    nights: 1,
    totalAmount: 0,
    today: formatDate(new Date()),
  },

  onLoad(options) {
    const { checkIn, checkOut } = getDefaultBookingDate();
    this.roomId = options.roomId;
    this.setData({
      checkInDate: options.checkInDate || checkIn,
      checkOutDate: options.checkOutDate || checkOut,
    });
    this.loadDetail();
  },

  async loadDetail() {
    if (!this.roomId) {
      wx.showToast({ title: '缺少房型参数', icon: 'none' });
      return;
    }

    try {
      this.setData({ loading: true });
      const detail = await fetchRoomDetail(this.roomId, this.data.checkInDate);
      const nights = Math.max(diffDays(this.data.checkInDate, this.data.checkOutDate), 1);
      const totalAmount = detail.calendar.slice(0, nights).reduce((sum, item) => sum + item.price, 0);
      this.setData({
        room: detail,
        calendar: detail.calendar,
        nights,
        totalAmount,
      });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onCheckInChange(event) {
    const nextCheckIn = event.detail.value;
    let nextCheckOut = this.data.checkOutDate;
    if (diffDays(nextCheckIn, nextCheckOut) <= 0) {
      nextCheckOut = formatDate(addDays(nextCheckIn, 1));
    }
    this.setData({
      checkInDate: nextCheckIn,
      checkOutDate: nextCheckOut,
    });
    this.loadDetail();
  },

  onCheckOutChange(event) {
    const nextCheckOut = event.detail.value;
    if (diffDays(this.data.checkInDate, nextCheckOut) <= 0) {
      wx.showToast({ title: '退房日期需晚于入住日期', icon: 'none' });
      return;
    }
    this.setData({ checkOutDate: nextCheckOut });
    this.loadDetail();
  },

  goCreateOrder() {
    const { checkInDate, checkOutDate } = this.data;
    wx.navigateTo({
      url: `/pages/mvp/order-create/index?roomId=${this.roomId}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`,
    });
  },
});
