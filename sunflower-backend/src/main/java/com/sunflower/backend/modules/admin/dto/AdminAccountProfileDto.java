package com.sunflower.backend.modules.admin.dto;

public class AdminAccountProfileDto {

    private String id;
    private String phone;
    private String role;
    private String roleLabel;

    public AdminAccountProfileDto(String id, String phone, String role, String roleLabel) {
        this.id = id;
        this.phone = phone;
        this.role = role;
        this.roleLabel = roleLabel;
    }

    public String getId() {
        return id;
    }

    public String getPhone() {
        return phone;
    }

    public String getRole() {
        return role;
    }

    public String getRoleLabel() {
        return roleLabel;
    }
}
