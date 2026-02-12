package com.sunflower.backend.modules.order;

import com.sunflower.backend.common.exception.BusinessException;
import com.sunflower.backend.modules.order.dto.CreateOrderRequest;
import com.sunflower.backend.modules.order.dto.OrderDto;
import com.sunflower.backend.modules.room.RoomService;
import com.sunflower.backend.modules.room.dto.RoomCalendarItemDto;
import com.sunflower.backend.modules.user.UserService;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import javax.annotation.PostConstruct;
import org.springframework.stereotype.Service;

@Service
public class OrderService {

    private static final ZoneId SHANGHAI_ZONE = ZoneId.of("Asia/Shanghai");
    private static final DateTimeFormatter ORDER_NO_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final Map<String, OrderRecord> orderStore = new ConcurrentHashMap<>();
    private final Random random = new SecureRandom();

    private final RoomService roomService;
    private final UserService userService;

    public OrderService(RoomService roomService, UserService userService) {
        this.roomService = roomService;
        this.userService = userService;
    }

    @PostConstruct
    public void init() {
        LocalDate checkInDate = LocalDate.now(SHANGHAI_ZONE).plusDays(1);
        LocalDate checkOutDate = checkInDate.plusDays(1);
        OffsetDateTime createdAt = OffsetDateTime.now(SHANGHAI_ZONE).minusDays(1);

        OrderRecord seedOrder = new OrderRecord();
        seedOrder.id = "order_seed_" + System.currentTimeMillis();
        seedOrder.orderNo = buildOrderNo(createdAt.toLocalDate());
        seedOrder.userId = userService.currentUserId();
        seedOrder.source = "direct";
        seedOrder.roomId = "room-mountain-203";
        seedOrder.roomName = roomService.requireRoomSeed("room-mountain-203").getName();
        seedOrder.checkInDate = checkInDate;
        seedOrder.checkOutDate = checkOutDate;
        seedOrder.nights = 1;
        seedOrder.guestName = "演示住客";
        seedOrder.guestPhone = "13800000000";
        seedOrder.arrivalTime = "18:00";
        seedOrder.remark = "系统初始化订单";
        seedOrder.totalAmount = calculateOrderAmount(seedOrder.roomId, checkInDate, seedOrder.nights);
        seedOrder.status = OrderStatus.COMPLETED;
        seedOrder.createdAt = createdAt;
        seedOrder.paidAt = createdAt;

        orderStore.put(seedOrder.id, seedOrder);
    }

    public List<OrderDto> getCurrentUserOrders() {
        String userId = userService.currentUserId();
        return orderStore
            .values()
            .stream()
            .filter(order -> order.userId.equals(userId))
            .sorted(Comparator.comparing((OrderRecord item) -> item.createdAt).reversed())
            .map(this::toOrderDto)
            .collect(Collectors.toList());
    }

    public OrderDto getCurrentUserOrder(String orderId) {
        return toOrderDto(requireCurrentUserOrderRecord(orderId));
    }

    public OrderDto createOrder(CreateOrderRequest request) {
        LocalDate checkInDate = roomService.parseDate(request.getCheckInDate(), "checkInDate");
        LocalDate checkOutDate = roomService.parseDate(request.getCheckOutDate(), "checkOutDate");

        long nights = ChronoUnit.DAYS.between(checkInDate, checkOutDate);
        if (nights <= 0) {
            throw BusinessException.badRequest("退房日期需晚于入住日期");
        }

        RoomService.RoomSeed room = roomService.requireRoomSeed(request.getRoomId());

        OrderRecord order = new OrderRecord();
        order.id = buildOrderId();
        order.orderNo = buildOrderNo(LocalDate.now(SHANGHAI_ZONE));
        order.userId = userService.currentUserId();
        order.source = normalizeSource(request.getSource());
        order.roomId = room.getId();
        order.roomName = room.getName();
        order.checkInDate = checkInDate;
        order.checkOutDate = checkOutDate;
        order.nights = (int) nights;
        order.guestName = request.getGuestName().trim();
        order.guestPhone = request.getGuestPhone().trim();
        order.arrivalTime = request.getArrivalTime().trim();
        order.remark = request.getRemark() == null ? "" : request.getRemark().trim();
        order.totalAmount = calculateOrderAmount(order.roomId, checkInDate, order.nights);
        order.status = OrderStatus.PENDING_PAYMENT;
        order.createdAt = OffsetDateTime.now(SHANGHAI_ZONE);

        orderStore.put(order.id, order);
        return toOrderDto(order);
    }

    public OrderDto payCurrentUserOrder(String orderId) {
        OrderRecord order = requireCurrentUserOrderRecord(orderId);
        if (order.status != OrderStatus.PENDING_PAYMENT) {
            throw BusinessException.conflict("当前订单状态不可支付");
        }
        order.status = OrderStatus.CONFIRMED;
        order.paidAt = OffsetDateTime.now(SHANGHAI_ZONE);
        return toOrderDto(order);
    }

    public OrderDto cancelCurrentUserOrder(String orderId) {
        OrderRecord order = requireCurrentUserOrderRecord(orderId);
        if (order.status != OrderStatus.PENDING_PAYMENT && order.status != OrderStatus.CONFIRMED) {
            throw BusinessException.conflict("当前订单状态不可取消");
        }
        order.status = OrderStatus.CANCELLED;
        return toOrderDto(order);
    }

    private OrderRecord requireCurrentUserOrderRecord(String orderId) {
        OrderRecord order = orderStore.get(orderId);
        if (order == null) {
            throw BusinessException.notFound("订单不存在");
        }
        if (!order.userId.equals(userService.currentUserId())) {
            throw BusinessException.notFound("订单不存在");
        }
        return order;
    }

    private int calculateOrderAmount(String roomId, LocalDate checkInDate, int nights) {
        List<RoomCalendarItemDto> calendar = roomService.buildCalendar(roomId, checkInDate, nights);
        return calendar.stream().mapToInt(RoomCalendarItemDto::getPrice).sum();
    }

    private String buildOrderId() {
        return "order_" + System.currentTimeMillis() + "_" + random.nextInt(1000);
    }

    private String buildOrderNo(LocalDate localDate) {
        String datePart = localDate.format(ORDER_NO_DATE_FORMATTER);
        int randomPart = random.nextInt(9000) + 1000;
        return "SF" + datePart + randomPart;
    }

    private String normalizeSource(String source) {
        if (source == null || source.trim().isEmpty()) {
            return "direct";
        }
        return source.trim();
    }

    private OrderDto toOrderDto(OrderRecord order) {
        OrderDto dto = new OrderDto();
        dto.setId(order.id);
        dto.setOrderNo(order.orderNo);
        dto.setSource(order.source);
        dto.setRoomId(order.roomId);
        dto.setRoomName(order.roomName);
        dto.setCheckInDate(order.checkInDate.toString());
        dto.setCheckOutDate(order.checkOutDate.toString());
        dto.setNights(order.nights);
        dto.setGuestName(order.guestName);
        dto.setGuestPhone(order.guestPhone);
        dto.setArrivalTime(order.arrivalTime);
        dto.setRemark(order.remark);
        dto.setTotalAmount(order.totalAmount);
        dto.setStatus(order.status.name());
        dto.setStatusLabel(order.status.getLabel());
        dto.setCreatedAt(order.createdAt.toString());
        dto.setPaidAt(order.paidAt == null ? "" : order.paidAt.toString());
        return dto;
    }

    private static class OrderRecord {

        private String id;
        private String orderNo;
        private String userId;
        private String source;
        private String roomId;
        private String roomName;
        private LocalDate checkInDate;
        private LocalDate checkOutDate;
        private int nights;
        private String guestName;
        private String guestPhone;
        private String arrivalTime;
        private String remark;
        private int totalAmount;
        private OrderStatus status;
        private OffsetDateTime createdAt;
        private OffsetDateTime paidAt;
    }
}
