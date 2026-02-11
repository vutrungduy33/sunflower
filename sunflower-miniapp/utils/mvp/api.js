const {
  homeBanners,
  memberBenefits,
  poiList,
  roomList,
  serviceEntries,
  travelNotes,
  getPriceCalendar,
  getRoomById,
} = require('./mock');
const { getDefaultBookingDate } = require('./date');
const {
  bindPhone,
  cancelOrder,
  createOrder,
  getOrderById,
  getOrders,
  getProfile,
  payOrder,
  seedDemoData,
  updateProfile,
} = require('./store');

seedDemoData();

function requestDelay(ms = 150) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toRoomCard(room, checkInDate) {
  const calendar = getPriceCalendar(room.id, checkInDate);
  const todayPrice = calendar[0] ? calendar[0].price : room.basePrice;
  return {
    ...room,
    todayPrice,
    stock: calendar[0] ? calendar[0].stock : 0,
  };
}

async function wechatLogin(code) {
  await requestDelay();
  const profile = getProfile();
  return {
    token: `mock_token_${Date.now()}`,
    openId: `mock_openid_${code || 'anonymous'}`,
    profile,
  };
}

async function fetchHomeData() {
  await requestDelay();
  const { checkIn } = getDefaultBookingDate();
  return {
    banners: homeBanners,
    services: serviceEntries,
    featuredRooms: roomList.slice(0, 2).map((room) => toRoomCard(room, checkIn)),
    memberBenefits,
  };
}

async function fetchRooms(params = {}) {
  await requestDelay();
  const checkInDate = params.checkInDate;
  const keyword = `${params.keyword || ''}`.trim();
  return roomList
    .filter((room) => {
      if (!keyword) {
        return true;
      }
      return room.name.includes(keyword) || room.subtitle.includes(keyword) || room.scenicType.includes(keyword);
    })
    .map((room) => toRoomCard(room, checkInDate));
}

async function fetchRoomDetail(roomId, checkInDate) {
  await requestDelay();
  const room = getRoomById(roomId);
  if (!room) {
    throw new Error('房型不存在');
  }
  return {
    ...room,
    calendar: getPriceCalendar(room.id, checkInDate),
  };
}

async function fetchPoiList() {
  await requestDelay();
  return poiList;
}

async function fetchTravelNotes() {
  await requestDelay();
  return travelNotes;
}

async function fetchProfile() {
  await requestDelay();
  return getProfile();
}

async function patchProfile(payload) {
  await requestDelay();
  return updateProfile(payload);
}

async function postBindPhone(phone) {
  await requestDelay();
  return bindPhone(phone);
}

async function postCreateOrder(payload) {
  await requestDelay();
  return createOrder(payload);
}

async function postPayOrder(orderId) {
  await requestDelay();
  return payOrder(orderId);
}

async function fetchOrders() {
  await requestDelay();
  return getOrders();
}

async function fetchOrderDetail(orderId) {
  await requestDelay();
  return getOrderById(orderId);
}

async function postCancelOrder(orderId) {
  await requestDelay();
  return cancelOrder(orderId);
}

module.exports = {
  fetchHomeData,
  fetchOrderDetail,
  fetchOrders,
  fetchPoiList,
  fetchProfile,
  fetchRoomDetail,
  fetchRooms,
  fetchTravelNotes,
  patchProfile,
  postBindPhone,
  postCancelOrder,
  postCreateOrder,
  postPayOrder,
  wechatLogin,
};
