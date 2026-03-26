package com.sunflower.backend.modules.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sunflower.backend.modules.admin.persistence.AdminSmsVerificationCodeEntity;
import com.sunflower.backend.modules.admin.persistence.AdminSmsVerificationCodeRepository;
import java.time.LocalDateTime;
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
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class AdminAuthIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FakeAdminSmsSender fakeAdminSmsSender;

    @Autowired
    private AdminSmsVerificationCodeRepository adminSmsVerificationCodeRepository;

    @Test
    void shouldRequireAllowlistedPhoneForActivateSmsCode() throws Exception {
        mockMvc
            .perform(
                post("/api/admin/auth/sms-code")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"13400000000\",\"purpose\":\"ACTIVATE\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.purpose").value("ACTIVATE"))
            .andExpect(jsonPath("$.data.expiresInSeconds").value(600));

        mockMvc
            .perform(
                post("/api/admin/auth/sms-code")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"13500000000\",\"purpose\":\"ACTIVATE\"}")
            )
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value(40100))
            .andExpect(jsonPath("$.message").value("该手机号未在后台激活白名单中"));
    }

    @Test
    void shouldActivateLogoutLoginResetAndChangePassword() throws Exception {
        String activateCode = requestSmsCode("13300000000", AdminSmsPurpose.ACTIVATE);

        String activateToken = readToken(
            mockMvc
                .perform(
                    post("/api/admin/auth/activate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                            "{"
                                + "\"phone\":\"13300000000\","
                                + "\"smsCode\":\""
                                + activateCode
                                + "\","
                                + "\"password\":\"Admin12345\""
                                + "}"
                        )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.account.role").value("ADMIN"))
                .andReturn()
        );

        mockMvc
            .perform(get("/api/admin/account/me").header("Authorization", bearerToken(activateToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.phone").value("13300000000"));

        mockMvc
            .perform(post("/api/admin/auth/logout").header("Authorization", bearerToken(activateToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0));

        mockMvc
            .perform(get("/api/admin/account/me").header("Authorization", bearerToken(activateToken)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("管理端登录态无效"));

        String loginToken = readToken(
            mockMvc
                .perform(
                    post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"13300000000\",\"password\":\"Admin12345\"}")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.account.role").value("ADMIN"))
                .andReturn()
        );

        String resetCode = requestSmsCode("13300000000", AdminSmsPurpose.RESET_PASSWORD);
        String resetToken = readToken(
            mockMvc
                .perform(
                    post("/api/admin/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                            "{"
                                + "\"phone\":\"13300000000\","
                                + "\"smsCode\":\""
                                + resetCode
                                + "\","
                                + "\"newPassword\":\"Admin23456\""
                                + "}"
                        )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.account.phone").value("13300000000"))
                .andReturn()
        );

        mockMvc
            .perform(get("/api/admin/account/me").header("Authorization", bearerToken(loginToken)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("管理端登录态无效"));

        String changedToken = readToken(
            mockMvc
                .perform(
                    post("/api/admin/account/change-password")
                        .header("Authorization", bearerToken(resetToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Admin23456\",\"newPassword\":\"Admin34567\"}")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.account.role").value("ADMIN"))
                .andReturn()
        );

        mockMvc
            .perform(get("/api/admin/account/me").header("Authorization", bearerToken(resetToken)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("管理端登录态无效"));

        mockMvc
            .perform(
                post("/api/admin/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"13300000000\",\"password\":\"Admin23456\"}")
            )
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("手机号或密码错误"));

        mockMvc
            .perform(get("/api/admin/account/me").header("Authorization", bearerToken(changedToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    @Test
    void shouldExpireAndInvalidateVerificationCode() throws Exception {
        String activateCode = requestSmsCode("13200000000", AdminSmsPurpose.ACTIVATE);
        AdminSmsVerificationCodeEntity codeEntity = adminSmsVerificationCodeRepository
            .findTopByPhoneAndPurposeOrderByIdDesc("13200000000", AdminSmsPurpose.ACTIVATE)
            .orElseThrow(() -> new IllegalStateException("缺少验证码记录"));
        codeEntity.setExpiresAt(LocalDateTime.now().minusSeconds(1));
        adminSmsVerificationCodeRepository.save(codeEntity);

        mockMvc
            .perform(
                post("/api/admin/auth/activate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{"
                            + "\"phone\":\"13200000000\","
                            + "\"smsCode\":\""
                            + activateCode
                            + "\","
                            + "\"password\":\"Admin12345\""
                            + "}"
                    )
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("验证码已过期，请重新获取"));

        requestSmsCode("13200000000", AdminSmsPurpose.ACTIVATE);
        for (int attempt = 1; attempt <= 5; attempt += 1) {
            String expectedMessage = attempt == 5 ? "验证码错误次数过多，请重新获取" : "验证码错误";
            mockMvc
                .perform(
                    post("/api/admin/auth/activate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                            "{"
                                + "\"phone\":\"13200000000\","
                                + "\"smsCode\":\"000000\","
                                + "\"password\":\"Admin12345\""
                                + "}"
                        )
                )
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(expectedMessage));
        }
    }

    @Test
    void shouldLockAccountAfterRepeatedFailedLogins() throws Exception {
        String activateCode = requestSmsCode("13100000000", AdminSmsPurpose.ACTIVATE);

        mockMvc
            .perform(
                post("/api/admin/auth/activate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{"
                            + "\"phone\":\"13100000000\","
                            + "\"smsCode\":\""
                            + activateCode
                            + "\","
                            + "\"password\":\"Admin12345\""
                            + "}"
                    )
            )
            .andExpect(status().isOk());

        for (int attempt = 1; attempt <= 5; attempt += 1) {
            String expectedMessage = attempt == 5 ? "密码连续错误次数过多，请 15 分钟后再试" : "手机号或密码错误";
            mockMvc
                .perform(
                    post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"13100000000\",\"password\":\"Wrong12345\"}")
                )
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(expectedMessage));
        }

        mockMvc
            .perform(
                post("/api/admin/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"13100000000\",\"password\":\"Admin12345\"}")
            )
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("密码连续错误次数过多，请 15 分钟后再试"));
    }

    @Test
    void shouldAllowOperatorToAccessExistingAdminBusinessApis() throws Exception {
        String activateCode = requestSmsCode("13900000000", AdminSmsPurpose.ACTIVATE);
        String operatorToken = readToken(
            mockMvc
                .perform(
                    post("/api/admin/auth/activate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                            "{"
                                + "\"phone\":\"13900000000\","
                                + "\"smsCode\":\""
                                + activateCode
                                + "\","
                                + "\"password\":\"Operator123\""
                                + "}"
                        )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.account.role").value("OPERATOR"))
                .andReturn()
        );

        mockMvc
            .perform(get("/api/admin/reports/summary").header("Authorization", bearerToken(operatorToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0));

        mockMvc
            .perform(get("/api/admin/rooms").header("Authorization", bearerToken(operatorToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()", greaterThanOrEqualTo(1)));
    }

    private String requestSmsCode(String phone, AdminSmsPurpose purpose) throws Exception {
        mockMvc
            .perform(
                post("/api/admin/auth/sms-code")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"" + phone + "\",\"purpose\":\"" + purpose.name() + "\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0));
        String latestCode = fakeAdminSmsSender.peekLatestCode(phone, purpose);
        assertEquals(6, latestCode.length());
        return latestCode;
    }

    private String readToken(MvcResult mvcResult) throws Exception {
        JsonNode body = objectMapper.readTree(mvcResult.getResponse().getContentAsString());
        return body.path("data").path("token").asText();
    }

    private String bearerToken(String token) {
        return "Bearer " + token;
    }
}
