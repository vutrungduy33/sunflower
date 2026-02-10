# 接口清单（REST）

> 说明：以下为接口粒度与资源定义建议，实际可按团队技术栈调整。

## 1. 认证与用户

- `POST /api/auth/wechat/login`：微信登录（code 换取 session）  
- `POST /api/auth/bind-phone`：绑定手机号  
- `GET /api/users/me`：获取当前用户信息  
- `PATCH /api/users/me`：更新用户资料  

## 2. 房型与房态

- `GET /api/rooms`：房型列表  
- `GET /api/rooms/{id}`：房型详情  
- `GET /api/rooms/{id}/calendar`：价格与库存日历  
- `POST /api/admin/rooms`：新增房型（后台）  
- `PATCH /api/admin/rooms/{id}`：编辑房型  
- `POST /api/admin/room-inventory`：批量设置库存  
- `POST /api/admin/room-prices`：批量设置价格  

## 3. 住宿订单

- `POST /api/orders`：创建订单  
- `GET /api/orders`：用户订单列表  
- `GET /api/orders/{id}`：订单详情  
- `POST /api/orders/{id}/cancel`：取消订单  
- `POST /api/orders/{id}/reschedule`：改期申请  
- `POST /api/orders/{id}/pay`：发起支付  
- `POST /api/orders/{id}/refund`：退款申请  

## 4. 餐饮/商品

- `GET /api/products`：商品列表  
- `GET /api/products/{id}`：商品详情  
- `POST /api/food-orders`：创建餐饮订单  
- `GET /api/food-orders`：用户餐饮订单列表  
- `PATCH /api/admin/products/{id}`：商品管理（后台）  

## 5. 服务预订（接驳/猪槽船）

- `GET /api/services`：服务列表  
- `POST /api/service-orders`：服务下单  
- `GET /api/service-orders`：用户服务订单  
- `PATCH /api/admin/service-orders/{id}`：确认/取消（后台）  

## 6. 内容与社区

- `GET /api/poi`：景点/餐饮 POI 列表  
- `GET /api/poi/{id}`：POI 详情  
- `GET /api/posts`：游记列表  
- `POST /api/posts`：发布游记  
- `GET /api/reviews`：评论列表  
- `POST /api/reviews`：发布评论  
- `POST /api/admin/posts/{id}/review`：内容审核（后台）  

## 7. 营销与优惠券

- `GET /api/coupons`：可领取优惠券  
- `POST /api/coupons/{id}/claim`：领取优惠券  
- `POST /api/orders/{id}/apply-coupon`：订单使用优惠券  
- `POST /api/admin/coupons`：创建优惠券（后台）  

## 8. 报表与对账（后台）

- `GET /api/admin/reports/summary`：经营概览  
- `GET /api/admin/reports/orders`：订单报表  
- `GET /api/admin/reports/payments`：支付对账  

## 9. 管理与权限

- `GET /api/admin/users`：后台用户  
- `POST /api/admin/roles`：角色与权限  
- `PATCH /api/admin/settings`：系统配置  
