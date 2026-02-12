package com.sunflower.backend.modules.content.dto;

public class HomeBannerDto {

    private String id;
    private String title;
    private String subtitle;
    private String cta;

    public HomeBannerDto(String id, String title, String subtitle, String cta) {
        this.id = id;
        this.title = title;
        this.subtitle = subtitle;
        this.cta = cta;
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public String getCta() {
        return cta;
    }
}
