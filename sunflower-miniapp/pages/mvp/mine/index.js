const {
  fetchOrders,
  fetchProfile,
  patchProfile,
  postBindPhone,
} = require('../../../utils/mvp/api');
const { isDevelopOrTrialEnv } = require('../../../utils/mvp/env');
const { track } = require('../../../utils/mvp/tracker');

const EMPTY_PROFILE = Object.freeze({
  nickName: '',
  phone: '',
  tags: [],
  isPhoneBound: false,
});

const EMPTY_ORDER_STATS = Object.freeze({
  pending: 0,
  confirmed: 0,
  completed: 0,
});

function normalizeProfile(profile) {
  const nextProfile = profile && typeof profile === 'object' ? profile : {};
  const tags = Array.isArray(nextProfile.tags) ? nextProfile.tags : [];
  return {
    ...EMPTY_PROFILE,
    ...nextProfile,
    tags,
  };
}

function normalizeOrders(orders) {
  return Array.isArray(orders)
    ? orders.map((order) => ({
        ...(order && typeof order === 'object' ? order : {}),
        status: `${(order && order.status) || ''}`.trim(),
        bookingStatus: `${(order && order.bookingStatus) || ''}`.trim(),
      }))
    : [];
}

function buildOrderStats(orders) {
  return {
    pending: orders.filter(
      (order) => order && (order.bookingStatus === 'PENDING_PAYMENT' || order.status === 'PENDING_PAYMENT')
    ).length,
    confirmed: orders.filter(
      (order) => order && (order.bookingStatus === 'CONFIRMED' || order.status === 'CONFIRMED' || order.status === 'RESCHEDULED')
    ).length,
    completed: orders.filter(
      (order) => order && (order.bookingStatus === 'CHECKED_OUT' || order.status === 'COMPLETED')
    ).length,
  };
}

function buildProfileMetaText(profile) {
  const phoneText = profile.isPhoneBound && profile.phone ? profile.phone : '未绑定手机号';
  return profile.tags.length ? `${phoneText} · ${profile.tags.join(' / ')}` : phoneText;
}

Page({
  data: {
    loading: true,
    errorMessage: '',
    hasProfile: false,
    profile: { ...EMPTY_PROFILE },
    profileMetaText: '',
    orderStats: { ...EMPTY_ORDER_STATS },
    editingNickName: '',
    bindingPhone: '',
    canUseManualPhoneFallback: false,
    showManualPhoneFallback: false,
  },

  onShow() {
    this.syncManualPhoneFallbackCapability();
    this.loadData();
  },

  syncManualPhoneFallbackCapability() {
    const canUseManualPhoneFallback = isDevelopOrTrialEnv();
    if (
      canUseManualPhoneFallback !== this.data.canUseManualPhoneFallback ||
      (!canUseManualPhoneFallback && this.data.showManualPhoneFallback)
    ) {
      this.setData({
        canUseManualPhoneFallback,
        showManualPhoneFallback: canUseManualPhoneFallback ? this.data.showManualPhoneFallback : false,
      });
    }
  },

  async loadData() {
    const loadSeq = (this._loadSeq || 0) + 1;
    this._loadSeq = loadSeq;

    try {
      this.setData({ loading: true, errorMessage: '' });
      // Avoid Promise.all destructuring here: lib 3.14.2 on devtools can throw
      // a render-layer null-iterable error while the page is switching tabs.
      const rawProfile = await fetchProfile();
      const profile = normalizeProfile(rawProfile);
      const orders = normalizeOrders(await fetchOrders());
      if (loadSeq !== this._loadSeq) {
        return;
      }

      const orderStats = buildOrderStats(orders);

      this.setData({
        hasProfile: !!rawProfile,
        profile,
        orderStats,
        editingNickName: profile.nickName || '',
        bindingPhone: profile.phone || '',
        profileMetaText: rawProfile ? buildProfileMetaText(profile) : '',
      });
    } catch (error) {
      if (loadSeq !== this._loadSeq) {
        return;
      }
      this.setData({
        hasProfile: false,
        profile: { ...EMPTY_PROFILE },
        profileMetaText: '',
        orderStats: { ...EMPTY_ORDER_STATS },
        editingNickName: '',
        bindingPhone: '',
        showManualPhoneFallback: false,
        errorMessage: error.message || '个人页加载失败，请稍后重试',
      });
    } finally {
      if (loadSeq === this._loadSeq) {
        this.setData({ loading: false });
      }
    }
  },

  retryLoadData() {
    this.loadData();
  },

  onInput(event) {
    const { field } = event.currentTarget.dataset;
    this.setData({
      [field]: event.detail.value,
    });
  },

  async saveNickname() {
    const nickname = `${this.data.editingNickName || ''}`.trim();
    if (!nickname) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }

    try {
      const profile = normalizeProfile(await patchProfile({ nickName: nickname }));
      this.setData({ hasProfile: true, profile, profileMetaText: buildProfileMetaText(profile) });
      wx.showToast({ title: '昵称已更新', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: error.message || '更新失败', icon: 'none' });
    }
  },

  async bindPhone() {
    const phone = `${this.data.bindingPhone || ''}`.trim();
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      return;
    }

    try {
      const profile = normalizeProfile(await postBindPhone(phone));
      this.setData({ hasProfile: true, profile, profileMetaText: buildProfileMetaText(profile) });
      track('bind_phone_success', { source: 'mine' });
      wx.showToast({ title: '绑定成功', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: error.message || '绑定失败', icon: 'none' });
    }
  },

  async bindPhoneWithWechat(event) {
    const detail = event && event.detail ? event.detail : {};
    const errMsg = `${detail.errMsg || ''}`;
    const phoneCode = `${detail.code || ''}`.trim();

    if (!phoneCode) {
      wx.showToast({
        title: errMsg.includes('deny') ? '你已取消手机号授权' : '未获取到手机号授权码',
        icon: 'none',
      });
      return;
    }

    try {
      const profile = normalizeProfile(await postBindPhone({ phoneCode }));
      this.setData({
        hasProfile: true,
        profile,
        bindingPhone: profile.phone || '',
        profileMetaText: buildProfileMetaText(profile),
        showManualPhoneFallback: false,
      });
      track('bind_phone_success', { source: 'mine', channel: 'wechat_phone' });
      wx.showToast({ title: '绑定成功', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: error.message || '绑定失败', icon: 'none' });
    }
  },

  toggleManualPhoneFallback() {
    if (!this.data.canUseManualPhoneFallback) {
      return;
    }
    this.setData({
      showManualPhoneFallback: !this.data.showManualPhoneFallback,
    });
  },

  goOrderList() {
    wx.navigateTo({ url: '/pages/mvp/order-list/index' });
  },

  goBooking() {
    wx.redirectTo({ url: '/pages/mvp/booking/index' });
  },
});
