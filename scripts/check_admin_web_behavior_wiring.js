#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const adminWebDir = process.env.SUNFLOWER_ADMIN_WEB_DIR
  ? path.resolve(process.env.SUNFLOWER_ADMIN_WEB_DIR)
  : path.join(rootDir, 'sunflower-admin-web');

const checks = [];

function formatPath(relativePath) {
  if (adminWebDir === path.join(rootDir, 'sunflower-admin-web')) {
    return `sunflower-admin-web/${relativePath}`;
  }
  return path.join(adminWebDir, relativePath);
}

function addCheck(relativePath, description, pattern) {
  checks.push({
    relativePath,
    description,
    pattern,
  });
}

function readAdminFile(relativePath) {
  const filePath = path.join(adminWebDir, relativePath);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`cannot read ${formatPath(relativePath)}: ${error.message}`);
  }
}

function matches(content, pattern) {
  if (pattern instanceof RegExp) {
    return pattern.test(content);
  }
  return content.includes(pattern);
}

function fail(message) {
  console.error(`[admin-web-behavior-wiring] ERROR: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`[admin-web-behavior-wiring] PASS: ${message}`);
}

addCheck('src/services/http.ts', 'Axios client uses configured API base URL', /axios\.create\(\{[\s\S]*baseURL: appEnv\.apiBaseUrl/);
addCheck('src/services/http.ts', 'request interceptor injects bearer token', /headers\.set\('Authorization', `Bearer \$\{token\}`\)/);
addCheck('src/services/http.ts', '401 responses clear admin session', /error\.response\?\.status === 401[\s\S]*clearAdminSession\(\)/);

addCheck('src/features/auth/auth-store.ts', 'admin session is stored in localStorage', 'sunflower.admin.session');
addCheck('src/features/auth/auth-store.ts', 'legacy token storage is removed', 'sunflower.admin.token');
addCheck('src/features/auth/auth-store.ts', 'auth state is exposed through useSyncExternalStore', /useSyncExternalStore\(subscribeAdminAuth/);
addCheck('src/features/auth/auth-store.ts', 'setAdminSession normalizes token and account', /export function setAdminSession[\s\S]*normalizeToken\(session\.token\)[\s\S]*normalizeAccount\(session\.account\)/);
addCheck('src/features/auth/auth-store.ts', 'clearAdminSession removes stored session', /export function clearAdminSession[\s\S]*writeStoredSession\(null\)/);

addCheck('src/features/auth/auth-service.ts', 'login endpoint is wired', "/admin/auth/login");
addCheck('src/features/auth/auth-service.ts', 'SMS endpoint is wired', "/admin/auth/sms-code");
addCheck('src/features/auth/auth-service.ts', 'activation endpoint is wired', "/admin/auth/activate");
addCheck('src/features/auth/auth-service.ts', 'reset password endpoint is wired', "/admin/auth/reset-password");
addCheck('src/features/auth/auth-service.ts', 'current account endpoint is wired', "/admin/account/me");
addCheck('src/features/auth/auth-service.ts', 'change password endpoint is wired', "/admin/account/change-password");
addCheck('src/features/auth/auth-service.ts', 'logout endpoint is wired', "/admin/auth/logout");
addCheck('src/features/auth/auth-service.ts', 'successful auth payload is consumed into session store', /consumeAdminSession\(response\.data\.data\)/);
addCheck('src/features/auth/auth-service.ts', 'bootstrap restores current admin account', /bootstrapAdminSession[\s\S]*fetchCurrentAdminAccount\(\)[\s\S]*updateAdminAccount\(account\)/);

addCheck('src/app/router.tsx', 'login route exists', /path: '\/login'[\s\S]*<LoginPage \/>/);
addCheck('src/app/router.tsx', 'activation route exists', /path: '\/activate'[\s\S]*<ActivatePage \/>/);
addCheck('src/app/router.tsx', 'reset-password route exists', /path: '\/reset-password'[\s\S]*<ResetPasswordPage \/>/);
addCheck('src/app/router.tsx', 'protected shell wraps operator routes', /path: '\/'[\s\S]*element: <ProtectedShell \/>/);
addCheck('src/app/router.tsx', 'workspace index route exists', /index: true[\s\S]*<WorkspacePage \/>/);
addCheck('src/app/router.tsx', 'rooms route exists', /path: 'rooms'[\s\S]*<RoomManagementPage \/>/);
addCheck('src/app/router.tsx', 'pricing route exists', /path: 'pricing'[\s\S]*<PricingManagementPage \/>/);
addCheck('src/app/router.tsx', 'orders route exists', /path: 'orders'[\s\S]*<OrderManagementPage \/>/);
addCheck('src/app/router.tsx', 'change-password route exists', /path: 'account\/password'[\s\S]*<ChangePasswordPage \/>/);
addCheck('src/app/protected-shell.tsx', 'protected shell redirects unauthenticated users to login', /!isAuthenticated[\s\S]*<Navigate[\s\S]*to="\/login"/);
addCheck('src/app/protected-shell.tsx', 'protected shell preserves attempted location', /state=\{\{ from: `\$\{location\.pathname\}\$\{location\.search\}\$\{location\.hash\}` \}\}/);

addCheck('src/pages/login-page.tsx', 'login form calls password login service', /await loginWithAdminPassword\(phone, password\)/);
addCheck('src/pages/login-page.tsx', 'login success navigates to redirect target', /navigate\(redirectTo, \{ replace: true \}\)/);
addCheck('src/pages/login-page.tsx', 'login page links to activation', /<Link to="\/activate">/);
addCheck('src/pages/login-page.tsx', 'login page links to reset password', /<Link to="\/reset-password">/);
addCheck('src/pages/activate-page.tsx', 'activation send-code uses ACTIVATE purpose', /sendAdminSmsCode\(phone, 'ACTIVATE'\)/);
addCheck('src/pages/activate-page.tsx', 'activation submit calls activateAdminAccount', /await activateAdminAccount\(phone, smsCode, password\)/);
addCheck('src/pages/activate-page.tsx', 'activation success navigates to workspace', /navigate\('\/', \{ replace: true \}\)/);
addCheck('src/pages/reset-password-page.tsx', 'reset send-code uses RESET_PASSWORD purpose', /sendAdminSmsCode\(phone, 'RESET_PASSWORD'\)/);
addCheck('src/pages/reset-password-page.tsx', 'reset submit calls resetAdminPassword', /await resetAdminPassword\(phone, smsCode, newPassword\)/);
addCheck('src/pages/reset-password-page.tsx', 'reset success navigates to workspace', /navigate\('\/', \{ replace: true \}\)/);
addCheck('src/pages/change-password-page.tsx', 'change password submit calls service', /await changeAdminPassword\(currentPassword, newPassword\)/);
addCheck('src/pages/change-password-page.tsx', 'change password success returns to workspace', /navigate\('\/', \{ replace: true \}\)/);

addCheck('src/pages/workspace-page.tsx', 'workspace checks backend health through query', /queryKey: \['health'\][\s\S]*queryFn: fetchHealth/);
addCheck('src/pages/workspace-page.tsx', 'workspace health refresh button refetches', /onClick=\{\(\) => void healthQuery\.refetch\(\)\}/);
addCheck('src/pages/workspace-page.tsx', 'workspace shows current account from auth store', /account\?\.phone/);

addCheck('src/features/rooms/admin-room-service.ts', 'room list endpoint is wired', "const ROOM_ENDPOINT = '/admin/rooms'");
addCheck('src/features/rooms/admin-room-service.ts', 'room create uses POST', /httpClient\.post<ApiEnvelope<AdminRoom>>\(ROOM_ENDPOINT, payload\)/);
addCheck('src/features/rooms/admin-room-service.ts', 'room update uses PATCH by id', /httpClient\.patch<ApiEnvelope<AdminRoom>>\(`\$\{ROOM_ENDPOINT\}\/\$\{roomId\}`, payload\)/);
addCheck('src/pages/room-management-page.tsx', 'room page fetches room list through query', /queryKey: ROOM_LIST_QUERY_KEY[\s\S]*queryFn: fetchAdminRooms/);
addCheck('src/pages/room-management-page.tsx', 'room save mutation chooses create or update', /if \(roomId\)[\s\S]*updateAdminRoom\(roomId, payload\)[\s\S]*createAdminRoom\(payload\)/);
addCheck('src/pages/room-management-page.tsx', 'room save success invalidates room list', /onSuccess: async \(_, variables\) => \{[\s\S]*invalidateQueries\(\{ queryKey: ROOM_LIST_QUERY_KEY \}\)/);
addCheck('src/pages/room-management-page.tsx', 'room status toggle uses updateAdminRoom', /toggleRoomMutation[\s\S]*updateAdminRoom\(room\.id, \{ status: nextStatus \}\)/);
addCheck('src/pages/room-management-page.tsx', 'room status toggle invalidates room list', /toggleRoomMutation[\s\S]*invalidateQueries\(\{ queryKey: ROOM_LIST_QUERY_KEY \}\)/);
addCheck('src/pages/room-management-page.tsx', 'room toolbar search is wired', /value=\{keyword\}[\s\S]*onChange=\{\(value\) => setKeyword\(String\(value\)\)\}/);
addCheck('src/pages/room-management-page.tsx', 'room status filter is wired', /value=\{statusFilter\}[\s\S]*setStatusFilter\(String\(value\) as AdminRoomStatusFilter\)/);
addCheck('src/pages/room-management-page.tsx', 'room create button opens dialog', /onClick=\{openCreateDialog\}[\s\S]*新建房型/);
addCheck('src/pages/room-management-page.tsx', 'room editor submit saves room', /<form className="room-editor" onSubmit=\{handleSubmit\}>/);

addCheck('src/features/rooms/admin-room-pricing-service.ts', 'room calendar endpoint is wired', /httpClient\.get<ApiEnvelope<RoomCalendarResponse>>\(`\/rooms\/\$\{roomId\}\/calendar`/);
addCheck('src/features/rooms/admin-room-pricing-service.ts', 'price batch endpoint is wired', "/admin/room-prices");
addCheck('src/features/rooms/admin-room-pricing-service.ts', 'inventory batch endpoint is wired', "/admin/room-inventory");
addCheck('src/pages/pricing-management-page.tsx', 'pricing page fetches rooms', /queryKey: ROOM_LIST_QUERY_KEY[\s\S]*queryFn: fetchAdminRooms/);
addCheck('src/pages/pricing-management-page.tsx', 'pricing page fetches selected room calendar', /queryKey: \['room-calendar', effectiveSelectedRoomId, selectedMonth\][\s\S]*fetchRoomCalendar\(effectiveSelectedRoomId/);
addCheck('src/pages/pricing-management-page.tsx', 'price mutation invalidates room-calendar queries', /priceMutation[\s\S]*updateAdminRoomPrices[\s\S]*invalidateQueries\(\{ queryKey: \['room-calendar', result\.roomId\] \}\)/);
addCheck('src/pages/pricing-management-page.tsx', 'inventory mutation invalidates room-calendar queries', /inventoryMutation[\s\S]*updateAdminRoomInventory[\s\S]*invalidateQueries\(\{ queryKey: \['room-calendar', result\.roomId\] \}\)/);
addCheck('src/pages/pricing-management-page.tsx', 'room change clears interactive state', /function handleRoomChange[\s\S]*resetInteractiveState\(\)/);
addCheck('src/pages/pricing-management-page.tsx', 'month change clears interactive state', /function handleMonthChange[\s\S]*resetInteractiveState\(\)/);
addCheck('src/pages/pricing-management-page.tsx', 'calendar day click creates date range', /handleCalendarDayClick[\s\S]*normalizeDateRange\(rangeAnchorDate, date\)/);
addCheck('src/pages/pricing-management-page.tsx', 'price submit validates and mutates', /function handlePriceSubmit[\s\S]*priceMutation\.mutate\(\{[\s\S]*buildPriceBatchItems\(batchDates, draftPrice, priceSource\)/);
addCheck('src/pages/pricing-management-page.tsx', 'inventory submit validates and mutates', /function handleInventorySubmit[\s\S]*inventoryMutation\.mutate\(\{[\s\S]*buildInventoryBatchItems\(batchDates, draftInventory\)/);
addCheck('src/pages/pricing-management-page.tsx', 'pricing UI refreshes rooms and calendar', /void roomListQuery\.refetch\(\)[\s\S]*void roomCalendarQuery\.refetch\(\)/);

addCheck('src/features/orders/admin-order-service.ts', 'order list endpoint is wired', "const ADMIN_ORDER_ENDPOINT = '/admin/orders'");
addCheck('src/features/orders/admin-order-service.ts', 'order overview endpoint is wired', "const ADMIN_ORDER_OVERVIEW_ENDPOINT = '/admin/reports/summary'");
addCheck('src/features/orders/admin-order-service.ts', 'order detail endpoint is wired', /httpClient\.get<ApiEnvelope<AdminOrder>>\(`\$\{ADMIN_ORDER_ENDPOINT\}\/\$\{orderId\}`\)/);
addCheck('src/features/orders/admin-order-service.ts', 'reschedule endpoint is wired', /\/\$\{orderId\}\/reschedule/);
addCheck('src/features/orders/admin-order-service.ts', 'refund endpoint is wired', /\/\$\{orderId\}\/refund`/);
addCheck('src/features/orders/admin-order-service.ts', 'refund retry endpoint is wired', /\/refunds\/\$\{refundId\}\/retry/);
addCheck('src/features/orders/admin-order-service.ts', 'after-sale approve endpoint is wired', /\/after-sale\/\$\{requestId\}\/approve/);
addCheck('src/features/orders/admin-order-service.ts', 'after-sale reject endpoint is wired', /\/after-sale\/\$\{requestId\}\/reject/);
addCheck('src/features/orders/admin-order-service.ts', 'check-in endpoint is wired', /\/\$\{orderId\}\/check-in/);
addCheck('src/features/orders/admin-order-service.ts', 'check-out endpoint is wired', /\/\$\{orderId\}\/check-out/);
addCheck('src/features/orders/admin-order-service.ts', 'no-show endpoint is wired', /\/\$\{orderId\}\/no-show/);
addCheck('src/pages/order-management-page.tsx', 'orders page fetches overview', /queryKey: ORDER_OVERVIEW_QUERY_KEY[\s\S]*queryFn: fetchAdminOrderOverview/);
addCheck('src/pages/order-management-page.tsx', 'orders page fetches list with filters', /queryKey: \[[\s\S]*\.\.\.ORDER_LIST_QUERY_KEY[\s\S]*status: statusFilter[\s\S]*keyword: deferredKeyword[\s\S]*checkInStartDate[\s\S]*checkInEndDate/);
addCheck('src/pages/order-management-page.tsx', 'orders page fetches selected detail', /queryKey: \['admin-order-detail', selectedOrderId\][\s\S]*fetchAdminOrderDetail\(selectedOrderId as string\)/);
addCheck('src/pages/order-management-page.tsx', 'order mutation success updates detail cache', /queryClient\.setQueryData\(\['admin-order-detail', order\.id\], order\)/);
addCheck('src/pages/order-management-page.tsx', 'order mutation success invalidates list and overview', /Promise\.all\(\[[\s\S]*invalidateQueries\(\{ queryKey: ORDER_LIST_QUERY_KEY \}\)[\s\S]*invalidateQueries\(\{ queryKey: ORDER_OVERVIEW_QUERY_KEY \}\)/);
addCheck('src/pages/order-management-page.tsx', 'reschedule mutation calls service', /rescheduleMutation[\s\S]*rescheduleAdminOrder\(orderId/);
addCheck('src/pages/order-management-page.tsx', 'refund mutation calls service', /refundMutation[\s\S]*refundAdminOrder\(orderId/);
addCheck('src/pages/order-management-page.tsx', 'refund retry mutation calls service', /retryRefundMutation[\s\S]*retryAdminRefund\(orderId, refundId\)/);
addCheck('src/pages/order-management-page.tsx', 'after-sale approve mutation calls service', /approveAfterSaleMutation[\s\S]*approveAdminAfterSaleRequest\(orderId, requestId\)/);
addCheck('src/pages/order-management-page.tsx', 'after-sale reject mutation calls service', /rejectAfterSaleMutation[\s\S]*rejectAdminAfterSaleRequest\(orderId, requestId/);
addCheck('src/pages/order-management-page.tsx', 'check-in mutation calls service', /checkInMutation[\s\S]*checkInAdminOrder\(orderId\)/);
addCheck('src/pages/order-management-page.tsx', 'check-out mutation calls service', /checkOutMutation[\s\S]*checkOutAdminOrder\(orderId\)/);
addCheck('src/pages/order-management-page.tsx', 'no-show mutation calls service', /noShowMutation[\s\S]*noShowAdminOrder\(orderId\)/);
addCheck('src/pages/order-management-page.tsx', 'order refresh button refetches overview list and detail', /function handleRefresh\(\)[\s\S]*orderOverviewQuery\.refetch\(\)[\s\S]*orderListQuery\.refetch\(\)[\s\S]*orderDetailQuery\.refetch\(\)/);
addCheck('src/pages/order-management-page.tsx', 'order filters can be cleared', /function handleClearFilters\(\)[\s\S]*setStatusFilter\('ALL'\)[\s\S]*setCheckInStartDate\(''\)[\s\S]*setCheckInEndDate\(''\)/);
addCheck('src/pages/order-management-page.tsx', 'reschedule form validates before mutation', /handleSubmitReschedule[\s\S]*validateRescheduleEditorValue\(rescheduleEditor, selectedOrder\)[\s\S]*rescheduleMutation\.mutate/);
addCheck('src/pages/order-management-page.tsx', 'refund form validates before mutation', /handleSubmitRefund[\s\S]*validateRefundEditorValue\(refundEditor\)[\s\S]*refundMutation\.mutate/);
addCheck('src/pages/order-management-page.tsx', 'reject form validates before mutation', /handleRejectAfterSale[\s\S]*validateRejectEditorValue\(rejectEditor\)[\s\S]*rejectAfterSaleMutation\.mutate/);

function main() {
  const fileCache = new Map();
  const touchedFiles = new Set();

  checks.forEach((check) => {
    if (!fileCache.has(check.relativePath)) {
      try {
        fileCache.set(check.relativePath, readAdminFile(check.relativePath));
      } catch (error) {
        fail(error.message);
        return;
      }
    }

    const content = fileCache.get(check.relativePath);
    touchedFiles.add(check.relativePath);
    if (!matches(content, check.pattern)) {
      fail(`${formatPath(check.relativePath)} is missing wiring: ${check.description}`);
    }
  });

  if (process.exitCode) {
    return;
  }

  pass(`${checks.length} key behavior wiring checks passed across ${touchedFiles.size} files`);
}

main();
