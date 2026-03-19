package com.sunflower.backend.modules.auth;

import com.sunflower.backend.modules.auth.dto.WechatLoginResponse;
import com.sunflower.backend.modules.user.ProfileDto;
import com.sunflower.backend.modules.user.UserService;
import com.sunflower.backend.modules.user.persistence.UserEntity;
import com.sunflower.backend.modules.user.persistence.UserProfileEntity;
import com.sunflower.backend.modules.user.persistence.UserProfileRepository;
import com.sunflower.backend.modules.user.persistence.UserRepository;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String USER_STATUS_ACTIVE = "ACTIVE";
    private static final String DEFAULT_NICKNAME = "微信用户";
    private static final String DEFAULT_AVATAR = "";
    private static final String DEFAULT_TAGS_JSON = "[\"亲子\",\"湖景偏好\"]";
    private static final String DEFAULT_PREFERENCES_JSON = "{\"language\":\"zh-CN\"}";

    private final UserService userService;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AuthTokenService authTokenService;
    private final WechatCode2SessionClient wechatCode2SessionClient;
    private final WechatPhoneNumberClient wechatPhoneNumberClient;
    private final boolean manualPhoneBindEnabled;

    public AuthService(
        UserService userService,
        UserRepository userRepository,
        UserProfileRepository userProfileRepository,
        AuthTokenService authTokenService,
        WechatCode2SessionClient wechatCode2SessionClient,
        WechatPhoneNumberClient wechatPhoneNumberClient,
        @Value("${app.auth.wechat.manual-phone-bind-enabled:false}") boolean manualPhoneBindEnabled
    ) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.authTokenService = authTokenService;
        this.wechatCode2SessionClient = wechatCode2SessionClient;
        this.wechatPhoneNumberClient = wechatPhoneNumberClient;
        this.manualPhoneBindEnabled = manualPhoneBindEnabled;
    }

    @Transactional
    public WechatLoginResponse wechatLogin(String code) {
        String openId = wechatCode2SessionClient.resolveOpenId(code);
        UserEntity user = userRepository.findByOpenid(openId).orElseGet(() -> registerWechatUser(openId));
        ensureProfileExists(user.getId());

        ProfileDto profile = userService.getProfileByUserId(user.getId());
        String token = authTokenService.buildToken(user.getId());
        return new WechatLoginResponse(token, openId, profile);
    }

    public ProfileDto bindPhone(String phone, String phoneCode) {
        String normalizedPhoneCode = normalize(phoneCode);
        if (!normalizedPhoneCode.isEmpty()) {
            return userService.bindCurrentUserPhone(wechatPhoneNumberClient.resolvePhoneNumber(normalizedPhoneCode));
        }

        String normalizedPhone = normalize(phone);
        if (normalizedPhone.isEmpty()) {
            throw com.sunflower.backend.common.exception.BusinessException.badRequest("手机号授权码不能为空");
        }
        if (!manualPhoneBindEnabled) {
            throw com.sunflower.backend.common.exception.BusinessException.badRequest("当前环境仅支持微信手机号授权绑定");
        }
        return userService.bindCurrentUserPhone(normalizedPhone);
    }

    private UserEntity registerWechatUser(String openId) {
        UserEntity user = new UserEntity();
        user.setId(buildUserId());
        user.setOpenid(openId);
        user.setStatus(USER_STATUS_ACTIVE);
        try {
            UserEntity savedUser = userRepository.save(user);
            userProfileRepository.save(buildDefaultProfile(savedUser.getId()));
            return savedUser;
        } catch (DataIntegrityViolationException ex) {
            return userRepository
                .findByOpenid(openId)
                .orElseThrow(() -> ex);
        }
    }

    private void ensureProfileExists(String userId) {
        if (!userProfileRepository.existsById(userId)) {
            userProfileRepository.save(buildDefaultProfile(userId));
        }
    }

    private UserProfileEntity buildDefaultProfile(String userId) {
        UserProfileEntity profile = new UserProfileEntity();
        profile.setUserId(userId);
        profile.setNickname(DEFAULT_NICKNAME);
        profile.setAvatar(DEFAULT_AVATAR);
        profile.setTagsJson(DEFAULT_TAGS_JSON);
        profile.setPreferencesJson(DEFAULT_PREFERENCES_JSON);
        return profile;
    }

    private String buildUserId() {
        return "user_" + UUID.randomUUID().toString().replace("-", "");
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
