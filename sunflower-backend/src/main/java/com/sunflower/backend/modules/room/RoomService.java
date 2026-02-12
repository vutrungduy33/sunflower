package com.sunflower.backend.modules.room;

import com.sunflower.backend.common.exception.BusinessException;
import com.sunflower.backend.modules.room.dto.RoomCalendarItemDto;
import com.sunflower.backend.modules.room.dto.RoomCalendarResponse;
import com.sunflower.backend.modules.room.dto.RoomDto;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import javax.annotation.PostConstruct;
import org.springframework.stereotype.Service;

@Service
public class RoomService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final int DEFAULT_CALENDAR_DAYS = 14;

    private final Map<String, RoomSeed> roomMap = new LinkedHashMap<>();

    @PostConstruct
    public void init() {
        register(
            new RoomSeed(
                "room-lake-101",
                "湖景大床房",
                "推窗见湖 | 亲子友好 | 含双早",
                "/assets/TDesign-logo_light.png",
                2,
                32,
                "1.8m 大床",
                "湖景",
                Arrays.asList("热门", "私域专属价"),
                468,
                "含早餐",
                "房间位于二楼，正对泸沽湖东岸，配备观景阳台与独立卫浴，适合情侣与小家庭。",
                Arrays.asList("空调", "地暖", "免费 Wi-Fi", "智能门锁", "观景阳台"),
                Arrays.asList("14:00 后入住", "12:00 前退房", "不可加床", "支持宠物入住（需提前沟通）"),
                24
            )
        );

        register(
            new RoomSeed(
                "room-loft-301",
                "湖景 Loft 亲子房",
                "复式空间 | 可住 3 人 | 含双早",
                "/assets/TDesign-logo_light.png",
                3,
                45,
                "1.8m 大床 + 1.2m 单床",
                "湖景",
                Arrays.asList("亲子推荐", "含接驳"),
                598,
                "含早餐",
                "复式结构，楼上休憩区可看湖。适合亲子出行或好友结伴入住，房内含儿童用品包。",
                Arrays.asList("空调", "地暖", "免费 Wi-Fi", "浴缸", "儿童洗漱包"),
                Arrays.asList("14:00 后入住", "12:00 前退房", "可加床（收费）", "支持宠物入住（需提前沟通）"),
                48
            )
        );

        register(
            new RoomSeed(
                "room-mountain-203",
                "静谧山景双床房",
                "高性价比 | 安静好睡 | 含双早",
                "/assets/TDesign-logo_light.png",
                2,
                28,
                "1.2m 双床",
                "山景",
                Arrays.asList("性价比", "可改期"),
                388,
                "含早餐",
                "背湖一侧，安静舒适，适合自驾游客与轻旅居用户。靠近停车区与餐饮合作门店。",
                Arrays.asList("空调", "地暖", "免费 Wi-Fi", "智能电视", "遮光窗帘"),
                Arrays.asList("14:00 后入住", "12:00 前退房", "不可加床", "支持宠物入住（需提前沟通）"),
                24
            )
        );
    }

    public List<RoomDto> listRooms(String checkInDate, String keyword) {
        LocalDate checkIn = parseDateOrDefault(checkInDate, LocalDate.now().plusDays(1));
        String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);

        return roomMap
            .values()
            .stream()
            .filter(room -> matchKeyword(room, normalizedKeyword))
            .map(room -> toRoomCard(room, checkIn))
            .collect(Collectors.toList());
    }

    public List<RoomDto> listFeaturedRooms(String checkInDate) {
        LocalDate checkIn = parseDateOrDefault(checkInDate, LocalDate.now().plusDays(1));
        return roomMap
            .values()
            .stream()
            .limit(2)
            .map(room -> toRoomCard(room, checkIn))
            .collect(Collectors.toList());
    }

    public RoomDto getRoomDetail(String roomId, String checkInDate) {
        RoomSeed room = requireRoomSeed(roomId);
        LocalDate checkIn = parseDateOrDefault(checkInDate, LocalDate.now().plusDays(1));

        RoomDto detail = toBaseRoomDto(room);
        detail.setCalendar(buildCalendar(room, checkIn, DEFAULT_CALENDAR_DAYS));
        return detail;
    }

    public RoomCalendarResponse getRoomCalendar(String roomId, String startDate, Integer days) {
        RoomSeed room = requireRoomSeed(roomId);
        LocalDate start = parseDateOrDefault(startDate, LocalDate.now().plusDays(1));
        int size = days == null ? DEFAULT_CALENDAR_DAYS : days;
        if (size <= 0 || size > 31) {
            throw BusinessException.badRequest("days 范围必须在 1-31");
        }
        return new RoomCalendarResponse(roomId, buildCalendar(room, start, size));
    }

    public RoomSeed requireRoomSeed(String roomId) {
        RoomSeed room = roomMap.get(roomId);
        if (room == null) {
            throw BusinessException.notFound("房型不存在");
        }
        return room;
    }

    public List<RoomCalendarItemDto> buildCalendar(String roomId, LocalDate startDate, int days) {
        return buildCalendar(requireRoomSeed(roomId), startDate, days);
    }

    public LocalDate parseDate(String value, String fieldName) {
        try {
            return LocalDate.parse(value, DATE_FORMATTER);
        } catch (DateTimeParseException ex) {
            throw BusinessException.badRequest(fieldName + " 格式必须是 yyyy-MM-dd");
        }
    }

    private boolean matchKeyword(RoomSeed room, String keyword) {
        if (keyword.isEmpty()) {
            return true;
        }
        return room.name.toLowerCase(Locale.ROOT).contains(keyword)
            || room.subtitle.toLowerCase(Locale.ROOT).contains(keyword)
            || room.scenicType.toLowerCase(Locale.ROOT).contains(keyword);
    }

    private void register(RoomSeed room) {
        roomMap.put(room.id, room);
    }

    private RoomDto toRoomCard(RoomSeed room, LocalDate checkInDate) {
        RoomDto dto = toBaseRoomDto(room);
        List<RoomCalendarItemDto> calendar = buildCalendar(room, checkInDate, DEFAULT_CALENDAR_DAYS);
        RoomCalendarItemDto firstDay = calendar.isEmpty() ? null : calendar.get(0);
        dto.setTodayPrice(firstDay == null ? room.basePrice : firstDay.getPrice());
        dto.setStock(firstDay == null ? 0 : firstDay.getStock());
        return dto;
    }

    private RoomDto toBaseRoomDto(RoomSeed room) {
        RoomDto dto = new RoomDto();
        dto.setId(room.id);
        dto.setName(room.name);
        dto.setSubtitle(room.subtitle);
        dto.setCover(room.cover);
        dto.setCapacity(room.capacity);
        dto.setArea(room.area);
        dto.setBedType(room.bedType);
        dto.setScenicType(room.scenicType);
        dto.setTags(room.tags);
        dto.setBasePrice(room.basePrice);
        dto.setBreakfast(room.breakfast);
        dto.setIntro(room.intro);
        dto.setAmenities(room.amenities);
        dto.setRules(room.rules);
        dto.setCanCancelBeforeHours(room.canCancelBeforeHours);
        return dto;
    }

    private List<RoomCalendarItemDto> buildCalendar(RoomSeed room, LocalDate startDate, int days) {
        if (days <= 0) {
            return Collections.emptyList();
        }

        List<RoomCalendarItemDto> calendar = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate date = startDate.plusDays(i);
            DayOfWeek dayOfWeek = date.getDayOfWeek();
            boolean isWeekend = dayOfWeek == DayOfWeek.FRIDAY || dayOfWeek == DayOfWeek.SATURDAY;
            boolean isHighSeason = date.getMonthValue() >= 7 && date.getMonthValue() <= 9;

            int price = room.basePrice;
            if (isWeekend) {
                price += 80;
            }
            if (isHighSeason) {
                price += 120;
            }

            int stock = i % 5 == 0 ? 1 : 3;
            calendar.add(
                new RoomCalendarItemDto(
                    date.format(DATE_FORMATTER),
                    toWeekdayLabel(dayOfWeek),
                    price,
                    stock
                )
            );
        }
        return calendar;
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
        private final String subtitle;
        private final String cover;
        private final int capacity;
        private final int area;
        private final String bedType;
        private final String scenicType;
        private final List<String> tags;
        private final int basePrice;
        private final String breakfast;
        private final String intro;
        private final List<String> amenities;
        private final List<String> rules;
        private final int canCancelBeforeHours;

        RoomSeed(
            String id,
            String name,
            String subtitle,
            String cover,
            int capacity,
            int area,
            String bedType,
            String scenicType,
            List<String> tags,
            int basePrice,
            String breakfast,
            String intro,
            List<String> amenities,
            List<String> rules,
            int canCancelBeforeHours
        ) {
            this.id = id;
            this.name = name;
            this.subtitle = subtitle;
            this.cover = cover;
            this.capacity = capacity;
            this.area = area;
            this.bedType = bedType;
            this.scenicType = scenicType;
            this.tags = new ArrayList<>(tags);
            this.basePrice = basePrice;
            this.breakfast = breakfast;
            this.intro = intro;
            this.amenities = new ArrayList<>(amenities);
            this.rules = new ArrayList<>(rules);
            this.canCancelBeforeHours = canCancelBeforeHours;
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
