import gulpError from './utils/gulpError';
const { DEFAULT_API_BASE_URL } = require('./utils/mvp/runtime-config');

App({
    globalData: {
        // 小程序端统一 API 入口地址，可在启动前通过 storage 覆盖：SUNFLOWER_API_BASE_URL
        apiBaseUrl: DEFAULT_API_BASE_URL,
        pendingProfilePrompt: false,
        pendingProfilePromptProfile: null,
    },
    onShow() {
        if (gulpError !== 'gulpErrorPlaceHolder') {
            wx.redirectTo({
                url: `/pages/gulp-error/index?gulpError=${gulpError}`,
            });
        }
    },
});
