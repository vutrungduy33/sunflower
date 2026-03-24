const {
  fetchOrders,
  fetchProfile,
  patchProfile,
  postBindPhone,
  postLogout,
  uploadProfileAvatar,
} = require('../../../utils/mvp/api');
const { isDevelopOrTrialEnv } = require('../../../utils/mvp/env');
const { track } = require('../../../utils/mvp/tracker');

const EMPTY_PROFILE = Object.freeze({
  nickName: '',
  avatarUrl: '',
  phone: '',
  tags: [],
  isPhoneBound: false,
  needsProfileCompletion: false,
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
      (order) =>
        order &&
        (order.bookingStatus === 'CONFIRMED' || order.status === 'CONFIRMED' || order.status === 'RESCHEDULED')
    ).length,
    completed: orders.filter(
      (order) => order && (order.bookingStatus === 'CHECKED_OUT' || order.status === 'COMPLETED')
    ).length,
  };
}

function buildAvatarFallback(profile) {
  const nickname = `${(profile && profile.nickName) || ''}`.trim();
  return nickname ? nickname.slice(0, 1) : '葵';
}

Page({
  data: {
    loading: true,
    errorMessage: '',
    hasProfile: false,
    profile: { ...EMPTY_PROFILE },
    avatarFallbackText: '葵',
    orderStats: { ...EMPTY_ORDER_STATS },
    editingNickNameMode: false,
    pendingNickName: '',
    bindingPhone: '',
    canUseManualPhoneFallback: false,
    showManualPhoneFallback: false,
    avatarSubmitting: false,
    logoutSubmitting: false,
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
        avatarFallbackText: buildAvatarFallback(profile),
        orderStats,
        editingNickNameMode: false,
        pendingNickName: profile.nickName || '',
        bindingPhone: profile.phone || '',
      });
    } catch (error) {
      if (loadSeq !== this._loadSeq) {
        return;
      }
      this.setData({
        hasProfile: false,
        profile: { ...EMPTY_PROFILE },
        avatarFallbackText: '葵',
        orderStats: { ...EMPTY_ORDER_STATS },
        editingNickNameMode: false,
        pendingNickName: '',
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

  startEditingNickName() {
    if (!this.data.hasProfile) {
      return;
    }
    this.setData({
      editingNickNameMode: true,
      pendingNickName: (this.data.profile && this.data.profile.nickName) || '',
    });
  },

  cancelEditingNickName() {
    this.setData({
      editingNickNameMode: false,
      pendingNickName: (this.data.profile && this.data.profile.nickName) || '',
    });
  },

  async saveNickname() {
    const nickname = `${this.data.pendingNickName || ''}`.trim();
    const currentNickName = `${(this.data.profile && this.data.profile.nickName) || ''}`.trim();
    if (!nickname) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }

    if (nickname === currentNickName) {
      this.setData({
        editingNickNameMode: false,
        pendingNickName: currentNickName,
      });
      return;
    }

    try {
      const profile = normalizeProfile(await patchProfile({ nickName: nickname }));
      this.setData({
        hasProfile: true,
        profile,
        avatarFallbackText: buildAvatarFallback(profile),
        editingNickNameMode: false,
        pendingNickName: profile.nickName || '',
      });
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
      this.setData({
        hasProfile: true,
        profile,
        avatarFallbackText: buildAvatarFallback(profile),
      });
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
        avatarFallbackText: buildAvatarFallback(profile),
        bindingPhone: profile.phone || '',
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

  async onChooseAvatar(event) {
    const avatarPath = `${(event && event.detail && event.detail.avatarUrl) || ''}`.trim();
    if (!avatarPath) {
      wx.showToast({ title: '未获取到头像图片', icon: 'none' });
      return;
    }

    try {
      this.setData({ avatarSubmitting: true });
      const profile = normalizeProfile(await uploadProfileAvatar(avatarPath));
      this.setData({
        hasProfile: true,
        profile,
        avatarFallbackText: buildAvatarFallback(profile),
        pendingNickName: profile.nickName || '',
      });
      wx.showToast({ title: '头像已更新', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: error.message || '头像更新失败', icon: 'none' });
    } finally {
      this.setData({ avatarSubmitting: false });
    }
  },

  logout() {
    if (this.data.logoutSubmitting) {
      return;
    }
    wx.showModal({
      title: '退出登录',
      content: '退出后需要重新使用微信登录，是否继续？',
      confirmText: '退出登录',
      success: async (result) => {
        if (!result.confirm) {
          return;
        }
        try {
          this.setData({ logoutSubmitting: true });
          await postLogout();
          wx.reLaunch({ url: '/pages/mvp/login/index' });
        } catch (error) {
          wx.showToast({ title: error.message || '退出失败，请稍后重试', icon: 'none' });
        } finally {
          this.setData({ logoutSubmitting: false });
        }
      },
    });
  },

  goOrderList() {
    wx.navigateTo({ url: '/pages/mvp/order-list/index' });
  },
});
