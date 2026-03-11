package com.sunflower.backend.modules.order.admin;

import com.sunflower.backend.common.exception.BusinessException;
import com.sunflower.backend.modules.admin.AdminAuthService;
import com.sunflower.backend.modules.order.OrderService;
import com.sunflower.backend.modules.order.OrderStatus;
import com.sunflower.backend.modules.order.admin.dto.AdminOrderDto;
import com.sunflower.backend.modules.order.admin.dto.AdminOrderOverviewDto;
import com.sunflower.backend.modules.order.dto.RefundOrderRequest;
import com.sunflower.backend.modules.order.dto.RescheduleOrderRequest;
import com.sunflower.backend.modules.order.persistence.OrderEntity;
import com.sunflower.backend.modules.order.persistence.OrderRepository;
import com.sunflower.backend.modules.room.RoomService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
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

    private static final ZoneId SHANGHAI_ZONE = ZoneId.of("Asia/Shanghai");
    private static final Set<OrderStatus> PENDING_CHECK_IN_STATUSES = Set.of(
        OrderStatus.CONFIRMED,
        OrderStatus.RESCHEDULED
    );
    private static final Set<OrderStatus> REVENUE_STATUSES = Set.of(
        OrderStatus.CONFIRMED,
        OrderStatus.RESCHEDULED,
        OrderStatus.COMPLETED
    );

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
            .map(this::toAdminOrderDto)
            .collect(Collectors.toList());
    }

    public AdminOrderDto getOrderDetail(String orderId) {
        adminAuthService.requireAdminAccess();
        return toAdminOrderDto(requireOrder(orderId));
    }

    public AdminOrderDto rescheduleOrder(String orderId, RescheduleOrderRequest request) {
        adminAuthService.requireAdminAccess();
        orderService.rescheduleOrderByAdmin(orderId, request);
        return toAdminOrderDto(requireOrder(orderId));
    }

    public AdminOrderDto refundOrder(String orderId, RefundOrderRequest request) {
        adminAuthService.requireAdminAccess();
        orderService.refundOrderByAdmin(orderId, request);
        return toAdminOrderDto(requireOrder(orderId));
    }

    public AdminOrderOverviewDto getOrderOverview() {
        adminAuthService.requireAdminAccess();

        int revenueAmount = Math.toIntExact(orderRepository.sumTotalAmountByStatusIn(REVENUE_STATUSES));
        return new AdminOrderOverviewDto(
            orderRepository.count(),
            orderRepository.countByStatusIn(PENDING_CHECK_IN_STATUSES),
            orderRepository.countByStatus(OrderStatus.REFUNDED),
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

    private AdminOrderDto toAdminOrderDto(OrderEntity order) {
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
        dto.setStatusLabel(order.getStatus().getLabel());
        dto.setCreatedAt(toDateTimeString(order.getCreatedAt()));
        dto.setPaidAt(toDateTimeString(order.getPaidAt()));
        dto.setCancelledAt(toDateTimeString(order.getCancelledAt()));
        dto.setRescheduledAt(toDateTimeString(order.getRescheduledAt()));
        dto.setRefundedAt(toDateTimeString(order.getRefundedAt()));
        dto.setAfterSaleReason(order.getAfterSaleReason() == null ? "" : order.getAfterSaleReason());
        return dto;
    }

    private String toDateTimeString(LocalDateTime value) {
        if (value == null) {
            return "";
        }
        return value.atZone(SHANGHAI_ZONE).toOffsetDateTime().toString();
    }
}
