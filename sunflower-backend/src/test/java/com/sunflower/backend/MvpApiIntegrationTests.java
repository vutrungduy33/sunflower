package com.sunflower.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sunflower.backend.modules.auth.AuthTokenService;
import com.sunflower.backend.modules.room.persistence.RoomInventoryEntity;
import com.sunflower.backend.modules.room.persistence.RoomInventoryRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
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
import static org.junit.jupiter.api.Assertions.assertTrue;
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

    @Autowired
    private RoomInventoryRepository roomInventoryRepository;

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
    void shouldBindPhoneByWechatPhoneCode() throws Exception {
        String token = loginAndGetToken("wechat_bind_phone_code_case");

        mockMvc
            .perform(
                post("/api/auth/bind-phone")
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phoneCode\":\"wechat_phone_code_1234\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.phone").value("18800001234"))
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
    void shouldRequireAdminTokenForAdminRoomApis() throws Exception {
        mockMvc
            .perform(get("/api/admin/rooms"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value(40100))
            .andExpect(jsonPath("$.message").value("请先登录管理端"));

        mockMvc
            .perform(
                post("/api/admin/rooms")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(buildCreateAdminRoomPayload())
            )
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value(40100))
            .andExpect(jsonPath("$.message").value("请先登录管理端"));

        mockMvc
            .perform(
                post("/api/admin/rooms")
                    .header("Authorization", bearerToken("wrong-admin-token"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(buildCreateAdminRoomPayload())
            )
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value(40100))
            .andExpect(jsonPath("$.message").value("管理端登录态无效"));
    }

    @Test
    void shouldCreateUpdateRoomAndManagePriceInventory() throws Exception {
        String adminAuthorization = adminAuthorization();
        MvcResult createResult = mockMvc
            .perform(
                post("/api/admin/rooms")
                    .header("Authorization", adminAuthorization)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(buildCreateAdminRoomPayload())
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.id").exists())
            .andExpect(jsonPath("$.data.name").value("云顶湖景套房"))
            .andExpect(jsonPath("$.data.status").value("ACTIVE"))
            .andReturn();

        JsonNode createBody = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String roomId = createBody.path("data").path("id").asText();

        MvcResult listResult = mockMvc
            .perform(get("/api/admin/rooms").header("Authorization", adminAuthorization))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andReturn();

        JsonNode listBody = objectMapper.readTree(listResult.getResponse().getContentAsString()).path("data");
        assertTrue(listBody.isArray());
        boolean containsActiveRoom = false;
        for (JsonNode node : listBody) {
            if (roomId.equals(node.path("id").asText()) && "ACTIVE".equals(node.path("status").asText())) {
                containsActiveRoom = true;
                break;
            }
        }
        assertTrue(containsActiveRoom);

        mockMvc
            .perform(
                patch("/api/admin/rooms/{roomId}", roomId)
                    .header("Authorization", adminAuthorization)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"云顶湖景家庭套房\",\"basePrice\":699}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.id").value(roomId))
            .andExpect(jsonPath("$.data.name").value("云顶湖景家庭套房"))
            .andExpect(jsonPath("$.data.basePrice").value(699));

        mockMvc
            .perform(
                post("/api/admin/room-prices")
                    .header("Authorization", adminAuthorization)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{"
                            + "\"roomId\":\""
                            + roomId
                            + "\","
                            + "\"items\":["
                            + "{\"date\":\"2026-02-20\",\"price\":699},"
                            + "{\"date\":\"2026-02-21\",\"price\":799,\"source\":\"weekend\"}"
                            + "]"
                            + "}"
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.roomId").value(roomId))
            .andExpect(jsonPath("$.data.updatedCount").value(2))
            .andExpect(jsonPath("$.data.items[0].source").value("MANUAL"))
            .andExpect(jsonPath("$.data.items[1].source").value("WEEKEND"));

        mockMvc
            .perform(
                post("/api/admin/room-inventory")
                    .header("Authorization", adminAuthorization)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{"
                            + "\"roomId\":\""
                            + roomId
                            + "\","
                            + "\"items\":["
                            + "{\"date\":\"2026-02-20\",\"totalStock\":2},"
                            + "{\"date\":\"2026-02-21\",\"totalStock\":1}"
                            + "]"
                            + "}"
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.updatedCount").value(2))
            .andExpect(jsonPath("$.data.items[0].availableStock").value(2))
            .andExpect(jsonPath("$.data.items[1].availableStock").value(1));

        mockMvc
            .perform(get("/api/rooms/{roomId}", roomId).param("checkInDate", "2026-02-20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.id").value(roomId))
            .andExpect(jsonPath("$.data.name").value("云顶湖景家庭套房"))
            .andExpect(jsonPath("$.data.calendar[0].price").value(699))
            .andExpect(jsonPath("$.data.calendar[0].stock").value(2));

        mockMvc
            .perform(
                patch("/api/admin/rooms/{roomId}", roomId)
                    .header("Authorization", adminAuthorization)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"INACTIVE\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("INACTIVE"));

        MvcResult inactiveListResult = mockMvc
            .perform(get("/api/admin/rooms").header("Authorization", adminAuthorization))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andReturn();

        JsonNode inactiveListBody = objectMapper
            .readTree(inactiveListResult.getResponse().getContentAsString())
            .path("data");
        boolean containsInactiveRoom = false;
        for (JsonNode node : inactiveListBody) {
            if (roomId.equals(node.path("id").asText()) && "INACTIVE".equals(node.path("status").asText())) {
                containsInactiveRoom = true;
                break;
            }
        }
        assertTrue(containsInactiveRoom);

        mockMvc
            .perform(get("/api/rooms").param("keyword", roomId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.length()").value(0));

        mockMvc
            .perform(get("/api/rooms/{roomId}", roomId).param("checkInDate", "2026-02-20"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value(40400))
            .andExpect(jsonPath("$.message").value("房型不存在"));
    }

    @Test
    void shouldRejectInvalidAdminParamsAndInventoryConflicts() throws Exception {
        String adminAuthorization = adminAuthorization();

        mockMvc
            .perform(
                post("/api/admin/rooms")
                    .header("Authorization", adminAuthorization)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(buildInvalidAdminRoomPayload())
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value(40001))
            .andExpect(jsonPath("$.message").value("房型名称不能为空"));

        mockMvc
            .perform(
                post("/api/admin/room-prices")
                    .header("Authorization", adminAuthorization)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{"
                            + "\"roomId\":\"room-lake-101\","
                            + "\"items\":["
                            + "{\"date\":\"2026-02-20\",\"price\":688},"
                            + "{\"date\":\"2026-02-20\",\"price\":699}"
                            + "]"
                            + "}"
                    )
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value(40000))
            .andExpect(jsonPath("$.message").value("date 不能重复"));

        mockMvc
            .perform(
                post("/api/admin/room-inventory")
                    .header("Authorization", adminAuthorization)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{"
                            + "\"roomId\":\"room-lake-101\","
                            + "\"items\":["
                            + "{\"date\":\"2026-02-13\",\"totalStock\":0}"
                            + "]"
                            + "}"
                    )
            )
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value(40900))
            .andExpect(jsonPath("$.message").value("目标库存不能小于已锁定库存"));
    }

    @Test
    void shouldRequireAdminTokenForAdminOrderApis() throws Exception {
        mockMvc
            .perform(get("/api/admin/orders"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value(40100))
            .andExpect(jsonPath("$.message").value("请先登录管理端"));

        mockMvc
            .perform(get("/api/admin/reports/summary").header("Authorization", bearerToken("wrong-admin-token")))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value(40100))
            .andExpect(jsonPath("$.message").value("管理端登录态无效"));
    }

    @Test
    void shouldListFilterAndDetailAdminOrders() throws Exception {
        String adminAuthorization = adminAuthorization();
        setInventory("room-lake-101", LocalDate.parse("2026-02-12"), 5, 5, 0);
        setInventory("room-loft-301", LocalDate.parse("2026-03-12"), 5, 5, 0);

        String confirmedToken = loginAndGetToken("admin_order_filter_confirmed");
        JsonNode confirmedOrder = createOrder(
            confirmedToken,
            buildCreateOrderPayload(
                "room-lake-101",
                "2026-02-12",
                "2026-02-13",
                "后台筛选住客A",
                "13800000001",
                "后台筛选-已确认"
            )
        );
        String confirmedOrderId = confirmedOrder.path("id").asText();
        String confirmedOrderNo = confirmedOrder.path("orderNo").asText();
        mockMvc
            .perform(post("/api/orders/{id}/pay", confirmedOrderId).header("Authorization", bearerToken(confirmedToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        String pendingToken = loginAndGetToken("admin_order_filter_pending");
        JsonNode pendingOrder = createOrder(
            pendingToken,
            buildCreateOrderPayload(
                "room-loft-301",
                "2026-03-12",
                "2026-03-13",
                "后台筛选住客B",
                "13800000002",
                "后台筛选-待支付"
            )
        );
        String pendingOrderId = pendingOrder.path("id").asText();

        mockMvc
            .perform(get("/api/admin/orders").header("Authorization", adminAuthorization).param("status", "CONFIRMED"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.length()", greaterThanOrEqualTo(1)))
            .andExpect(jsonPath("$.data[0].id").value(confirmedOrderId))
            .andExpect(jsonPath("$.data[0].guestName").value("后台筛选住客A"));

        mockMvc
            .perform(get("/api/admin/orders").header("Authorization", adminAuthorization).param("keyword", confirmedOrderNo))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].id").value(confirmedOrderId));

        mockMvc
            .perform(
                get("/api/admin/orders")
                    .header("Authorization", adminAuthorization)
                    .param("checkInStartDate", "2026-03-12")
                    .param("checkInEndDate", "2026-03-12")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].id").value(pendingOrderId));

        mockMvc
            .perform(get("/api/admin/orders/{id}", confirmedOrderId).header("Authorization", adminAuthorization))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.id").value(confirmedOrderId))
            .andExpect(jsonPath("$.data.orderNo").value(confirmedOrderNo))
            .andExpect(jsonPath("$.data.userId").exists())
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
            .andExpect(jsonPath("$.data.guestName").value("后台筛选住客A"));

        mockMvc
            .perform(get("/api/admin/orders").header("Authorization", adminAuthorization).param("status", "UNKNOWN"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value(40000))
            .andExpect(
                jsonPath("$.message").value(
                    "status 仅支持 PENDING_PAYMENT, CONFIRMED, CHECKED_IN, RESCHEDULED, REFUNDED, COMPLETED, CANCELLED, NO_SHOW"
                )
            );
    }

    @Test
    void shouldManageAfterSaleAndBuildAdminOrderOverview() throws Exception {
        String adminAuthorization = adminAuthorization();
        JsonNode overviewBefore = getAdminOrderOverview(adminAuthorization);
        setInventory("room-lake-101", LocalDate.parse("2026-02-12"), 5, 5, 0);
        setInventory("room-lake-101", LocalDate.parse("2026-02-13"), 5, 5, 0);
        setInventory("room-lake-101", LocalDate.parse("2026-02-14"), 5, 5, 0);
        setInventory("room-lake-101", LocalDate.parse("2026-02-15"), 5, 5, 0);

        String tokenA = loginAndGetToken("admin_after_sale_a");
        JsonNode orderA = createOrder(
            tokenA,
            buildCreateOrderPayload(
                "room-lake-101",
                "2026-02-12",
                "2026-02-13",
                "后台售后住客A",
                "13800000011",
                "后台改期单"
            )
        );
        String orderAId = orderA.path("id").asText();
        int orderAAmount = orderA.path("totalAmount").asInt();
        mockMvc
            .perform(post("/api/orders/{id}/pay", orderAId).header("Authorization", bearerToken(tokenA)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        String tokenB = loginAndGetToken("admin_after_sale_b");
        JsonNode orderB = createOrder(
            tokenB,
            buildCreateOrderPayload(
                "room-lake-101",
                "2026-02-13",
                "2026-02-14",
                "后台售后住客B",
                "13800000012",
                "后台退款单"
            )
        );
        String orderBId = orderB.path("id").asText();
        mockMvc
            .perform(post("/api/orders/{id}/pay", orderBId).header("Authorization", bearerToken(tokenB)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        String tokenC = loginAndGetToken("admin_after_sale_c");
        JsonNode orderC = createOrder(
            tokenC,
            buildCreateOrderPayload(
                "room-lake-101",
                "2026-02-14",
                "2026-02-15",
                "后台售后住客C",
                "13800000013",
                "后台概览确认单"
            )
        );
        String orderCId = orderC.path("id").asText();
        int orderCAmount = orderC.path("totalAmount").asInt();
        mockMvc
            .perform(post("/api/orders/{id}/pay", orderCId).header("Authorization", bearerToken(tokenC)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        mockMvc
            .perform(
                post("/api/admin/orders/{id}/reschedule", orderAId)
                    .header("Authorization", adminAuthorization)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{"
                            + "\"checkInDate\":\"2026-02-15\","
                            + "\"checkOutDate\":\"2026-02-16\","
                            + "\"reason\":\"后台人工协调档期\""
                            + "}"
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.id").value(orderAId))
            .andExpect(jsonPath("$.data.status").value("RESCHEDULED"))
            .andExpect(jsonPath("$.data.checkInDate").value("2026-02-15"))
            .andExpect(jsonPath("$.data.afterSaleReason").value("后台人工协调档期"));

        mockMvc
            .perform(
                post("/api/admin/orders/{id}/refund", orderBId)
                    .header("Authorization", adminAuthorization)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reason\":\"后台审核同意退款\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.id").value(orderBId))
            .andExpect(jsonPath("$.data.status").value("REFUNDED"))
            .andExpect(jsonPath("$.data.afterSaleReason").value("后台审核同意退款"));

        RoomInventoryEntity rescheduledOldDate = getInventory("room-lake-101", LocalDate.parse("2026-02-12"));
        RoomInventoryEntity rescheduledNewDate = getInventory("room-lake-101", LocalDate.parse("2026-02-15"));
        RoomInventoryEntity refundedDate = getInventory("room-lake-101", LocalDate.parse("2026-02-13"));
        assertEquals(5, rescheduledOldDate.getAvailableStock());
        assertEquals(0, rescheduledOldDate.getLockedStock());
        assertEquals(4, rescheduledNewDate.getAvailableStock());
        assertEquals(1, rescheduledNewDate.getLockedStock());
        assertEquals(5, refundedDate.getAvailableStock());
        assertEquals(0, refundedDate.getLockedStock());

        mockMvc
            .perform(get("/api/admin/reports/summary").header("Authorization", adminAuthorization))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.orderCount").value(overviewBefore.path("orderCount").asInt() + 3))
            .andExpect(
                jsonPath("$.data.pendingCheckInCount").value(overviewBefore.path("pendingCheckInCount").asInt() + 2)
            )
            .andExpect(
                jsonPath("$.data.refundedOrderCount").value(overviewBefore.path("refundedOrderCount").asInt() + 1)
            )
            .andExpect(
                jsonPath("$.data.revenueAmount").value(overviewBefore.path("revenueAmount").asInt() + orderAAmount + orderCAmount)
            );
    }

    @Test
    void shouldCreateCancelAndQueryOrder() throws Exception {
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
            .andExpect(jsonPath("$.data.bookingStatus").value("PENDING_PAYMENT"))
            .andExpect(jsonPath("$.data.paymentStatus").value("UNPAID"))
            .andReturn();

        JsonNode createBody = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String orderId = createBody.path("data").path("id").asText();

        mockMvc
            .perform(
                post("/api/orders/{id}/cancel", orderId)
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("CANCELLED"))
            .andExpect(jsonPath("$.data.bookingStatus").value("CANCELLED"))
            .andExpect(jsonPath("$.data.paymentStatus").value("UNPAID"));

        mockMvc
            .perform(get("/api/orders/{id}", orderId).header("Authorization", bearerToken(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.id").value(orderId))
            .andExpect(jsonPath("$.data.bookingStatus").value("CANCELLED"))
            .andExpect(jsonPath("$.data.statusLabel").value("已取消"));
    }

    @Test
    void shouldRescheduleAndRefundConfirmedOrder() throws Exception {
        LocalDate firstCheckIn = LocalDate.parse("2026-02-12");
        LocalDate firstCheckOut = firstCheckIn.plusDays(2);
        LocalDate secondCheckIn = firstCheckIn.plusDays(2);
        LocalDate secondCheckOut = secondCheckIn.plusDays(2);
        String adminAuthorization = adminAuthorization();

        setInventory("room-lake-101", firstCheckIn, 3, 3, 0);
        setInventory("room-lake-101", firstCheckIn.plusDays(1), 3, 3, 0);
        setInventory("room-lake-101", secondCheckIn, 3, 3, 0);
        setInventory("room-lake-101", secondCheckIn.plusDays(1), 3, 3, 0);

        String token = loginAndGetToken("order_reschedule_refund");
        MvcResult createResult = mockMvc
            .perform(
                post("/api/orders")
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        buildCreateOrderPayload(
                            "room-lake-101",
                            firstCheckIn.toString(),
                            firstCheckOut.toString()
                        )
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andReturn();

        JsonNode createBody = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String orderId = createBody.path("data").path("id").asText();

        mockMvc
            .perform(post("/api/orders/{id}/pay", orderId).header("Authorization", bearerToken(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        MvcResult rescheduleRequestResult = mockMvc
            .perform(
                post("/api/orders/{id}/reschedule", orderId)
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{"
                            + "\"checkInDate\":\""
                            + secondCheckIn
                            + "\","
                            + "\"checkOutDate\":\""
                            + secondCheckOut
                            + "\","
                            + "\"reason\":\"行程调整\""
                            + "}"
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
            .andExpect(jsonPath("$.data.bookingStatus").value("CONFIRMED"))
            .andExpect(jsonPath("$.data.paymentStatus").value("PAID"))
            .andExpect(jsonPath("$.data.latestAfterSaleType").value("RESCHEDULE"))
            .andExpect(jsonPath("$.data.latestAfterSaleStatus").value("REQUESTED"))
            .andExpect(jsonPath("$.data.checkInDate").value(firstCheckIn.toString()))
            .andExpect(jsonPath("$.data.checkOutDate").value(firstCheckOut.toString()))
            .andReturn();

        JsonNode rescheduleRequestBody = objectMapper.readTree(rescheduleRequestResult.getResponse().getContentAsString());
        long rescheduleRequestId = rescheduleRequestBody.path("data").path("latestAfterSaleRequestId").asLong();

        RoomInventoryEntity oldDay1 = getInventory("room-lake-101", firstCheckIn);
        RoomInventoryEntity oldDay2 = getInventory("room-lake-101", firstCheckIn.plusDays(1));
        RoomInventoryEntity newDay1 = getInventory("room-lake-101", secondCheckIn);
        RoomInventoryEntity newDay2 = getInventory("room-lake-101", secondCheckIn.plusDays(1));
        assertEquals(2, oldDay1.getAvailableStock());
        assertEquals(1, oldDay1.getLockedStock());
        assertEquals(2, oldDay2.getAvailableStock());
        assertEquals(1, oldDay2.getLockedStock());
        assertEquals(3, newDay1.getAvailableStock());
        assertEquals(0, newDay1.getLockedStock());
        assertEquals(3, newDay2.getAvailableStock());
        assertEquals(0, newDay2.getLockedStock());

        mockMvc
            .perform(
                post("/api/admin/orders/{orderId}/after-sale/{requestId}/approve", orderId, rescheduleRequestId)
                    .header("Authorization", adminAuthorization)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("RESCHEDULED"))
            .andExpect(jsonPath("$.data.bookingStatus").value("CONFIRMED"))
            .andExpect(jsonPath("$.data.latestAfterSaleStatus").value("APPROVED"))
            .andExpect(jsonPath("$.data.rescheduleCount").value(1))
            .andExpect(jsonPath("$.data.checkInDate").value(secondCheckIn.toString()))
            .andExpect(jsonPath("$.data.checkOutDate").value(secondCheckOut.toString()));

        oldDay1 = getInventory("room-lake-101", firstCheckIn);
        oldDay2 = getInventory("room-lake-101", firstCheckIn.plusDays(1));
        newDay1 = getInventory("room-lake-101", secondCheckIn);
        newDay2 = getInventory("room-lake-101", secondCheckIn.plusDays(1));
        assertEquals(3, oldDay1.getAvailableStock());
        assertEquals(0, oldDay1.getLockedStock());
        assertEquals(3, oldDay2.getAvailableStock());
        assertEquals(0, oldDay2.getLockedStock());
        assertEquals(2, newDay1.getAvailableStock());
        assertEquals(1, newDay1.getLockedStock());
        assertEquals(2, newDay2.getAvailableStock());
        assertEquals(1, newDay2.getLockedStock());

        MvcResult refundRequestResult = mockMvc
            .perform(
                post("/api/orders/{id}/refund", orderId)
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reason\":\"临时取消行程\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
            .andExpect(jsonPath("$.data.bookingStatus").value("CONFIRMED"))
            .andExpect(jsonPath("$.data.paymentStatus").value("PAID"))
            .andExpect(jsonPath("$.data.latestAfterSaleType").value("REFUND"))
            .andExpect(jsonPath("$.data.latestAfterSaleStatus").value("REQUESTED"))
            .andReturn();

        JsonNode refundRequestBody = objectMapper.readTree(refundRequestResult.getResponse().getContentAsString());
        long refundRequestId = refundRequestBody.path("data").path("latestAfterSaleRequestId").asLong();

        newDay1 = getInventory("room-lake-101", secondCheckIn);
        newDay2 = getInventory("room-lake-101", secondCheckIn.plusDays(1));
        assertEquals(2, newDay1.getAvailableStock());
        assertEquals(1, newDay1.getLockedStock());
        assertEquals(2, newDay2.getAvailableStock());
        assertEquals(1, newDay2.getLockedStock());

        mockMvc
            .perform(
                post("/api/admin/orders/{orderId}/after-sale/{requestId}/approve", orderId, refundRequestId)
                    .header("Authorization", adminAuthorization)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("REFUNDED"))
            .andExpect(jsonPath("$.data.bookingStatus").value("CANCELLED"))
            .andExpect(jsonPath("$.data.paymentStatus").value("REFUNDED"))
            .andExpect(jsonPath("$.data.refundedAt").isNotEmpty());

        RoomInventoryEntity refundedDay1 = getInventory("room-lake-101", secondCheckIn);
        RoomInventoryEntity refundedDay2 = getInventory("room-lake-101", secondCheckIn.plusDays(1));
        assertEquals(3, refundedDay1.getAvailableStock());
        assertEquals(0, refundedDay1.getLockedStock());
        assertEquals(3, refundedDay2.getAvailableStock());
        assertEquals(0, refundedDay2.getLockedStock());

        mockMvc
            .perform(get("/api/orders/{id}", orderId).header("Authorization", bearerToken(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("REFUNDED"))
            .andExpect(jsonPath("$.data.latestAfterSaleStatus").value("APPROVED"))
            .andExpect(jsonPath("$.data.refundedAt").isNotEmpty());
    }

    @Test
    void shouldRescheduleWithOverlappedDateRange() throws Exception {
        LocalDate firstCheckIn = LocalDate.parse("2026-02-12");
        LocalDate firstCheckOut = firstCheckIn.plusDays(2);
        LocalDate secondCheckIn = firstCheckIn.plusDays(1);
        LocalDate secondCheckOut = secondCheckIn.plusDays(2);
        String adminAuthorization = adminAuthorization();

        setInventory("room-lake-101", firstCheckIn, 3, 3, 0);
        setInventory("room-lake-101", firstCheckIn.plusDays(1), 3, 3, 0);
        setInventory("room-lake-101", secondCheckIn.plusDays(1), 3, 3, 0);

        String token = loginAndGetToken("order_reschedule_overlap");
        MvcResult createResult = mockMvc
            .perform(
                post("/api/orders")
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        buildCreateOrderPayload(
                            "room-lake-101",
                            firstCheckIn.toString(),
                            firstCheckOut.toString()
                        )
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andReturn();

        JsonNode createBody = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String orderId = createBody.path("data").path("id").asText();

        mockMvc
            .perform(post("/api/orders/{id}/pay", orderId).header("Authorization", bearerToken(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        MvcResult rescheduleRequestResult = mockMvc
            .perform(
                post("/api/orders/{id}/reschedule", orderId)
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{"
                            + "\"checkInDate\":\""
                            + secondCheckIn
                            + "\","
                            + "\"checkOutDate\":\""
                            + secondCheckOut
                            + "\","
                            + "\"reason\":\"重叠区间改期\""
                            + "}"
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
            .andExpect(jsonPath("$.data.latestAfterSaleType").value("RESCHEDULE"))
            .andExpect(jsonPath("$.data.latestAfterSaleStatus").value("REQUESTED"))
            .andReturn();

        JsonNode rescheduleRequestBody = objectMapper.readTree(rescheduleRequestResult.getResponse().getContentAsString());
        long rescheduleRequestId = rescheduleRequestBody.path("data").path("latestAfterSaleRequestId").asLong();

        mockMvc
            .perform(
                post("/api/admin/orders/{orderId}/after-sale/{requestId}/approve", orderId, rescheduleRequestId)
                    .header("Authorization", adminAuthorization)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("RESCHEDULED"))
            .andExpect(jsonPath("$.data.checkInDate").value(secondCheckIn.toString()))
            .andExpect(jsonPath("$.data.checkOutDate").value(secondCheckOut.toString()));

        RoomInventoryEntity oldOnlyDate = getInventory("room-lake-101", firstCheckIn);
        RoomInventoryEntity overlapDate = getInventory("room-lake-101", secondCheckIn);
        RoomInventoryEntity newOnlyDate = getInventory("room-lake-101", secondCheckIn.plusDays(1));
        assertEquals(3, oldOnlyDate.getAvailableStock());
        assertEquals(0, oldOnlyDate.getLockedStock());
        assertEquals(2, overlapDate.getAvailableStock());
        assertEquals(1, overlapDate.getLockedStock());
        assertEquals(2, newOnlyDate.getAvailableStock());
        assertEquals(1, newOnlyDate.getLockedStock());
    }

    @Test
    void shouldRescheduleWhenOriginalLockAlreadyReleased() throws Exception {
        LocalDate firstCheckIn = LocalDate.parse("2026-02-12");
        LocalDate firstCheckOut = firstCheckIn.plusDays(2);
        LocalDate secondCheckIn = firstCheckIn.plusDays(2);
        LocalDate secondCheckOut = secondCheckIn.plusDays(2);
        String adminAuthorization = adminAuthorization();

        setInventory("room-lake-101", firstCheckIn, 3, 3, 0);
        setInventory("room-lake-101", firstCheckIn.plusDays(1), 3, 3, 0);
        setInventory("room-lake-101", secondCheckIn, 3, 3, 0);
        setInventory("room-lake-101", secondCheckIn.plusDays(1), 3, 3, 0);

        String token = loginAndGetToken("order_reschedule_released_lock");
        MvcResult createResult = mockMvc
            .perform(
                post("/api/orders")
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        buildCreateOrderPayload(
                            "room-lake-101",
                            firstCheckIn.toString(),
                            firstCheckOut.toString()
                        )
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andReturn();

        JsonNode createBody = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String orderId = createBody.path("data").path("id").asText();

        mockMvc
            .perform(post("/api/orders/{id}/pay", orderId).header("Authorization", bearerToken(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        // Simulate historical bad seed overwrite: order is confirmed but old dates are no longer locked.
        setInventory("room-lake-101", firstCheckIn, 3, 3, 0);
        setInventory("room-lake-101", firstCheckIn.plusDays(1), 3, 3, 0);

        MvcResult rescheduleRequestResult = mockMvc
            .perform(
                post("/api/orders/{id}/reschedule", orderId)
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{"
                            + "\"checkInDate\":\""
                            + secondCheckIn
                            + "\","
                            + "\"checkOutDate\":\""
                            + secondCheckOut
                            + "\","
                            + "\"reason\":\"库存已释放兼容\""
                            + "}"
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
            .andExpect(jsonPath("$.data.latestAfterSaleStatus").value("REQUESTED"))
            .andReturn();

        JsonNode rescheduleRequestBody = objectMapper.readTree(rescheduleRequestResult.getResponse().getContentAsString());
        long rescheduleRequestId = rescheduleRequestBody.path("data").path("latestAfterSaleRequestId").asLong();

        mockMvc
            .perform(
                post("/api/admin/orders/{orderId}/after-sale/{requestId}/approve", orderId, rescheduleRequestId)
                    .header("Authorization", adminAuthorization)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("RESCHEDULED"));

        RoomInventoryEntity oldDay1 = getInventory("room-lake-101", firstCheckIn);
        RoomInventoryEntity oldDay2 = getInventory("room-lake-101", firstCheckIn.plusDays(1));
        RoomInventoryEntity newDay1 = getInventory("room-lake-101", secondCheckIn);
        RoomInventoryEntity newDay2 = getInventory("room-lake-101", secondCheckIn.plusDays(1));
        assertEquals(3, oldDay1.getAvailableStock());
        assertEquals(0, oldDay1.getLockedStock());
        assertEquals(3, oldDay2.getAvailableStock());
        assertEquals(0, oldDay2.getLockedStock());
        assertEquals(2, newDay1.getAvailableStock());
        assertEquals(1, newDay1.getLockedStock());
        assertEquals(2, newDay2.getAvailableStock());
        assertEquals(1, newDay2.getLockedStock());
    }

    @Test
    void shouldRefundWhenOriginalLockAlreadyReleased() throws Exception {
        LocalDate checkIn = LocalDate.parse("2026-02-12");
        LocalDate checkOut = checkIn.plusDays(1);
        String adminAuthorization = adminAuthorization();

        setInventory("room-lake-101", checkIn, 3, 3, 0);

        String token = loginAndGetToken("order_refund_released_lock");
        MvcResult createResult = mockMvc
            .perform(
                post("/api/orders")
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        buildCreateOrderPayload(
                            "room-lake-101",
                            checkIn.toString(),
                            checkOut.toString()
                        )
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andReturn();

        JsonNode createBody = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String orderId = createBody.path("data").path("id").asText();

        mockMvc
            .perform(post("/api/orders/{id}/pay", orderId).header("Authorization", bearerToken(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        // Simulate historical bad seed overwrite: order is confirmed but date lock is gone.
        setInventory("room-lake-101", checkIn, 3, 3, 0);

        MvcResult refundRequestResult = mockMvc
            .perform(
                post("/api/orders/{id}/refund", orderId)
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reason\":\"库存已释放兼容\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
            .andExpect(jsonPath("$.data.latestAfterSaleStatus").value("REQUESTED"))
            .andReturn();

        JsonNode refundRequestBody = objectMapper.readTree(refundRequestResult.getResponse().getContentAsString());
        long refundRequestId = refundRequestBody.path("data").path("latestAfterSaleRequestId").asLong();

        mockMvc
            .perform(
                post("/api/admin/orders/{orderId}/after-sale/{requestId}/approve", orderId, refundRequestId)
                    .header("Authorization", adminAuthorization)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.status").value("REFUNDED"));

        RoomInventoryEntity refundedDay = getInventory("room-lake-101", checkIn);
        assertEquals(3, refundedDay.getAvailableStock());
        assertEquals(0, refundedDay.getLockedStock());
    }

    @Test
    void shouldRejectRefundWhenOrderNotPaid() throws Exception {
        String token = loginAndGetToken("order_refund_pending");

        MvcResult createResult = mockMvc
            .perform(
                post("/api/orders")
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(buildCreateOrderPayload("room-lake-101", "2026-02-12", "2026-02-13"))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andReturn();

        JsonNode createBody = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String orderId = createBody.path("data").path("id").asText();

        mockMvc
            .perform(
                post("/api/orders/{id}/refund", orderId)
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reason\":\"未入住\"}")
            )
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value(40900))
            .andExpect(jsonPath("$.message").value("当前订单状态不可退款"));
    }

    @Test
    void shouldRejectAfterSaleRequestAndKeepOrderConfirmed() throws Exception {
        LocalDate checkIn = LocalDate.parse("2026-02-12");
        LocalDate checkOut = checkIn.plusDays(1);
        String token = loginAndGetToken("order_after_sale_reject");
        String adminAuthorization = adminAuthorization();

        MvcResult createResult = mockMvc
            .perform(
                post("/api/orders")
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(buildCreateOrderPayload("room-lake-101", checkIn.toString(), checkOut.toString()))
            )
            .andExpect(status().isOk())
            .andReturn();

        JsonNode createBody = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String orderId = createBody.path("data").path("id").asText();

        mockMvc
            .perform(post("/api/orders/{id}/pay", orderId).header("Authorization", bearerToken(token)))
            .andExpect(status().isOk());

        MvcResult refundRequestResult = mockMvc
            .perform(
                post("/api/orders/{id}/refund", orderId)
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reason\":\"用户申请退款\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.latestAfterSaleStatus").value("REQUESTED"))
            .andReturn();

        JsonNode refundRequestBody = objectMapper.readTree(refundRequestResult.getResponse().getContentAsString());
        long refundRequestId = refundRequestBody.path("data").path("latestAfterSaleRequestId").asLong();

        mockMvc
            .perform(
                post("/api/admin/orders/{orderId}/after-sale/{requestId}/reject", orderId, refundRequestId)
                    .header("Authorization", adminAuthorization)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"rejectReason\":\"已超过当前房型退款时限\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
            .andExpect(jsonPath("$.data.bookingStatus").value("CONFIRMED"))
            .andExpect(jsonPath("$.data.latestAfterSaleStatus").value("REJECTED"))
            .andExpect(jsonPath("$.data.latestAfterSaleRejectReason").value("已超过当前房型退款时限"));
    }

    @Test
    void shouldCheckInCheckOutAndMarkNoShowByAdmin() throws Exception {
        LocalDate checkIn = LocalDate.parse("2026-02-12");
        LocalDate checkOut = checkIn.plusDays(1);
        String adminAuthorization = adminAuthorization();

        setInventory("room-lake-101", checkIn, 3, 3, 0);
        setInventory("room-lake-101", checkOut, 3, 3, 0);

        String stayToken = loginAndGetToken("order_check_in_out");
        String noShowToken = loginAndGetToken("order_no_show");

        JsonNode stayOrder = createOrder(
            stayToken,
            buildCreateOrderPayload("room-lake-101", checkIn.toString(), checkOut.toString())
        );
        String stayOrderId = stayOrder.path("id").asText();
        mockMvc.perform(post("/api/orders/{id}/pay", stayOrderId).header("Authorization", bearerToken(stayToken))).andExpect(status().isOk());

        mockMvc
            .perform(post("/api/admin/orders/{orderId}/check-in", stayOrderId).header("Authorization", adminAuthorization))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("CHECKED_IN"))
            .andExpect(jsonPath("$.data.bookingStatus").value("CHECKED_IN"))
            .andExpect(jsonPath("$.data.checkedInAt").isNotEmpty());

        mockMvc
            .perform(post("/api/admin/orders/{orderId}/check-out", stayOrderId).header("Authorization", adminAuthorization))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("COMPLETED"))
            .andExpect(jsonPath("$.data.bookingStatus").value("CHECKED_OUT"))
            .andExpect(jsonPath("$.data.checkedOutAt").isNotEmpty());

        JsonNode noShowOrder = createOrder(
            noShowToken,
            buildCreateOrderPayload("room-lake-101", checkIn.toString(), checkOut.toString())
        );
        String noShowOrderId = noShowOrder.path("id").asText();
        mockMvc
            .perform(post("/api/orders/{id}/pay", noShowOrderId).header("Authorization", bearerToken(noShowToken)))
            .andExpect(status().isOk());

        mockMvc
            .perform(post("/api/admin/orders/{orderId}/no-show", noShowOrderId).header("Authorization", adminAuthorization))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("NO_SHOW"))
            .andExpect(jsonPath("$.data.bookingStatus").value("NO_SHOW"))
            .andExpect(jsonPath("$.data.noShowAt").isNotEmpty());

        RoomInventoryEntity noShowDay = getInventory("room-lake-101", checkIn);
        assertEquals(2, noShowDay.getAvailableStock());
        assertEquals(1, noShowDay.getLockedStock());
    }

    @Test
    void shouldReuseMockUserAcrossDifferentLoginCodes() throws Exception {
        String firstToken = loginAndGetToken("first_login_code");

        MvcResult createResult = mockMvc
            .perform(
                post("/api/orders")
                    .header("Authorization", bearerToken(firstToken))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{"
                            + "\"roomId\":\"room-lake-101\","
                            + "\"checkInDate\":\"2026-02-12\","
                            + "\"checkOutDate\":\"2026-02-13\","
                            + "\"source\":\"direct\","
                            + "\"guestName\":\"张三\","
                            + "\"guestPhone\":\"13800000000\","
                            + "\"arrivalTime\":\"18:00\","
                            + "\"remark\":\"mock稳定账号验证\""
                            + "}"
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andReturn();

        JsonNode createBody = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String orderId = createBody.path("data").path("id").asText();

        String secondToken = loginAndGetToken("second_login_code");

        mockMvc
            .perform(get("/api/orders/{id}", orderId).header("Authorization", bearerToken(secondToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.id").value(orderId));
    }

    @Test
    void shouldRejectCreateOrderWhenInventoryInsufficient() throws Exception {
        LocalDate stayDate = LocalDate.parse("2026-02-13");
        setInventory("room-lake-101", stayDate, 3, 0, 3);

        String token = loginAndGetToken("order_stock_empty");
        mockMvc
            .perform(
                post("/api/orders")
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        buildCreateOrderPayload(
                            "room-lake-101",
                            stayDate.toString(),
                            stayDate.plusDays(1).toString()
                        )
                    )
            )
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value(40900))
            .andExpect(jsonPath("$.message").value("所选日期库存不足"));
    }

    @Test
    void shouldAllowOnlyOneOrderWhenConcurrentCreateOnSingleStock() throws Exception {
        LocalDate stayDate = LocalDate.parse("2026-02-15");
        setInventory("room-loft-301", stayDate, 1, 1, 0);

        String tokenA = loginAndGetToken("concurrent_order_a");
        String tokenB = loginAndGetToken("concurrent_order_b");
        String payload = buildCreateOrderPayload(
            "room-loft-301",
            stayDate.toString(),
            stayDate.plusDays(1).toString()
        );

        ExecutorService executorService = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        try {
            Future<MvcResult> futureA = submitCreateOrderTask(executorService, ready, start, tokenA, payload);
            Future<MvcResult> futureB = submitCreateOrderTask(executorService, ready, start, tokenB, payload);

            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();

            List<MvcResult> results = Arrays.asList(futureA.get(10, TimeUnit.SECONDS), futureB.get(10, TimeUnit.SECONDS));
            int successCount = 0;
            int conflictCount = 0;
            List<String> responseSnapshots = new ArrayList<>();
            for (MvcResult result : results) {
                JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
                int statusCode = result.getResponse().getStatus();
                int code = body.path("code").asInt();
                responseSnapshots.add(statusCode + ":" + body.toString());
                if (statusCode == 200 && code == 0) {
                    successCount++;
                } else if (statusCode == 409 && code == 40900) {
                    conflictCount++;
                }
            }

            assertEquals(1, successCount, "并发下单响应: " + responseSnapshots);
            assertEquals(1, conflictCount, "并发下单响应: " + responseSnapshots);
        } finally {
            executorService.shutdownNow();
        }

        RoomInventoryEntity inventory = getInventory("room-loft-301", stayDate);
        assertEquals(0, inventory.getAvailableStock());
        assertEquals(1, inventory.getLockedStock());
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
                post("/api/auth/bind-phone")
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}")
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value(40000))
            .andExpect(jsonPath("$.message").value("手机号授权码不能为空"));

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

    private Future<MvcResult> submitCreateOrderTask(
        ExecutorService executorService,
        CountDownLatch ready,
        CountDownLatch start,
        String token,
        String payload
    ) {
        return executorService.submit(() -> {
            ready.countDown();
            if (!start.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("并发测试启动超时");
            }
            return mockMvc
                .perform(
                    post("/api/orders")
                        .header("Authorization", bearerToken(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload)
                )
                .andReturn();
        });
    }

    private void setInventory(String roomId, LocalDate date, int totalStock, int availableStock, int lockedStock) {
        RoomInventoryEntity inventory = getInventory(roomId, date);
        inventory.setTotalStock(totalStock);
        inventory.setAvailableStock(availableStock);
        inventory.setLockedStock(lockedStock);
        roomInventoryRepository.save(inventory);
    }

    private RoomInventoryEntity getInventory(String roomId, LocalDate date) {
        return roomInventoryRepository
            .findByRoomIdAndBizDateBetweenOrderByBizDateAsc(roomId, date, date)
            .stream()
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("未找到库存种子数据: " + roomId + "@" + date));
    }

    private String buildCreateOrderPayload(String roomId, String checkInDate, String checkOutDate) {
        return buildCreateOrderPayload(
            roomId,
            checkInDate,
            checkOutDate,
            "并发住客",
            "13800000000",
            "库存测试"
        );
    }

    private String buildCreateOrderPayload(
        String roomId,
        String checkInDate,
        String checkOutDate,
        String guestName,
        String guestPhone,
        String remark
    ) {
        return "{"
            + "\"roomId\":\"" + roomId + "\","
            + "\"checkInDate\":\"" + checkInDate + "\","
            + "\"checkOutDate\":\"" + checkOutDate + "\","
            + "\"source\":\"direct\","
            + "\"guestName\":\"" + guestName + "\","
            + "\"guestPhone\":\"" + guestPhone + "\","
            + "\"arrivalTime\":\"18:00\","
            + "\"remark\":\"" + remark + "\""
            + "}";
    }

    private JsonNode createOrder(String token, String payload) throws Exception {
        MvcResult createResult = mockMvc
            .perform(
                post("/api/orders")
                    .header("Authorization", bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(payload)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andReturn();

        return objectMapper.readTree(createResult.getResponse().getContentAsString()).path("data");
    }

    private JsonNode getAdminOrderOverview(String adminAuthorization) throws Exception {
        MvcResult summaryResult = mockMvc
            .perform(get("/api/admin/reports/summary").header("Authorization", adminAuthorization))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andReturn();

        return objectMapper.readTree(summaryResult.getResponse().getContentAsString()).path("data");
    }

    private String buildCreateAdminRoomPayload() {
        return "{"
            + "\"name\":\"云顶湖景套房\","
            + "\"subtitle\":\"270 度观景露台 | 可住 4 人\","
            + "\"cover\":\"/assets/admin-room-cover.png\","
            + "\"capacity\":4,"
            + "\"area\":68,"
            + "\"bedType\":\"2m 大床 + 1.2m 沙发床\","
            + "\"scenicType\":\"湖景\","
            + "\"tags\":[\"新上架\",\"家庭出游\"],"
            + "\"basePrice\":688,"
            + "\"breakfast\":\"含 4 份早餐\","
            + "\"intro\":\"顶层景观套房，适合家庭和小团体入住。\","
            + "\"amenities\":[\"空调\",\"投影\",\"露台浴缸\"],"
            + "\"rules\":[\"14:00 后入住\",\"12:00 前退房\"],"
            + "\"canCancelBeforeHours\":24"
            + "}";
    }

    private String buildInvalidAdminRoomPayload() {
        return "{"
            + "\"name\":\"   \","
            + "\"subtitle\":\"test\","
            + "\"cover\":\"/assets/admin-room-cover.png\","
            + "\"capacity\":2,"
            + "\"area\":36,"
            + "\"bedType\":\"1.8m 大床\","
            + "\"scenicType\":\"湖景\","
            + "\"tags\":[],"
            + "\"basePrice\":388,"
            + "\"breakfast\":\"含早餐\","
            + "\"intro\":\"test\","
            + "\"amenities\":[],"
            + "\"rules\":[],"
            + "\"canCancelBeforeHours\":24"
            + "}";
    }

    private String adminAuthorization() {
        return bearerToken("test-admin-token");
    }

    private String bearerToken(String token) {
        return "Bearer " + token;
    }
}
