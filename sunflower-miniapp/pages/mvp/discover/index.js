const { fetchTravelNotes } = require('../../../utils/mvp/api');

Page({
  data: {
    loading: true,
    notes: [],
  },

  onLoad() {
    this.loadNotes();
  },

  async loadNotes() {
    try {
      this.setData({ loading: true });
      const notes = await fetchTravelNotes();
      this.setData({ notes });
    } catch (error) {
      wx.showToast({ title: '内容加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onPublish() {
    wx.showToast({ title: 'MVP 二期开放发布', icon: 'none' });
  },
});
