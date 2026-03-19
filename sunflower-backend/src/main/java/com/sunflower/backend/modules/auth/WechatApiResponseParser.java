package com.sunflower.backend.modules.auth;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sunflower.backend.common.exception.BusinessException;
import org.springframework.util.StringUtils;

final class WechatApiResponseParser {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private WechatApiResponseParser() {
    }

    static <T> T parse(String responseBody, Class<T> responseType, String errorMessage) {
        if (!StringUtils.hasText(responseBody)) {
            throw BusinessException.badRequest(errorMessage);
        }

        try {
            return OBJECT_MAPPER.readValue(responseBody, responseType);
        } catch (JsonProcessingException ex) {
            throw BusinessException.badRequest(errorMessage);
        }
    }
}
