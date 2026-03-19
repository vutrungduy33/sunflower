package com.sunflower.backend.modules.auth;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class WechatAccessTokenClientTests {

    @Test
    void shouldReuseCachedStableAccessToken() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        server
            .expect(ExpectedCount.once(), requestTo("https://api.weixin.qq.com/cgi-bin/stable_token"))
            .andExpect(method(HttpMethod.POST))
            .andRespond(
                withSuccess(
                    "{\"access_token\":\"stable_access_token\",\"expires_in\":7200}",
                    MediaType.APPLICATION_JSON
                )
            );

        WechatAccessTokenClient client = new WechatAccessTokenClient(
            restTemplate,
            false,
            "wx_app_id",
            "wx_app_secret",
            "https://api.weixin.qq.com/cgi-bin/stable_token"
        );

        assertEquals("stable_access_token", client.getAccessToken());
        assertEquals("stable_access_token", client.getAccessToken());
        server.verify();
    }

    @Test
    void shouldReturnMockAccessTokenWhenMockEnabled() {
        WechatAccessTokenClient client = new WechatAccessTokenClient(
            new RestTemplate(),
            true,
            "",
            "",
            "https://api.weixin.qq.com/cgi-bin/stable_token"
        );

        assertEquals("mock_wechat_access_token", client.getAccessToken());
    }

    @Test
    void shouldRequireWechatCredentialsWhenMockDisabled() {
        assertThrows(
            IllegalStateException.class,
            () -> new WechatAccessTokenClient(
                new RestTemplate(),
                false,
                "",
                "",
                "https://api.weixin.qq.com/cgi-bin/stable_token"
            )
        );
    }
}
