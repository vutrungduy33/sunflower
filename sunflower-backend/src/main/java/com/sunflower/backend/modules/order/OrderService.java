package com.sunflower.backend.modules.order;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sunflower.backend.common.exception.BusinessException;
import com.sunflower.backend.modules.order.admin.dto.AdminOrderDto;
import com.sunflower.backend.modules.order.dto.CreateOrderRequest;
import com.sunflower.backend.modules.order.dto.OrderDto;
import com.sunflower.backend.modules.order.dto.OrderPayPrepareDto;
import com.sunflower.backend.modules.order.dto.RefundOrderRequest;
import com.sunflower.backend.modules.order.dto.RescheduleOrderRequest;
import com.sunflower.backend.modules.payment.wechat.OrderPaymentService;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatPaymentOrderEntity;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatPaymentOrderRepository;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatRefundOrderEntity;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatRefundOrderRepository;
import com.sunflower.backend.modules.order.persistence.OrderAfterSaleRequestEntity;
import com.sunflower.backend.modules.order.persistence.OrderAfterSaleRequestRepository;
import com.sunflower.backend.modules.order.persistence.OrderEntity;
import com.sunflower.backend.modules.order.persistence.OrderRepository;
import com.sunflower.backend.modules.room.RoomService;
import com.sunflower.backend.modules.room.dto.RoomCalendarItemDto;
import com.sunflower.backend.modules.room.persistence.RoomInventoryEntity;
import com.sunflower.backend.modules.room.persistence.RoomInventoryRepository;
import com.sunflower.backend.modules.user.UserService;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private static final ZoneId SHANGHAI_ZONE = ZoneId.of("Asia/Shanghai");
    private static final DateTimeFormatter ORDER_NO_DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final String DEFAULT_SOURCE = "direct";
    private static final String OUT_OF_STOCK_MESSAGE = "所选日期库存不足";
    private static final String INVENTORY_DATA_ERROR_MESSAGE = "库存数据异常，请联系管理员";
    private static final String RESCHEDULE_NIGHTS_NOT_MATCH_MESSAGE = "改期暂仅支持保持原入住晚数";
    private static final String ACTIVE_AFTER_SALE_CONFLICT_MESSAGE = "当前订单已有进行中的售后申请";
    private static final int ORDER_NO_MAX_RETRY = 8;
    private static final String USER_ACTOR_PREFIX = "USER:";
    private static final String ADMIN_ACTOR = "ADMIN";

    private final Random random = new SecureRandom();

    private final OrderRepository orderRepository;
    private final OrderAfterSaleRequestRepository orderAfterSaleRequestRepository;
    private final WechatPaymentOrderRepository wechatPaymentOrderRepository;
    private final WechatRefundOrderRepository wechatRefundOrderRepository;
    private final RoomInventoryRepository roomInventoryRepository;
    private final RoomService roomService;
    private final UserService userService;
    private final OrderPaymentService orderPaymentService;
    private final ObjectMapper objectMapper;

    public OrderService(
        OrderRepository orderRepository,
        OrderAfterSaleRequestRepository orderAfterSaleRequestRepository,
        WechatPaymentOrderRepository wechatPaymentOrderRepository,
        WechatRefundOrderRepository wechatRefundOrderRepository,
        RoomInventoryRepository roomInventoryRepository,
        RoomService roomService,
        UserService userService,
        OrderPaymentService orderPaymentService,
        ObjectMapper objectMapper
    ) {
        this.orderRepository = orderRepository;
        this.orderAfterSaleRequestRepository = orderAfterSaleRequestRepository;
        this.wechatPaymentOrderRepository = wechatPaymentOrderRepository;
        this.wechatRefundOrderRepository = wechatRefundOrderRepository;
        this.roomInventoryRepository = roomInventoryRepository;
        this.roomService = roomService;
        this.userService = userService;
        this.orderPaymentService = orderPaymentService;
        this.objectMapper = objectMapper;
    }

    public List<OrderDto> getCurrentUserOrders() {
        String userId = userService.currentUserId();
        return orderRepository
            .findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::toOrderDto)
            .collect(Collectors.toList());
    }

    public OrderDto getCurrentUserOrder(String orderId) {
        return toOrderDto(requireCurrentUserOrderRecord(orderId));
    }

    @Transactional
    public OrderDto createOrder(CreateOrderRequest request) {
        LocalDate checkInDate = roomService.parseDate(request.getCheckInDate(), "checkInDate");
        LocalDate checkOutDate = roomService.parseDate(request.getCheckOutDate(), "checkOutDate");

        long nights = ChronoUnit.DAYS.between(checkInDate, checkOutDate);
        if (nights <= 0) {
            throw BusinessException.badRequest("退房日期需晚于入住日期");
        }

        RoomService.RoomSeed room = roomService.requireRoomSeed(request.getRoomId());
        String userId = userService.currentUserId();
        List<LocalDate> stayDates = buildStayDates(checkInDate, (int) nights);
        lockInventoryForCreate(room.getId(), stayDates);

        LocalDateTime now = LocalDateTime.now(SHANGHAI_ZONE);
        int totalAmount = calculateOrderAmount(room.getId(), checkInDate, (int) nights);

        OrderEntity order = new OrderEntity();
        order.setId(buildOrderId(now));
        order.setOrderNo(buildUniqueOrderNo(now));
        order.setUserId(userId);
        order.setSource(normalizeSource(request.getSource()));
        order.setRoomId(room.getId());
        order.setRoomName(room.getName());
        order.setCheckInDate(checkInDate);
        order.setCheckOutDate(checkOutDate);
        order.setNights((int) nights);
        order.setGuestName(normalizeRequiredText(request.getGuestName()));
        order.setGuestPhone(normalizeRequiredText(request.getGuestPhone()));
        order.setArrivalTime(normalizeRequiredText(request.getArrivalTime()));
        order.setRemark(normalizeOptionalText(request.getRemark()));
        order.setTotalAmount(totalAmount);
        order.setBookingStatus(BookingStatus.PENDING_PAYMENT);
        order.setPaymentStatus(PaymentStatus.UNPAID);
        order.setAfterSaleReason("");
        order.setCreatedAt(now);
        syncLegacyStatus(order, null);

        return toOrderDto(orderRepository.save(order));
    }

    @Transactional
    public OrderPayPrepareDto payCurrentUserOrder(String orderId) {
        OrderPaymentService.PreparePaymentResult result = orderPaymentService.prepareCurrentUserOrderPayment(orderId);
        OrderPayPrepareDto dto = new OrderPayPrepareDto();
        dto.setOrder(toOrderDto(requireCurrentUserOrderRecord(orderId)));
        dto.setPaymentMode(result.getPaymentMode());
        dto.setPaymentRecordId(result.getPaymentOrder().getId());
        dto.setExpiresAt(toDateTimeString(result.getPaymentOrder().getTimeExpire()));

        OrderPayPrepareDto.PaymentRequest paymentRequest = new OrderPayPrepareDto.PaymentRequest();
        paymentRequest.setTimeStamp(result.getPaymentRequest().getTimeStamp());
        paymentRequest.setNonceStr(result.getPaymentRequest().getNonceStr());
        paymentRequest.setPackageValue(result.getPaymentRequest().getPackageValue());
        paymentRequest.setSignType(result.getPaymentRequest().getSignType());
        paymentRequest.setPaySign(result.getPaymentRequest().getPaySign());
        dto.setPaymentRequest(paymentRequest);
        return dto;
    }

    @Transactional
    public OrderDto confirmCurrentUserOrderPayment(String orderId) {
        return toOrderDto(orderPaymentService.confirmCurrentUserOrderPayment(orderId));
    }

    @Transactional
    public OrderDto cancelCurrentUserOrder(String orderId) {
        return cancelCurrentUserOrder(orderId, "");
    }

    @Transactional
    public OrderDto cancelCurrentUserOrder(String orderId, String reason) {
        OrderEntity order = requireCurrentUserOrderRecord(orderId);
        if (order.getBookingStatus() != BookingStatus.PENDING_PAYMENT) {
            throw BusinessException.conflict("当前订单状态不可取消");
        }
        List<LocalDate> stayDates = buildStayDates(order.getCheckInDate(), order.getNights());
        releaseInventoryForCancel(order.getRoomId(), stayDates);
        order.setBookingStatus(BookingStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now(SHANGHAI_ZONE));
        order.setAfterSaleReason(normalizeOptionalText(reason));
        syncLegacyStatus(order, null);
        return toOrderDto(orderRepository.save(order));
    }

    @Transactional
    public OrderDto rescheduleCurrentUserOrder(String orderId, RescheduleOrderRequest request) {
        OrderEntity order = requireCurrentUserOrderRecord(orderId);
        validateRescheduleRequest(order, request);
        OrderAfterSaleRequestEntity afterSaleRequest = createAfterSaleRequest(
            order,
            AfterSaleRequestType.RESCHEDULE,
            normalizeOptionalText(request.getReason()),
            buildReschedulePayloadSnapshot(request),
            buildCurrentUserActor(),
            AfterSaleRequestStatus.REQUESTED
        );
        order.setAfterSaleReason(afterSaleRequest.getReason());
        syncLegacyStatus(order, afterSaleRequest);
        orderRepository.save(order);
        return toOrderDto(order);
    }

    @Transactional
    public OrderDto refundCurrentUserOrder(String orderId, RefundOrderRequest request) {
        OrderEntity order = requireCurrentUserOrderRecord(orderId);
        validateRefundRequest(order);
        OrderAfterSaleRequestEntity afterSaleRequest = createAfterSaleRequest(
            order,
            AfterSaleRequestType.REFUND,
            normalizeOptionalText(request == null ? null : request.getReason()),
            "",
            buildCurrentUserActor(),
            AfterSaleRequestStatus.REQUESTED
        );
        order.setAfterSaleReason(afterSaleRequest.getReason());
        syncLegacyStatus(order, afterSaleRequest);
        orderRepository.save(order);
        return toOrderDto(order);
    }

    @Transactional
    public OrderDto rescheduleOrderByAdmin(String orderId, RescheduleOrderRequest request) {
        OrderEntity order = requireOrderRecord(orderId);
        validateRescheduleRequest(order, request);
        ensureNoActiveAfterSaleRequest(order.getId());

        LocalDateTime now = LocalDateTime.now(SHANGHAI_ZONE);
        OrderAfterSaleRequestEntity afterSaleRequest = buildApprovedAfterSaleRequest(
            order,
            AfterSaleRequestType.RESCHEDULE,
            normalizeOptionalText(request.getReason()),
            buildReschedulePayloadSnapshot(request),
            now
        );
        applyApprovedReschedule(order, afterSaleRequest, request.getCheckInDate(), request.getCheckOutDate(), now);
        orderAfterSaleRequestRepository.save(afterSaleRequest);
        orderRepository.save(order);
        return toOrderDto(order);
    }

    @Transactional
    public OrderDto refundOrderByAdmin(String orderId, RefundOrderRequest request) {
        OrderEntity order = requireOrderRecord(orderId);
        validateRefundRequest(order);
        ensureNoActiveAfterSaleRequest(order.getId());

        LocalDateTime now = LocalDateTime.now(SHANGHAI_ZONE);
        OrderAfterSaleRequestEntity afterSaleRequest = buildApprovedAfterSaleRequest(
            order,
            AfterSaleRequestType.REFUND,
            normalizeOptionalText(request == null ? null : request.getReason()),
            "",
            now
        );
        orderPaymentService.startDirectRefund(orderId, afterSaleRequest.getReason());
        orderAfterSaleRequestRepository.save(afterSaleRequest);
        return toOrderDto(requireOrderRecord(orderId));
    }

    @Transactional
    public OrderDto approveAfterSaleRequestByAdmin(String orderId, Long requestId) {
        OrderEntity order = requireOrderRecord(orderId);
        OrderAfterSaleRequestEntity afterSaleRequest = requirePendingAfterSaleRequest(orderId, requestId);
        LocalDateTime now = LocalDateTime.now(SHANGHAI_ZONE);

        if (afterSaleRequest.getType() == AfterSaleRequestType.RESCHEDULE) {
            JsonNode payload = parsePayloadSnapshot(afterSaleRequest.getPayloadSnapshot());
            String nextCheckInDate = payload.path("checkInDate").asText("");
            String nextCheckOutDate = payload.path("checkOutDate").asText("");
            if (nextCheckInDate.isEmpty() || nextCheckOutDate.isEmpty()) {
                throw BusinessException.conflict("改期申请缺少日期信息");
            }
            applyApprovedReschedule(order, afterSaleRequest, nextCheckInDate, nextCheckOutDate, now);
        } else if (afterSaleRequest.getType() == AfterSaleRequestType.REFUND) {
            orderPaymentService.approveRefundAfterSale(order, afterSaleRequest, now);
        } else {
            throw BusinessException.conflict("暂不支持的售后类型");
        }

        orderAfterSaleRequestRepository.save(afterSaleRequest);
        orderRepository.save(order);
        return toOrderDto(order);
    }

    @Transactional
    public OrderDto rejectAfterSaleRequestByAdmin(String orderId, Long requestId, String rejectReason) {
        OrderEntity order = requireOrderRecord(orderId);
        OrderAfterSaleRequestEntity afterSaleRequest = requirePendingAfterSaleRequest(orderId, requestId);
        afterSaleRequest.setStatus(AfterSaleRequestStatus.REJECTED);
        afterSaleRequest.setReviewedBy(ADMIN_ACTOR);
        afterSaleRequest.setReviewedAt(LocalDateTime.now(SHANGHAI_ZONE));
        afterSaleRequest.setRejectReason(normalizeOptionalText(rejectReason));
        syncLegacyStatus(order, afterSaleRequest);
        orderAfterSaleRequestRepository.save(afterSaleRequest);
        orderRepository.save(order);
        return toOrderDto(order);
    }

    @Transactional
    public OrderDto checkInOrderByAdmin(String orderId) {
        OrderEntity order = requireOrderRecord(orderId);
        if (order.getBookingStatus() != BookingStatus.CONFIRMED || order.getPaymentStatus() != PaymentStatus.PAID) {
            throw BusinessException.conflict("当前订单状态不可办理入住");
        }
        ensureNoActiveAfterSaleRequest(order.getId());
        order.setBookingStatus(BookingStatus.CHECKED_IN);
        order.setCheckedInAt(LocalDateTime.now(SHANGHAI_ZONE));
        syncLegacyStatus(order, loadLatestAfterSaleRequest(order.getId()));
        orderRepository.save(order);
        return toOrderDto(order);
    }

    @Transactional
    public OrderDto checkOutOrderByAdmin(String orderId) {
        OrderEntity order = requireOrderRecord(orderId);
        if (order.getBookingStatus() != BookingStatus.CHECKED_IN) {
            throw BusinessException.conflict("当前订单状态不可办理离店");
        }
        order.setBookingStatus(BookingStatus.CHECKED_OUT);
        order.setCheckedOutAt(LocalDateTime.now(SHANGHAI_ZONE));
        syncLegacyStatus(order, loadLatestAfterSaleRequest(order.getId()));
        orderRepository.save(order);
        return toOrderDto(order);
    }

    @Transactional
    public OrderDto markNoShowOrderByAdmin(String orderId) {
        OrderEntity order = requireOrderRecord(orderId);
        if (order.getBookingStatus() != BookingStatus.CONFIRMED) {
            throw BusinessException.conflict("当前订单状态不可标记失约");
        }
        ensureNoActiveAfterSaleRequest(order.getId());
        releaseInventoryForCancel(order.getRoomId(), buildStayDates(order.getCheckInDate(), order.getNights()));
        order.setBookingStatus(BookingStatus.NO_SHOW);
        order.setNoShowAt(LocalDateTime.now(SHANGHAI_ZONE));
        syncLegacyStatus(order, loadLatestAfterSaleRequest(order.getId()));
        orderRepository.save(order);
        return toOrderDto(order);
    }

    public OrderDto toOrderDto(OrderEntity order) {
        AfterSaleSnapshot snapshot = buildAfterSaleSnapshot(order.getId());
        PaymentSnapshot paymentSnapshot = buildPaymentSnapshot(order.getId());
        syncLegacyStatus(order, snapshot.latestRequest);

        OrderDto dto = new OrderDto();
        dto.setId(order.getId());
        dto.setOrderNo(order.getOrderNo());
        dto.setSource(order.getSource());
        dto.setRoomId(order.getRoomId());
        dto.setRoomName(order.getRoomName());
        dto.setCheckInDate(order.getCheckInDate().toString());
        dto.setCheckOutDate(order.getCheckOutDate().toString());
        dto.setNights(order.getNights());
        dto.setGuestName(order.getGuestName());
        dto.setGuestPhone(order.getGuestPhone());
        dto.setArrivalTime(order.getArrivalTime());
        dto.setRemark(order.getRemark());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus().name());
        dto.setStatusLabel(resolveLegacyStatusLabel(order, snapshot));
        dto.setBookingStatus(order.getBookingStatus().name());
        dto.setBookingStatusLabel(order.getBookingStatus().getLabel());
        dto.setPaymentStatus(order.getPaymentStatus().name());
        dto.setPaymentStatusLabel(order.getPaymentStatus().getLabel());
        dto.setPaymentMode(paymentSnapshot.paymentMode);
        dto.setPaymentRecordStatus(paymentSnapshot.paymentRecordStatus);
        dto.setPaymentRecordNo(paymentSnapshot.paymentRecordNo);
        dto.setTransactionId(paymentSnapshot.transactionId);
        dto.setLatestRefundRecordId(paymentSnapshot.latestRefundRecordId);
        dto.setLatestRefundStatus(paymentSnapshot.latestRefundStatus);
        dto.setLatestRefundFailureCode(paymentSnapshot.latestRefundFailureCode);
        dto.setLatestRefundFailureMessage(paymentSnapshot.latestRefundFailureMessage);
        dto.setLatestRefundAmount(paymentSnapshot.latestRefundAmount);
        dto.setLatestAfterSaleRequestId(snapshot.latestRequest == null ? null : snapshot.latestRequest.getId());
        dto.setLatestAfterSaleType(snapshot.latestType == null ? "" : snapshot.latestType.name());
        dto.setLatestAfterSaleStatus(snapshot.latestStatus == null ? "" : snapshot.latestStatus.name());
        dto.setLatestAfterSaleStatusLabel(snapshot.latestStatus == null ? "" : snapshot.latestStatus.getLabel());
        dto.setLatestAfterSaleRejectReason(snapshot.latestRejectReason);
        dto.setRescheduleCount(snapshot.rescheduleCount);
        dto.setCreatedAt(toDateTimeString(order.getCreatedAt()));
        dto.setPaidAt(toDateTimeString(order.getPaidAt()));
        dto.setCancelledAt(toDateTimeString(order.getCancelledAt()));
        dto.setCheckedInAt(toDateTimeString(order.getCheckedInAt()));
        dto.setCheckedOutAt(toDateTimeString(order.getCheckedOutAt()));
        dto.setNoShowAt(toDateTimeString(order.getNoShowAt()));
        dto.setRescheduledAt(toDateTimeString(order.getRescheduledAt()));
        dto.setRefundedAt(toDateTimeString(order.getRefundedAt()));
        dto.setAfterSaleReason(snapshot.latestReason.isEmpty() ? safeString(order.getAfterSaleReason()) : snapshot.latestReason);
        return dto;
    }

    public AdminOrderDto toAdminOrderDto(OrderEntity order) {
        AfterSaleSnapshot snapshot = buildAfterSaleSnapshot(order.getId());
        PaymentSnapshot paymentSnapshot = buildPaymentSnapshot(order.getId());
        syncLegacyStatus(order, snapshot.latestRequest);

        AdminOrderDto dto = new AdminOrderDto();
        dto.setId(order.getId());
        dto.setOrderNo(order.getOrderNo());
        dto.setUserId(order.getUserId());
        dto.setSource(order.getSource());
        dto.setRoomId(order.getRoomId());
        dto.setRoomName(order.getRoomName());
        dto.setCheckInDate(order.getCheckInDate().toString());
        dto.setCheckOutDate(order.getCheckOutDate().toString());
        dto.setNights(order.getNights());
        dto.setGuestName(order.getGuestName());
        dto.setGuestPhone(order.getGuestPhone());
        dto.setArrivalTime(order.getArrivalTime());
        dto.setRemark(order.getRemark());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus().name());
        dto.setStatusLabel(resolveLegacyStatusLabel(order, snapshot));
        dto.setBookingStatus(order.getBookingStatus().name());
        dto.setBookingStatusLabel(order.getBookingStatus().getLabel());
        dto.setPaymentStatus(order.getPaymentStatus().name());
        dto.setPaymentStatusLabel(order.getPaymentStatus().getLabel());
        dto.setPaymentMode(paymentSnapshot.paymentMode);
        dto.setPaymentRecordStatus(paymentSnapshot.paymentRecordStatus);
        dto.setPaymentRecordNo(paymentSnapshot.paymentRecordNo);
        dto.setTransactionId(paymentSnapshot.transactionId);
        dto.setLatestRefundRecordId(paymentSnapshot.latestRefundRecordId);
        dto.setLatestRefundStatus(paymentSnapshot.latestRefundStatus);
        dto.setLatestRefundFailureCode(paymentSnapshot.latestRefundFailureCode);
        dto.setLatestRefundFailureMessage(paymentSnapshot.latestRefundFailureMessage);
        dto.setLatestRefundAmount(paymentSnapshot.latestRefundAmount);
        dto.setLatestAfterSaleRequestId(snapshot.latestRequest == null ? null : snapshot.latestRequest.getId());
        dto.setLatestAfterSaleType(snapshot.latestType == null ? "" : snapshot.latestType.name());
        dto.setLatestAfterSaleStatus(snapshot.latestStatus == null ? "" : snapshot.latestStatus.name());
        dto.setLatestAfterSaleStatusLabel(snapshot.latestStatus == null ? "" : snapshot.latestStatus.getLabel());
        dto.setLatestAfterSaleRejectReason(snapshot.latestRejectReason);
        dto.setRescheduleCount(snapshot.rescheduleCount);
        dto.setCreatedAt(toDateTimeString(order.getCreatedAt()));
        dto.setPaidAt(toDateTimeString(order.getPaidAt()));
        dto.setCancelledAt(toDateTimeString(order.getCancelledAt()));
        dto.setCheckedInAt(toDateTimeString(order.getCheckedInAt()));
        dto.setCheckedOutAt(toDateTimeString(order.getCheckedOutAt()));
        dto.setNoShowAt(toDateTimeString(order.getNoShowAt()));
        dto.setRescheduledAt(toDateTimeString(order.getRescheduledAt()));
        dto.setRefundedAt(toDateTimeString(order.getRefundedAt()));
        dto.setAfterSaleReason(snapshot.latestReason.isEmpty() ? safeString(order.getAfterSaleReason()) : snapshot.latestReason);
        return dto;
    }

    private void validateRescheduleRequest(OrderEntity order, RescheduleOrderRequest request) {
        if (order.getBookingStatus() != BookingStatus.CONFIRMED || order.getPaymentStatus() != PaymentStatus.PAID) {
            throw BusinessException.conflict("当前订单状态不可改期");
        }
        ensureNoActiveAfterSaleRequest(order.getId());

        LocalDate checkInDate = roomService.parseDate(request.getCheckInDate(), "checkInDate");
        LocalDate checkOutDate = roomService.parseDate(request.getCheckOutDate(), "checkOutDate");
        long nights = ChronoUnit.DAYS.between(checkInDate, checkOutDate);
        if (nights <= 0) {
            throw BusinessException.badRequest("退房日期需晚于入住日期");
        }
        if (nights != order.getNights()) {
            throw BusinessException.badRequest(RESCHEDULE_NIGHTS_NOT_MATCH_MESSAGE);
        }
        if (checkInDate.equals(order.getCheckInDate()) && checkOutDate.equals(order.getCheckOutDate())) {
            throw BusinessException.badRequest("改期日期不能与原订单一致");
        }
    }

    private void validateRefundRequest(OrderEntity order) {
        if (order.getBookingStatus() != BookingStatus.CONFIRMED || order.getPaymentStatus() != PaymentStatus.PAID) {
            throw BusinessException.conflict("当前订单状态不可退款");
        }
        ensureNoActiveAfterSaleRequest(order.getId());
    }

    private void ensureNoActiveAfterSaleRequest(String orderId) {
        if (orderAfterSaleRequestRepository.existsByOrderIdAndStatus(orderId, AfterSaleRequestStatus.REQUESTED)) {
            throw BusinessException.conflict(ACTIVE_AFTER_SALE_CONFLICT_MESSAGE);
        }
    }

    private OrderAfterSaleRequestEntity requirePendingAfterSaleRequest(String orderId, Long requestId) {
        OrderAfterSaleRequestEntity afterSaleRequest = orderAfterSaleRequestRepository
            .findByIdAndOrderId(requestId, orderId)
            .orElseThrow(() -> BusinessException.notFound("售后申请不存在"));
        if (afterSaleRequest.getStatus() != AfterSaleRequestStatus.REQUESTED) {
            throw BusinessException.conflict("当前售后申请不可审批");
        }
        return afterSaleRequest;
    }

    private OrderAfterSaleRequestEntity createAfterSaleRequest(
        OrderEntity order,
        AfterSaleRequestType type,
        String reason,
        String payloadSnapshot,
        String requestedBy,
        AfterSaleRequestStatus status
    ) {
        LocalDateTime now = LocalDateTime.now(SHANGHAI_ZONE);
        OrderAfterSaleRequestEntity afterSaleRequest = new OrderAfterSaleRequestEntity();
        afterSaleRequest.setOrderId(order.getId());
        afterSaleRequest.setType(type);
        afterSaleRequest.setStatus(status);
        afterSaleRequest.setRequestedBy(requestedBy);
        afterSaleRequest.setRequestedAt(now);
        afterSaleRequest.setReason(reason);
        afterSaleRequest.setRejectReason("");
        afterSaleRequest.setPayloadSnapshot(payloadSnapshot);
        if (status == AfterSaleRequestStatus.APPROVED) {
            afterSaleRequest.setReviewedBy(ADMIN_ACTOR);
            afterSaleRequest.setReviewedAt(now);
        }
        return orderAfterSaleRequestRepository.save(afterSaleRequest);
    }

    private OrderAfterSaleRequestEntity buildApprovedAfterSaleRequest(
        OrderEntity order,
        AfterSaleRequestType type,
        String reason,
        String payloadSnapshot,
        LocalDateTime now
    ) {
        OrderAfterSaleRequestEntity afterSaleRequest = new OrderAfterSaleRequestEntity();
        afterSaleRequest.setOrderId(order.getId());
        afterSaleRequest.setType(type);
        afterSaleRequest.setStatus(AfterSaleRequestStatus.APPROVED);
        afterSaleRequest.setRequestedBy(ADMIN_ACTOR);
        afterSaleRequest.setRequestedAt(now);
        afterSaleRequest.setReviewedBy(ADMIN_ACTOR);
        afterSaleRequest.setReviewedAt(now);
        afterSaleRequest.setReason(reason);
        afterSaleRequest.setRejectReason("");
        afterSaleRequest.setPayloadSnapshot(payloadSnapshot);
        return afterSaleRequest;
    }

    private void applyApprovedReschedule(
        OrderEntity order,
        OrderAfterSaleRequestEntity afterSaleRequest,
        String nextCheckInDateText,
        String nextCheckOutDateText,
        LocalDateTime now
    ) {
        LocalDate checkInDate = roomService.parseDate(nextCheckInDateText, "checkInDate");
        LocalDate checkOutDate = roomService.parseDate(nextCheckOutDateText, "checkOutDate");
        long nights = ChronoUnit.DAYS.between(checkInDate, checkOutDate);
        if (nights <= 0) {
            throw BusinessException.badRequest("退房日期需晚于入住日期");
        }
        if (nights != order.getNights()) {
            throw BusinessException.badRequest(RESCHEDULE_NIGHTS_NOT_MATCH_MESSAGE);
        }
        if (checkInDate.equals(order.getCheckInDate()) && checkOutDate.equals(order.getCheckOutDate())) {
            throw BusinessException.badRequest("改期日期不能与原订单一致");
        }

        List<LocalDate> oldStayDates = buildStayDates(order.getCheckInDate(), order.getNights());
        List<LocalDate> newStayDates = buildStayDates(checkInDate, (int) nights);
        rescheduleInventory(order.getRoomId(), oldStayDates, newStayDates);

        order.setCheckInDate(checkInDate);
        order.setCheckOutDate(checkOutDate);
        order.setRescheduledAt(now);
        order.setAfterSaleReason(normalizeOptionalText(afterSaleRequest.getReason()));
        order.setBookingStatus(BookingStatus.CONFIRMED);
        order.setPaymentStatus(PaymentStatus.PAID);

        afterSaleRequest.setStatus(AfterSaleRequestStatus.APPROVED);
        afterSaleRequest.setReviewedBy(ADMIN_ACTOR);
        afterSaleRequest.setReviewedAt(now);

        syncLegacyStatus(order, afterSaleRequest);
    }

    private void applyApprovedRefund(OrderEntity order, OrderAfterSaleRequestEntity afterSaleRequest, LocalDateTime now) {
        List<LocalDate> stayDates = buildStayDates(order.getCheckInDate(), order.getNights());
        releaseInventoryForCancel(order.getRoomId(), stayDates);

        order.setBookingStatus(BookingStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.REFUNDED);
        order.setRefundedAt(now);
        order.setCancelledAt(now);
        order.setAfterSaleReason(normalizeOptionalText(afterSaleRequest.getReason()));

        afterSaleRequest.setStatus(AfterSaleRequestStatus.APPROVED);
        afterSaleRequest.setReviewedBy(ADMIN_ACTOR);
        afterSaleRequest.setReviewedAt(now);

        syncLegacyStatus(order, afterSaleRequest);
    }

    private OrderEntity requireOrderRecord(String orderId) {
        return orderRepository.findById(orderId).orElseThrow(() -> BusinessException.notFound("订单不存在"));
    }

    private OrderEntity requireCurrentUserOrderRecord(String orderId) {
        return orderRepository
            .findByIdAndUserId(orderId, userService.currentUserId())
            .orElseThrow(() -> BusinessException.notFound("订单不存在"));
    }

    private int calculateOrderAmount(String roomId, LocalDate checkInDate, int nights) {
        List<RoomCalendarItemDto> calendar = roomService.buildCalendar(roomId, checkInDate, nights);
        return calendar.stream().mapToInt(RoomCalendarItemDto::getPrice).sum();
    }

    private void lockInventoryForCreate(String roomId, List<LocalDate> stayDates) {
        Map<LocalDate, RoomInventoryEntity> inventoryMap = lockStayInventory(roomId, stayDates);
        for (LocalDate stayDate : stayDates) {
            RoomInventoryEntity inventory = inventoryMap.get(stayDate);
            if (inventory == null || inventory.getAvailableStock() <= 0) {
                throw BusinessException.conflict(OUT_OF_STOCK_MESSAGE);
            }
        }
        for (LocalDate stayDate : stayDates) {
            RoomInventoryEntity inventory = inventoryMap.get(stayDate);
            inventory.setAvailableStock(inventory.getAvailableStock() - 1);
            inventory.setLockedStock(inventory.getLockedStock() + 1);
        }
        roomInventoryRepository.saveAll(inventoryMap.values());
    }

    private void releaseInventoryForCancel(String roomId, List<LocalDate> stayDates) {
        Map<LocalDate, RoomInventoryEntity> inventoryMap = lockStayInventory(roomId, stayDates);
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
        if (changedInventory.isEmpty()) {
            return;
        }
        roomInventoryRepository.saveAll(changedInventory);
    }

    private void rescheduleInventory(String roomId, List<LocalDate> oldStayDates, List<LocalDate> newStayDates) {
        LocalDate lockStartDate = oldStayDates.get(0).isBefore(newStayDates.get(0)) ? oldStayDates.get(0) : newStayDates.get(0);
        LocalDate oldEndDate = oldStayDates.get(oldStayDates.size() - 1);
        LocalDate newEndDate = newStayDates.get(newStayDates.size() - 1);
        LocalDate lockEndDate = oldEndDate.isAfter(newEndDate) ? oldEndDate : newEndDate;

        Map<LocalDate, RoomInventoryEntity> inventoryMap = lockStayInventory(roomId, lockStartDate, lockEndDate);
        Set<RoomInventoryEntity> changedInventory = new LinkedHashSet<>();

        for (LocalDate stayDate : oldStayDates) {
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

        for (LocalDate stayDate : newStayDates) {
            RoomInventoryEntity inventory = inventoryMap.get(stayDate);
            if (inventory == null || inventory.getAvailableStock() <= 0) {
                throw BusinessException.conflict(OUT_OF_STOCK_MESSAGE);
            }
        }
        for (LocalDate stayDate : newStayDates) {
            RoomInventoryEntity inventory = inventoryMap.get(stayDate);
            inventory.setAvailableStock(inventory.getAvailableStock() - 1);
            inventory.setLockedStock(inventory.getLockedStock() + 1);
            changedInventory.add(inventory);
        }

        roomInventoryRepository.saveAll(changedInventory);
    }

    private Map<LocalDate, RoomInventoryEntity> lockStayInventory(String roomId, List<LocalDate> stayDates) {
        return lockStayInventory(roomId, stayDates.get(0), stayDates.get(stayDates.size() - 1));
    }

    private Map<LocalDate, RoomInventoryEntity> lockStayInventory(String roomId, LocalDate startDate, LocalDate endDate) {
        List<RoomInventoryEntity> inventoryEntities = roomInventoryRepository.findForUpdateByRoomIdAndBizDateBetweenOrderByBizDateAsc(
            roomId,
            startDate,
            endDate
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

    private String buildOrderId(LocalDateTime now) {
        return "order_" + now.atZone(SHANGHAI_ZONE).toInstant().toEpochMilli() + "_" + (random.nextInt(9000) + 1000);
    }

    private String buildUniqueOrderNo(LocalDateTime now) {
        for (int i = 0; i < ORDER_NO_MAX_RETRY; i++) {
            String orderNo = buildOrderNo(now);
            if (!orderRepository.existsByOrderNo(orderNo)) {
                return orderNo;
            }
        }
        throw new IllegalStateException("生成订单号失败");
    }

    private String buildOrderNo(LocalDateTime now) {
        String dateTimePart = now.format(ORDER_NO_DATE_TIME_FORMATTER);
        int randomPart = random.nextInt(9000) + 1000;
        return "SF" + dateTimePart + randomPart;
    }

    private String normalizeSource(String source) {
        if (source == null || source.trim().isEmpty()) {
            return DEFAULT_SOURCE;
        }
        return source.trim();
    }

    private String normalizeRequiredText(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeOptionalText(String value) {
        return value == null ? "" : value.trim();
    }

    private String safeString(String value) {
        return value == null ? "" : value;
    }

    private String buildCurrentUserActor() {
        return USER_ACTOR_PREFIX + userService.currentUserId();
    }

    private String buildReschedulePayloadSnapshot(RescheduleOrderRequest request) {
        Map<String, String> payload = new HashMap<>();
        payload.put("checkInDate", request.getCheckInDate());
        payload.put("checkOutDate", request.getCheckOutDate());
        return writeJson(payload);
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("序列化售后申请快照失败", exception);
        }
    }

    private JsonNode parsePayloadSnapshot(String payloadSnapshot) {
        try {
            return payloadSnapshot == null || payloadSnapshot.trim().isEmpty()
                ? objectMapper.createObjectNode()
                : objectMapper.readTree(payloadSnapshot);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("解析售后申请快照失败", exception);
        }
    }

    private OrderAfterSaleRequestEntity loadLatestAfterSaleRequest(String orderId) {
        return orderAfterSaleRequestRepository.findTopByOrderIdOrderByRequestedAtDescIdDesc(orderId).orElse(null);
    }

    private AfterSaleSnapshot buildAfterSaleSnapshot(String orderId) {
        OrderAfterSaleRequestEntity latestRequest = loadLatestAfterSaleRequest(orderId);
        int rescheduleCount = Math.toIntExact(
            orderAfterSaleRequestRepository.countByOrderIdAndTypeAndStatus(
                orderId,
                AfterSaleRequestType.RESCHEDULE,
                AfterSaleRequestStatus.APPROVED
            )
        );
        return new AfterSaleSnapshot(
            latestRequest,
            latestRequest == null ? null : latestRequest.getType(),
            latestRequest == null ? null : latestRequest.getStatus(),
            latestRequest == null ? "" : safeString(latestRequest.getReason()),
            latestRequest == null ? "" : safeString(latestRequest.getRejectReason()),
            rescheduleCount
        );
    }

    private void syncLegacyStatus(OrderEntity order, OrderAfterSaleRequestEntity latestRequest) {
        order.setStatus(resolveLegacyStatus(order, latestRequest));
    }

    private PaymentSnapshot buildPaymentSnapshot(String orderId) {
        WechatPaymentOrderEntity paymentOrder = wechatPaymentOrderRepository
            .findTopByOrderIdOrderByCreatedAtDescIdDesc(orderId)
            .orElse(null);
        WechatRefundOrderEntity refundOrder = wechatRefundOrderRepository
            .findTopByOrderIdOrderByCreatedAtDescIdDesc(orderId)
            .orElse(null);

        return new PaymentSnapshot(
            resolvePaymentMode(paymentOrder),
            paymentOrder == null || paymentOrder.getStatus() == null ? "" : paymentOrder.getStatus().name(),
            paymentOrder == null ? "" : safeString(paymentOrder.getOutTradeNo()),
            paymentOrder == null ? "" : safeString(paymentOrder.getTransactionId()),
            refundOrder == null ? null : refundOrder.getId(),
            refundOrder == null || refundOrder.getStatus() == null ? "" : refundOrder.getStatus().name(),
            refundOrder == null ? "" : safeString(refundOrder.getFailCode()),
            refundOrder == null ? "" : safeString(refundOrder.getFailMessage()),
            refundOrder == null ? 0 : refundOrder.getRefundAmount() / 100
        );
    }

    private String resolvePaymentMode(WechatPaymentOrderEntity paymentOrder) {
        if (paymentOrder == null) {
            return "";
        }
        String prepayId = safeString(paymentOrder.getPrepayId());
        if (prepayId.startsWith("mock_")) {
            return "MOCK_WECHAT_PAY";
        }
        return "WECHAT_MINIAPP";
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

    private String resolveLegacyStatusLabel(OrderEntity order, AfterSaleSnapshot snapshot) {
        if (order.getBookingStatus() == BookingStatus.CANCELLED && order.getPaymentStatus() == PaymentStatus.REFUND_PENDING) {
            return PaymentStatus.REFUND_PENDING.getLabel();
        }

        OrderStatus legacyStatus = order.getStatus();
        if (legacyStatus != OrderStatus.CONFIRMED) {
            return legacyStatus.getLabel();
        }

        if (snapshot.latestStatus == AfterSaleRequestStatus.REQUESTED && snapshot.latestType != null) {
            return legacyStatus.getLabel() + "（" + snapshot.latestType.getLabel() + snapshot.latestStatus.getLabel() + "）";
        }
        if (snapshot.latestStatus == AfterSaleRequestStatus.REJECTED && snapshot.latestType != null) {
            return legacyStatus.getLabel() + "（" + snapshot.latestType.getLabel() + "被拒绝）";
        }
        return legacyStatus.getLabel();
    }

    private String toDateTimeString(LocalDateTime value) {
        if (value == null) {
            return "";
        }
        return value.atZone(SHANGHAI_ZONE).toOffsetDateTime().toString();
    }

    private static final class AfterSaleSnapshot {

        private final OrderAfterSaleRequestEntity latestRequest;
        private final AfterSaleRequestType latestType;
        private final AfterSaleRequestStatus latestStatus;
        private final String latestReason;
        private final String latestRejectReason;
        private final int rescheduleCount;

        private AfterSaleSnapshot(
            OrderAfterSaleRequestEntity latestRequest,
            AfterSaleRequestType latestType,
            AfterSaleRequestStatus latestStatus,
            String latestReason,
            String latestRejectReason,
            int rescheduleCount
        ) {
            this.latestRequest = latestRequest;
            this.latestType = latestType;
            this.latestStatus = latestStatus;
            this.latestReason = latestReason;
            this.latestRejectReason = latestRejectReason;
            this.rescheduleCount = rescheduleCount;
        }
    }

    private static final class PaymentSnapshot {

        private final String paymentMode;
        private final String paymentRecordStatus;
        private final String paymentRecordNo;
        private final String transactionId;
        private final Long latestRefundRecordId;
        private final String latestRefundStatus;
        private final String latestRefundFailureCode;
        private final String latestRefundFailureMessage;
        private final int latestRefundAmount;

        private PaymentSnapshot(
            String paymentMode,
            String paymentRecordStatus,
            String paymentRecordNo,
            String transactionId,
            Long latestRefundRecordId,
            String latestRefundStatus,
            String latestRefundFailureCode,
            String latestRefundFailureMessage,
            int latestRefundAmount
        ) {
            this.paymentMode = paymentMode;
            this.paymentRecordStatus = paymentRecordStatus;
            this.paymentRecordNo = paymentRecordNo;
            this.transactionId = transactionId;
            this.latestRefundRecordId = latestRefundRecordId;
            this.latestRefundStatus = latestRefundStatus;
            this.latestRefundFailureCode = latestRefundFailureCode;
            this.latestRefundFailureMessage = latestRefundFailureMessage;
            this.latestRefundAmount = latestRefundAmount;
        }
    }
}
