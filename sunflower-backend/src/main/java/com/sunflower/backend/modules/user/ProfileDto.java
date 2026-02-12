package com.sunflower.backend.modules.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class ProfileDto {

    private String nickName;
    private String phone;
    private List<String> tags;
    private boolean phoneBound;

    public ProfileDto() {
        this.tags = new ArrayList<>();
    }

    public ProfileDto(String nickName, String phone, List<String> tags, boolean phoneBound) {
        this.nickName = nickName;
        this.phone = phone;
        this.tags = new ArrayList<>(tags);
        this.phoneBound = phoneBound;
    }

    public ProfileDto copy() {
        return new ProfileDto(this.nickName, this.phone, this.tags, this.phoneBound);
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

    @JsonProperty("isPhoneBound")
    public boolean isPhoneBound() {
        return phoneBound;
    }

    public void setPhoneBound(boolean phoneBound) {
        this.phoneBound = phoneBound;
    }
}
