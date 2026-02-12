import gulpError from './utils/gulpError';
App({
    globalData: {
        // 小程序端后端地址，可在启动前通过 storage 覆盖：SUNFLOWER_API_BASE_URL
        apiBaseUrl: 'http://8.155.148.126',
    },
    onShow() {
        if (gulpError !== 'gulpErrorPlaceHolder') {
            wx.redirectTo({
                url: `/pages/gulp-error/index?gulpError=${gulpError}`,
            });
        }
    },
});
