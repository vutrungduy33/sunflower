package com.sunflower.backend.modules.auth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.sunflower.backend.common.exception.BusinessException;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
public class WechatAccessTokenClient {

    private static final String GRANT_TYPE_CLIENT_CREDENTIAL = "client_credential";
    private static final String MOCK_ACCESS_TOKEN = "mock_wechat_access_token";
    private static final int ACCESS_TOKEN_REFRESH_BUFFER_SECONDS = 300;

    private final RestTemplate restTemplate;
    private final boolean mockEnabled;
    private final String appId;
    private final String appSecret;
    private final String stableAccessTokenUrl;

    private volatile CachedAccessToken cachedAccessToken;

    @Autowired
    public WechatAccessTokenClient(
        RestTemplateBuilder restTemplateBuilder,
        @Value("${app.auth.wechat.mock-enabled:false}") boolean mockEnabled,
        @Value("${app.auth.wechat.app-id:}") String appId,
        @Value("${app.auth.wechat.app-secret:}") String appSecret,
        @Value("${app.auth.wechat.stable-access-token-url:https://api.weixin.qq.com/cgi-bin/stable_token}") String stableAccessTokenUrl
    ) {
        this(
            restTemplateBuilder.build(),
            mockEnabled,
            appId,
            appSecret,
            stableAccessTokenUrl
        );
    }

    WechatAccessTokenClient(
        RestTemplate restTemplate,
        boolean mockEnabled,
        String appId,
        String appSecret,
        String stableAccessTokenUrl
    ) {
        this.restTemplate = restTemplate;
        this.mockEnabled = mockEnabled;
        this.appId = trim(appId);
        this.appSecret = trim(appSecret);
        this.stableAccessTokenUrl = trim(stableAccessTokenUrl);

        requireText(this.stableAccessTokenUrl, "app.auth.wechat.stable-access-token-url 未配置");
        if (!this.mockEnabled) {
            requireText(this.appId, "app.auth.wechat.app-id 未配置");
            requireText(this.appSecret, "app.auth.wechat.app-secret 未配置");
        }
    }

    public String getAccessToken() {
        if (mockEnabled) {
            return MOCK_ACCESS_TOKEN;
        }

        CachedAccessToken existing = cachedAccessToken;
        if (existing != null && !existing.isExpired()) {
            return existing.value();
        }

        synchronized (this) {
            existing = cachedAccessToken;
            if (existing != null && !existing.isExpired()) {
                return existing.value();
            }

            StableAccessTokenResponse response = requestStableAccessToken();
            Integer errCode = response.getErrCode();
            if (errCode != null && errCode != 0) {
                throw BusinessException.badRequest("微信登录服务暂不可用，请稍后重试");
            }

            String accessToken = trim(response.getAccessToken());
            if (accessToken.isEmpty()) {
                throw BusinessException.badRequest("微信登录服务暂不可用，请稍后重试");
            }

            long expiresIn = response.getExpiresIn() == null ? 7200L : response.getExpiresIn();
            long expiresAtEpochSecond = Instant.now().getEpochSecond()
                + Math.max(60L, expiresIn - ACCESS_TOKEN_REFRESH_BUFFER_SECONDS);
            cachedAccessToken = new CachedAccessToken(accessToken, expiresAtEpochSecond);
            return accessToken;
        }
    }

    private StableAccessTokenResponse requestStableAccessToken() {
        try {
            ResponseEntity<StableAccessTokenResponse> responseEntity = restTemplate.postForEntity(
                stableAccessTokenUrl,
                new StableAccessTokenRequest(appId, appSecret),
                StableAccessTokenResponse.class
            );
            if (!responseEntity.getStatusCode().is2xxSuccessful() || responseEntity.getBody() == null) {
                throw BusinessException.badRequest("微信登录服务暂不可用，请稍后重试");
            }
            return responseEntity.getBody();
        } catch (RestClientException ex) {
            throw BusinessException.badRequest("微信登录服务暂不可用，请稍后重试");
        }
    }

    private static void requireText(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException(message);
        }
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private static class CachedAccessToken {

        private final String value;
        private final long expiresAtEpochSecond;

        private CachedAccessToken(String value, long expiresAtEpochSecond) {
            this.value = value;
            this.expiresAtEpochSecond = expiresAtEpochSecond;
        }

        private String value() {
            return value;
        }

        private boolean isExpired() {
            return Instant.now().getEpochSecond() >= expiresAtEpochSecond;
        }
    }

    private static class StableAccessTokenRequest {

        @JsonProperty("grant_type")
        private final String grantType = GRANT_TYPE_CLIENT_CREDENTIAL;

        @JsonProperty("appid")
        private final String appId;

        @JsonProperty("secret")
        private final String appSecret;

        @JsonProperty("force_refresh")
        private final boolean forceRefresh = false;

        private StableAccessTokenRequest(String appId, String appSecret) {
            this.appId = appId;
            this.appSecret = appSecret;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class StableAccessTokenResponse {

        @JsonProperty("access_token")
        private String accessToken;

        @JsonProperty("expires_in")
        private Long expiresIn;

        @JsonProperty("errcode")
        private Integer errCode;

        public String getAccessToken() {
            return accessToken;
        }

        public void setAccessToken(String accessToken) {
            this.accessToken = accessToken;
        }

        public Long getExpiresIn() {
            return expiresIn;
        }

        public void setExpiresIn(Long expiresIn) {
            this.expiresIn = expiresIn;
        }

        public Integer getErrCode() {
            return errCode;
        }

        public void setErrCode(Integer errCode) {
            this.errCode = errCode;
        }
    }
}
