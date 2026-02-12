package com.sunflower.backend.modules.room;

import com.sunflower.backend.common.api.ApiResponse;
import com.sunflower.backend.modules.room.dto.RoomCalendarResponse;
import com.sunflower.backend.modules.room.dto.RoomDto;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public ApiResponse<List<RoomDto>> listRooms(
        @RequestParam(required = false) String checkInDate,
        @RequestParam(required = false) String keyword
    ) {
        return ApiResponse.ok(roomService.listRooms(checkInDate, keyword));
    }

    @GetMapping("/{roomId}")
    public ApiResponse<RoomDto> getRoomDetail(
        @PathVariable String roomId,
        @RequestParam(required = false) String checkInDate
    ) {
        return ApiResponse.ok(roomService.getRoomDetail(roomId, checkInDate));
    }

    @GetMapping("/{roomId}/calendar")
    public ApiResponse<RoomCalendarResponse> getRoomCalendar(
        @PathVariable String roomId,
        @RequestParam(required = false) String startDate,
        @RequestParam(required = false) Integer days
    ) {
        return ApiResponse.ok(roomService.getRoomCalendar(roomId, startDate, days));
    }
}
