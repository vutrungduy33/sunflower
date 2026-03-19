package com.sunflower.backend.modules.auth;

import com.sunflower.backend.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class WechatPhoneNumberClientTests {

    @Test
    void shouldResolveMockPhoneNumberFromPhoneCode() {
        WechatPhoneNumberClient client = new WechatPhoneNumberClient(
            new RestTemplate(),
            mock(WechatAccessTokenClient.class),
            true,
            "https://api.weixin.qq.com/wxa/business/getuserphonenumber",
            "1880000"
        );

        assertEquals("18800001234", client.resolvePhoneNumber("wechat_phone_code_1234"));
    }

    @Test
    void shouldRejectInvalidWechatPhoneCode() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        WechatAccessTokenClient accessTokenClient = mock(WechatAccessTokenClient.class);
        when(accessTokenClient.getAccessToken()).thenReturn("stable_access_token");
        server
            .expect(
                requestTo("https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=stable_access_token")
            )
            .andExpect(method(HttpMethod.POST))
            .andExpect(content().json("{\"code\":\"expired_phone_code\"}"))
            .andRespond(withSuccess("{\"errcode\":40029,\"errmsg\":\"code invalid\"}", MediaType.TEXT_PLAIN));

        WechatPhoneNumberClient client = new WechatPhoneNumberClient(
            restTemplate,
            accessTokenClient,
            false,
            "https://api.weixin.qq.com/wxa/business/getuserphonenumber",
            "1880000"
        );

        BusinessException exception = assertThrows(
            BusinessException.class,
            () -> client.resolvePhoneNumber("expired_phone_code")
        );
        assertEquals("手机号授权已失效，请重新授权", exception.getMessage());
        server.verify();
    }

    @Test
    void shouldParseTextPlainWechatPhoneResponse() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        WechatAccessTokenClient accessTokenClient = mock(WechatAccessTokenClient.class);
        when(accessTokenClient.getAccessToken()).thenReturn("stable_access_token");
        server
            .expect(
                requestTo("https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=stable_access_token")
            )
            .andExpect(method(HttpMethod.POST))
            .andExpect(content().json("{\"code\":\"fresh_phone_code\"}"))
            .andRespond(
                withSuccess(
                    "{\"phone_info\":{\"phoneNumber\":\"+86 13800138000\",\"purePhoneNumber\":\"13800138000\"}}",
                    MediaType.TEXT_PLAIN
                )
            );

        WechatPhoneNumberClient client = new WechatPhoneNumberClient(
            restTemplate,
            accessTokenClient,
            false,
            "https://api.weixin.qq.com/wxa/business/getuserphonenumber",
            "1880000"
        );

        assertEquals("13800138000", client.resolvePhoneNumber("fresh_phone_code"));
        server.verify();
    }
}
