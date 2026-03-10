package com.sunflower.backend.modules.room.admin.dto;

import java.util.List;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public class CreateAdminRoomRequest {

    @NotBlank(message = "房型名称不能为空")
    private String name;

    @NotBlank(message = "房型副标题不能为空")
    private String subtitle;

    @NotBlank(message = "房型封面不能为空")
    private String cover;

    @Min(value = 1, message = "capacity 必须大于 0")
    private int capacity;

    @Min(value = 1, message = "area 必须大于 0")
    private int area;

    @NotBlank(message = "床型不能为空")
    private String bedType;

    @NotBlank(message = "景观类型不能为空")
    private String scenicType;

    @NotNull(message = "tags 不能为空")
    private List<String> tags;

    @Min(value = 1, message = "basePrice 必须大于 0")
    private int basePrice;

    @NotBlank(message = "早餐说明不能为空")
    private String breakfast;

    @NotBlank(message = "房型介绍不能为空")
    private String intro;

    @NotNull(message = "amenities 不能为空")
    private List<String> amenities;

    @NotNull(message = "rules 不能为空")
    private List<String> rules;

    @Min(value = 0, message = "canCancelBeforeHours 不能小于 0")
    private int canCancelBeforeHours;

    private String status;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public String getCover() {
        return cover;
    }

    public void setCover(String cover) {
        this.cover = cover;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public int getArea() {
        return area;
    }

    public void setArea(int area) {
        this.area = area;
    }

    public String getBedType() {
        return bedType;
    }

    public void setBedType(String bedType) {
        this.bedType = bedType;
    }

    public String getScenicType() {
        return scenicType;
    }

    public void setScenicType(String scenicType) {
        this.scenicType = scenicType;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public int getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(int basePrice) {
        this.basePrice = basePrice;
    }

    public String getBreakfast() {
        return breakfast;
    }

    public void setBreakfast(String breakfast) {
        this.breakfast = breakfast;
    }

    public String getIntro() {
        return intro;
    }

    public void setIntro(String intro) {
        this.intro = intro;
    }

    public List<String> getAmenities() {
        return amenities;
    }

    public void setAmenities(List<String> amenities) {
        this.amenities = amenities;
    }

    public List<String> getRules() {
        return rules;
    }

    public void setRules(List<String> rules) {
        this.rules = rules;
    }

    public int getCanCancelBeforeHours() {
        return canCancelBeforeHours;
    }

    public void setCanCancelBeforeHours(int canCancelBeforeHours) {
        this.canCancelBeforeHours = canCancelBeforeHours;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
