package com.sunflower.backend.modules.room.dto;

public class RoomCalendarItemDto {

    private String date;
    private String weekdayLabel;
    private int price;
    private int stock;

    public RoomCalendarItemDto(String date, String weekdayLabel, int price, int stock) {
        this.date = date;
        this.weekdayLabel = weekdayLabel;
        this.price = price;
        this.stock = stock;
    }

    public String getDate() {
        return date;
    }

    public String getWeekdayLabel() {
        return weekdayLabel;
    }

    public int getPrice() {
        return price;
    }

    public int getStock() {
        return stock;
    }
}
