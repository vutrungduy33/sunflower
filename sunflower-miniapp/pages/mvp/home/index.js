const {
  ensureWechatLogin,
  fetchHomeData,
  isLogoutRequired,
  patchProfile,
  uploadProfileAvatar,
} = require('../../../utils/mvp/api');
const { isDevelopOrTrialEnv } = require('../../../utils/mvp/env');
const { normalizeHomeData, normalizeProfile } = require('../../../utils/mvp/normalize');
const { track } = require('../../../utils/mvp/tracker');

function shouldPromptProfileCompletion(loginResult) {
  return !!(
    loginResult &&
    !loginResult.reusedToken &&
    loginResult.isNewUser &&
    loginResult.profile &&
    loginResult.profile.needsProfileCompletion
  );
}

function consumePendingProfilePrompt() {
  const app = getApp();
  if (!app || !app.globalData || !app.globalData.pendingProfilePrompt) {
    return null;
  }
  const pendingProfile = app.globalData.pendingProfilePromptProfile || null;
  app.globalData.pendingProfilePrompt = false;
  app.globalData.pendingProfilePromptProfile = null;
  return pendingProfile;
}

Page({
  data: {
    loading: true,
    errorMessage: '',
    showDevLoginEntry: false,
    banners: [],
    services: [],
    featuredRooms: [],
    memberBenefits: [],
    showProfilePrompt: false,
    profilePromptSubmitting: false,
    profilePromptNickName: '',
    profilePromptOriginalNickName: '',
    profilePromptAvatarPreview: '',
    profilePromptAvatarTempPath: '',
  },

  onLoad() {
    this.setData({ showDevLoginEntry: isDevelopOrTrialEnv() });
    this.bootstrap();
  },

  async bootstrap() {
    if (isLogoutRequired()) {
      this.setData({ loading: false, errorMessage: '' });
      wx.redirectTo({ url: '/pages/mvp/login/index' });
      return;
    }

    try {
      this.setData({ loading: true, errorMessage: '' });
      const loginResult = await ensureWechatLogin();
      const homeData = normalizeHomeData(await fetchHomeData());
      this.setData(homeData);
      if (loginResult && !loginResult.reusedToken) {
        track('wx_login_success', { source: 'mvp_home' });
      }
      const pendingProfile = consumePendingProfilePrompt();
      if (pendingProfile || shouldPromptProfileCompletion(loginResult)) {
        this.openProfilePrompt(pendingProfile || ((loginResult && loginResult.profile) || null));
      }
    } catch (error) {
      this.setData({
        banners: [],
        services: [],
        featuredRooms: [],
        memberBenefits: [],
        errorMessage: error.message || '首页加载失败，请稍后重试',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  retryBootstrap() {
    this.bootstrap();
  },

  openProfilePrompt(profile) {
    const nextProfile = normalizeProfile(profile);
    this.setData({
      showProfilePrompt: true,
      profilePromptSubmitting: false,
      profilePromptNickName: nextProfile.nickName || '',
      profilePromptOriginalNickName: nextProfile.nickName || '',
      profilePromptAvatarPreview: nextProfile.avatarUrl || '',
      profilePromptAvatarTempPath: '',
    });
  },

  onProfilePromptInput(event) {
    this.setData({
      profilePromptNickName: event.detail.value,
    });
  },

  onProfilePromptChooseAvatar(event) {
    const avatarPath = `${(event && event.detail && event.detail.avatarUrl) || ''}`.trim();
    if (!avatarPath) {
      wx.showToast({ title: '未获取到头像图片', icon: 'none' });
      return;
    }
    this.setData({
      profilePromptAvatarPreview: avatarPath,
      profilePromptAvatarTempPath: avatarPath,
    });
  },

  skipProfilePrompt() {
    this.setData({ showProfilePrompt: false });
  },

  async saveProfilePrompt() {
    const nickName = `${this.data.profilePromptNickName || ''}`.trim();
    const originalNickName = `${this.data.profilePromptOriginalNickName || ''}`.trim();
    const avatarTempPath = `${this.data.profilePromptAvatarTempPath || ''}`.trim();
    const hasNicknameChange = !!nickName && nickName !== originalNickName;

    if (!avatarTempPath && !hasNicknameChange) {
      wx.showToast({ title: '请选择头像或完善昵称', icon: 'none' });
      return;
    }

    try {
      this.setData({ profilePromptSubmitting: true });
      if (avatarTempPath) {
        await uploadProfileAvatar(avatarTempPath);
      }
      if (hasNicknameChange) {
        await patchProfile({ nickName });
      }
      this.setData({ showProfilePrompt: false });
      wx.showToast({ title: '资料已保存', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: error.message || '资料保存失败', icon: 'none' });
    } finally {
      this.setData({ profilePromptSubmitting: false });
    }
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

  goDevLogin() {
    wx.navigateTo({ url: '/pages/mvp/login/index' });
  },
});
