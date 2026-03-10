package com.sunflower.backend.modules.room.admin.dto;

import java.util.ArrayList;
import java.util.List;

public class AdminRoomPriceBatchResponse {

    private String roomId;
    private int updatedCount;
    private List<PriceItem> items;

    public AdminRoomPriceBatchResponse() {
        this.items = new ArrayList<>();
    }

    public AdminRoomPriceBatchResponse(String roomId, int updatedCount, List<PriceItem> items) {
        this();
        this.roomId = roomId;
        this.updatedCount = updatedCount;
        this.items = new ArrayList<>(items);
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public int getUpdatedCount() {
        return updatedCount;
    }

    public void setUpdatedCount(int updatedCount) {
        this.updatedCount = updatedCount;
    }

    public List<PriceItem> getItems() {
        return items;
    }

    public void setItems(List<PriceItem> items) {
        this.items = items == null ? new ArrayList<>() : new ArrayList<>(items);
    }

    public static class PriceItem {

        private String date;
        private int price;
        private String source;

        public PriceItem() {
        }

        public PriceItem(String date, int price, String source) {
            this.date = date;
            this.price = price;
            this.source = source;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public int getPrice() {
            return price;
        }

        public void setPrice(int price) {
            this.price = price;
        }

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }
    }
}
