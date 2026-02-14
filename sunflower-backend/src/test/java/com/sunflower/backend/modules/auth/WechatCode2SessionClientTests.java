package com.sunflower.backend.modules.auth;

import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;

import static org.junit.jupiter.api.Assertions.assertEquals;

class WechatCode2SessionClientTests {

    private static final String JSCODE2SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session";
    private static final String MOCK_OPENID_PREFIX = "mock_openid_";

    private final RestTemplateBuilder restTemplateBuilder = new RestTemplateBuilder();

    @Test
    void shouldUseCodeBasedOpenIdWhenMockFixedOpenIdIsEmpty() {
        WechatCode2SessionClient client = new WechatCode2SessionClient(
            restTemplateBuilder,
            true,
            "",
            "",
            JSCODE2SESSION_URL,
            "   ",
            MOCK_OPENID_PREFIX
        );

        assertEquals("mock_openid_login_code", client.resolveOpenId(" login_code "));
    }

    @Test
    void shouldUseFixedOpenIdWhenMockFixedOpenIdConfigured() {
        WechatCode2SessionClient client = new WechatCode2SessionClient(
            restTemplateBuilder,
            true,
            "",
            "",
            JSCODE2SESSION_URL,
            " mock_openid_fixed_user ",
            MOCK_OPENID_PREFIX
        );

        assertEquals("mock_openid_fixed_user", client.resolveOpenId("another_code"));
    }
}
