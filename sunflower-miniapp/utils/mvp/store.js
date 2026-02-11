const { diffDays, formatDate, getDefaultBookingDate } = require('./date');
const { getPriceCalendar, getRoomById } = require('./mock');

const STORAGE_KEYS = {
  PROFILE: 'sunflower_mvp_profile',
  ORDERS: 'sunflower_mvp_orders',
};

const ORDER_STATUS = {
  PENDING_PAYMENT: '待支付',
  CONFIRMED: '待入住',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

const defaultProfile = {
  nickName: '微信用户',
  phone: '',
  tags: ['亲子', '湖景偏好'],
  isPhoneBound: false,
};

function readStorage(key, fallback) {
  try {
    const data = wx.getStorageSync(key);
    return data || fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  wx.setStorageSync(key, value);
}

function getProfile() {
  const profile = readStorage(STORAGE_KEYS.PROFILE, null);
  if (profile) {
    return profile;
  }
  writeStorage(STORAGE_KEYS.PROFILE, defaultProfile);
  return defaultProfile;
}

function updateProfile(payload) {
  const profile = {
    ...getProfile(),
    ...payload,
  };
  writeStorage(STORAGE_KEYS.PROFILE, profile);
  return profile;
}

function bindPhone(phone) {
  const normalizedPhone = `${phone}`.trim();
  return updateProfile({
    phone: normalizedPhone,
    isPhoneBound: true,
  });
}

function getOrderStatusLabel(status) {
  return ORDER_STATUS[status] || status;
}

function formatOrder(order) {
  return {
    ...order,
    statusLabel: getOrderStatusLabel(order.status),
  };
}

function getOrders() {
  const orders = readStorage(STORAGE_KEYS.ORDERS, []);
  return orders
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((order) => formatOrder(order));
}

function getRawOrders() {
  return readStorage(STORAGE_KEYS.ORDERS, []);
}

function getOrderById(orderId) {
  return getOrders().find((order) => order.id === orderId) || null;
}

function writeOrders(orders) {
  writeStorage(STORAGE_KEYS.ORDERS, orders);
}

function buildOrderNo() {
  const datePart = formatDate(new Date()).replace(/-/g, '');
  const randomPart = `${Math.floor(Math.random() * 9000 + 1000)}`;
  return `SF${datePart}${randomPart}`;
}

function calculateOrderAmount(roomId, checkInDate, nights) {
  const calendar = getPriceCalendar(roomId, checkInDate);
  const activeCalendar = calendar.slice(0, Math.max(nights, 1));
  const total = activeCalendar.reduce((sum, item) => sum + item.price, 0);
  return total || 0;
}

function createOrder(payload) {
  const room = getRoomById(payload.roomId);
  if (!room) {
    throw new Error('房型不存在');
  }

  const nights = Math.max(diffDays(payload.checkInDate, payload.checkOutDate), 1);
  const totalAmount = calculateOrderAmount(payload.roomId, payload.checkInDate, nights);

  const order = {
    id: `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    orderNo: buildOrderNo(),
    source: payload.source || 'direct',
    roomId: room.id,
    roomName: room.name,
    checkInDate: payload.checkInDate,
    checkOutDate: payload.checkOutDate,
    nights,
    guestName: payload.guestName,
    guestPhone: payload.guestPhone,
    arrivalTime: payload.arrivalTime,
    remark: payload.remark || '',
    totalAmount,
    status: 'PENDING_PAYMENT',
    createdAt: new Date().toISOString(),
    paidAt: '',
  };

  const orders = getRawOrders().map((item) => ({ ...item }));
  orders.unshift(order);
  writeOrders(orders);
  return formatOrder(order);
}

function payOrder(orderId) {
  const orders = getRawOrders().map((item) => ({ ...item }));
  const order = orders.find((item) => item.id === orderId);
  if (!order) {
    throw new Error('订单不存在');
  }
  order.status = 'CONFIRMED';
  order.paidAt = new Date().toISOString();
  writeOrders(orders);
  return formatOrder(order);
}

function cancelOrder(orderId) {
  const orders = getRawOrders().map((item) => ({ ...item }));
  const order = orders.find((item) => item.id === orderId);
  if (!order) {
    throw new Error('订单不存在');
  }
  if (order.status !== 'PENDING_PAYMENT' && order.status !== 'CONFIRMED') {
    throw new Error('当前订单状态不可取消');
  }
  order.status = 'CANCELLED';
  writeOrders(orders);
  return formatOrder(order);
}

function seedDemoData() {
  const profile = readStorage(STORAGE_KEYS.PROFILE, null);
  if (!profile) {
    writeStorage(STORAGE_KEYS.PROFILE, defaultProfile);
  }

  const orders = readStorage(STORAGE_KEYS.ORDERS, []);
  if (orders.length > 0) {
    return;
  }

  const { checkIn, checkOut } = getDefaultBookingDate();
  const demoOrder = {
    id: `order_seed_${Date.now()}`,
    orderNo: buildOrderNo(),
    source: 'direct',
    roomId: 'room-mountain-203',
    roomName: '静谧山景双床房',
    checkInDate: checkIn,
    checkOutDate: checkOut,
    nights: 1,
    guestName: '演示住客',
    guestPhone: '13800000000',
    arrivalTime: '18:00',
    remark: '系统初始化订单',
    totalAmount: calculateOrderAmount('room-mountain-203', checkIn, 1),
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  };

  writeOrders([demoOrder]);
}

module.exports = {
  bindPhone,
  cancelOrder,
  createOrder,
  getOrderById,
  getOrders,
  getProfile,
  payOrder,
  seedDemoData,
  updateProfile,
};
