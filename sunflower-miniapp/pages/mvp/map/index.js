const { fetchPoiList } = require('../../../utils/mvp/api');
const { normalizePoiList, toFiniteNumber } = require('../../../utils/mvp/normalize');

function toMarkerCoordinate(value) {
  if (value === null || value === undefined || `${value}`.trim() === '') {
    return NaN;
  }
  return toFiniteNumber(value, NaN);
}

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
      const poiList = normalizePoiList(await fetchPoiList());
      const markers = poiList
        .map((poi, index) => ({
          id: index + 1,
          latitude: toMarkerCoordinate(poi.latitude),
          longitude: toMarkerCoordinate(poi.longitude),
          title: poi.name,
          width: 24,
          height: 24,
        }))
        .filter((marker) => Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude));

      const firstMarker = markers[0];
      this.setData({
        poiList,
        markers,
        latitude: firstMarker ? firstMarker.latitude : this.data.latitude,
        longitude: firstMarker ? firstMarker.longitude : this.data.longitude,
      });
    } catch (error) {
      this.setData({
        poiList: [],
        markers: [],
      });
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
