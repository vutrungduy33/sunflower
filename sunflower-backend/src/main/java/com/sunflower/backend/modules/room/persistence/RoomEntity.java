package com.sunflower.backend.modules.room.persistence;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "rooms")
public class RoomEntity {

    @Id
    private String id;

    private String name;

    private String subtitle;

    private String cover;

    private int capacity;

    private int area;

    @Column(name = "bed_type")
    private String bedType;

    @Column(name = "scenic_type")
    private String scenicType;

    @Column(name = "tags_json")
    private String tagsJson;

    @Column(name = "base_price")
    private int basePrice;

    private String breakfast;

    private String intro;

    @Column(name = "amenities_json")
    private String amenitiesJson;

    @Column(name = "rules_json")
    private String rulesJson;

    @Column(name = "can_cancel_before_hours")
    private int canCancelBeforeHours;

    private String status;

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

    public String getTagsJson() {
        return tagsJson;
    }

    public void setTagsJson(String tagsJson) {
        this.tagsJson = tagsJson;
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

    public String getAmenitiesJson() {
        return amenitiesJson;
    }

    public void setAmenitiesJson(String amenitiesJson) {
        this.amenitiesJson = amenitiesJson;
    }

    public String getRulesJson() {
        return rulesJson;
    }

    public void setRulesJson(String rulesJson) {
        this.rulesJson = rulesJson;
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
