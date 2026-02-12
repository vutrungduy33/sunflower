package com.sunflower.backend.modules.user;

import com.sunflower.backend.common.exception.BusinessException;
import java.util.Arrays;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.annotation.PostConstruct;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private static final String DEMO_USER_ID = "user_demo_1001";

    private final Map<String, ProfileDto> profiles = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        profiles.put(
            DEMO_USER_ID,
            new ProfileDto("微信用户", "", Arrays.asList("亲子", "湖景偏好"), false)
        );
    }

    public String currentUserId() {
        return DEMO_USER_ID;
    }

    public ProfileDto getCurrentProfile() {
        return getProfileByUserId(DEMO_USER_ID);
    }

    public ProfileDto getProfileByUserId(String userId) {
        ProfileDto profile = profiles.get(userId);
        if (profile == null) {
            throw BusinessException.notFound("用户不存在");
        }
        return profile.copy();
    }

    public ProfileDto updateCurrentProfile(UpdateProfileRequest request) {
        ProfileDto profile = profiles.get(DEMO_USER_ID);
        if (profile == null) {
            throw BusinessException.notFound("用户不存在");
        }

        if (request.getNickName() != null) {
            String nickName = request.getNickName().trim();
            if (nickName.isEmpty()) {
                throw BusinessException.badRequest("昵称不能为空");
            }
            profile.setNickName(nickName);
        }

        if (request.getTags() != null && !request.getTags().isEmpty()) {
            profile.setTags(request.getTags());
        }

        return profile.copy();
    }

    public ProfileDto bindCurrentUserPhone(String phone) {
        String normalized = phone.trim();
        ProfileDto profile = profiles.get(DEMO_USER_ID);
        if (profile == null) {
            throw BusinessException.notFound("用户不存在");
        }
        profile.setPhone(normalized);
        profile.setPhoneBound(true);
        return profile.copy();
    }
}
