const { ensureWechatLogin, fetchHomeData } = require('../../../utils/mvp/api');
const { track } = require('../../../utils/mvp/tracker');

Page({
  data: {
    loading: true,
    errorMessage: '',
    banners: [],
    services: [],
    featuredRooms: [],
    memberBenefits: [],
  },

  onLoad() {
    this.bootstrap();
  },

  async bootstrap() {
    try {
      this.setData({ loading: true, errorMessage: '' });
      const loginResult = await ensureWechatLogin();
      const homeData = await fetchHomeData();
      this.setData({
        banners: homeData.banners,
        services: homeData.services,
        featuredRooms: homeData.featuredRooms,
        memberBenefits: homeData.memberBenefits,
      });
      if (loginResult && !loginResult.reusedToken) {
        track('wx_login_success', { source: 'mvp_home' });
      }
    } catch (error) {
      this.setData({
        errorMessage: error.message || '首页加载失败，请稍后重试',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  retryBootstrap() {
    this.bootstrap();
  },

  goBooking() {
    wx.redirectTo({ url: '/pages/mvp/booking/index' });
  },

  goRoomDetail(event) {
    const { roomid } = event.currentTarget.dataset;
    track('room_view', { roomId: roomid, source: 'home' });
    wx.navigateTo({ url: `/pages/mvp/room-detail/index?roomId=${roomid}` });
  },

  onServiceTap(event) {
    const { name } = event.currentTarget.dataset;
    wx.showToast({ title: `${name} 功能开发中`, icon: 'none' });
  },

  goOrderCenter() {
    wx.navigateTo({ url: '/pages/mvp/order-list/index' });
  },
});
