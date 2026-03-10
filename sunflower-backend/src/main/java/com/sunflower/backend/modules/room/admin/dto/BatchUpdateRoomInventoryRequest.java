package com.sunflower.backend.modules.room.admin.dto;

import java.util.List;
import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Pattern;

public class BatchUpdateRoomInventoryRequest {

    @NotBlank(message = "roomId 不能为空")
    private String roomId;

    @Valid
    @NotEmpty(message = "items 不能为空")
    private List<InventoryItem> items;

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public List<InventoryItem> getItems() {
        return items;
    }

    public void setItems(List<InventoryItem> items) {
        this.items = items;
    }

    public static class InventoryItem {

        @NotBlank(message = "date 不能为空")
        @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "date 格式必须是 yyyy-MM-dd")
        private String date;

        @Min(value = 0, message = "totalStock 不能小于 0")
        private int totalStock;

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
    }
}
