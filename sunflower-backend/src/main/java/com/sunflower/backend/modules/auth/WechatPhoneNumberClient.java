package com.sunflower.backend.modules.auth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.sunflower.backend.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class WechatPhoneNumberClient {

    private static final int ERR_CODE_INVALID = 40029;
    private static final int ERR_CODE_INVALID_APP_ID = 40013;
    private static final int ERR_CODE_RATE_LIMIT = 45011;

    private final RestTemplate restTemplate;
    private final WechatAccessTokenClient wechatAccessTokenClient;
    private final boolean mockEnabled;
    private final String getPhoneNumberUrl;
    private final String mockPhoneNumberPrefix;

    @Autowired
    public WechatPhoneNumberClient(
        RestTemplateBuilder restTemplateBuilder,
        WechatAccessTokenClient wechatAccessTokenClient,
        @Value("${app.auth.wechat.mock-enabled:false}") boolean mockEnabled,
        @Value("${app.auth.wechat.get-phone-number-url:https://api.weixin.qq.com/wxa/business/getuserphonenumber}") String getPhoneNumberUrl,
        @Value("${app.auth.wechat.mock-phone-number-prefix:1880000}") String mockPhoneNumberPrefix
    ) {
        this(
            restTemplateBuilder.build(),
            wechatAccessTokenClient,
            mockEnabled,
            getPhoneNumberUrl,
            mockPhoneNumberPrefix
        );
    }

    WechatPhoneNumberClient(
        RestTemplate restTemplate,
        WechatAccessTokenClient wechatAccessTokenClient,
        boolean mockEnabled,
        String getPhoneNumberUrl,
        String mockPhoneNumberPrefix
    ) {
        this.restTemplate = restTemplate;
        this.wechatAccessTokenClient = wechatAccessTokenClient;
        this.mockEnabled = mockEnabled;
        this.getPhoneNumberUrl = trim(getPhoneNumberUrl);
        this.mockPhoneNumberPrefix = trim(mockPhoneNumberPrefix);

        requireText(this.getPhoneNumberUrl, "app.auth.wechat.get-phone-number-url 未配置");
        requireText(this.mockPhoneNumberPrefix, "app.auth.wechat.mock-phone-number-prefix 未配置");
    }

    public String resolvePhoneNumber(String code) {
        String normalizedCode = normalizeCode(code);
        if (mockEnabled) {
            return buildMockPhoneNumber(normalizedCode);
        }

        String requestUrl = UriComponentsBuilder
            .fromHttpUrl(getPhoneNumberUrl)
            .queryParam("access_token", wechatAccessTokenClient.getAccessToken())
            .build(true)
            .toUriString();
        WechatPhoneNumberResponse response = requestPhoneNumber(requestUrl, normalizedCode);

        Integer errCode = response.getErrCode();
        if (errCode != null && errCode != 0) {
            if (errCode == ERR_CODE_INVALID) {
                throw BusinessException.badRequest("手机号授权已失效，请重新授权");
            }
            if (errCode == ERR_CODE_RATE_LIMIT) {
                throw BusinessException.badRequest("手机号获取过于频繁，请稍后重试");
            }
            if (errCode == ERR_CODE_INVALID_APP_ID) {
                throw BusinessException.badRequest("微信手机号服务配置异常，请联系管理员");
            }
            throw BusinessException.badRequest("微信手机号服务暂不可用，请稍后重试");
        }

        WechatPhoneInfo phoneInfo = response.getPhoneInfo();
        if (phoneInfo == null) {
            throw BusinessException.badRequest("微信手机号服务暂不可用，请稍后重试");
        }

        String purePhoneNumber = trim(phoneInfo.getPurePhoneNumber());
        String phoneNumber = trim(phoneInfo.getPhoneNumber());
        String resolvedPhone = purePhoneNumber.isEmpty() ? phoneNumber : purePhoneNumber;
        if (resolvedPhone.isEmpty()) {
            throw BusinessException.badRequest("微信手机号服务暂不可用，请稍后重试");
        }
        return resolvedPhone;
    }

    private WechatPhoneNumberResponse requestPhoneNumber(String requestUrl, String code) {
        try {
            ResponseEntity<WechatPhoneNumberResponse> responseEntity = restTemplate.postForEntity(
                requestUrl,
                new WechatPhoneNumberRequest(code),
                WechatPhoneNumberResponse.class
            );
            if (!responseEntity.getStatusCode().is2xxSuccessful() || responseEntity.getBody() == null) {
                throw BusinessException.badRequest("微信手机号服务暂不可用，请稍后重试");
            }
            return responseEntity.getBody();
        } catch (RestClientException ex) {
            throw BusinessException.badRequest("微信手机号服务暂不可用，请稍后重试");
        }
    }

    private String buildMockPhoneNumber(String code) {
        String digitsOnly = code.replaceAll("\\D", "");
        String source = digitsOnly.isEmpty() ? String.valueOf(Math.abs(code.hashCode())) : digitsOnly;
        String suffix = source.length() >= 4 ? source.substring(source.length() - 4) : leftPad(source, 4);
        String prefix = mockPhoneNumberPrefix.length() >= 7
            ? mockPhoneNumberPrefix.substring(0, 7)
            : leftPad(mockPhoneNumberPrefix, 7);
        return prefix + suffix;
    }

    private String normalizeCode(String code) {
        String normalized = trim(code);
        if (normalized.isEmpty()) {
            throw BusinessException.badRequest("手机号授权码不能为空");
        }
        return normalized;
    }

    private static String leftPad(String value, int expectedLength) {
        StringBuilder builder = new StringBuilder();
        while (builder.length() + value.length() < expectedLength) {
            builder.append('0');
        }
        builder.append(value);
        return builder.toString();
    }

    private static void requireText(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException(message);
        }
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private static class WechatPhoneNumberRequest {

        @JsonProperty("code")
        private final String code;

        private WechatPhoneNumberRequest(String code) {
            this.code = code;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class WechatPhoneNumberResponse {

        @JsonProperty("errcode")
        private Integer errCode;

        @JsonProperty("phone_info")
        private WechatPhoneInfo phoneInfo;

        public Integer getErrCode() {
            return errCode;
        }

        public void setErrCode(Integer errCode) {
            this.errCode = errCode;
        }

        public WechatPhoneInfo getPhoneInfo() {
            return phoneInfo;
        }

        public void setPhoneInfo(WechatPhoneInfo phoneInfo) {
            this.phoneInfo = phoneInfo;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class WechatPhoneInfo {

        @JsonProperty("phoneNumber")
        private String phoneNumber;

        @JsonProperty("purePhoneNumber")
        private String purePhoneNumber;

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

        public String getPurePhoneNumber() {
            return purePhoneNumber;
        }

        public void setPurePhoneNumber(String purePhoneNumber) {
            this.purePhoneNumber = purePhoneNumber;
        }
    }
}
