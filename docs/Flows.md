# 关键流程与状态说明

## 1. 住客预订流程（小程序）

1. 首页/房型列表 → 选择房型  
2. 选择入住日期 → 展示价格日历与可售库存  
3. 填写入住人/联系方式 → 确认订单  
4. 模拟支付 → 支付成功  
5. M1 订单状态主路径：`PENDING_PAYMENT`（待支付）→ `CONFIRMED`（待入住）

### 异常流程
- 取消订单：`PENDING_PAYMENT/CONFIRMED` → `CANCELLED`
- 改期：`CONFIRMED/RESCHEDULED` → `RESCHEDULED`
- 退款：`CONFIRMED/RESCHEDULED` → `REFUNDED`

## 2. 接驳服务流程

1. 选择接驳服务 → 输入航班/到达时间  
2. 系统生成接驳订单 → 运营审核  
3. 车队确认 → 用户通知  
4. 服务完成 → 支付/结算

## 3. 猪槽船预订流程

1. 选择时间段与人数 → 生成订单  
2. 库存扣减 → 订单确认  
3. 到店核销 → 完成  

## 4. 餐饮/商品点单流程

1. 菜单浏览 → 下单 → 支付  
2. 出单 → 配送/自取  
3. 订单完成 → 评价  

## 5. 游记/点评发布流程

1. 发布内容（图文）  
2. 机器审核 + 人工抽检  
3. 发布成功/驳回  

## 6. OTA 转私域流程（建议）

1. 入住前短信/二维码引导  
2. 小程序注册绑定手机号  
3. 入住完成后发券 → 引导复购  
4. 复购/会员权益

## 7. 订单状态枚举

### 7.1 住宿订单
- `PENDING_PAYMENT`（待支付）
- `CONFIRMED`（待入住）
- `RESCHEDULED`（已改期）
- `REFUNDED`（已退款）
- `COMPLETED`（已完成）
- `CANCELLED`（已取消）

### 7.2 餐饮订单
- `pending_payment` → `paid` → `preparing` → `delivering` → `completed`

### 7.3 服务订单（接驳/猪槽船）
- `pending_confirm` → `confirmed` → `completed` / `cancelled`
