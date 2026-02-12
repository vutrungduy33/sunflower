Component({
  properties: {
    homePath: {
      type: String,
      value: '/pages/mvp/home/index',
    },
    backLabel: {
      type: String,
      value: '返回上一页',
    },
    homeLabel: {
      type: String,
      value: '返回首页',
    },
  },

  methods: {
    goBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack({ delta: 1 });
        return;
      }
      this.goHome();
    },

    goHome() {
      const pages = getCurrentPages();
      const currentRoute = pages.length ? `/${pages[pages.length - 1].route}` : '';
      if (currentRoute === this.properties.homePath) {
        return;
      }
      wx.reLaunch({
        url: this.properties.homePath,
      });
    },
  },
});
