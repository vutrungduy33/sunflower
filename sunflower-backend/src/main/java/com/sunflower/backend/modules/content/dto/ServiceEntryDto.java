package com.sunflower.backend.modules.content.dto;

public class ServiceEntryDto {

    private String id;
    private String name;
    private String desc;
    private String icon;

    public ServiceEntryDto(String id, String name, String desc, String icon) {
        this.id = id;
        this.name = name;
        this.desc = desc;
        this.icon = icon;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDesc() {
        return desc;
    }

    public String getIcon() {
        return icon;
    }
}
