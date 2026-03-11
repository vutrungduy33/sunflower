const { fetchRoomDetail } = require('../../../utils/mvp/api');
const { diffDays, formatDate, getDefaultBookingDate, parseDate } = require('../../../utils/mvp/date');
const { normalizeRoomDetail } = require('../../../utils/mvp/normalize');

Page({
  data: {
    loading: true,
    errorMessage: '',
    room: null,
    calendar: [],
    checkInDate: '',
    checkOutDate: '',
    nights: 1,
    totalAmount: 0,
    dateCalendarVisible: false,
    dateRangeValue: [],
    minBookingDate: new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
  },

  onLoad(options) {
    const { checkIn, checkOut } = getDefaultBookingDate();
    this.roomId = options.roomId;
    this.setData({
      checkInDate: options.checkInDate || checkIn,
      checkOutDate: options.checkOutDate || checkOut,
    }, () => {
      this.syncDateRangeValue();
      this.loadDetail();
    });
  },

  async loadDetail() {
    if (!this.roomId) {
      this.setData({
        loading: false,
        errorMessage: '缺少房型参数，请返回上一页重新选择',
      });
      return;
    }

    try {
      this.setData({ loading: true, errorMessage: '' });
      const rawDetail = await fetchRoomDetail(this.roomId, this.data.checkInDate);
      const detail = normalizeRoomDetail(rawDetail);
      const nights = Math.max(diffDays(this.data.checkInDate, this.data.checkOutDate), 1);
      const totalAmount = detail.calendar.slice(0, nights).reduce((sum, item) => sum + item.price, 0);
      this.setData({
        room: rawDetail ? detail : null,
        calendar: detail.calendar,
        nights,
        totalAmount,
      });
    } catch (error) {
      this.setData({
        room: null,
        calendar: [],
        totalAmount: 0,
        errorMessage: error.message || '房型加载失败，请稍后重试',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  retryLoadDetail() {
    this.loadDetail();
  },

  openDateCalendar() {
    this.setData({ dateCalendarVisible: true });
  },

  onDateRangeConfirm(event) {
    const value = event.detail && event.detail.value;
    if (!Array.isArray(value) || value.length < 2) {
      wx.showToast({ title: '请选择入住和退房日期', icon: 'none' });
      return;
    }

    const nextCheckIn = formatDate(new Date(value[0]));
    const nextCheckOut = formatDate(new Date(value[1]));
    const nights = diffDays(nextCheckIn, nextCheckOut);

    if (nights <= 0) {
      wx.showToast({ title: '退房日期需晚于入住日期', icon: 'none' });
      return;
    }

    this.setData({
      checkInDate: nextCheckIn,
      checkOutDate: nextCheckOut,
      nights,
      dateCalendarVisible: false,
      dateRangeValue: [value[0], value[1]],
    });
    this.loadDetail();
  },

  onDateRangeClose() {
    this.setData({ dateCalendarVisible: false });
  },

  goCreateOrder() {
    const { checkInDate, checkOutDate } = this.data;
    wx.navigateTo({
      url: `/pages/mvp/order-create/index?roomId=${this.roomId}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`,
    });
  },

  syncDateRangeValue() {
    const { checkInDate, checkOutDate } = this.data;
    const nights = Math.max(diffDays(checkInDate, checkOutDate), 1);
    this.setData({
      nights,
      dateRangeValue: [parseDate(checkInDate).getTime(), parseDate(checkOutDate).getTime()],
    });
  },
});
