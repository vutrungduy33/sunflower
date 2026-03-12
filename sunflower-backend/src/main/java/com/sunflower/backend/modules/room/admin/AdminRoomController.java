package com.sunflower.backend.modules.room.admin;

import com.sunflower.backend.common.api.ApiResponse;
import com.sunflower.backend.modules.room.admin.dto.AdminRoomDto;
import com.sunflower.backend.modules.room.admin.dto.AdminRoomInventoryBatchResponse;
import com.sunflower.backend.modules.room.admin.dto.AdminRoomPriceBatchResponse;
import com.sunflower.backend.modules.room.admin.dto.BatchUpdateRoomInventoryRequest;
import com.sunflower.backend.modules.room.admin.dto.BatchUpdateRoomPricesRequest;
import com.sunflower.backend.modules.room.admin.dto.CreateAdminRoomRequest;
import com.sunflower.backend.modules.room.admin.dto.UpdateAdminRoomRequest;
import java.util.List;
import javax.validation.Valid;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/admin")
public class AdminRoomController {

    private final AdminRoomService adminRoomService;

    public AdminRoomController(AdminRoomService adminRoomService) {
        this.adminRoomService = adminRoomService;
    }

    @GetMapping("/rooms")
    public ApiResponse<List<AdminRoomDto>> listRooms() {
        return ApiResponse.ok(adminRoomService.listRooms());
    }

    @PostMapping("/rooms")
    public ApiResponse<AdminRoomDto> createRoom(@Valid @RequestBody CreateAdminRoomRequest request) {
        return ApiResponse.ok(adminRoomService.createRoom(request));
    }

    @PatchMapping("/rooms/{roomId}")
    public ApiResponse<AdminRoomDto> updateRoom(
        @PathVariable String roomId,
        @RequestBody UpdateAdminRoomRequest request
    ) {
        return ApiResponse.ok(adminRoomService.updateRoom(roomId, request));
    }

    @PostMapping("/room-prices")
    public ApiResponse<AdminRoomPriceBatchResponse> updateRoomPrices(
        @Valid @RequestBody BatchUpdateRoomPricesRequest request
    ) {
        return ApiResponse.ok(adminRoomService.updateRoomPrices(request));
    }

    @PostMapping("/room-inventory")
    public ApiResponse<AdminRoomInventoryBatchResponse> updateRoomInventory(
        @Valid @RequestBody BatchUpdateRoomInventoryRequest request
    ) {
        return ApiResponse.ok(adminRoomService.updateRoomInventory(request));
    }
}
