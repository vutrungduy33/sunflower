package com.sunflower.backend.modules.order.admin;

import com.sunflower.backend.common.exception.BusinessException;
import com.sunflower.backend.modules.admin.AdminAuthService;
import com.sunflower.backend.modules.order.BookingStatus;
import com.sunflower.backend.modules.order.OrderService;
import com.sunflower.backend.modules.order.OrderStatus;
import com.sunflower.backend.modules.order.PaymentStatus;
import com.sunflower.backend.modules.order.admin.dto.AdminOrderDto;
import com.sunflower.backend.modules.order.admin.dto.AdminOrderOverviewDto;
import com.sunflower.backend.modules.order.dto.RefundOrderRequest;
import com.sunflower.backend.modules.order.dto.RescheduleOrderRequest;
import com.sunflower.backend.modules.order.persistence.OrderEntity;
import com.sunflower.backend.modules.order.persistence.OrderRepository;
import com.sunflower.backend.modules.room.RoomService;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import javax.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class AdminOrderService {

    private static final Set<BookingStatus> PENDING_CHECK_IN_BOOKING_STATUSES = Set.of(BookingStatus.CONFIRMED);
    private static final Set<PaymentStatus> REVENUE_PAYMENT_STATUSES = Set.of(PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED);

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final RoomService roomService;
    private final AdminAuthService adminAuthService;

    public AdminOrderService(
        OrderRepository orderRepository,
        OrderService orderService,
        RoomService roomService,
        AdminAuthService adminAuthService
    ) {
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.roomService = roomService;
        this.adminAuthService = adminAuthService;
    }

    public List<AdminOrderDto> listOrders(
        String statusText,
        String keywordText,
        String checkInStartDateText,
        String checkInEndDateText
    ) {
        adminAuthService.requireAdminAccess();

        OrderStatus status = parseOrderStatus(statusText);
        String keyword = normalizeText(keywordText);
        LocalDate checkInStartDate = parseOptionalDate(checkInStartDateText, "checkInStartDate");
        LocalDate checkInEndDate = parseOptionalDate(checkInEndDateText, "checkInEndDate");
        if (checkInStartDate != null && checkInEndDate != null && checkInStartDate.isAfter(checkInEndDate)) {
            throw BusinessException.badRequest("checkInStartDate 不能晚于 checkInEndDate");
        }

        Specification<OrderEntity> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (!keyword.isEmpty()) {
                String keywordPattern = "%" + keyword.toLowerCase(Locale.ROOT) + "%";
                predicates.add(
                    criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("orderNo")), keywordPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("roomName")), keywordPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("guestName")), keywordPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("guestPhone")), keywordPattern)
                    )
                );
            }

            if (checkInStartDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("checkInDate"), checkInStartDate));
            }
            if (checkInEndDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("checkInDate"), checkInEndDate));
            }

            return predicates.isEmpty()
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return orderRepository
            .findAll(specification, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")))
            .stream()
            .map(orderService::toAdminOrderDto)
            .collect(Collectors.toList());
    }

    public AdminOrderDto getOrderDetail(String orderId) {
        adminAuthService.requireAdminAccess();
        return orderService.toAdminOrderDto(requireOrder(orderId));
    }

    public AdminOrderDto rescheduleOrder(String orderId, RescheduleOrderRequest request) {
        adminAuthService.requireAdminAccess();
        orderService.rescheduleOrderByAdmin(orderId, request);
        return orderService.toAdminOrderDto(requireOrder(orderId));
    }

    public AdminOrderDto refundOrder(String orderId, RefundOrderRequest request) {
        adminAuthService.requireAdminAccess();
        orderService.refundOrderByAdmin(orderId, request);
        return orderService.toAdminOrderDto(requireOrder(orderId));
    }

    public AdminOrderDto approveAfterSaleRequest(String orderId, Long requestId) {
        adminAuthService.requireAdminAccess();
        orderService.approveAfterSaleRequestByAdmin(orderId, requestId);
        return orderService.toAdminOrderDto(requireOrder(orderId));
    }

    public AdminOrderDto rejectAfterSaleRequest(String orderId, Long requestId, String rejectReason) {
        adminAuthService.requireAdminAccess();
        orderService.rejectAfterSaleRequestByAdmin(orderId, requestId, rejectReason);
        return orderService.toAdminOrderDto(requireOrder(orderId));
    }

    public AdminOrderDto checkInOrder(String orderId) {
        adminAuthService.requireAdminAccess();
        orderService.checkInOrderByAdmin(orderId);
        return orderService.toAdminOrderDto(requireOrder(orderId));
    }

    public AdminOrderDto checkOutOrder(String orderId) {
        adminAuthService.requireAdminAccess();
        orderService.checkOutOrderByAdmin(orderId);
        return orderService.toAdminOrderDto(requireOrder(orderId));
    }

    public AdminOrderDto markNoShowOrder(String orderId) {
        adminAuthService.requireAdminAccess();
        orderService.markNoShowOrderByAdmin(orderId);
        return orderService.toAdminOrderDto(requireOrder(orderId));
    }

    public AdminOrderOverviewDto getOrderOverview() {
        adminAuthService.requireAdminAccess();

        int revenueAmount = Math.toIntExact(orderRepository.sumTotalAmountByPaymentStatusIn(REVENUE_PAYMENT_STATUSES));
        return new AdminOrderOverviewDto(
            orderRepository.count(),
            orderRepository.countByBookingStatusIn(PENDING_CHECK_IN_BOOKING_STATUSES),
            orderRepository.countByPaymentStatus(PaymentStatus.REFUNDED),
            revenueAmount
        );
    }

    private OrderEntity requireOrder(String orderId) {
        return orderRepository.findById(orderId).orElseThrow(() -> BusinessException.notFound("订单不存在"));
    }

    private OrderStatus parseOrderStatus(String statusText) {
        String normalized = normalizeText(statusText);
        if (normalized.isEmpty()) {
            return null;
        }
        try {
            return OrderStatus.valueOf(normalized.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw BusinessException.badRequest(
                "status 仅支持 " + Arrays.stream(OrderStatus.values()).map(Enum::name).collect(Collectors.joining(", "))
            );
        }
    }

    private LocalDate parseOptionalDate(String value, String fieldName) {
        String normalized = normalizeText(value);
        if (normalized.isEmpty()) {
            return null;
        }
        return roomService.parseDate(normalized, fieldName);
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }
}
