function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeObject(value) {
  return isObject(value) ? value : {};
}

function normalizeObjectArray(value) {
  return normalizeArray(value).filter(isObject);
}

function normalizeStringArray(value) {
  return normalizeArray(value)
    .map((item) => `${item == null ? '' : item}`.trim())
    .filter(Boolean);
}

function toFiniteNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

const EMPTY_PROFILE = Object.freeze({
  nickName: '',
  phone: '',
  tags: [],
  isPhoneBound: false,
});

function normalizeProfile(profile) {
  const next = normalizeObject(profile);
  return {
    ...EMPTY_PROFILE,
    ...next,
    tags: normalizeStringArray(next.tags),
  };
}

function normalizeRoomSummary(room) {
  const next = normalizeObject(room);
  return {
    ...next,
    tags: normalizeStringArray(next.tags),
  };
}

function normalizeCalendar(calendar) {
  return normalizeObjectArray(calendar).map((item) => ({
    ...item,
    price: toFiniteNumber(item.price, 0),
    stock: toFiniteNumber(item.stock, 0),
  }));
}

function normalizeRoomDetail(detail) {
  const next = normalizeRoomSummary(detail);
  return {
    ...next,
    calendar: normalizeCalendar(next.calendar),
    amenities: normalizeStringArray(next.amenities),
    rules: normalizeStringArray(next.rules),
  };
}

function normalizeRoomList(rooms) {
  return normalizeObjectArray(rooms).map((room) => normalizeRoomSummary(room));
}

function normalizeHomeData(homeData) {
  const next = normalizeObject(homeData);
  return {
    banners: normalizeObjectArray(next.banners),
    services: normalizeObjectArray(next.services),
    featuredRooms: normalizeRoomList(next.featuredRooms),
    memberBenefits: normalizeStringArray(next.memberBenefits),
  };
}

function normalizeTravelNotes(notes) {
  return normalizeObjectArray(notes).map((note) => {
    const next = normalizeObject(note);
    return {
      ...next,
      tags: normalizeStringArray(next.tags),
    };
  });
}

function normalizePoiList(poiList) {
  return normalizeObjectArray(poiList);
}

function normalizeOrder(order) {
  const next = normalizeObject(order);
  const status = `${next.status || ''}`.trim();
  const bookingStatus = `${next.bookingStatus || ''}`.trim();
  const paymentStatus = `${next.paymentStatus || ''}`.trim();
  const latestAfterSaleStatus = `${next.latestAfterSaleStatus || ''}`.trim();

  return {
    ...next,
    status,
    bookingStatus,
    paymentStatus,
    latestAfterSaleType: `${next.latestAfterSaleType || ''}`.trim(),
    latestAfterSaleStatus,
    latestAfterSaleStatusLabel: `${next.latestAfterSaleStatusLabel || ''}`.trim(),
    latestAfterSaleRejectReason: `${next.latestAfterSaleRejectReason || ''}`.trim(),
    statusLabel: `${next.statusLabel || status}`.trim() || status,
    canPay: status === 'PENDING_PAYMENT',
    canCancel: bookingStatus ? bookingStatus === 'PENDING_PAYMENT' : status === 'PENDING_PAYMENT',
    canReschedule:
      bookingStatus === 'CONFIRMED' && paymentStatus === 'PAID' && latestAfterSaleStatus !== 'REQUESTED',
    canRefund:
      bookingStatus === 'CONFIRMED' && paymentStatus === 'PAID' && latestAfterSaleStatus !== 'REQUESTED',
  };
}

function normalizeOrders(orders) {
  return normalizeObjectArray(orders).map((order) => normalizeOrder(order));
}

module.exports = {
  normalizeCalendar,
  normalizeHomeData,
  normalizeOrder,
  normalizeOrders,
  normalizePoiList,
  normalizeProfile,
  normalizeRoomDetail,
  normalizeRoomList,
  normalizeTravelNotes,
  toFiniteNumber,
};
