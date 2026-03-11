const { fetchTravelNotes } = require('../../../utils/mvp/api');
const { normalizeTravelNotes } = require('../../../utils/mvp/normalize');

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
      const notes = normalizeTravelNotes(await fetchTravelNotes());
      this.setData({ notes });
    } catch (error) {
      this.setData({ notes: [] });
      wx.showToast({ title: '内容加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onPublish() {
    wx.showToast({ title: 'MVP 二期开放发布', icon: 'none' });
  },
});
