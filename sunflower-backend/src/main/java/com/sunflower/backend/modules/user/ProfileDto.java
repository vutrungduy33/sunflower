package com.sunflower.backend.modules.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class ProfileDto {

    private String nickName;
    private String phone;
    private List<String> tags;
    @JsonProperty("isPhoneBound")
    private boolean isPhoneBound;

    public ProfileDto() {
        this.tags = new ArrayList<>();
    }

    public ProfileDto(String nickName, String phone, List<String> tags, boolean isPhoneBound) {
        this.nickName = nickName;
        this.phone = phone;
        this.tags = new ArrayList<>(tags);
        this.isPhoneBound = isPhoneBound;
    }

    public ProfileDto copy() {
        return new ProfileDto(this.nickName, this.phone, this.tags, this.isPhoneBound);
    }

    public String getNickName() {
        return nickName;
    }

    public void setNickName(String nickName) {
        this.nickName = nickName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = new ArrayList<>(tags);
    }

    public boolean isPhoneBound() {
        return isPhoneBound;
    }

    public void setPhoneBound(boolean phoneBound) {
        isPhoneBound = phoneBound;
    }
}
