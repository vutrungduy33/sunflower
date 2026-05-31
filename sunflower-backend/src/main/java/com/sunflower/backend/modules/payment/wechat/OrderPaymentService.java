package com.sunflower.backend.modules.payment.wechat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sunflower.backend.common.exception.BusinessException;
import com.sunflower.backend.modules.order.AfterSaleRequestStatus;
import com.sunflower.backend.modules.order.AfterSaleRequestType;
import com.sunflower.backend.modules.order.BookingStatus;
import com.sunflower.backend.modules.order.OrderStatus;
import com.sunflower.backend.modules.order.PaymentStatus;
import com.sunflower.backend.modules.order.persistence.OrderAfterSaleRequestEntity;
import com.sunflower.backend.modules.order.persistence.OrderAfterSaleRequestRepository;
import com.sunflower.backend.modules.order.persistence.OrderEntity;
import com.sunflower.backend.modules.order.persistence.OrderRepository;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatPaymentOrderEntity;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatPaymentOrderRepository;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatPaymentOrderStatus;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatRefundOrderEntity;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatRefundOrderRepository;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatRefundOrderStatus;
import com.sunflower.backend.modules.room.persistence.RoomInventoryEntity;
import com.sunflower.backend.modules.room.persistence.RoomInventoryRepository;
import com.sunflower.backend.modules.user.UserService;
import com.sunflower.backend.modules.user.persistence.UserEntity;
import com.sunflower.backend.modules.user.persistence.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderPaymentService {

    static final ZoneId SHANGHAI_ZONE = ZoneId.of("Asia/Shanghai");

    private static final String USER_STATUS_ACTIVE = "ACTIVE";
    private static final String INVENTORY_DATA_ERROR_MESSAGE = "库存数据异常，请联系管理员";

    private final OrderRepository orderRepository;
    private final OrderAfterSaleRequestRepository orderAfterSaleRequestRepository;
    private final WechatPaymentOrderRepository wechatPaymentOrderRepository;
    private final WechatRefundOrderRepository wechatRefundOrderRepository;
    private final RoomInventoryRepository roomInventoryRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final WechatPayClient wechatPayClient;
    private final WechatPayProperties wechatPayProperties;
    private final WechatPayCryptoSupport wechatPayCryptoSupport;
    private final WechatPaymentRecordPersistenceService wechatPaymentRecordPersistenceService;
    private final ObjectMapper objectMapper;

    public OrderPaymentService(
        OrderRepository orderRepository,
        OrderAfterSaleRequestRepository orderAfterSaleRequestRepository,
        WechatPaymentOrderRepository wechatPaymentOrderRepository,
        WechatRefundOrderRepository wechatRefundOrderRepository,
        RoomInventoryRepository roomInventoryRepository,
        UserRepository userRepository,
        UserService userService,
        WechatPayClient wechatPayClient,
        WechatPayProperties wechatPayProperties,
        WechatPayCryptoSupport wechatPayCryptoSupport,
        WechatPaymentRecordPersistenceService wechatPaymentRecordPersistenceService,
        ObjectMapper objectMapper
    ) {
        this.orderRepository = orderRepository;
        this.orderAfterSaleRequestRepository = orderAfterSaleRequestRepository;
        this.wechatPaymentOrderRepository = wechatPaymentOrderRepository;
        this.wechatRefundOrderRepository = wechatRefundOrderRepository;
        this.roomInventoryRepository = roomInventoryRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.wechatPayClient = wechatPayClient;
        this.wechatPayProperties = wechatPayProperties;
        this.wechatPayCryptoSupport = wechatPayCryptoSupport;
        this.wechatPaymentRecordPersistenceService = wechatPaymentRecordPersistenceService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public PreparePaymentResult prepareCurrentUserOrderPayment(String orderId) {
        OrderEntity order = requireCurrentUserOrder(orderId);
        if (order.getBookingStatus() != BookingStatus.PENDING_PAYMENT || order.getPaymentStatus() != PaymentStatus.UNPAID) {
            throw BusinessException.conflict("当前订单状态不可支付");
        }
        UserEntity user = requireActiveUser(order.getUserId());
        LocalDateTime now = LocalDateTime.now(SHANGHAI_ZONE);

        WechatPaymentOrderEntity paymentOrder = findReusablePaymentOrder(orderId, now).orElseGet(() -> createPaymentOrder(order, user, now));
        PreparePaymentRequest paymentRequest = buildPaymentRequest(paymentOrder.getPrepayId(), now);
        return new PreparePaymentResult(paymentOrder, paymentRequest, resolvePaymentMode());
    }

    @Transactional
    public OrderEntity confirmCurrentUserOrderPayment(String orderId) {
        OrderEntity order = requireCurrentUserOrder(orderId);
        WechatPaymentOrderEntity paymentOrder = requireLatestPaymentRecord(orderId);
        if (paymentOrder.getStatus() == WechatPaymentOrderStatus.SUCCESS) {
            applyPaymentSuccess(order, paymentOrder, paymentOrder.getTransactionId(), paymentOrder.getAmount(), paymentOrder.getPayerOpenid());
            return orderRepository.save(order);
        }
        WechatPayClient.QueryOrderResult queryResult = wechatPayClient.queryTransactionByOutTradeNo(paymentOrder.getOutTradeNo());
        LocalDateTime now = LocalDateTime.now(SHANGHAI_ZONE);
        paymentOrder.setLastQueryAt(now);
        paymentOrder.setResponseSnapshot(queryResult.getResponseSnapshot());
        applyQueryResult(order, paymentOrder, queryResult, now);
        wechatPaymentOrderRepository.save(paymentOrder);
        return orderRepository.save(order);
    }

    @Transactional
    public OrderEntity startDirectRefund(String orderId, String reason) {
        OrderEntity order = requireOrder(orderId);
        if (order.getBookingStatus() != BookingStatus.CONFIRMED || order.getPaymentStatus() != PaymentStatus.PAID) {
            throw BusinessException.conflict("当前订单状态不可退款");
        }
        return startRefund(order, normalizeReason(reason), true, null);
    }

    @Transactional
    public OrderEntity approveRefundAfterSale(OrderEntity order, OrderAfterSaleRequestEntity afterSaleRequest, LocalDateTime now) {
        if (order.getBookingStatus() != BookingStatus.CONFIRMED || order.getPaymentStatus() != PaymentStatus.PAID) {
            throw BusinessException.conflict("当前订单状态不可退款");
        }
        afterSaleRequest.setStatus(AfterSaleRequestStatus.APPROVED);
        afterSaleRequest.setReviewedBy("ADMIN");
        afterSaleRequest.setReviewedAt(now);
        return startRefund(order, normalizeReason(afterSaleRequest.getReason()), true, afterSaleRequest);
    }

    @Transactional
    public OrderEntity retryRefund(String orderId, Long refundId) {
        OrderEntity order = requireOrder(orderId);
        WechatRefundOrderEntity latestRefund = wechatRefundOrderRepository
            .findByIdAndOrderId(refundId, orderId)
            .orElseThrow(() -> BusinessException.notFound("退款记录不存在"));
        if (latestRefund.getStatus() != WechatRefundOrderStatus.FAILED
            && latestRefund.getStatus() != WechatRefundOrderStatus.ABNORMAL
            && latestRefund.getStatus() != WechatRefundOrderStatus.CLOSED) {
            throw BusinessException.conflict("当前退款记录不可重试");
        }
        if (order.getPaymentStatus() != PaymentStatus.PAID && order.getPaymentStatus() != PaymentStatus.PARTIALLY_REFUNDED) {
            throw BusinessException.conflict("当前订单状态不可重试退款");
        }
        return startRefund(order, normalizeReason(latestRefund.getReason()), false, null);
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public void handleTransactionNotification(String decryptedBody) {
        JsonNode payload = readJson(decryptedBody);
        String outTradeNo = payload.path("out_trade_no").asText("");
        WechatPaymentOrderEntity paymentOrder = wechatPaymentOrderRepository
            .findByOutTradeNo(outTradeNo)
            .orElseThrow(() -> BusinessException.notFound("支付记录不存在"));
        OrderEntity order = requireOrder(paymentOrder.getOrderId());
        if (paymentOrder.getStatus() == WechatPaymentOrderStatus.SUCCESS && order.getPaymentStatus() == PaymentStatus.PAID) {
            return;
        }
        int totalAmountFen = payload.path("amount").path("total").asInt(0);
        if (totalAmountFen != paymentOrder.getAmount()) {
            throw BusinessException.badRequest("微信支付回调金额不匹配");
        }
        String payerOpenId = payload.path("payer").path("openid").asText("");
        if (!normalize(payerOpenId).isEmpty() && !Objects.equals(normalize(payerOpenId), normalize(paymentOrder.getPayerOpenid()))) {
            throw BusinessException.badRequest("微信支付回调付款人不匹配");
        }
        String tradeState = payload.path("trade_state").asText("");
        paymentOrder.setResponseSnapshot(decryptedBody);
        if ("SUCCESS".equalsIgnoreCase(tradeState)) {
            applyPaymentSuccess(order, paymentOrder, payload.path("transaction_id").asText(""), totalAmountFen, payerOpenId);
        } else {
            paymentOrder.setStatus(resolvePaymentOrderStatus(tradeState));
            paymentOrder.setFailCode(tradeState);
            paymentOrder.setFailMessage(payload.path("trade_state_desc").asText(""));
        }
        wechatPaymentOrderRepository.save(paymentOrder);
        orderRepository.save(order);
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public void handleRefundNotification(String decryptedBody) {
        JsonNode payload = readJson(decryptedBody);
        String outRefundNo = payload.path("out_refund_no").asText("");
        WechatRefundOrderEntity refundOrder = wechatRefundOrderRepository
            .findByOutRefundNo(outRefundNo)
            .orElseThrow(() -> BusinessException.notFound("退款记录不存在"));
        OrderEntity order = requireOrder(refundOrder.getOrderId());
        String refundStatus = payload.path("refund_status").asText(payload.path("status").asText(""));
        if (refundOrder.getStatus() == WechatRefundOrderStatus.SUCCESS
            && order.getPaymentStatus() == PaymentStatus.REFUNDED
            && "SUCCESS".equalsIgnoreCase(refundStatus)) {
            return;
        }
        int refundAmountFen = payload.path("amount").path("refund").asInt(payload.path("amount").path("refund_fee").asInt(0));
        int totalAmountFen = payload.path("amount").path("total").asInt(payload.path("amount").path("payer_total").asInt(0));
        if (refundAmountFen > 0 && refundAmountFen != refundOrder.getRefundAmount()) {
            throw BusinessException.badRequest("微信退款回调退款金额不匹配");
        }
        if (totalAmountFen > 0 && totalAmountFen != refundOrder.getTotalAmount()) {
            throw BusinessException.badRequest("微信退款回调订单金额不匹配");
        }
        refundOrder.setResponseSnapshot(decryptedBody);
        if ("SUCCESS".equalsIgnoreCase(refundStatus)) {
            applyRefundSuccess(order, refundOrder, payload.path("refund_id").asText(""));
        } else if ("PROCESSING".equalsIgnoreCase(refundStatus)) {
            refundOrder.setStatus(WechatRefundOrderStatus.PROCESSING);
            ensureInventoryReleased(order);
            order.setBookingStatus(BookingStatus.CANCELLED);
            order.setPaymentStatus(PaymentStatus.REFUND_PENDING);
            syncLegacyStatus(order, loadLatestAfterSaleRequest(order.getId()));
        } else {
            applyRefundFailure(order, refundOrder, refundStatus, payload.path("user_received_account").asText(""));
        }
        wechatRefundOrderRepository.save(refundOrder);
        orderRepository.save(order);
    }

    private Optional<WechatPaymentOrderEntity> findReusablePaymentOrder(String orderId, LocalDateTime now) {
        return wechatPaymentOrderRepository
            .findTopByOrderIdOrderByCreatedAtDescIdDesc(orderId)
            .filter(record ->
                (record.getStatus() == WechatPaymentOrderStatus.PREPARED || record.getStatus() == WechatPaymentOrderStatus.USERPAYING)
                    && record.getTimeExpire() != null
                    && record.getTimeExpire().isAfter(now)
                    && normalize(record.getPrepayId()).length() > 0
            );
    }

    private WechatPaymentOrderEntity createPaymentOrder(OrderEntity order, UserEntity user, LocalDateTime now) {
        String outTradeNo = buildOutTradeNo(order);
        LocalDateTime expiresAt = now.plusMinutes(Math.max(wechatPayProperties.getPayExpireMinutes(), 5));
        int totalAmountFen = toFen(order.getTotalAmount());
        WechatPayClient.CreateOrderResult result = wechatPayClient.createJsapiOrder(
            outTradeNo,
            totalAmountFen,
            user.getOpenid(),
            buildOrderDescription(order),
            expiresAt
        );
        return wechatPaymentRecordPersistenceService.createPreparedPaymentOrder(order, user, outTradeNo, totalAmountFen, result);
    }

    private PreparePaymentRequest buildPaymentRequest(String prepayId, LocalDateTime now) {
        PreparePaymentRequest paymentRequest = new PreparePaymentRequest();
        paymentRequest.setTimeStamp(String.valueOf(now.atZone(SHANGHAI_ZONE).toEpochSecond()));
        paymentRequest.setNonceStr(UUID.randomUUID().toString().replace("-", ""));
        paymentRequest.setPackageValue("prepay_id=" + prepayId);
        paymentRequest.setSignType("RSA");
        if (wechatPayProperties.isMockEnabled()) {
            paymentRequest.setPaySign("mock-pay-sign");
        } else {
            paymentRequest.setPaySign(
                wechatPayCryptoSupport.signMiniProgramPayment(
                    wechatPayProperties.getAppId(),
                    paymentRequest.getTimeStamp(),
                    paymentRequest.getNonceStr(),
                    paymentRequest.getPackageValue(),
                    paymentRequest.getSignType()
                )
            );
        }
        return paymentRequest;
    }

    private void applyQueryResult(
        OrderEntity order,
        WechatPaymentOrderEntity paymentOrder,
        WechatPayClient.QueryOrderResult queryResult,
        LocalDateTime now
    ) {
        String tradeState = normalize(queryResult.getTradeState()).toUpperCase();
        if ("SUCCESS".equals(tradeState)) {
            if (queryResult.getTotalAmountFen() > 0 && queryResult.getTotalAmountFen() != paymentOrder.getAmount()) {
                throw BusinessException.badRequest("微信支付金额校验失败");
            }
            if (!normalize(queryResult.getPayerOpenId()).isEmpty()
                && !Objects.equals(normalize(queryResult.getPayerOpenId()), normalize(paymentOrder.getPayerOpenid()))) {
                throw BusinessException.badRequest("微信支付付款人校验失败");
            }
            applyPaymentSuccess(order, paymentOrder, queryResult.getTransactionId(), paymentOrder.getAmount(), paymentOrder.getPayerOpenid());
            return;
        }

        paymentOrder.setStatus(resolvePaymentOrderStatus(tradeState));
        paymentOrder.setFailCode(tradeState);
        paymentOrder.setFailMessage(queryResult.getTradeStateDesc());
        if ("USERPAYING".equals(tradeState) || "NOTPAY".equals(tradeState) || tradeState.isEmpty()) {
            throw BusinessException.conflict("支付结果确认中，请稍后刷新订单列表");
        }
        paymentOrder.setLastQueryAt(now);
        throw BusinessException.conflict("支付未完成，请重新发起支付");
    }

    private OrderEntity startRefund(
        OrderEntity order,
        String reason,
        boolean releaseInventoryIfNeeded,
        OrderAfterSaleRequestEntity latestAfterSaleRequest
    ) {
        WechatPaymentOrderEntity paymentOrder = requireSuccessfulPaymentRecord(order.getId());
        LocalDateTime now = LocalDateTime.now(SHANGHAI_ZONE);
        if (releaseInventoryIfNeeded && order.getBookingStatus() != BookingStatus.CANCELLED) {
            releaseInventory(order);
        }
        String outRefundNo = buildOutRefundNo(order);
        int refundAmountFen = toFen(order.getTotalAmount());
        WechatPayClient.CreateRefundResult result = wechatPayClient.createRefund(
            paymentOrder.getOutTradeNo(),
            outRefundNo,
            refundAmountFen,
            paymentOrder.getAmount(),
            reason
        );
        WechatRefundOrderStatus refundStatus = resolveRefundStatus(result.getStatus());
        WechatRefundOrderEntity refundOrder = wechatPaymentRecordPersistenceService.createRefundOrder(
            order,
            paymentOrder,
            outRefundNo,
            refundAmountFen,
            reason,
            result,
            refundStatus
        );

        order.setAfterSaleReason(reason);
        order.setBookingStatus(BookingStatus.CANCELLED);
        order.setCancelledAt(order.getCancelledAt() == null ? now : order.getCancelledAt());
        if (refundStatus == WechatRefundOrderStatus.SUCCESS) {
            applyRefundSuccess(order, refundOrder, result.getRefundId());
        } else if (refundStatus == WechatRefundOrderStatus.PROCESSING) {
            order.setPaymentStatus(PaymentStatus.REFUND_PENDING);
        } else {
            applyRefundFailure(order, refundOrder, refundStatus.name(), "");
        }
        syncLegacyStatus(order, latestAfterSaleRequest);
        return orderRepository.save(order);
    }

    private void applyPaymentSuccess(
        OrderEntity order,
        WechatPaymentOrderEntity paymentOrder,
        String transactionId,
        int totalAmountFen,
        String payerOpenId
    ) {
        LocalDateTime now = LocalDateTime.now(SHANGHAI_ZONE);
        paymentOrder.setTransactionId(normalize(transactionId));
        paymentOrder.setStatus(WechatPaymentOrderStatus.SUCCESS);
        paymentOrder.setSuccessAt(paymentOrder.getSuccessAt() == null ? now : paymentOrder.getSuccessAt());
        paymentOrder.setFailCode("");
        paymentOrder.setFailMessage("");
        if (totalAmountFen > 0) {
            paymentOrder.setAmount(totalAmountFen);
        }
        if (!normalize(payerOpenId).isEmpty()) {
            paymentOrder.setPayerOpenid(payerOpenId);
        }

        order.setBookingStatus(BookingStatus.CONFIRMED);
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaidAt(order.getPaidAt() == null ? now : order.getPaidAt());
        syncLegacyStatus(order, loadLatestAfterSaleRequest(order.getId()));
    }

    private void applyRefundSuccess(OrderEntity order, WechatRefundOrderEntity refundOrder, String refundId) {
        LocalDateTime now = LocalDateTime.now(SHANGHAI_ZONE);
        boolean alreadySucceeded = refundOrder.getStatus() == WechatRefundOrderStatus.SUCCESS;
        long successfulRefundAmountFen = Optional.ofNullable(wechatRefundOrderRepository.sumSuccessRefundAmountByOrderId(order.getId())).orElse(0L);
        refundOrder.setRefundId(normalize(refundId));
        refundOrder.setStatus(WechatRefundOrderStatus.SUCCESS);
        refundOrder.setSuccessAt(refundOrder.getSuccessAt() == null ? now : refundOrder.getSuccessAt());
        refundOrder.setFailCode("");
        refundOrder.setFailMessage("");
        ensureInventoryReleased(order);
        long totalRefundAmountFen = alreadySucceeded ? successfulRefundAmountFen : successfulRefundAmountFen + refundOrder.getRefundAmount();
        if (totalRefundAmountFen >= toFen(order.getTotalAmount())) {
            order.setBookingStatus(BookingStatus.CANCELLED);
            order.setPaymentStatus(PaymentStatus.REFUNDED);
            order.setRefundedAt(order.getRefundedAt() == null ? now : order.getRefundedAt());
        } else {
            order.setPaymentStatus(PaymentStatus.PARTIALLY_REFUNDED);
        }
        syncLegacyStatus(order, loadLatestAfterSaleRequest(order.getId()));
    }

    private void ensureInventoryReleased(OrderEntity order) {
        if (order.getBookingStatus() == BookingStatus.CANCELLED && order.getPaymentStatus() == PaymentStatus.REFUNDED) {
            return;
        }
        releaseInventory(order);
    }

    private void applyRefundFailure(OrderEntity order, WechatRefundOrderEntity refundOrder, String failCode, String failMessage) {
        refundOrder.setStatus(resolveRefundFailureStatus(failCode));
        refundOrder.setFailCode(normalize(failCode));
        refundOrder.setFailMessage(normalize(failMessage));
        order.setBookingStatus(BookingStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.PAID);
        syncLegacyStatus(order, loadLatestAfterSaleRequest(order.getId()));
    }

    private void releaseInventory(OrderEntity order) {
        List<LocalDate> stayDates = buildStayDates(order.getCheckInDate(), order.getNights());
        Map<LocalDate, RoomInventoryEntity> inventoryMap = lockStayInventory(order.getRoomId(), stayDates);
        List<RoomInventoryEntity> changedInventory = new ArrayList<>();
        for (LocalDate stayDate : stayDates) {
            RoomInventoryEntity inventory = inventoryMap.get(stayDate);
            if (inventory == null) {
                throw BusinessException.conflict(INVENTORY_DATA_ERROR_MESSAGE);
            }
            if (inventory.getLockedStock() > 0) {
                inventory.setAvailableStock(inventory.getAvailableStock() + 1);
                inventory.setLockedStock(inventory.getLockedStock() - 1);
                changedInventory.add(inventory);
            }
        }
        if (!changedInventory.isEmpty()) {
            roomInventoryRepository.saveAll(changedInventory);
        }
    }

    private Map<LocalDate, RoomInventoryEntity> lockStayInventory(String roomId, List<LocalDate> stayDates) {
        List<RoomInventoryEntity> inventoryEntities = roomInventoryRepository.findForUpdateByRoomIdAndBizDateBetweenOrderByBizDateAsc(
            roomId,
            stayDates.get(0),
            stayDates.get(stayDates.size() - 1)
        );
        Map<LocalDate, RoomInventoryEntity> inventoryMap = new LinkedHashMap<>();
        for (RoomInventoryEntity inventoryEntity : inventoryEntities) {
            inventoryMap.put(inventoryEntity.getBizDate(), inventoryEntity);
        }
        return inventoryMap;
    }

    private List<LocalDate> buildStayDates(LocalDate checkInDate, int nights) {
        List<LocalDate> stayDates = new ArrayList<>(nights);
        for (int i = 0; i < nights; i++) {
            stayDates.add(checkInDate.plusDays(i));
        }
        return stayDates;
    }

    private WechatPaymentOrderEntity requireLatestPaymentRecord(String orderId) {
        return wechatPaymentOrderRepository
            .findTopByOrderIdOrderByCreatedAtDescIdDesc(orderId)
            .orElseThrow(() -> BusinessException.notFound("支付记录不存在"));
    }

    private WechatPaymentOrderEntity requireSuccessfulPaymentRecord(String orderId) {
        WechatPaymentOrderEntity paymentOrder = requireLatestPaymentRecord(orderId);
        if (paymentOrder.getStatus() != WechatPaymentOrderStatus.SUCCESS
            && orderRepository.findById(orderId).map(OrderEntity::getPaymentStatus).orElse(PaymentStatus.UNPAID) != PaymentStatus.PAID) {
            throw BusinessException.conflict("当前订单缺少可退款的成功支付记录");
        }
        return paymentOrder;
    }

    private OrderEntity requireCurrentUserOrder(String orderId) {
        return orderRepository
            .findByIdAndUserId(orderId, userService.currentUserId())
            .orElseThrow(() -> BusinessException.notFound("订单不存在"));
    }

    private OrderEntity requireOrder(String orderId) {
        return orderRepository.findById(orderId).orElseThrow(() -> BusinessException.notFound("订单不存在"));
    }

    private UserEntity requireActiveUser(String userId) {
        return userRepository
            .findByIdAndStatus(userId, USER_STATUS_ACTIVE)
            .orElseThrow(() -> BusinessException.notFound("用户不存在"));
    }

    private OrderAfterSaleRequestEntity loadLatestAfterSaleRequest(String orderId) {
        return orderAfterSaleRequestRepository.findTopByOrderIdOrderByRequestedAtDescIdDesc(orderId).orElse(null);
    }

    private void syncLegacyStatus(OrderEntity order, OrderAfterSaleRequestEntity latestRequest) {
        order.setStatus(resolveLegacyStatus(order, latestRequest));
    }

    private OrderStatus resolveLegacyStatus(OrderEntity order, OrderAfterSaleRequestEntity latestRequest) {
        BookingStatus bookingStatus = Objects.requireNonNull(order.getBookingStatus(), "bookingStatus");
        PaymentStatus paymentStatus = Objects.requireNonNull(order.getPaymentStatus(), "paymentStatus");

        switch (bookingStatus) {
            case PENDING_PAYMENT:
                return OrderStatus.PENDING_PAYMENT;
            case CHECKED_IN:
                return OrderStatus.CHECKED_IN;
            case CHECKED_OUT:
                return OrderStatus.COMPLETED;
            case NO_SHOW:
                return OrderStatus.NO_SHOW;
            case CANCELLED:
                if (paymentStatus == PaymentStatus.REFUND_PENDING) {
                    return OrderStatus.REFUND_PENDING;
                }
                return paymentStatus == PaymentStatus.REFUNDED ? OrderStatus.REFUNDED : OrderStatus.CANCELLED;
            case CONFIRMED:
                if (latestRequest != null
                    && latestRequest.getType() == AfterSaleRequestType.RESCHEDULE
                    && latestRequest.getStatus() == AfterSaleRequestStatus.APPROVED) {
                    return OrderStatus.RESCHEDULED;
                }
                return OrderStatus.CONFIRMED;
            default:
                throw new IllegalStateException("Unsupported booking status: " + bookingStatus);
        }
    }

    private JsonNode readJson(String value) {
        try {
            return objectMapper.readTree(value == null ? "{}" : value);
        } catch (java.io.IOException ex) {
            throw BusinessException.badRequest("微信回调报文格式错误");
        }
    }

    private int toFen(int yuanAmount) {
        return yuanAmount * 100;
    }

    private String buildOrderDescription(OrderEntity order) {
        return order.getRoomName() + " " + order.getCheckInDate() + "入住";
    }

    private String buildOutTradeNo(OrderEntity order) {
        return "SFP" + order.getOrderNo() + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
    }

    private String buildOutRefundNo(OrderEntity order) {
        return "SFR" + order.getOrderNo() + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    private String resolvePaymentMode() {
        return wechatPayProperties.isMockEnabled() ? "MOCK_WECHAT_PAY" : "WECHAT_MINIAPP";
    }

    private String normalizeReason(String reason) {
        String normalized = normalize(reason);
        return normalized.isEmpty() ? "订单退款" : normalized;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private WechatPaymentOrderStatus resolvePaymentOrderStatus(String tradeState) {
        String normalized = normalize(tradeState).toUpperCase();
        if ("SUCCESS".equals(normalized)) {
            return WechatPaymentOrderStatus.SUCCESS;
        }
        if ("USERPAYING".equals(normalized) || "NOTPAY".equals(normalized)) {
            return WechatPaymentOrderStatus.USERPAYING;
        }
        if ("CLOSED".equals(normalized) || "REVOKED".equals(normalized)) {
            return WechatPaymentOrderStatus.CLOSED;
        }
        return WechatPaymentOrderStatus.FAILED;
    }

    private WechatRefundOrderStatus resolveRefundStatus(String status) {
        String normalized = normalize(status).toUpperCase();
        if ("SUCCESS".equals(normalized)) {
            return WechatRefundOrderStatus.SUCCESS;
        }
        if ("ABNORMAL".equals(normalized)) {
            return WechatRefundOrderStatus.ABNORMAL;
        }
        if ("CLOSED".equals(normalized)) {
            return WechatRefundOrderStatus.CLOSED;
        }
        return WechatRefundOrderStatus.PROCESSING;
    }

    private WechatRefundOrderStatus resolveRefundFailureStatus(String failCode) {
        String normalized = normalize(failCode).toUpperCase();
        if ("ABNORMAL".equals(normalized)) {
            return WechatRefundOrderStatus.ABNORMAL;
        }
        if ("CLOSED".equals(normalized)) {
            return WechatRefundOrderStatus.CLOSED;
        }
        return WechatRefundOrderStatus.FAILED;
    }

    public static final class PreparePaymentResult {

        private final WechatPaymentOrderEntity paymentOrder;
        private final PreparePaymentRequest paymentRequest;
        private final String paymentMode;

        public PreparePaymentResult(WechatPaymentOrderEntity paymentOrder, PreparePaymentRequest paymentRequest, String paymentMode) {
            this.paymentOrder = paymentOrder;
            this.paymentRequest = paymentRequest;
            this.paymentMode = paymentMode;
        }

        public WechatPaymentOrderEntity getPaymentOrder() {
            return paymentOrder;
        }

        public PreparePaymentRequest getPaymentRequest() {
            return paymentRequest;
        }

        public String getPaymentMode() {
            return paymentMode;
        }
    }

    public static final class PreparePaymentRequest {

        private String timeStamp;
        private String nonceStr;
        private String packageValue;
        private String signType;
        private String paySign;

        public String getTimeStamp() {
            return timeStamp;
        }

        public void setTimeStamp(String timeStamp) {
            this.timeStamp = timeStamp;
        }

        public String getNonceStr() {
            return nonceStr;
        }

        public void setNonceStr(String nonceStr) {
            this.nonceStr = nonceStr;
        }

        public String getPackageValue() {
            return packageValue;
        }

        public void setPackageValue(String packageValue) {
            this.packageValue = packageValue;
        }

        public String getSignType() {
            return signType;
        }

        public void setSignType(String signType) {
            this.signType = signType;
        }

        public String getPaySign() {
            return paySign;
        }

        public void setPaySign(String paySign) {
            this.paySign = paySign;
        }
    }
}
