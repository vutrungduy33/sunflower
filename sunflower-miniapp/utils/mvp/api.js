const { getDefaultBookingDate } = require('./date');

const STORAGE_KEY_API_BASE_URL = 'SUNFLOWER_API_BASE_URL';
const STORAGE_KEY_AUTH_TOKEN = 'SUNFLOWER_AUTH_TOKEN';
const DEFAULT_API_BASE_URL = 'https://8.155.148.126';
const AUTH_EXPIRED_MESSAGE = '登录态已失效，请重新进入首页';

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

function getAuthToken() {
  return `${wx.getStorageSync(STORAGE_KEY_AUTH_TOKEN) || ''}`.trim();
}

function hasAuthToken() {
  return !!getAuthToken();
}

function setAuthToken(token) {
  const normalized = `${token || ''}`.trim();
  if (!normalized) {
    return;
  }
  wx.setStorageSync(STORAGE_KEY_AUTH_TOKEN, normalized);
}

function clearAuthToken() {
  try {
    wx.removeStorageSync(STORAGE_KEY_AUTH_TOKEN);
  } catch (error) {
    // Ignore cleanup failures to avoid masking the original request error.
  }
}

function getWechatLoginCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(result) {
        const code = `${(result && result.code) || ''}`.trim();
        if (!code) {
          reject(new Error('微信登录失败，请重试'));
          return;
        }
        resolve(code);
      },
      fail(error) {
        reject(new Error((error && error.errMsg) || '微信登录失败，请重试'));
      },
    });
  });
}

function buildUrl(path) {
  if (!path.startsWith('/')) {
    throw new Error(`非法 API 路径: ${path}`);
  }
  return `${getApiBaseUrl()}${path}`;
}

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const authToken = getAuthToken();
    if (options.requireAuth && !authToken) {
      reject(new Error(AUTH_EXPIRED_MESSAGE));
      return;
    }

    wx.request({
      url: buildUrl(path),
      method: options.method || 'GET',
      data: options.data,
      timeout: options.timeout || 12000,
      header: {
        'content-type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options.header || {}),
      },
      success(response) {
        const { statusCode, data } = response;
        if (statusCode === 401) {
          clearAuthToken();
          reject(new Error(AUTH_EXPIRED_MESSAGE));
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          reject(new Error((data && data.message) || `请求失败(${statusCode})`));
          return;
        }

        if (data && typeof data.code === 'number') {
          if (data.code !== 0) {
            if (data.code === 401 || (data.code >= 40100 && data.code < 40200)) {
              clearAuthToken();
              reject(new Error(AUTH_EXPIRED_MESSAGE));
              return;
            }
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
  const resolvedCode = `${code || ''}`.trim() || (await getWechatLoginCode());
  const loginData = await request('/api/auth/wechat/login', {
    method: 'POST',
    data: {
      code: resolvedCode,
    },
  });
  if (loginData && loginData.token) {
    setAuthToken(loginData.token);
  }
  return loginData;
}

async function ensureWechatLogin() {
  const token = getAuthToken();
  if (token) {
    return { token, reusedToken: true };
  }
  const loginData = await wechatLogin();
  return {
    ...(loginData || {}),
    reusedToken: false,
  };
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
  return request('/api/users/me', {
    requireAuth: true,
  });
}

async function patchProfile(payload) {
  return request('/api/users/me', {
    method: 'PATCH',
    requireAuth: true,
    data: payload,
  });
}

async function postBindPhone(phone) {
  return request('/api/auth/bind-phone', {
    method: 'POST',
    requireAuth: true,
    data: {
      phone,
    },
  });
}

async function postCreateOrder(payload) {
  return request('/api/orders', {
    method: 'POST',
    requireAuth: true,
    data: payload,
  });
}

async function postPayOrder(orderId) {
  return request(`/api/orders/${orderId}/pay`, {
    method: 'POST',
    requireAuth: true,
  });
}

async function fetchOrders() {
  return request('/api/orders', {
    requireAuth: true,
  });
}

async function fetchOrderDetail(orderId) {
  return request(`/api/orders/${orderId}`, {
    requireAuth: true,
  });
}

async function postCancelOrder(orderId, reason = '') {
  return request(`/api/orders/${orderId}/cancel`, {
    method: 'POST',
    requireAuth: true,
    data: reason ? { reason } : {},
  });
}

async function postRescheduleOrder(orderId, payload) {
  return request(`/api/orders/${orderId}/reschedule`, {
    method: 'POST',
    requireAuth: true,
    data: payload,
  });
}

async function postRefundOrder(orderId, reason = '') {
  return request(`/api/orders/${orderId}/refund`, {
    method: 'POST',
    requireAuth: true,
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
  postRefundOrder,
  postRescheduleOrder,
  ensureWechatLogin,
  hasAuthToken,
  setApiBaseUrl,
  wechatLogin,
};
