const { fetchRooms } = require('../../../utils/mvp/api');
const { diffDays, formatDate, getDefaultBookingDate, parseDate } = require('../../../utils/mvp/date');
const { track } = require('../../../utils/mvp/tracker');

Page({
  data: {
    loading: true,
    errorMessage: '',
    rooms: [],
    keyword: '',
    checkInDate: '',
    checkOutDate: '',
    stayNights: 1,
    dateCalendarVisible: false,
    dateRangeValue: [],
    minBookingDate: new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
  },

  onLoad() {
    const { checkIn, checkOut } = getDefaultBookingDate();
    this.setData(
      {
        checkInDate: checkIn,
        checkOutDate: checkOut,
      },
      () => {
        this.syncDateRangeValue();
        this.loadRooms();
      },
    );
  },

  async loadRooms() {
    const { checkInDate, keyword } = this.data;
    try {
      this.setData({ loading: true, errorMessage: '' });
      const rooms = await fetchRooms({
        checkInDate,
        keyword,
      });
      this.setData({ rooms });
    } catch (error) {
      this.setData({
        rooms: [],
        errorMessage: error.message || '房型加载失败，请稍后重试',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  onKeywordInput(event) {
    this.setData({ keyword: event.detail.value });
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
    const stayNights = diffDays(nextCheckIn, nextCheckOut);

    if (stayNights <= 0) {
      wx.showToast({ title: '退房日期需晚于入住日期', icon: 'none' });
      return;
    }

    this.setData({
      checkInDate: nextCheckIn,
      checkOutDate: nextCheckOut,
      stayNights,
      dateCalendarVisible: false,
      dateRangeValue: [value[0], value[1]],
    });
  },

  onDateRangeClose() {
    this.setData({ dateCalendarVisible: false });
  },

  onSearch() {
    this.loadRooms();
  },

  retryLoadRooms() {
    this.loadRooms();
  },

  goRoomDetail(event) {
    const { roomid } = event.currentTarget.dataset;
    const { checkInDate, checkOutDate } = this.data;
    track('room_view', { roomId: roomid, source: 'booking' });
    wx.navigateTo({
      url: `/pages/mvp/room-detail/index?roomId=${roomid}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`,
    });
  },

  syncDateRangeValue() {
    const { checkInDate, checkOutDate } = this.data;
    const stayNights = Math.max(diffDays(checkInDate, checkOutDate), 1);
    this.setData({
      stayNights,
      dateRangeValue: [parseDate(checkInDate).getTime(), parseDate(checkOutDate).getTime()],
    });
  },
});
