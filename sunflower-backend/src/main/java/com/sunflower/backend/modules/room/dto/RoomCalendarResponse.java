package com.sunflower.backend.modules.room.dto;

import java.util.List;

public class RoomCalendarResponse {

    private String roomId;
    private List<RoomCalendarItemDto> calendar;

    public RoomCalendarResponse(String roomId, List<RoomCalendarItemDto> calendar) {
        this.roomId = roomId;
        this.calendar = calendar;
    }

    public String getRoomId() {
        return roomId;
    }

    public List<RoomCalendarItemDto> getCalendar() {
        return calendar;
    }
}
