package com.sunflower.backend.modules.auth;

import com.sunflower.backend.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

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

    @Test
    void shouldParseTextPlainWechatLoginResponse() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        server
            .expect(
                requestTo(
                    "https://api.weixin.qq.com/sns/jscode2session?appid=wx_app_id&secret=wx_app_secret&js_code=login_code&grant_type=authorization_code"
                )
            )
            .andExpect(method(HttpMethod.GET))
            .andRespond(withSuccess("{\"openid\":\"real_openid\"}", MediaType.TEXT_PLAIN));

        WechatCode2SessionClient client = new WechatCode2SessionClient(
            restTemplate,
            false,
            "wx_app_id",
            "wx_app_secret",
            JSCODE2SESSION_URL,
            "",
            MOCK_OPENID_PREFIX
        );

        assertEquals("real_openid", client.resolveOpenId("login_code"));
        server.verify();
    }

    @Test
    void shouldMapInvalidWechatLoginCodeFromTextPlainResponse() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        server
            .expect(
                requestTo(
                    "https://api.weixin.qq.com/sns/jscode2session?appid=wx_app_id&secret=wx_app_secret&js_code=expired_code&grant_type=authorization_code"
                )
            )
            .andExpect(method(HttpMethod.GET))
            .andRespond(withSuccess("{\"errcode\":40029,\"errmsg\":\"invalid code\"}", MediaType.TEXT_PLAIN));

        WechatCode2SessionClient client = new WechatCode2SessionClient(
            restTemplate,
            false,
            "wx_app_id",
            "wx_app_secret",
            JSCODE2SESSION_URL,
            "",
            MOCK_OPENID_PREFIX
        );

        BusinessException exception = assertThrows(
            BusinessException.class,
            () -> client.resolveOpenId("expired_code")
        );
        assertEquals("微信登录凭证无效，请重新登录", exception.getMessage());
        server.verify();
    }
}
