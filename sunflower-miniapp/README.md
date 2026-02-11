# Sunflower Miniapp（前端一期 MVP）

## 1. 目标

基于微信小程序原生框架，落地一期 MVP 业务闭环：
- 登录（mock）
- 房型浏览与预订
- 订单创建/支付（mock）
- 订单中心与手机号绑定

详细说明见：`/Users/chenyao/dev/miniapp/sunflower/docs/Miniapp-Frontend-MVP.md`

## 2. 入口与路由

- 默认首页：`pages/mvp/home/index`
- 页面目录：`pages/mvp/*`
- 底部导航组件：`components/mvp-tabbar`

## 3. 数据层

- `utils/mvp/mock.js`：mock 数据
- `utils/mvp/store.js`：本地 storage 状态
- `utils/mvp/api.js`：页面调用的数据访问层
- `utils/mvp/tracker.js`：MVP 埋点记录

## 4. 本地运行

1. 微信开发者工具打开目录：`/Users/chenyao/dev/miniapp/sunflower/sunflower-miniapp`
2. 使用已有 `project.config.json` 启动
3. 首次进入默认为 MVP 首页，可从底部导航体验主流程

## 5. 联调约定

后端联调时优先替换 `utils/mvp/api.js`，保持页面层方法签名不变。
