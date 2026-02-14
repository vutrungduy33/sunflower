package com.sunflower.backend.modules.auth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.sunflower.backend.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class WechatCode2SessionClient {

    private static final String GRANT_TYPE_AUTHORIZATION_CODE = "authorization_code";
    private static final int ERR_CODE_INVALID = 40029;
    private static final int ERR_CODE_USED = 40163;

    private final RestTemplate restTemplate;
    private final boolean mockEnabled;
    private final String appId;
    private final String appSecret;
    private final String jscode2sessionUrl;
    private final String mockFixedOpenId;
    private final String mockOpenIdPrefix;

    public WechatCode2SessionClient(
        RestTemplateBuilder restTemplateBuilder,
        @Value("${app.auth.wechat.mock-enabled:true}") boolean mockEnabled,
        @Value("${app.auth.wechat.app-id:}") String appId,
        @Value("${app.auth.wechat.app-secret:}") String appSecret,
        @Value("${app.auth.wechat.jscode2session-url:https://api.weixin.qq.com/sns/jscode2session}") String jscode2sessionUrl,
        @Value("${app.auth.wechat.mock-fixed-openid:}") String mockFixedOpenId,
        @Value("${app.auth.wechat.mock-openid-prefix:mock_openid_}") String mockOpenIdPrefix
    ) {
        this.restTemplate = restTemplateBuilder.build();
        this.mockEnabled = mockEnabled;
        this.appId = trim(appId);
        this.appSecret = trim(appSecret);
        this.jscode2sessionUrl = trim(jscode2sessionUrl);
        this.mockFixedOpenId = trim(mockFixedOpenId);
        this.mockOpenIdPrefix = trim(mockOpenIdPrefix);

        if (!this.mockEnabled) {
            requireText(this.appId, "app.auth.wechat.app-id 未配置");
            requireText(this.appSecret, "app.auth.wechat.app-secret 未配置");
        }
        requireText(this.jscode2sessionUrl, "app.auth.wechat.jscode2session-url 未配置");
        requireText(this.mockOpenIdPrefix, "app.auth.wechat.mock-openid-prefix 未配置");
    }

    public String resolveOpenId(String code) {
        String normalizedCode = normalizeCode(code);
        if (mockEnabled) {
            if (!mockFixedOpenId.isEmpty()) {
                return mockFixedOpenId;
            }
            return mockOpenIdPrefix + normalizedCode;
        }

        String requestUrl = UriComponentsBuilder
            .fromHttpUrl(jscode2sessionUrl)
            .queryParam("appid", appId)
            .queryParam("secret", appSecret)
            .queryParam("js_code", normalizedCode)
            .queryParam("grant_type", GRANT_TYPE_AUTHORIZATION_CODE)
            .build(true)
            .toUriString();

        WechatCode2SessionResponse response = requestSession(requestUrl);
        Integer errCode = response.getErrCode();
        if (errCode != null && errCode != 0) {
            if (errCode == ERR_CODE_INVALID || errCode == ERR_CODE_USED) {
                throw BusinessException.badRequest("微信登录凭证无效，请重新登录");
            }
            throw BusinessException.badRequest("微信登录失败，请稍后重试");
        }

        String openId = trim(response.getOpenId());
        if (openId.isEmpty()) {
            throw BusinessException.badRequest("微信登录失败，请稍后重试");
        }
        return openId;
    }

    private WechatCode2SessionResponse requestSession(String requestUrl) {
        try {
            ResponseEntity<WechatCode2SessionResponse> responseEntity = restTemplate.getForEntity(
                requestUrl,
                WechatCode2SessionResponse.class
            );
            if (!responseEntity.getStatusCode().is2xxSuccessful() || responseEntity.getBody() == null) {
                throw BusinessException.badRequest("微信登录失败，请稍后重试");
            }
            return responseEntity.getBody();
        } catch (RestClientException ex) {
            throw BusinessException.badRequest("微信登录服务暂不可用，请稍后重试");
        }
    }

    private String normalizeCode(String code) {
        String normalized = trim(code);
        if (normalized.isEmpty()) {
            throw BusinessException.badRequest("微信登录 code 不能为空");
        }
        return normalized;
    }

    private static void requireText(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException(message);
        }
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class WechatCode2SessionResponse {

        @JsonProperty("openid")
        private String openId;

        @JsonProperty("errcode")
        private Integer errCode;

        public String getOpenId() {
            return openId;
        }

        public void setOpenId(String openId) {
            this.openId = openId;
        }

        public Integer getErrCode() {
            return errCode;
        }

        public void setErrCode(Integer errCode) {
            this.errCode = errCode;
        }
    }
}
