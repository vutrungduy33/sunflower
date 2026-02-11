Component({
  properties: {
    current: {
      type: String,
      value: 'home',
    },
  },

  data: {
    tabs: [
      { key: 'home', label: '首页', icon: 'home', path: '/pages/mvp/home/index' },
      { key: 'booking', label: '预订', icon: 'calendar', path: '/pages/mvp/booking/index' },
      { key: 'map', label: '地图', icon: 'location', path: '/pages/mvp/map/index' },
      { key: 'discover', label: '发现', icon: 'app', path: '/pages/mvp/discover/index' },
      { key: 'mine', label: '我的', icon: 'user', path: '/pages/mvp/mine/index' },
    ],
  },

  methods: {
    onTap(event) {
      const { path, key } = event.currentTarget.dataset;
      if (!path || key === this.properties.current) {
        return;
      }
      wx.redirectTo({
        url: path,
      });
    },
  },
});
