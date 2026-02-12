package com.sunflower.backend.modules.room.dto;

import java.util.ArrayList;
import java.util.List;

public class RoomDto {

    private String id;
    private String name;
    private String subtitle;
    private String cover;
    private int capacity;
    private int area;
    private String bedType;
    private String scenicType;
    private List<String> tags;
    private int basePrice;
    private String breakfast;
    private String intro;
    private List<String> amenities;
    private List<String> rules;
    private int canCancelBeforeHours;
    private Integer todayPrice;
    private Integer stock;
    private List<RoomCalendarItemDto> calendar;

    public RoomDto() {
        this.tags = new ArrayList<>();
        this.amenities = new ArrayList<>();
        this.rules = new ArrayList<>();
        this.calendar = new ArrayList<>();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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
        this.tags = new ArrayList<>(tags);
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
        this.amenities = new ArrayList<>(amenities);
    }

    public List<String> getRules() {
        return rules;
    }

    public void setRules(List<String> rules) {
        this.rules = new ArrayList<>(rules);
    }

    public int getCanCancelBeforeHours() {
        return canCancelBeforeHours;
    }

    public void setCanCancelBeforeHours(int canCancelBeforeHours) {
        this.canCancelBeforeHours = canCancelBeforeHours;
    }

    public Integer getTodayPrice() {
        return todayPrice;
    }

    public void setTodayPrice(Integer todayPrice) {
        this.todayPrice = todayPrice;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public List<RoomCalendarItemDto> getCalendar() {
        return calendar;
    }

    public void setCalendar(List<RoomCalendarItemDto> calendar) {
        this.calendar = calendar;
    }
}
