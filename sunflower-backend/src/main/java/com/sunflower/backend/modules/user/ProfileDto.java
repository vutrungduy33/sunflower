package com.sunflower.backend.modules.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class ProfileDto {

    private String nickName;
    private String avatarUrl;
    private String phone;
    private List<String> tags;
    private boolean phoneBound;
    private boolean needsProfileCompletion;

    public ProfileDto() {
        this.tags = new ArrayList<>();
    }

    public ProfileDto(
        String nickName,
        String avatarUrl,
        String phone,
        List<String> tags,
        boolean phoneBound,
        boolean needsProfileCompletion
    ) {
        this.nickName = nickName;
        this.avatarUrl = avatarUrl;
        this.phone = phone;
        this.tags = new ArrayList<>(tags);
        this.phoneBound = phoneBound;
        this.needsProfileCompletion = needsProfileCompletion;
    }

    public ProfileDto copy() {
        return new ProfileDto(
            this.nickName,
            this.avatarUrl,
            this.phone,
            this.tags,
            this.phoneBound,
            this.needsProfileCompletion
        );
    }

    public String getNickName() {
        return nickName;
    }

    public void setNickName(String nickName) {
        this.nickName = nickName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
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

    public boolean isNeedsProfileCompletion() {
        return needsProfileCompletion;
    }

    public void setNeedsProfileCompletion(boolean needsProfileCompletion) {
        this.needsProfileCompletion = needsProfileCompletion;
    }
}
