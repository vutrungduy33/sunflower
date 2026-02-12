const { getDefaultBookingDate } = require('./date');

const STORAGE_KEY_API_BASE_URL = 'SUNFLOWER_API_BASE_URL';
const DEFAULT_API_BASE_URL = 'http://8.155.148.126';

function safeGetApp() {
  try {
    return getApp();
  } catch (error) {
    return null;
  }
}

function getApiBaseUrl() {
  const app = safeGetApp();
  const appBaseUrl = app && app.globalData ? app.globalData.apiBaseUrl : '';
  const storageBaseUrl = wx.getStorageSync(STORAGE_KEY_API_BASE_URL);
  const value = `${storageBaseUrl || appBaseUrl || DEFAULT_API_BASE_URL}`.trim();
  return value.replace(/\/+$/, '');
}

function setApiBaseUrl(baseUrl) {
  const value = `${baseUrl || ''}`.trim().replace(/\/+$/, '');
  if (!value) {
    throw new Error('API 地址不能为空');
  }
  wx.setStorageSync(STORAGE_KEY_API_BASE_URL, value);
  const app = safeGetApp();
  if (app && app.globalData) {
    app.globalData.apiBaseUrl = value;
  }
  return value;
}

function buildUrl(path) {
  if (!path.startsWith('/')) {
    throw new Error(`非法 API 路径: ${path}`);
  }
  return `${getApiBaseUrl()}${path}`;
}

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: buildUrl(path),
      method: options.method || 'GET',
      data: options.data,
      timeout: options.timeout || 12000,
      header: {
        'content-type': 'application/json',
        ...(options.header || {}),
      },
      success(response) {
        const { statusCode, data } = response;
        if (statusCode < 200 || statusCode >= 300) {
          reject(new Error((data && data.message) || `请求失败(${statusCode})`));
          return;
        }

        if (data && typeof data.code === 'number') {
          if (data.code !== 0) {
            reject(new Error(data.message || '请求失败'));
            return;
          }
          resolve(data.data);
          return;
        }

        resolve(data);
      },
      fail(error) {
        reject(new Error((error && error.errMsg) || '网络异常，请检查后端服务'));
      },
    });
  });
}

function withQuery(params = {}) {
  const query = {};
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value === undefined || value === null || `${value}`.trim() === '') {
      return;
    }
    query[key] = value;
  });
  return query;
}

async function wechatLogin(code) {
  return request('/api/auth/wechat/login', {
    method: 'POST',
    data: {
      code: `${code || 'anonymous'}`,
    },
  });
}

async function fetchHomeData() {
  const { checkIn } = getDefaultBookingDate();
  return request('/api/content/home', {
    data: {
      checkInDate: checkIn,
    },
  });
}

async function fetchRooms(params = {}) {
  return request('/api/rooms', {
    data: withQuery({
      checkInDate: params.checkInDate,
      keyword: params.keyword,
    }),
  });
}

async function fetchRoomDetail(roomId, checkInDate) {
  return request(`/api/rooms/${roomId}`, {
    data: withQuery({ checkInDate }),
  });
}

async function fetchPoiList() {
  return request('/api/poi');
}

async function fetchTravelNotes() {
  return request('/api/posts');
}

async function fetchProfile() {
  return request('/api/users/me');
}

async function patchProfile(payload) {
  return request('/api/users/me', {
    method: 'PATCH',
    data: payload,
  });
}

async function postBindPhone(phone) {
  return request('/api/auth/bind-phone', {
    method: 'POST',
    data: {
      phone,
    },
  });
}

async function postCreateOrder(payload) {
  return request('/api/orders', {
    method: 'POST',
    data: payload,
  });
}

async function postPayOrder(orderId) {
  return request(`/api/orders/${orderId}/pay`, {
    method: 'POST',
  });
}

async function fetchOrders() {
  return request('/api/orders');
}

async function fetchOrderDetail(orderId) {
  return request(`/api/orders/${orderId}`);
}

async function postCancelOrder(orderId, reason = '') {
  return request(`/api/orders/${orderId}/cancel`, {
    method: 'POST',
    data: reason ? { reason } : {},
  });
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
  setApiBaseUrl,
  wechatLogin,
};
