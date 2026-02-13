package com.sunflower.backend.modules.room;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sunflower.backend.common.exception.BusinessException;
import com.sunflower.backend.modules.room.dto.RoomCalendarItemDto;
import com.sunflower.backend.modules.room.dto.RoomCalendarResponse;
import com.sunflower.backend.modules.room.dto.RoomDto;
import com.sunflower.backend.modules.room.persistence.RoomEntity;
import com.sunflower.backend.modules.room.persistence.RoomInventoryEntity;
import com.sunflower.backend.modules.room.persistence.RoomInventoryRepository;
import com.sunflower.backend.modules.room.persistence.RoomPriceEntity;
import com.sunflower.backend.modules.room.persistence.RoomPriceRepository;
import com.sunflower.backend.modules.room.persistence.RoomRepository;
import java.io.IOException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class RoomService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final int DEFAULT_CALENDAR_DAYS = 14;
    private static final String ROOM_STATUS_ACTIVE = "ACTIVE";
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<List<String>>() {
    };

    private final RoomRepository roomRepository;
    private final RoomPriceRepository roomPriceRepository;
    private final RoomInventoryRepository roomInventoryRepository;
    private final ObjectMapper objectMapper;

    public RoomService(
        RoomRepository roomRepository,
        RoomPriceRepository roomPriceRepository,
        RoomInventoryRepository roomInventoryRepository,
        ObjectMapper objectMapper
    ) {
        this.roomRepository = roomRepository;
        this.roomPriceRepository = roomPriceRepository;
        this.roomInventoryRepository = roomInventoryRepository;
        this.objectMapper = objectMapper;
    }

    public List<RoomDto> listRooms(String checkInDate, String keyword) {
        LocalDate checkIn = parseDateOrDefault(checkInDate, LocalDate.now().plusDays(1));
        String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);

        List<RoomEntity> rooms = roomRepository
            .findByStatusOrderByIdAsc(ROOM_STATUS_ACTIVE)
            .stream()
            .filter(room -> matchKeyword(room, normalizedKeyword))
            .collect(Collectors.toList());
        if (rooms.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> roomIds = rooms.stream().map(RoomEntity::getId).collect(Collectors.toList());
        Map<String, Integer> roomPriceMap = roomPriceRepository
            .findByRoomIdInAndBizDate(roomIds, checkIn)
            .stream()
            .collect(Collectors.toMap(RoomPriceEntity::getRoomId, RoomPriceEntity::getPrice, (left, right) -> left));
        Map<String, Integer> roomStockMap = roomInventoryRepository
            .findByRoomIdInAndBizDate(roomIds, checkIn)
            .stream()
            .collect(
                Collectors.toMap(
                    RoomInventoryEntity::getRoomId,
                    RoomInventoryEntity::getAvailableStock,
                    (left, right) -> left
                )
            );

        return rooms
            .stream()
            .map(room -> toRoomCard(room, roomPriceMap, roomStockMap))
            .collect(Collectors.toList());
    }

    public List<RoomDto> listFeaturedRooms(String checkInDate) {
        LocalDate checkIn = parseDateOrDefault(checkInDate, LocalDate.now().plusDays(1));
        List<RoomEntity> rooms = roomRepository.findByStatusOrderByIdAsc(ROOM_STATUS_ACTIVE);
        if (rooms.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> roomIds = rooms.stream().map(RoomEntity::getId).collect(Collectors.toList());
        Map<String, Integer> roomPriceMap = roomPriceRepository
            .findByRoomIdInAndBizDate(roomIds, checkIn)
            .stream()
            .collect(Collectors.toMap(RoomPriceEntity::getRoomId, RoomPriceEntity::getPrice, (left, right) -> left));
        Map<String, Integer> roomStockMap = roomInventoryRepository
            .findByRoomIdInAndBizDate(roomIds, checkIn)
            .stream()
            .collect(
                Collectors.toMap(
                    RoomInventoryEntity::getRoomId,
                    RoomInventoryEntity::getAvailableStock,
                    (left, right) -> left
                )
            );

        return rooms
            .stream()
            .limit(2)
            .map(room -> toRoomCard(room, roomPriceMap, roomStockMap))
            .collect(Collectors.toList());
    }

    public RoomDto getRoomDetail(String roomId, String checkInDate) {
        RoomEntity room = requireRoomEntity(roomId);
        LocalDate checkIn = parseDateOrDefault(checkInDate, LocalDate.now().plusDays(1));

        RoomDto detail = toBaseRoomDto(room);
        detail.setCalendar(buildCalendar(room, checkIn, DEFAULT_CALENDAR_DAYS));
        return detail;
    }

    public RoomCalendarResponse getRoomCalendar(String roomId, String startDate, Integer days) {
        RoomEntity room = requireRoomEntity(roomId);
        LocalDate start = parseDateOrDefault(startDate, LocalDate.now().plusDays(1));
        int size = days == null ? DEFAULT_CALENDAR_DAYS : days;
        if (size <= 0 || size > 31) {
            throw BusinessException.badRequest("days 范围必须在 1-31");
        }
        return new RoomCalendarResponse(roomId, buildCalendar(room, start, size));
    }

    public RoomSeed requireRoomSeed(String roomId) {
        RoomEntity room = requireRoomEntity(roomId);
        return new RoomSeed(room.getId(), room.getName(), room.getBasePrice());
    }

    public List<RoomCalendarItemDto> buildCalendar(String roomId, LocalDate startDate, int days) {
        return buildCalendar(requireRoomEntity(roomId), startDate, days);
    }

    public LocalDate parseDate(String value, String fieldName) {
        try {
            return LocalDate.parse(value, DATE_FORMATTER);
        } catch (DateTimeParseException ex) {
            throw BusinessException.badRequest(fieldName + " 格式必须是 yyyy-MM-dd");
        }
    }

    private RoomEntity requireRoomEntity(String roomId) {
        return roomRepository
            .findByIdAndStatus(roomId, ROOM_STATUS_ACTIVE)
            .orElseThrow(() -> BusinessException.notFound("房型不存在"));
    }

    private boolean matchKeyword(RoomEntity room, String keyword) {
        if (keyword.isEmpty()) {
            return true;
        }
        return containsKeyword(room.getName(), keyword)
            || containsKeyword(room.getSubtitle(), keyword)
            || containsKeyword(room.getScenicType(), keyword);
    }

    private boolean containsKeyword(String value, String keyword) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(keyword);
    }

    private RoomDto toRoomCard(RoomEntity room, Map<String, Integer> roomPriceMap, Map<String, Integer> roomStockMap) {
        RoomDto dto = toBaseRoomDto(room);
        dto.setTodayPrice(roomPriceMap.getOrDefault(room.getId(), room.getBasePrice()));
        dto.setStock(roomStockMap.getOrDefault(room.getId(), 0));
        return dto;
    }

    private RoomDto toBaseRoomDto(RoomEntity room) {
        RoomDto dto = new RoomDto();
        dto.setId(room.getId());
        dto.setName(room.getName());
        dto.setSubtitle(room.getSubtitle());
        dto.setCover(room.getCover());
        dto.setCapacity(room.getCapacity());
        dto.setArea(room.getArea());
        dto.setBedType(room.getBedType());
        dto.setScenicType(room.getScenicType());
        dto.setTags(parseJsonArray(room.getTagsJson()));
        dto.setBasePrice(room.getBasePrice());
        dto.setBreakfast(room.getBreakfast());
        dto.setIntro(room.getIntro());
        dto.setAmenities(parseJsonArray(room.getAmenitiesJson()));
        dto.setRules(parseJsonArray(room.getRulesJson()));
        dto.setCanCancelBeforeHours(room.getCanCancelBeforeHours());
        return dto;
    }

    private List<RoomCalendarItemDto> buildCalendar(RoomEntity room, LocalDate startDate, int days) {
        if (days <= 0) {
            return Collections.emptyList();
        }

        LocalDate endDate = startDate.plusDays(days - 1L);
        Map<LocalDate, Integer> priceMap = roomPriceRepository
            .findByRoomIdAndBizDateBetweenOrderByBizDateAsc(room.getId(), startDate, endDate)
            .stream()
            .collect(Collectors.toMap(RoomPriceEntity::getBizDate, RoomPriceEntity::getPrice, (left, right) -> left));
        Map<LocalDate, Integer> stockMap = roomInventoryRepository
            .findByRoomIdAndBizDateBetweenOrderByBizDateAsc(room.getId(), startDate, endDate)
            .stream()
            .collect(
                Collectors.toMap(
                    RoomInventoryEntity::getBizDate,
                    RoomInventoryEntity::getAvailableStock,
                    (left, right) -> left,
                    LinkedHashMap::new
                )
            );

        List<RoomCalendarItemDto> calendar = new ArrayList<>(days);
        for (int i = 0; i < days; i++) {
            LocalDate date = startDate.plusDays(i);
            int price = priceMap.getOrDefault(date, room.getBasePrice());
            int stock = stockMap.getOrDefault(date, 0);
            calendar.add(
                new RoomCalendarItemDto(
                    date.format(DATE_FORMATTER),
                    toWeekdayLabel(date.getDayOfWeek()),
                    price,
                    stock
                )
            );
        }
        return calendar;
    }

    private List<String> parseJsonArray(String value) {
        if (value == null || value.trim().isEmpty()) {
            return Collections.emptyList();
        }

        try {
            List<String> parsed = objectMapper.readValue(value, STRING_LIST_TYPE);
            return parsed == null ? Collections.emptyList() : parsed;
        } catch (IOException ex) {
            throw new IllegalStateException("房型 JSON 字段解析失败", ex);
        }
    }

    private LocalDate parseDateOrDefault(String value, LocalDate fallback) {
        if (value == null || value.trim().isEmpty()) {
            return fallback;
        }
        return parseDate(value.trim(), "日期");
    }

    private String toWeekdayLabel(DayOfWeek dayOfWeek) {
        switch (dayOfWeek) {
            case MONDAY:
                return "周一";
            case TUESDAY:
                return "周二";
            case WEDNESDAY:
                return "周三";
            case THURSDAY:
                return "周四";
            case FRIDAY:
                return "周五";
            case SATURDAY:
                return "周六";
            case SUNDAY:
            default:
                return "周日";
        }
    }

    public static class RoomSeed {

        private final String id;
        private final String name;
        private final int basePrice;

        RoomSeed(String id, String name, int basePrice) {
            this.id = id;
            this.name = name;
            this.basePrice = basePrice;
        }

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public int getBasePrice() {
            return basePrice;
        }
    }
}
