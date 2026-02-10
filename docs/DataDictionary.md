# 数据字典（核心表）

> 建议采用 MySQL/PostgreSQL。字段类型可按技术栈调整。

## 1. 用户与权限

**users**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint | 主键 |
| openid | varchar | 微信 OpenID |
| unionid | varchar | 微信 UnionID |
| phone | varchar | 手机号 |
| nickname | varchar | 昵称 |
| avatar | varchar | 头像 |
| status | tinyint | 0禁用/1正常 |
| created_at | datetime | 创建时间 |

**user_profiles**
| 字段 | 类型 | 说明 |
|---|---|---|
| user_id | bigint | 用户 ID |
| tags | json | 用户标签 |
| preferences | json | 偏好 |

**roles / user_roles**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint | 角色 ID |
| name | varchar | 角色名称 |

## 2. 房态与订单

**rooms**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint | 房型 ID |
| name | varchar | 房型名称 |
| view_type | varchar | 湖景/山景 |
| bed_type | varchar | 床型 |
| capacity | int | 可住人数 |
| base_price | decimal | 基础价 |
| status | tinyint | 上架状态 |

**room_inventory**
| 字段 | 类型 | 说明 |
|---|---|---|
| room_id | bigint | 房型 ID |
| date | date | 日期 |
| available | int | 可售数量 |

**room_prices**
| 字段 | 类型 | 说明 |
|---|---|---|
| room_id | bigint | 房型 ID |
| date | date | 日期 |
| price | decimal | 当日价格 |

**orders**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint | 订单 ID |
| user_id | bigint | 用户 ID |
| status | varchar | 订单状态 |
| total_amount | decimal | 订单总额 |
| checkin_date | date | 入住 |
| checkout_date | date | 退房 |
| created_at | datetime | 创建时间 |

**order_items**
| 字段 | 类型 | 说明 |
|---|---|---|
| order_id | bigint | 订单 ID |
| room_id | bigint | 房型 |
| nights | int | 晚数 |
| price | decimal | 单价 |

**payments / refunds**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint | 支付/退款 ID |
| order_id | bigint | 订单 ID |
| amount | decimal | 金额 |
| status | varchar | 状态 |
| channel | varchar | 支付渠道 |

## 3. 餐饮与商品

**products**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint | 商品 ID |
| category_id | bigint | 分类 |
| name | varchar | 名称 |
| price | decimal | 价格 |
| stock | int | 库存 |

**food_orders**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint | 订单 ID |
| user_id | bigint | 用户 |
| status | varchar | 订单状态 |
| total_amount | decimal | 总额 |

## 4. 内容与社区

**poi**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint | POI ID |
| name | varchar | 名称 |
| type | varchar | 景点/餐饮 |
| location | point | 经纬度 |

**posts**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint | 游记 ID |
| user_id | bigint | 发布者 |
| title | varchar | 标题 |
| content | text | 内容 |
| status | varchar | 审核状态 |

**reviews**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint | 评论 ID |
| user_id | bigint | 用户 |
| target_type | varchar | 订单/POI/餐饮 |
| target_id | bigint | 关联 ID |
| score | int | 评分 |
| content | text | 评论 |

**media_assets**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint | 资源 ID |
| url | varchar | 资源地址 |
| owner_id | bigint | 关联对象 |

## 5. 营销

**coupons**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint | 优惠券 ID |
| name | varchar | 名称 |
| value | decimal | 面值 |
| rules | json | 使用规则 |

**coupon_redemptions**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint | 领取记录 |
| coupon_id | bigint | 优惠券 |
| user_id | bigint | 用户 |
| status | varchar | 已用/未用 |
