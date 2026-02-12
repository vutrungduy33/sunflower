# Sunflower Miniapp（前端一期 MVP）

## 1. 目标

基于微信小程序原生框架，落地一期 MVP 业务闭环：
- 登录（后端 API）
- 房型浏览与预订
- 订单创建/支付（后端模拟支付接口）
- 订单中心与手机号绑定

详细说明见：`/Users/chenyao/dev/miniapp/sunflower/docs/Miniapp-Frontend-MVP.md`

## 2. 入口与路由

- 默认首页：`pages/mvp/home/index`
- 页面目录：`pages/mvp/*`
- 底部导航组件：`components/mvp-tabbar`

## 3. 数据层

- `utils/mvp/api.js`：页面调用的数据访问层（已切换为真实 `wx.request`）
- `utils/mvp/mock.js`：历史 mock 数据（当前联调不再作为事实源）
- `utils/mvp/store.js`：历史本地状态工具（当前联调不再作为事实源）
- `utils/mvp/tracker.js`：MVP 埋点记录

## 4. 本地运行

1. 微信开发者工具打开目录：`/Users/chenyao/dev/miniapp/sunflower/sunflower-miniapp`
2. 使用已有 `project.config.json` 启动
3. 首次进入默认为 MVP 首页，可从底部导航体验主流程

## 5. 联调约定

小程序业务页继续通过 `utils/mvp/api.js` 访问后端，页面层方法签名保持不变。

当前已切换说明：
- 默认后端地址：`http://8.155.148.126`（Nginx 80 反向代理到后端 8080）
- 可通过 `wx.setStorageSync('SUNFLOWER_API_BASE_URL', 'http://你的后端地址:端口')` 覆盖
- 已对齐后端接口：`/api/auth/*`、`/api/users/me`、`/api/content/home`、`/api/rooms*`、`/api/orders*`、`/api/poi`、`/api/posts`
