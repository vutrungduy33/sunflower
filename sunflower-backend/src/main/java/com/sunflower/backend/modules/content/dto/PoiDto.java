package com.sunflower.backend.modules.content.dto;

public class PoiDto {

    private String id;
    private String name;
    private String category;
    private double distanceKm;
    private String summary;
    private double latitude;
    private double longitude;

    public PoiDto(
        String id,
        String name,
        String category,
        double distanceKm,
        String summary,
        double latitude,
        double longitude
    ) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.distanceKm = distanceKm;
        this.summary = summary;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public double getDistanceKm() {
        return distanceKm;
    }

    public String getSummary() {
        return summary;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }
}
