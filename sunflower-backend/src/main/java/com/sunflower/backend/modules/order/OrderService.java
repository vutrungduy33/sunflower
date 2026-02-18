package com.sunflower.backend.modules.order;

import com.sunflower.backend.common.exception.BusinessException;
import com.sunflower.backend.modules.order.dto.CreateOrderRequest;
import com.sunflower.backend.modules.order.dto.OrderDto;
import com.sunflower.backend.modules.order.dto.RefundOrderRequest;
import com.sunflower.backend.modules.order.dto.RescheduleOrderRequest;
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
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
    private static final int ORDER_NO_MAX_RETRY = 8;

    private final Random random = new SecureRandom();

    private final OrderRepository orderRepository;
    private final RoomInventoryRepository roomInventoryRepository;
    private final RoomService roomService;
    private final UserService userService;

    public OrderService(
        OrderRepository orderRepository,
        RoomInventoryRepository roomInventoryRepository,
        RoomService roomService,
        UserService userService
    ) {
        this.orderRepository = orderRepository;
        this.roomInventoryRepository = roomInventoryRepository;
        this.roomService = roomService;
        this.userService = userService;
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
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setAfterSaleReason("");
        order.setCreatedAt(now);

        return toOrderDto(orderRepository.save(order));
    }

    @Transactional
    public OrderDto payCurrentUserOrder(String orderId) {
        OrderEntity order = requireCurrentUserOrderRecord(orderId);
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw BusinessException.conflict("当前订单状态不可支付");
        }
        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaidAt(LocalDateTime.now(SHANGHAI_ZONE));
        return toOrderDto(orderRepository.save(order));
    }

    @Transactional
    public OrderDto cancelCurrentUserOrder(String orderId) {
        return cancelCurrentUserOrder(orderId, "");
    }

    @Transactional
    public OrderDto cancelCurrentUserOrder(String orderId, String reason) {
        OrderEntity order = requireCurrentUserOrderRecord(orderId);
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT && order.getStatus() != OrderStatus.CONFIRMED) {
            throw BusinessException.conflict("当前订单状态不可取消");
        }
        List<LocalDate> stayDates = buildStayDates(order.getCheckInDate(), order.getNights());
        releaseInventoryForCancel(order.getRoomId(), stayDates);
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now(SHANGHAI_ZONE));
        order.setAfterSaleReason(normalizeOptionalText(reason));
        return toOrderDto(orderRepository.save(order));
    }

    @Transactional
    public OrderDto rescheduleCurrentUserOrder(String orderId, RescheduleOrderRequest request) {
        OrderEntity order = requireCurrentUserOrderRecord(orderId);
        if (order.getStatus() != OrderStatus.CONFIRMED && order.getStatus() != OrderStatus.RESCHEDULED) {
            throw BusinessException.conflict("当前订单状态不可改期");
        }

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

        List<LocalDate> oldStayDates = buildStayDates(order.getCheckInDate(), order.getNights());
        List<LocalDate> newStayDates = buildStayDates(checkInDate, (int) nights);

        rescheduleInventory(order.getRoomId(), oldStayDates, newStayDates);

        order.setCheckInDate(checkInDate);
        order.setCheckOutDate(checkOutDate);
        order.setNights((int) nights);
        order.setStatus(OrderStatus.RESCHEDULED);
        order.setRescheduledAt(LocalDateTime.now(SHANGHAI_ZONE));
        order.setAfterSaleReason(normalizeOptionalText(request.getReason()));
        return toOrderDto(orderRepository.save(order));
    }

    @Transactional
    public OrderDto refundCurrentUserOrder(String orderId, RefundOrderRequest request) {
        OrderEntity order = requireCurrentUserOrderRecord(orderId);
        if (order.getStatus() != OrderStatus.CONFIRMED && order.getStatus() != OrderStatus.RESCHEDULED) {
            throw BusinessException.conflict("当前订单状态不可退款");
        }

        List<LocalDate> stayDates = buildStayDates(order.getCheckInDate(), order.getNights());
        releaseInventoryForCancel(order.getRoomId(), stayDates);
        order.setStatus(OrderStatus.REFUNDED);
        order.setRefundedAt(LocalDateTime.now(SHANGHAI_ZONE));
        order.setAfterSaleReason(normalizeOptionalText(request == null ? null : request.getReason()));
        return toOrderDto(orderRepository.save(order));
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

    private OrderDto toOrderDto(OrderEntity order) {
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
