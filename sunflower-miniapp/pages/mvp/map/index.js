const { fetchPoiList } = require('../../../utils/mvp/api');

Page({
  data: {
    loading: true,
    poiList: [],
    markers: [],
    latitude: 27.742,
    longitude: 100.77,
  },

  onLoad() {
    this.loadPoiData();
  },

  async loadPoiData() {
    try {
      this.setData({ loading: true });
      const poiList = await fetchPoiList();
      const markers = poiList.map((poi, index) => ({
        id: index + 1,
        latitude: poi.latitude,
        longitude: poi.longitude,
        title: poi.name,
        width: 24,
        height: 24,
      }));

      const firstPoi = poiList[0];
      this.setData({
        poiList,
        markers,
        latitude: firstPoi ? firstPoi.latitude : this.data.latitude,
        longitude: firstPoi ? firstPoi.longitude : this.data.longitude,
      });
    } catch (error) {
      wx.showToast({ title: '地图加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  openNavigation(event) {
    const { latitude, longitude, name } = event.currentTarget.dataset;
    wx.openLocation({
      latitude: Number(latitude),
      longitude: Number(longitude),
      name,
      scale: 15,
    });
  },
});
