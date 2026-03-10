package com.sunflower.backend.modules.room.admin.dto;

import java.util.ArrayList;
import java.util.List;

public class AdminRoomInventoryBatchResponse {

    private String roomId;
    private int updatedCount;
    private List<InventoryItem> items;

    public AdminRoomInventoryBatchResponse() {
        this.items = new ArrayList<>();
    }

    public AdminRoomInventoryBatchResponse(String roomId, int updatedCount, List<InventoryItem> items) {
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

    public List<InventoryItem> getItems() {
        return items;
    }

    public void setItems(List<InventoryItem> items) {
        this.items = items == null ? new ArrayList<>() : new ArrayList<>(items);
    }

    public static class InventoryItem {

        private String date;
        private int totalStock;
        private int availableStock;
        private int lockedStock;

        public InventoryItem() {
        }

        public InventoryItem(String date, int totalStock, int availableStock, int lockedStock) {
            this.date = date;
            this.totalStock = totalStock;
            this.availableStock = availableStock;
            this.lockedStock = lockedStock;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public int getTotalStock() {
            return totalStock;
        }

        public void setTotalStock(int totalStock) {
            this.totalStock = totalStock;
        }

        public int getAvailableStock() {
            return availableStock;
        }

        public void setAvailableStock(int availableStock) {
            this.availableStock = availableStock;
        }

        public int getLockedStock() {
            return lockedStock;
        }

        public void setLockedStock(int lockedStock) {
            this.lockedStock = lockedStock;
        }
    }
}
