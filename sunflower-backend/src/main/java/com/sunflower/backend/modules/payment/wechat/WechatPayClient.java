package com.sunflower.backend.modules.payment.wechat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriUtils;

@Component
public class WechatPayClient {

    private static final ZoneId SHANGHAI_ZONE = ZoneId.of("Asia/Shanghai");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final WechatPayProperties properties;
    private final WechatPayCryptoSupport cryptoSupport;

    public WechatPayClient(
        RestTemplateBuilder restTemplateBuilder,
        ObjectMapper objectMapper,
        WechatPayProperties properties,
        WechatPayCryptoSupport cryptoSupport
    ) {
        this.restTemplate =
            restTemplateBuilder
                .setConnectTimeout(java.time.Duration.ofMillis(properties.getConnectTimeoutMillis()))
                .setReadTimeout(java.time.Duration.ofMillis(properties.getReadTimeoutMillis()))
                .build();
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.cryptoSupport = cryptoSupport;
    }

    public CreateOrderResult createJsapiOrder(
        String outTradeNo,
        int amountFen,
        String payerOpenId,
        String description,
        LocalDateTime expiresAt
    ) {
        if (properties.isMockEnabled()) {
            return new CreateOrderResult(
                "mock_prepay_" + outTradeNo,
                writeJson(buildMockRequest(outTradeNo, amountFen, payerOpenId, description)),
                "{\"prepay_id\":\"mock_prepay_" + outTradeNo + "\"}",
                expiresAt
            );
        }

        ObjectNode body = objectMapper.createObjectNode();
        body.put("appid", properties.getAppId());
        body.put("mchid", properties.getMchId());
        body.put("description", description);
        body.put("out_trade_no", outTradeNo);
        body.put("notify_url", properties.getPaymentNotifyUrl());
        body.put("time_expire", expiresAt.atZone(SHANGHAI_ZONE).toOffsetDateTime().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        ObjectNode amountNode = body.putObject("amount");
        amountNode.put("total", amountFen);
        amountNode.put("currency", properties.getCurrency());
        body.putObject("payer").put("openid", payerOpenId);

        String requestSnapshot = writeJson(body);
        JsonNode response = exchangeJson(HttpMethod.POST, "/v3/pay/transactions/jsapi", requestSnapshot);
        String prepayId = response.path("prepay_id").asText("");
        if (!StringUtils.hasText(prepayId)) {
            throw new IllegalStateException("微信支付下单响应缺少 prepay_id");
        }
        return new CreateOrderResult(prepayId, requestSnapshot, writeJson(response), expiresAt);
    }

    public QueryOrderResult queryTransactionByOutTradeNo(String outTradeNo) {
        if (properties.isMockEnabled()) {
            return new QueryOrderResult("SUCCESS", "mock_transaction_" + outTradeNo, "", 0, "", writeJson(buildMockQueryResult(outTradeNo)));
        }
        String encodedOutTradeNo = UriUtils.encodePathSegment(outTradeNo, StandardCharsets.UTF_8);
        String path = "/v3/pay/transactions/out-trade-no/" + encodedOutTradeNo + "?mchid=" + UriUtils.encodeQueryParam(properties.getMchId(), StandardCharsets.UTF_8);
        JsonNode response = exchangeJson(HttpMethod.GET, path, "");
        return new QueryOrderResult(
            response.path("trade_state").asText(""),
            response.path("transaction_id").asText(""),
            response.path("trade_state_desc").asText(""),
            response.path("amount").path("total").asInt(0),
            response.path("payer").path("openid").asText(""),
            writeJson(response)
        );
    }

    public CreateRefundResult createRefund(String outTradeNo, String outRefundNo, int refundAmountFen, int totalAmountFen, String reason) {
        if (properties.isMockEnabled()) {
            return new CreateRefundResult(
                "mock_refund_" + outRefundNo,
                "PROCESSING",
                writeJson(buildMockRefundRequest(outTradeNo, outRefundNo, refundAmountFen, totalAmountFen, reason)),
                "{\"refund_id\":\"mock_refund_" + outRefundNo + "\",\"status\":\"PROCESSING\"}"
            );
        }
        ObjectNode body = objectMapper.createObjectNode();
        body.put("out_trade_no", outTradeNo);
        body.put("out_refund_no", outRefundNo);
        body.put("reason", reason);
        body.put("notify_url", properties.getRefundNotifyUrl());
        ObjectNode amountNode = body.putObject("amount");
        amountNode.put("refund", refundAmountFen);
        amountNode.put("total", totalAmountFen);
        amountNode.put("currency", properties.getCurrency());
        String requestSnapshot = writeJson(body);
        JsonNode response = exchangeJson(HttpMethod.POST, "/v3/refund/domestic/refunds", requestSnapshot);
        return new CreateRefundResult(
            response.path("refund_id").asText(""),
            response.path("status").asText(""),
            requestSnapshot,
            writeJson(response)
        );
    }

    public QueryRefundResult queryRefund(String outRefundNo) {
        if (properties.isMockEnabled()) {
            return new QueryRefundResult("mock_refund_" + outRefundNo, "SUCCESS", 0, 0, "", writeJson(buildMockRefundQueryResult(outRefundNo)));
        }
        String encodedOutRefundNo = UriUtils.encodePathSegment(outRefundNo, StandardCharsets.UTF_8);
        JsonNode response = exchangeJson(HttpMethod.GET, "/v3/refund/domestic/refunds/" + encodedOutRefundNo, "");
        return new QueryRefundResult(
            response.path("refund_id").asText(""),
            response.path("status").asText(""),
            response.path("amount").path("refund").asInt(0),
            response.path("amount").path("total").asInt(0),
            response.path("user_received_account").asText(""),
            writeJson(response)
        );
    }

    private JsonNode exchangeJson(HttpMethod method, String canonicalUrl, String body) {
        String normalizedBody = body == null ? "" : body;
        String nonce = UUID.randomUUID().toString().replace("-", "");
        long timestamp = OffsetDateTime.now(SHANGHAI_ZONE).toEpochSecond();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
        headers.set("Authorization", cryptoSupport.buildAuthorization(method.name(), canonicalUrl, normalizedBody, timestamp, nonce));
        headers.set("Wechatpay-Serial", properties.getMerchantSerialNo());
        headers.set("User-Agent", "sunflower-backend/s18");

        HttpEntity<String> entity = new HttpEntity<>(normalizedBody, headers);
        try {
            ResponseEntity<String> response = restTemplate.exchange(new URI(properties.getBaseUrl() + canonicalUrl), method, entity, String.class);
            return objectMapper.readTree(response.getBody() == null ? "{}" : response.getBody());
        } catch (RestClientResponseException ex) {
            throw new WechatPayGatewayException("微信支付网关请求失败", ex.getRawStatusCode(), ex.getResponseBodyAsString());
        } catch (URISyntaxException | java.io.IOException ex) {
            throw new IllegalStateException("微信支付网关响应解析失败", ex);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (java.io.IOException ex) {
            throw new IllegalStateException("序列化微信支付请求失败", ex);
        }
    }

    private ObjectNode buildMockRequest(String outTradeNo, int amountFen, String payerOpenId, String description) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("appid", properties.getAppId());
        body.put("mchid", properties.getMchId());
        body.put("out_trade_no", outTradeNo);
        body.put("description", description);
        body.putObject("amount").put("total", amountFen);
        body.putObject("payer").put("openid", payerOpenId);
        return body;
    }

    private ObjectNode buildMockQueryResult(String outTradeNo) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("out_trade_no", outTradeNo);
        body.put("trade_state", "SUCCESS");
        body.put("transaction_id", "mock_transaction_" + outTradeNo);
        return body;
    }

    private ObjectNode buildMockRefundRequest(String outTradeNo, String outRefundNo, int refundAmountFen, int totalAmountFen, String reason) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("out_trade_no", outTradeNo);
        body.put("out_refund_no", outRefundNo);
        body.put("reason", reason);
        body.putObject("amount").put("refund", refundAmountFen).put("total", totalAmountFen);
        return body;
    }

    private ObjectNode buildMockRefundQueryResult(String outRefundNo) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("out_refund_no", outRefundNo);
        body.put("refund_id", "mock_refund_" + outRefundNo);
        body.put("status", "SUCCESS");
        return body;
    }

    public static final class CreateOrderResult {

        private final String prepayId;
        private final String requestSnapshot;
        private final String responseSnapshot;
        private final LocalDateTime expiresAt;

        public CreateOrderResult(String prepayId, String requestSnapshot, String responseSnapshot, LocalDateTime expiresAt) {
            this.prepayId = prepayId;
            this.requestSnapshot = requestSnapshot;
            this.responseSnapshot = responseSnapshot;
            this.expiresAt = expiresAt;
        }

        public String getPrepayId() {
            return prepayId;
        }

        public String getRequestSnapshot() {
            return requestSnapshot;
        }

        public String getResponseSnapshot() {
            return responseSnapshot;
        }

        public LocalDateTime getExpiresAt() {
            return expiresAt;
        }
    }

    public static final class QueryOrderResult {

        private final String tradeState;
        private final String transactionId;
        private final String tradeStateDesc;
        private final int totalAmountFen;
        private final String payerOpenId;
        private final String responseSnapshot;

        public QueryOrderResult(
            String tradeState,
            String transactionId,
            String tradeStateDesc,
            int totalAmountFen,
            String payerOpenId,
            String responseSnapshot
        ) {
            this.tradeState = tradeState;
            this.transactionId = transactionId;
            this.tradeStateDesc = tradeStateDesc;
            this.totalAmountFen = totalAmountFen;
            this.payerOpenId = payerOpenId;
            this.responseSnapshot = responseSnapshot;
        }

        public String getTradeState() {
            return tradeState;
        }

        public String getTransactionId() {
            return transactionId;
        }

        public String getTradeStateDesc() {
            return tradeStateDesc;
        }

        public int getTotalAmountFen() {
            return totalAmountFen;
        }

        public String getPayerOpenId() {
            return payerOpenId;
        }

        public String getResponseSnapshot() {
            return responseSnapshot;
        }
    }

    public static final class CreateRefundResult {

        private final String refundId;
        private final String status;
        private final String requestSnapshot;
        private final String responseSnapshot;

        public CreateRefundResult(String refundId, String status, String requestSnapshot, String responseSnapshot) {
            this.refundId = refundId;
            this.status = status;
            this.requestSnapshot = requestSnapshot;
            this.responseSnapshot = responseSnapshot;
        }

        public String getRefundId() {
            return refundId;
        }

        public String getStatus() {
            return status;
        }

        public String getRequestSnapshot() {
            return requestSnapshot;
        }

        public String getResponseSnapshot() {
            return responseSnapshot;
        }
    }

    public static final class QueryRefundResult {

        private final String refundId;
        private final String status;
        private final int refundAmountFen;
        private final int totalAmountFen;
        private final String userReceivedAccount;
        private final String responseSnapshot;

        public QueryRefundResult(
            String refundId,
            String status,
            int refundAmountFen,
            int totalAmountFen,
            String userReceivedAccount,
            String responseSnapshot
        ) {
            this.refundId = refundId;
            this.status = status;
            this.refundAmountFen = refundAmountFen;
            this.totalAmountFen = totalAmountFen;
            this.userReceivedAccount = userReceivedAccount;
            this.responseSnapshot = responseSnapshot;
        }

        public String getRefundId() {
            return refundId;
        }

        public String getStatus() {
            return status;
        }

        public int getRefundAmountFen() {
            return refundAmountFen;
        }

        public int getTotalAmountFen() {
            return totalAmountFen;
        }

        public String getUserReceivedAccount() {
            return userReceivedAccount;
        }

        public String getResponseSnapshot() {
            return responseSnapshot;
        }
    }
}
