package com.sunflower.backend.modules.room.admin.dto;

import java.util.List;
import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Pattern;

public class BatchUpdateRoomPricesRequest {

    @NotBlank(message = "roomId 不能为空")
    private String roomId;

    @Valid
    @NotEmpty(message = "items 不能为空")
    private List<PriceItem> items;

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public List<PriceItem> getItems() {
        return items;
    }

    public void setItems(List<PriceItem> items) {
        this.items = items;
    }

    public static class PriceItem {

        @NotBlank(message = "date 不能为空")
        @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "date 格式必须是 yyyy-MM-dd")
        private String date;

        @Min(value = 1, message = "price 必须大于 0")
        private int price;

        private String source;

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
