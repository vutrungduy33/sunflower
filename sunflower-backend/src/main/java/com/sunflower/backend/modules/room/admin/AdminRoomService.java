package com.sunflower.backend.modules.room.admin;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sunflower.backend.common.exception.BusinessException;
import com.sunflower.backend.modules.admin.AdminAuthService;
import com.sunflower.backend.modules.room.RoomService;
import com.sunflower.backend.modules.room.admin.dto.AdminRoomDto;
import com.sunflower.backend.modules.room.admin.dto.AdminRoomInventoryBatchResponse;
import com.sunflower.backend.modules.room.admin.dto.AdminRoomPriceBatchResponse;
import com.sunflower.backend.modules.room.admin.dto.BatchUpdateRoomInventoryRequest;
import com.sunflower.backend.modules.room.admin.dto.BatchUpdateRoomPricesRequest;
import com.sunflower.backend.modules.room.admin.dto.CreateAdminRoomRequest;
import com.sunflower.backend.modules.room.admin.dto.UpdateAdminRoomRequest;
import com.sunflower.backend.modules.room.persistence.RoomEntity;
import com.sunflower.backend.modules.room.persistence.RoomInventoryEntity;
import com.sunflower.backend.modules.room.persistence.RoomInventoryRepository;
import com.sunflower.backend.modules.room.persistence.RoomPriceEntity;
import com.sunflower.backend.modules.room.persistence.RoomPriceRepository;
import com.sunflower.backend.modules.room.persistence.RoomRepository;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminRoomService {

    private static final ZoneId SHANGHAI_ZONE = ZoneId.of("Asia/Shanghai");
    private static final DateTimeFormatter ROOM_ID_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final String ROOM_STATUS_ACTIVE = "ACTIVE";
    private static final String ROOM_STATUS_INACTIVE = "INACTIVE";
    private static final String PRICE_SOURCE_MANUAL = "MANUAL";
    private static final int ROOM_ID_MAX_RETRY = 8;

    private final Random random = new SecureRandom();

    private final RoomRepository roomRepository;
    private final RoomPriceRepository roomPriceRepository;
    private final RoomInventoryRepository roomInventoryRepository;
    private final RoomService roomService;
    private final AdminAuthService adminAuthService;
    private final ObjectMapper objectMapper;

    public AdminRoomService(
        RoomRepository roomRepository,
        RoomPriceRepository roomPriceRepository,
        RoomInventoryRepository roomInventoryRepository,
        RoomService roomService,
        AdminAuthService adminAuthService,
        ObjectMapper objectMapper
    ) {
        this.roomRepository = roomRepository;
        this.roomPriceRepository = roomPriceRepository;
        this.roomInventoryRepository = roomInventoryRepository;
        this.roomService = roomService;
        this.adminAuthService = adminAuthService;
        this.objectMapper = objectMapper;
    }

    public List<AdminRoomDto> listRooms() {
        adminAuthService.requireAdminAccess();

        return roomRepository
            .findAll(Sort.by(Sort.Order.asc("status"), Sort.Order.asc("id")))
            .stream()
            .map(this::toAdminRoomDto)
            .collect(Collectors.toList());
    }

    @Transactional
    public AdminRoomDto createRoom(CreateAdminRoomRequest request) {
        adminAuthService.requireAdminAccess();

        RoomEntity room = new RoomEntity();
        room.setId(buildUniqueRoomId());
        room.setName(request.getName().trim());
        room.setSubtitle(request.getSubtitle().trim());
        room.setCover(request.getCover().trim());
        room.setCapacity(request.getCapacity());
        room.setArea(request.getArea());
        room.setBedType(request.getBedType().trim());
        room.setScenicType(request.getScenicType().trim());
        room.setTagsJson(toJsonArray(request.getTags()));
        room.setBasePrice(request.getBasePrice());
        room.setBreakfast(request.getBreakfast().trim());
        room.setIntro(request.getIntro().trim());
        room.setAmenitiesJson(toJsonArray(request.getAmenities()));
        room.setRulesJson(toJsonArray(request.getRules()));
        room.setCanCancelBeforeHours(request.getCanCancelBeforeHours());
        room.setStatus(normalizeRoomStatus(request.getStatus()));

        return toAdminRoomDto(roomRepository.save(room));
    }

    @Transactional
    public AdminRoomDto updateRoom(String roomId, UpdateAdminRoomRequest request) {
        adminAuthService.requireAdminAccess();
        if (request == null || !request.hasAnyField()) {
            throw BusinessException.badRequest("至少提供一个待更新字段");
        }

        RoomEntity room = requireRoom(roomId);
        if (request.getName() != null) {
            room.setName(requireText(request.getName(), "房型名称不能为空"));
        }
        if (request.getSubtitle() != null) {
            room.setSubtitle(requireText(request.getSubtitle(), "房型副标题不能为空"));
        }
        if (request.getCover() != null) {
            room.setCover(requireText(request.getCover(), "房型封面不能为空"));
        }
        if (request.getCapacity() != null) {
            room.setCapacity(requirePositiveNumber(request.getCapacity(), "capacity 必须大于 0"));
        }
        if (request.getArea() != null) {
            room.setArea(requirePositiveNumber(request.getArea(), "area 必须大于 0"));
        }
        if (request.getBedType() != null) {
            room.setBedType(requireText(request.getBedType(), "床型不能为空"));
        }
        if (request.getScenicType() != null) {
            room.setScenicType(requireText(request.getScenicType(), "景观类型不能为空"));
        }
        if (request.getTags() != null) {
            room.setTagsJson(toJsonArray(request.getTags()));
        }
        if (request.getBasePrice() != null) {
            room.setBasePrice(requirePositiveNumber(request.getBasePrice(), "basePrice 必须大于 0"));
        }
        if (request.getBreakfast() != null) {
            room.setBreakfast(requireText(request.getBreakfast(), "早餐说明不能为空"));
        }
        if (request.getIntro() != null) {
            room.setIntro(requireText(request.getIntro(), "房型介绍不能为空"));
        }
        if (request.getAmenities() != null) {
            room.setAmenitiesJson(toJsonArray(request.getAmenities()));
        }
        if (request.getRules() != null) {
            room.setRulesJson(toJsonArray(request.getRules()));
        }
        if (request.getCanCancelBeforeHours() != null) {
            room.setCanCancelBeforeHours(
                requireNonNegativeNumber(
                    request.getCanCancelBeforeHours(),
                    "canCancelBeforeHours 不能小于 0"
                )
            );
        }
        if (request.getStatus() != null) {
            room.setStatus(normalizeRoomStatus(request.getStatus()));
        }

        return toAdminRoomDto(roomRepository.save(room));
    }

    @Transactional
    public AdminRoomPriceBatchResponse updateRoomPrices(BatchUpdateRoomPricesRequest request) {
        adminAuthService.requireAdminAccess();

        String roomId = request.getRoomId().trim();
        requireRoom(roomId);

        List<LocalDate> dates = validateUniqueDates(
            request.getItems()
                .stream()
                .map(BatchUpdateRoomPricesRequest.PriceItem::getDate)
                .collect(Collectors.toList())
        );
        Map<LocalDate, RoomPriceEntity> existingMap = roomPriceRepository
            .findByRoomIdAndBizDateIn(roomId, dates)
            .stream()
            .collect(Collectors.toMap(RoomPriceEntity::getBizDate, entity -> entity));

        List<RoomPriceEntity> entitiesToSave = new ArrayList<>();
        for (BatchUpdateRoomPricesRequest.PriceItem item : request.getItems()) {
            LocalDate bizDate = roomService.parseDate(item.getDate().trim(), "date");
            RoomPriceEntity entity = existingMap.getOrDefault(bizDate, new RoomPriceEntity());
            entity.setRoomId(roomId);
            entity.setBizDate(bizDate);
            entity.setPrice(item.getPrice());
            entity.setSource(normalizePriceSource(item.getSource()));
            entitiesToSave.add(entity);
        }

        List<RoomPriceEntity> savedEntities = roomPriceRepository.saveAll(entitiesToSave);
        savedEntities.sort(Comparator.comparing(RoomPriceEntity::getBizDate));

        List<AdminRoomPriceBatchResponse.PriceItem> responseItems = savedEntities
            .stream()
            .map(entity -> new AdminRoomPriceBatchResponse.PriceItem(
                entity.getBizDate().toString(),
                entity.getPrice(),
                entity.getSource()
            ))
            .collect(Collectors.toList());

        return new AdminRoomPriceBatchResponse(roomId, responseItems.size(), responseItems);
    }

    @Transactional
    public AdminRoomInventoryBatchResponse updateRoomInventory(BatchUpdateRoomInventoryRequest request) {
        adminAuthService.requireAdminAccess();

        String roomId = request.getRoomId().trim();
        requireRoom(roomId);

        List<LocalDate> dates = validateUniqueDates(
            request.getItems()
                .stream()
                .map(BatchUpdateRoomInventoryRequest.InventoryItem::getDate)
                .collect(Collectors.toList())
        );
        Map<LocalDate, RoomInventoryEntity> existingMap = roomInventoryRepository
            .findByRoomIdAndBizDateIn(roomId, dates)
            .stream()
            .collect(Collectors.toMap(RoomInventoryEntity::getBizDate, entity -> entity));

        List<RoomInventoryEntity> entitiesToSave = new ArrayList<>();
        for (BatchUpdateRoomInventoryRequest.InventoryItem item : request.getItems()) {
            LocalDate bizDate = roomService.parseDate(item.getDate().trim(), "date");
            RoomInventoryEntity entity = existingMap.getOrDefault(bizDate, new RoomInventoryEntity());
            int lockedStock = entity.getLockedStock();
            if (item.getTotalStock() < lockedStock) {
                throw BusinessException.conflict("目标库存不能小于已锁定库存");
            }
            entity.setRoomId(roomId);
            entity.setBizDate(bizDate);
            entity.setTotalStock(item.getTotalStock());
            entity.setAvailableStock(item.getTotalStock() - lockedStock);
            entitiesToSave.add(entity);
        }

        List<RoomInventoryEntity> savedEntities = roomInventoryRepository.saveAll(entitiesToSave);
        savedEntities.sort(Comparator.comparing(RoomInventoryEntity::getBizDate));

        List<AdminRoomInventoryBatchResponse.InventoryItem> responseItems = savedEntities
            .stream()
            .map(entity -> new AdminRoomInventoryBatchResponse.InventoryItem(
                entity.getBizDate().toString(),
                entity.getTotalStock(),
                entity.getAvailableStock(),
                entity.getLockedStock()
            ))
            .collect(Collectors.toList());

        return new AdminRoomInventoryBatchResponse(roomId, responseItems.size(), responseItems);
    }

    private RoomEntity requireRoom(String roomId) {
        return roomRepository.findById(roomId).orElseThrow(() -> BusinessException.notFound("房型不存在"));
    }

    private String buildUniqueRoomId() {
        for (int i = 0; i < ROOM_ID_MAX_RETRY; i++) {
            LocalDateTime now = LocalDateTime.now(SHANGHAI_ZONE);
            String roomId = "room-admin-" + now.format(ROOM_ID_TIME_FORMATTER) + "-" + (random.nextInt(9000) + 1000);
            if (!roomRepository.existsById(roomId)) {
                return roomId;
            }
        }
        throw new IllegalStateException("生成房型 ID 失败");
    }

    private String normalizeRoomStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return ROOM_STATUS_ACTIVE;
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (!ROOM_STATUS_ACTIVE.equals(normalized) && !ROOM_STATUS_INACTIVE.equals(normalized)) {
            throw BusinessException.badRequest("status 仅支持 ACTIVE 或 INACTIVE");
        }
        return normalized;
    }

    private String normalizePriceSource(String source) {
        if (source == null || source.trim().isEmpty()) {
            return PRICE_SOURCE_MANUAL;
        }
        return source.trim().toUpperCase(Locale.ROOT);
    }

    private String requireText(String value, String message) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            throw BusinessException.badRequest(message);
        }
        return normalized;
    }

    private int requirePositiveNumber(Integer value, String message) {
        if (value == null || value <= 0) {
            throw BusinessException.badRequest(message);
        }
        return value;
    }

    private int requireNonNegativeNumber(Integer value, String message) {
        if (value == null || value < 0) {
            throw BusinessException.badRequest(message);
        }
        return value;
    }

    private String toJsonArray(List<String> values) {
        List<String> normalized = values == null
            ? List.of()
            : values
                .stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(item -> !item.isEmpty())
                .collect(Collectors.toList());
        try {
            return objectMapper.writeValueAsString(normalized);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("房型 JSON 字段序列化失败", ex);
        }
    }

    private List<LocalDate> validateUniqueDates(List<String> dateTexts) {
        Set<LocalDate> dates = new LinkedHashSet<>();
        for (String dateText : dateTexts) {
            LocalDate date = roomService.parseDate(dateText.trim(), "date");
            if (!dates.add(date)) {
                throw BusinessException.badRequest("date 不能重复");
            }
        }
        return new ArrayList<>(dates);
    }

    private AdminRoomDto toAdminRoomDto(RoomEntity room) {
        return new AdminRoomDto(
            room.getId(),
            room.getName(),
            room.getSubtitle(),
            room.getCover(),
            room.getCapacity(),
            room.getArea(),
            room.getBedType(),
            room.getScenicType(),
            parseJsonArray(room.getTagsJson()),
            room.getBasePrice(),
            room.getBreakfast(),
            room.getIntro(),
            parseJsonArray(room.getAmenitiesJson()),
            parseJsonArray(room.getRulesJson()),
            room.getCanCancelBeforeHours(),
            room.getStatus()
        );
    }

    private List<String> parseJsonArray(String jsonValue) {
        if (jsonValue == null || jsonValue.trim().isEmpty()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(
                jsonValue,
                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
            );
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("房型 JSON 字段解析失败", ex);
        }
    }
}
