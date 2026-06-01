# Sunflower Miniapp

## 1. 目标

基于微信小程序原生框架，落地一期 MVP 业务闭环：

- 登录（后端 API）
- 手机号授权与绑定
- 首页内容与房型浏览
- 房型浏览与预订
- 订单创建、支付调起、订单中心
- 取消、改期、退款申请等售后入口

详细说明见：`/Users/chenyao/dev/miniapp/sunflower/docs/Miniapp-Frontend-MVP.md`

## 2. 入口与路由

- 默认首页：`pages/mvp/home/index`
- 页面目录：`pages/mvp/*`
- 底部导航组件：`components/mvp-tabbar`

## 3. 数据层

- `utils/mvp/api.js`：页面调用的数据访问层（已切换为真实 `wx.request`）
- `utils/mvp/payment.js`：微信支付调起与支付确认辅助逻辑
- `utils/mvp/runtime-config.js`：API base 运行时配置
- `utils/mvp/mock.js`：历史 mock 数据（当前联调不再作为事实源）
- `utils/mvp/store.js`：历史本地状态工具（当前联调不再作为事实源）
- `utils/mvp/tracker.js`：MVP 埋点记录

## 4. 本地运行

1. 微信开发者工具打开目录：`/Users/chenyao/dev/miniapp/sunflower/sunflower-miniapp`
2. 仓库默认使用 `touristappid`，可直接以游客模式打开并浏览页面
3. 若需调试微信登录等依赖真实小程序身份的能力，请复制
   `project.private.config.example.json` 为本地未跟踪的
   `project.private.config.json`，只在私有配置里填写真实 AppID；不要修改
   已提交的 `project.config.json`
4. 首次进入默认为 MVP 首页，可从底部导航体验主流程

## 5. 联调约定

小程序业务页继续通过 `utils/mvp/api.js` 访问后端，页面层方法签名保持不变。

当前已切换说明：

- 默认统一 API 入口来自 `utils/mvp/runtime-config.js` 的 `DEFAULT_API_BASE_URL`，发布前应改成正式 `HTTPS` 域名。
- 可通过 `wx.setStorageSync('SUNFLOWER_API_BASE_URL', 'https://你的统一入口地址')` 覆盖
- 真机扫码/预览若要直连小程序后端，必须使用 `HTTPS + 微信后台合法 request 域名`；裸 `http://IP` 仅适合开发联调排障。
- 已对齐后端接口：`/api/auth/*`、`/api/users/me`、`/api/content/home`、`/api/rooms*`、`/api/orders*`、`/api/poi`、`/api/posts`
- 支付主链路调用后端返回的微信支付参数并通过 `wx.requestPayment` 调起；开发/测试 mock 只在后端显式配置时可用，不能替代真实商户小额支付/退款验证。

## 6. 校验与交接

从仓库根目录执行：

```bash
node scripts/check_miniapp_mvp_smoke.js
node scripts/check_miniapp_behavior_wiring.js
node scripts/check_miniapp_external_qa_preflight.js
bash scripts/check_miniapp_project_config.sh
bash scripts/check_mvp_subpage_nav.sh
node scripts/check_miniapp_manual_qa.js
```

`node scripts/check_miniapp_manual_qa.js --strict` 仅用于最终 MVP 收口；在
真实 AppID、HTTPS 合法 request 域名、登录、手机号、支付、退款等外部证据补齐前会保持非零退出。

`node scripts/check_miniapp_behavior_wiring.js` 是静态接线守卫，用于检查登录、绑手机、房型浏览、下单、支付、取消、改期、退款等关键页面事件是否连到对应 API/支付工具；它不替代微信真机/预览验证。

交接入口：

- `docs/Miniapp-MVP-QA.md`：自动 smoke、DevTools/真机 QA 范围。
- `docs/Miniapp-Manual-QA.md`：人工 QA 证据规则。
- `docs/Miniapp-Manual-QA.json`：机器可检查的人工 QA 台账。
- `docs/MVP-Readiness.md`：当前 MVP 可用性和上线阻塞项。
