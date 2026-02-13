package com.sunflower.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    @Test
    void shouldLoginBindPhoneAndPatchProfile() throws Exception {
        mockMvc
            .perform(
                post("/api/auth/wechat/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"code\":\"mvp_code\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.token").exists())
            .andExpect(jsonPath("$.data.openId").value("mock_openid_mvp_code"))
            .andExpect(jsonPath("$.data.profile.nickName").value("微信用户"));

        mockMvc
            .perform(
                post("/api/auth/bind-phone")
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
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"nickName\":\"葵花住客\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.nickName").value("葵花住客"));
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
        MvcResult createResult = mockMvc
            .perform(
                post("/api/orders")
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
            .perform(post("/api/orders/{id}/pay", orderId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        mockMvc
            .perform(post("/api/orders/{id}/cancel", orderId).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("CANCELLED"));

        mockMvc
            .perform(get("/api/orders/{id}", orderId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.id").value(orderId))
            .andExpect(jsonPath("$.data.statusLabel").value("已取消"));
    }
}
