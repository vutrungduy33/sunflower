package com.sunflower.backend.modules.room.admin.dto;

import java.util.List;

public class UpdateAdminRoomRequest {

    private String name;
    private String subtitle;
    private String cover;
    private Integer capacity;
    private Integer area;
    private String bedType;
    private String scenicType;
    private List<String> tags;
    private Integer basePrice;
    private String breakfast;
    private String intro;
    private List<String> amenities;
    private List<String> rules;
    private Integer canCancelBeforeHours;
    private String status;

    public boolean hasAnyField() {
        return name != null
            || subtitle != null
            || cover != null
            || capacity != null
            || area != null
            || bedType != null
            || scenicType != null
            || tags != null
            || basePrice != null
            || breakfast != null
            || intro != null
            || amenities != null
            || rules != null
            || canCancelBeforeHours != null
            || status != null;
    }

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

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Integer getArea() {
        return area;
    }

    public void setArea(Integer area) {
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

    public Integer getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(Integer basePrice) {
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

    public Integer getCanCancelBeforeHours() {
        return canCancelBeforeHours;
    }

    public void setCanCancelBeforeHours(Integer canCancelBeforeHours) {
        this.canCancelBeforeHours = canCancelBeforeHours;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
