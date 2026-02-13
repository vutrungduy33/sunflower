package com.sunflower.backend.modules.user;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sunflower.backend.common.exception.BusinessException;
import com.sunflower.backend.modules.auth.AuthTokenService;
import com.sunflower.backend.modules.user.persistence.UserEntity;
import com.sunflower.backend.modules.user.persistence.UserProfileEntity;
import com.sunflower.backend.modules.user.persistence.UserProfileRepository;
import com.sunflower.backend.modules.user.persistence.UserRepository;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final String USER_STATUS_ACTIVE = "ACTIVE";
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<List<String>>() {
    };

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AuthTokenService authTokenService;
    private final ObjectMapper objectMapper;

    public UserService(
        UserRepository userRepository,
        UserProfileRepository userProfileRepository,
        AuthTokenService authTokenService,
        ObjectMapper objectMapper
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.authTokenService = authTokenService;
        this.objectMapper = objectMapper;
    }

    public String currentUserId() {
        Optional<String> token = authTokenService.extractTokenFromCurrentRequest();
        if (token.isEmpty()) {
            throw BusinessException.unauthorized("请先登录");
        }
        String userId = authTokenService
            .parseUserId(token.get())
            .orElseThrow(() -> BusinessException.unauthorized("登录态无效"));
        if (!userRepository.existsByIdAndStatus(userId, USER_STATUS_ACTIVE)) {
            throw BusinessException.unauthorized("登录态无效");
        }
        return userId;
    }

    public ProfileDto getCurrentProfile() {
        return getProfileByUserId(currentUserId());
    }

    public ProfileDto getProfileByUserId(String userId) {
        UserEntity user = requireActiveUser(userId);
        UserProfileEntity profile = requireProfile(user.getId());
        return toProfileDto(user, profile);
    }

    @Transactional
    public ProfileDto updateCurrentProfile(UpdateProfileRequest request) {
        String userId = currentUserId();
        UserEntity user = requireActiveUser(userId);
        UserProfileEntity profile = requireProfile(user.getId());

        if (request.getNickName() != null) {
            String nickName = request.getNickName().trim();
            if (nickName.isEmpty()) {
                throw BusinessException.badRequest("昵称不能为空");
            }
            profile.setNickname(nickName);
        }

        if (request.getTags() != null && !request.getTags().isEmpty()) {
            profile.setTagsJson(toTagsJson(request.getTags()));
        }

        userProfileRepository.save(profile);
        return toProfileDto(user, profile);
    }

    @Transactional
    public ProfileDto bindCurrentUserPhone(String phone) {
        String normalized = phone == null ? "" : phone.trim();
        if (normalized.isEmpty()) {
            throw BusinessException.badRequest("手机号不能为空");
        }

        String userId = currentUserId();
        UserEntity user = requireActiveUser(userId);
        userRepository
            .findByPhone(normalized)
            .ifPresent(existing -> {
                if (!existing.getId().equals(userId)) {
                    throw BusinessException.conflict("手机号已被绑定");
                }
            });
        user.setPhone(normalized);
        try {
            userRepository.save(user);
        } catch (DataIntegrityViolationException ex) {
            throw BusinessException.conflict("手机号已被绑定");
        }

        UserProfileEntity profile = requireProfile(user.getId());
        return toProfileDto(user, profile);
    }

    public String firstActiveUserId() {
        return userRepository
            .findFirstByStatusOrderByIdAsc(USER_STATUS_ACTIVE)
            .map(UserEntity::getId)
            .orElseThrow(() -> BusinessException.notFound("用户不存在"));
    }

    private UserEntity requireActiveUser(String userId) {
        return userRepository
            .findByIdAndStatus(userId, USER_STATUS_ACTIVE)
            .orElseThrow(() -> BusinessException.notFound("用户不存在"));
    }

    private UserProfileEntity requireProfile(String userId) {
        return userProfileRepository
            .findById(userId)
            .orElseThrow(() -> BusinessException.notFound("用户不存在"));
    }

    private ProfileDto toProfileDto(UserEntity user, UserProfileEntity profile) {
        String phone = normalizeNullable(user.getPhone());
        return new ProfileDto(
            profile.getNickname(),
            phone,
            parseTags(profile.getTagsJson()),
            !phone.isEmpty()
        );
    }

    private List<String> parseTags(String tagsJson) {
        if (tagsJson == null || tagsJson.trim().isEmpty()) {
            return Collections.emptyList();
        }
        try {
            List<String> tags = objectMapper.readValue(tagsJson, STRING_LIST_TYPE);
            return tags == null ? Collections.emptyList() : tags;
        } catch (IOException ex) {
            throw new IllegalStateException("用户标签 JSON 字段解析失败", ex);
        }
    }

    private String toTagsJson(List<String> tags) {
        List<String> normalized = tags
            .stream()
            .filter(Objects::nonNull)
            .map(String::trim)
            .filter(item -> !item.isEmpty())
            .collect(Collectors.toList());
        try {
            return objectMapper.writeValueAsString(normalized);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("用户标签 JSON 字段序列化失败", ex);
        }
    }

    private String normalizeNullable(String value) {
        return value == null ? "" : value.trim();
    }
}
