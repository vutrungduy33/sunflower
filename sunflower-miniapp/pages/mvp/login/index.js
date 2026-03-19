const {
  clearAuthToken,
  fetchProfile,
  hasAuthToken,
  wechatLogin,
} = require('../../../utils/mvp/api');
const { getMiniProgramEnvVersion, isDevelopOrTrialEnv } = require('../../../utils/mvp/env');
const { track } = require('../../../utils/mvp/tracker');

const EMPTY_PROFILE = Object.freeze({
  nickName: '',
  phone: '',
  tags: [],
  isPhoneBound: false,
});

function normalizeProfile(profile) {
  const nextProfile = profile && typeof profile === 'object' ? profile : {};
  return {
    ...EMPTY_PROFILE,
    ...nextProfile,
    tags: Array.isArray(nextProfile.tags) ? nextProfile.tags : [],
  };
}

Page({
  data: {
    envVersion: '',
    canUseLoginTest: false,
    hasToken: false,
    loggingIn: false,
    loadingProfile: false,
    loginMessage: '',
    openId: '',
    profile: { ...EMPTY_PROFILE },
  },

  onShow() {
    this.syncState();
  },

  async syncState() {
    const envVersion = getMiniProgramEnvVersion();
    const canUseLoginTest = isDevelopOrTrialEnv();
    const hasToken = hasAuthToken();

    this.setData({
      envVersion,
      canUseLoginTest,
      hasToken,
      loginMessage: canUseLoginTest ? '' : '当前环境不是 develop/trial，登录测试页仅用于开发调试。',
    });

    if (!hasToken) {
      this.setData({
        openId: '',
        profile: { ...EMPTY_PROFILE },
      });
      return;
    }

    this.setData({ loadingProfile: true });
    try {
      const profile = normalizeProfile(await fetchProfile());
      this.setData({
        profile,
        loginMessage: canUseLoginTest ? '已检测到现有登录态。' : this.data.loginMessage,
      });
    } catch (error) {
      clearAuthToken();
      this.setData({
        hasToken: false,
        openId: '',
        profile: { ...EMPTY_PROFILE },
        loginMessage: error.message || '现有登录态已失效，请重新登录。',
      });
    } finally {
      this.setData({ loadingProfile: false });
    }
  },

  async loginWithWechat() {
    if (!this.data.canUseLoginTest) {
      wx.showToast({ title: '当前环境不支持该测试入口', icon: 'none' });
      return;
    }

    this.setData({ loggingIn: true, loginMessage: '' });
    try {
      const loginData = await wechatLogin();
      const profile = normalizeProfile(loginData && loginData.profile);
      this.setData({
        hasToken: true,
        openId: `${(loginData && loginData.openId) || ''}`.trim(),
        profile,
        loginMessage: '微信登录成功，已写入本地登录态。',
      });
      track('wx_login_success', { source: 'mvp_login_page', envVersion: this.data.envVersion || 'unknown' });
      wx.showToast({ title: '登录成功', icon: 'success' });
    } catch (error) {
      this.setData({
        loginMessage: error.message || '微信登录失败，请稍后重试。',
      });
      wx.showToast({ title: error.message || '登录失败', icon: 'none' });
    } finally {
      this.setData({ loggingIn: false });
    }
  },

  clearLoginState() {
    clearAuthToken();
    this.setData({
      hasToken: false,
      openId: '',
      profile: { ...EMPTY_PROFILE },
      loginMessage: '已清除本地登录态，可重新发起微信登录。',
    });
    wx.showToast({ title: '已清除登录态', icon: 'success' });
  },

  goHome() {
    wx.switchTab({ url: '/pages/mvp/home/index' });
  },

  goMine() {
    wx.switchTab({ url: '/pages/mvp/mine/index' });
  },
});
