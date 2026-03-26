const { getDefaultBookingDate } = require('./date');
const { DEFAULT_API_BASE_URL } = require('./runtime-config');

const STORAGE_KEY_API_BASE_URL = 'SUNFLOWER_API_BASE_URL';
const STORAGE_KEY_AUTH_TOKEN = 'SUNFLOWER_AUTH_TOKEN';
const STORAGE_KEY_LOGOUT_REQUIRED = 'SUNFLOWER_LOGOUT_REQUIRED';
const AUTH_EXPIRED_MESSAGE = '登录态已失效，请重新进入首页';

function safeGetApp() {
  try {
    return getApp();
  } catch (error) {
    return null;
  }
}

function resolveApiBaseUrl() {
  const app = safeGetApp();
  const appBaseUrl = app && app.globalData ? app.globalData.apiBaseUrl : '';
  const storageBaseUrl = wx.getStorageSync(STORAGE_KEY_API_BASE_URL);
  const rawValue = `${storageBaseUrl || appBaseUrl || DEFAULT_API_BASE_URL}`.trim();
  return {
    value: rawValue.replace(/\/+$/, ''),
    source: storageBaseUrl ? 'storage' : appBaseUrl ? 'app' : 'default',
  };
}

function getApiBaseUrl() {
  return resolveApiBaseUrl().value;
}

function getApiBaseUrlDebugInfo() {
  return resolveApiBaseUrl();
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

function clearApiBaseUrlOverride() {
  try {
    wx.removeStorageSync(STORAGE_KEY_API_BASE_URL);
  } catch (error) {
    // Ignore cleanup failures to avoid blocking debug reset.
  }
  const app = safeGetApp();
  if (app && app.globalData) {
    app.globalData.apiBaseUrl = DEFAULT_API_BASE_URL;
  }
  return DEFAULT_API_BASE_URL;
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

function markLogoutRequired() {
  wx.setStorageSync(STORAGE_KEY_LOGOUT_REQUIRED, '1');
}

function clearLogoutRequired() {
  try {
    wx.removeStorageSync(STORAGE_KEY_LOGOUT_REQUIRED);
  } catch (error) {
    // Ignore cleanup failures to avoid masking the original request error.
  }
}

function isLogoutRequired() {
  return `${wx.getStorageSync(STORAGE_KEY_LOGOUT_REQUIRED) || ''}`.trim() === '1';
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
    clearLogoutRequired();
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

function upload(path, filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const authToken = getAuthToken();
    if (options.requireAuth && !authToken) {
      reject(new Error(AUTH_EXPIRED_MESSAGE));
      return;
    }

    wx.uploadFile({
      url: buildUrl(path),
      filePath,
      name: options.name || 'file',
      timeout: options.timeout || 20000,
      header: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options.header || {}),
      },
      formData: options.formData,
      success(response) {
        const statusCode = response.statusCode || 0;
        let data = null;
        try {
          data = response.data ? JSON.parse(response.data) : null;
        } catch (error) {
          reject(new Error('上传响应解析失败'));
          return;
        }

        if (statusCode === 401) {
          clearAuthToken();
          reject(new Error(AUTH_EXPIRED_MESSAGE));
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          reject(new Error((data && data.message) || `上传失败(${statusCode})`));
          return;
        }

        if (data && typeof data.code === 'number') {
          if (data.code !== 0) {
            if (data.code === 401 || (data.code >= 40100 && data.code < 40200)) {
              clearAuthToken();
              reject(new Error(AUTH_EXPIRED_MESSAGE));
              return;
            }
            reject(new Error(data.message || '上传失败'));
            return;
          }
          resolve(data.data);
          return;
        }

        resolve(data);
      },
      fail(error) {
        reject(new Error((error && error.errMsg) || '上传失败，请稍后重试'));
      },
    });
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

function normalizeBindPhonePayload(payload) {
  if (typeof payload === 'string') {
    return {
      phone: payload,
    };
  }
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  return {
    ...(payload.phone ? { phone: `${payload.phone}`.trim() } : {}),
    ...(payload.phoneCode ? { phoneCode: `${payload.phoneCode}`.trim() } : {}),
  };
}

async function postBindPhone(payload) {
  return request('/api/auth/bind-phone', {
    method: 'POST',
    requireAuth: true,
    data: normalizeBindPhonePayload(payload),
  });
}

async function postLogout() {
  try {
    await request('/api/auth/logout', {
      method: 'POST',
      requireAuth: true,
    });
  } catch (error) {
    if ((error && error.message) !== AUTH_EXPIRED_MESSAGE) {
      throw error;
    }
  }
  clearAuthToken();
  markLogoutRequired();
}

async function uploadProfileAvatar(filePath) {
  return upload('/api/users/me/avatar', filePath, {
    requireAuth: true,
    name: 'avatar',
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
  clearApiBaseUrlOverride,
  clearAuthToken,
  fetchHomeData,
  fetchOrderDetail,
  fetchOrders,
  fetchPoiList,
  fetchProfile,
  fetchRoomDetail,
  fetchRooms,
  fetchTravelNotes,
  getApiBaseUrlDebugInfo,
  patchProfile,
  postBindPhone,
  postCancelOrder,
  postCreateOrder,
  postPayOrder,
  postRefundOrder,
  postRescheduleOrder,
  ensureWechatLogin,
  hasAuthToken,
  isLogoutRequired,
  setApiBaseUrl,
  clearAuthToken,
  clearLogoutRequired,
  postLogout,
  uploadProfileAvatar,
  wechatLogin,
};
