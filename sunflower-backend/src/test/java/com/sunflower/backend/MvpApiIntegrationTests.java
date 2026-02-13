package com.sunflower.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sunflower.backend.modules.auth.AuthTokenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class MvpApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthTokenService authTokenService;

    @Test
    void shouldLoginBindPhoneAndPatchProfile() throws Exception {
        MvcResult loginResult = mockMvc
            .perform(
                post("/api/auth/wechat/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"code\":\"mvp_code\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.token").exists())
            .andExpect(jsonPath("$.data.openId").value("mock_openid_mvp_code"))
            .andExpect(jsonPath("$.data.profile.nickName").value("微信用户"))
            .andReturn();

        JsonNode loginBody = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String token = loginBody.path("data").path("token").asText();

        mockMvc
            .perform(
                post("/api/auth/bind-phone")
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"13800000000\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.phone").value("13800000000"))
            .andExpect(jsonPath("$.data.isPhoneBound").value(true));

        mockMvc
            .perform(
                patch("/api/users/me")
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"nickName\":\"葵花住客\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.nickName").value("葵花住客"));

        mockMvc
            .perform(get("/api/users/me").header("Authorization", bearerToken(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.nickName").value("葵花住客"))
            .andExpect(jsonPath("$.data.isPhoneBound").value(true));
    }

    @Test
    void shouldListRoomsAndCalendar() throws Exception {
        mockMvc
            .perform(get("/api/rooms").param("checkInDate", "2026-02-12").param("keyword", "湖景"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.length()", greaterThanOrEqualTo(2)))
            .andExpect(jsonPath("$.data[0].todayPrice").isNumber());

        mockMvc
            .perform(get("/api/rooms/room-lake-101").param("checkInDate", "2026-02-12"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.id").value("room-lake-101"))
            .andExpect(jsonPath("$.data.calendar.length()").value(14));

        mockMvc
            .perform(
                get("/api/rooms/room-lake-101/calendar")
                    .param("startDate", "2026-02-12")
                    .param("days", "3")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.calendar.length()").value(3));
    }

    @Test
    void shouldRejectInvalidRoomDateParams() throws Exception {
        mockMvc
            .perform(get("/api/rooms").param("checkInDate", "2026/02/12"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value(40000))
            .andExpect(jsonPath("$.message").value("日期 格式必须是 yyyy-MM-dd"));

        mockMvc
            .perform(get("/api/rooms/room-lake-101/calendar").param("startDate", "bad-date"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value(40000))
            .andExpect(jsonPath("$.message").value("日期 格式必须是 yyyy-MM-dd"));

        mockMvc
            .perform(get("/api/rooms/room-lake-101/calendar").param("startDate", "2026-02-12").param("days", "0"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value(40000))
            .andExpect(jsonPath("$.message").value("days 范围必须在 1-31"));
    }

    @Test
    void shouldCreatePayCancelAndQueryOrder() throws Exception {
        String token = loginAndGetToken("order_flow_code");

        MvcResult createResult = mockMvc
            .perform(
                post("/api/orders")
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{"
                            + "\"roomId\":\"room-lake-101\","
                            + "\"checkInDate\":\"2026-02-12\","
                            + "\"checkOutDate\":\"2026-02-14\","
                            + "\"source\":\"direct\","
                            + "\"guestName\":\"张三\","
                            + "\"guestPhone\":\"13800000000\","
                            + "\"arrivalTime\":\"18:00\","
                            + "\"remark\":\"需要婴儿床\""
                            + "}"
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("PENDING_PAYMENT"))
            .andReturn();

        JsonNode createBody = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String orderId = createBody.path("data").path("id").asText();

        mockMvc
            .perform(post("/api/orders/{id}/pay", orderId).header("Authorization", bearerToken(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        mockMvc
            .perform(
                post("/api/orders/{id}/cancel", orderId)
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("CANCELLED"));

        mockMvc
            .perform(get("/api/orders/{id}", orderId).header("Authorization", bearerToken(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.id").value(orderId))
            .andExpect(jsonPath("$.data.statusLabel").value("已取消"));
    }

    @Test
    void shouldRejectInvalidAuthAndProfileParams() throws Exception {
        String token = loginAndGetToken("invalid_param_case");

        mockMvc
            .perform(
                post("/api/auth/wechat/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"code\":\"   \"}")
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value(40001))
            .andExpect(jsonPath("$.message").value("微信登录 code 不能为空"));

        mockMvc
            .perform(
                post("/api/auth/bind-phone")
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"12345\"}")
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value(40001))
            .andExpect(jsonPath("$.message").value("请输入正确的 11 位手机号"));

        mockMvc
            .perform(
                patch("/api/users/me")
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"nickName\":\"   \"}")
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value(40000))
            .andExpect(jsonPath("$.message").value("昵称不能为空"));
    }

    @Test
    void shouldHandleNonExistingUserByToken() throws Exception {
        String nonExistingUserToken = authTokenService.buildToken("user_not_exists");

        mockMvc
            .perform(get("/api/users/me").header("Authorization", bearerToken(nonExistingUserToken)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value(40100))
            .andExpect(jsonPath("$.message").value("登录态无效"));

        mockMvc
            .perform(
                post("/api/auth/bind-phone")
                    .header("Authorization", bearerToken(nonExistingUserToken))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"13800000000\"}")
            )
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value(40100))
            .andExpect(jsonPath("$.message").value("登录态无效"));
    }

    @Test
    void shouldRejectMissingTokenForCurrentUserApis() throws Exception {
        mockMvc
            .perform(get("/api/users/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value(40100))
            .andExpect(jsonPath("$.message").value("请先登录"));

        mockMvc
            .perform(
                post("/api/auth/bind-phone")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"13800000000\"}")
            )
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value(40100))
            .andExpect(jsonPath("$.message").value("请先登录"));

        mockMvc
            .perform(get("/api/orders"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value(40100))
            .andExpect(jsonPath("$.message").value("请先登录"));
    }

    @Test
    void shouldRejectInvalidTokenFormat() throws Exception {
        mockMvc
            .perform(get("/api/users/me").header("Authorization", "Bearer invalid_token_format"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value(40100))
            .andExpect(jsonPath("$.message").value("登录态无效"));

        mockMvc
            .perform(get("/api/users/me").header("Authorization", "Bearer mock_token_user_demo_1001"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value(40100))
            .andExpect(jsonPath("$.message").value("登录态无效"));
    }

    @Test
    void shouldRejectTamperedTokenSignature() throws Exception {
        String token = loginAndGetToken("tamper_case");
        String tampered = token + "x";

        mockMvc
            .perform(get("/api/users/me").header("Authorization", bearerToken(tampered)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value(40100))
            .andExpect(jsonPath("$.message").value("登录态无效"));
    }

    private String loginAndGetToken(String code) throws Exception {
        MvcResult loginResult = mockMvc
            .perform(
                post("/api/auth/wechat/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"code\":\"" + code + "\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.token").exists())
            .andReturn();

        JsonNode loginBody = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return loginBody.path("data").path("token").asText();
    }

    private String bearerToken(String token) {
        return "Bearer " + token;
    }
}
