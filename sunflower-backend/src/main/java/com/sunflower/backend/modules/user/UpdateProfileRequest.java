package com.sunflower.backend.modules.user;

import java.util.List;

public class UpdateProfileRequest {

    private String nickName;
    private List<String> tags;

    public String getNickName() {
        return nickName;
    }

    public void setNickName(String nickName) {
        this.nickName = nickName;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }
}
