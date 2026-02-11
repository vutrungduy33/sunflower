const { fetchRooms } = require('../../../utils/mvp/api');
const { addDays, diffDays, formatDate, getDefaultBookingDate } = require('../../../utils/mvp/date');
const { track } = require('../../../utils/mvp/tracker');

Page({
  data: {
    loading: true,
    rooms: [],
    keyword: '',
    checkInDate: '',
    checkOutDate: '',
    today: formatDate(new Date()),
  },

  onLoad() {
    const { checkIn, checkOut } = getDefaultBookingDate();
    this.setData(
      {
        checkInDate: checkIn,
        checkOutDate: checkOut,
      },
      () => {
        this.loadRooms();
      },
    );
  },

  async loadRooms() {
    const { checkInDate, keyword } = this.data;
    try {
      this.setData({ loading: true });
      const rooms = await fetchRooms({
        checkInDate,
        keyword,
      });
      this.setData({ rooms });
    } catch (error) {
      wx.showToast({ title: '房型加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onKeywordInput(event) {
    this.setData({ keyword: event.detail.value });
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
  },

  onCheckOutChange(event) {
    const nextCheckOut = event.detail.value;
    if (diffDays(this.data.checkInDate, nextCheckOut) <= 0) {
      wx.showToast({ title: '退房日期需晚于入住日期', icon: 'none' });
      return;
    }
    this.setData({ checkOutDate: nextCheckOut });
  },

  onSearch() {
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
});
