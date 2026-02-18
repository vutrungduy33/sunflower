const {
  fetchOrders,
  fetchProfile,
  patchProfile,
  postBindPhone,
} = require('../../../utils/mvp/api');
const { track } = require('../../../utils/mvp/tracker');

function normalizeProfile(profile) {
  const nextProfile = profile || {};
  const tags = Array.isArray(nextProfile.tags) ? nextProfile.tags : [];
  return {
    ...nextProfile,
    tags,
  };
}

Page({
  data: {
    loading: true,
    errorMessage: '',
    profile: null,
    tagsText: '',
    orderStats: {
      pending: 0,
      confirmed: 0,
      completed: 0,
    },
    editingNickName: '',
    bindingPhone: '',
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    const loadSeq = (this._loadSeq || 0) + 1;
    this._loadSeq = loadSeq;

    try {
      this.setData({ loading: true, errorMessage: '' });
      const [profile, orders] = await Promise.all([fetchProfile(), fetchOrders()]);
      if (loadSeq !== this._loadSeq) {
        return;
      }

      const normalizedProfile = normalizeProfile(profile);

      const orderStats = {
        pending: orders.filter((order) => order.status === 'PENDING_PAYMENT').length,
        confirmed: orders.filter((order) => order.status === 'CONFIRMED').length,
        completed: orders.filter((order) => order.status === 'COMPLETED').length,
      };

      this.setData({
        profile: normalizedProfile,
        orderStats,
        editingNickName: normalizedProfile.nickName || '',
        bindingPhone: normalizedProfile.phone || '',
        tagsText: normalizedProfile.tags.join(' / '),
      });
    } catch (error) {
      if (loadSeq !== this._loadSeq) {
        return;
      }
      this.setData({
        profile: null,
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
      this.setData({ profile, tagsText: profile.tags.join(' / ') });
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
      this.setData({ profile, tagsText: profile.tags.join(' / ') });
      track('bind_phone_success', { source: 'mine' });
      wx.showToast({ title: '绑定成功', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: error.message || '绑定失败', icon: 'none' });
    }
  },

  goOrderList() {
    wx.navigateTo({ url: '/pages/mvp/order-list/index' });
  },

  goBooking() {
    wx.redirectTo({ url: '/pages/mvp/booking/index' });
  },
});
