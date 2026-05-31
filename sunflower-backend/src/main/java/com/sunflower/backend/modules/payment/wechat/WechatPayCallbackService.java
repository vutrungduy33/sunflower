package com.sunflower.backend.modules.payment.wechat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatNotifyEventEntity;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatNotifyEventRepository;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatNotifyEventStatus;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatNotifyEventType;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class WechatPayCallbackService {

    private static final ZoneId SHANGHAI_ZONE = ZoneId.of("Asia/Shanghai");

    private final WechatPayCryptoSupport cryptoSupport;
    private final WechatNotifyEventRepository notifyEventRepository;
    private final OrderPaymentService orderPaymentService;
    private final ObjectMapper objectMapper;

    public WechatPayCallbackService(
        WechatPayCryptoSupport cryptoSupport,
        WechatNotifyEventRepository notifyEventRepository,
        OrderPaymentService orderPaymentService,
        ObjectMapper objectMapper
    ) {
        this.cryptoSupport = cryptoSupport;
        this.notifyEventRepository = notifyEventRepository;
        this.orderPaymentService = orderPaymentService;
        this.objectMapper = objectMapper;
    }

    public CallbackResult handleTransactionNotify(Map<String, String> headers, String body) {
        return handleNotify(headers, body, WechatNotifyEventType.TRANSACTION);
    }

    public CallbackResult handleRefundNotify(Map<String, String> headers, String body) {
        return handleNotify(headers, body, WechatNotifyEventType.REFUND);
    }

    private CallbackResult handleNotify(Map<String, String> headers, String body, WechatNotifyEventType notifyType) {
        String serialNo = header(headers, "Wechatpay-Serial");
        String timestamp = header(headers, "Wechatpay-Timestamp");
        String nonce = header(headers, "Wechatpay-Nonce");
        String signature = header(headers, "Wechatpay-Signature");
        if (!cryptoSupport.verifySignature(serialNo, timestamp, nonce, body, signature)) {
            return CallbackResult.fail("微信回调验签失败");
        }

        JsonNode envelope = readJson(body);
        String notifyId = envelope.path("id").asText("");
        if (notifyId.isEmpty()) {
            return CallbackResult.fail("微信回调缺少通知 ID");
        }
        Optional<WechatNotifyEventEntity> existingNotifyEvent = notifyEventRepository.findByNotifyId(notifyId);
        if (existingNotifyEvent.isPresent() && existingNotifyEvent.get().getStatus() == WechatNotifyEventStatus.PROCESSED) {
            return CallbackResult.success();
        }

        WechatNotifyEventEntity notifyEvent = existingNotifyEvent.orElseGet(WechatNotifyEventEntity::new);
        notifyEvent.setNotifyId(notifyId);
        notifyEvent.setNotifyType(notifyType);
        notifyEvent.setResourceId(envelope.path("resource").path("id").asText(""));
        notifyEvent.setEventType(envelope.path("event_type").asText(""));
        notifyEvent.setSummary(envelope.path("summary").asText(""));
        notifyEvent.setStatus(WechatNotifyEventStatus.RECEIVED);
        notifyEvent.setRawHeaders(writeJson(headers));
        notifyEvent.setRawBody(body);
        notifyEvent.setDecryptedBody(null);
        notifyEvent.setProcessedAt(null);
        notifyEvent = notifyEventRepository.save(notifyEvent);

        try {
            JsonNode resource = envelope.path("resource");
            String decryptedBody = cryptoSupport.decryptResource(
                resource.path("associated_data").asText(""),
                resource.path("nonce").asText(""),
                resource.path("ciphertext").asText("")
            );
            notifyEvent.setDecryptedBody(decryptedBody);
            notifyEvent.setProcessedAt(LocalDateTime.now(SHANGHAI_ZONE));
            if (notifyType == WechatNotifyEventType.TRANSACTION) {
                orderPaymentService.handleTransactionNotification(decryptedBody);
            } else {
                orderPaymentService.handleRefundNotification(decryptedBody);
            }
            notifyEvent.setStatus(WechatNotifyEventStatus.PROCESSED);
            notifyEventRepository.save(notifyEvent);
            return CallbackResult.success();
        } catch (RuntimeException ex) {
            notifyEvent.setStatus(WechatNotifyEventStatus.FAILED);
            notifyEvent.setProcessedAt(LocalDateTime.now(SHANGHAI_ZONE));
            notifyEventRepository.save(notifyEvent);
            return CallbackResult.fail(ex.getMessage() == null ? "微信回调处理失败" : ex.getMessage());
        }
    }

    private JsonNode readJson(String value) {
        try {
            return objectMapper.readTree(value == null ? "{}" : value);
        } catch (java.io.IOException ex) {
            throw new IllegalArgumentException("微信回调报文格式错误", ex);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (java.io.IOException ex) {
            throw new IllegalStateException("序列化微信回调快照失败", ex);
        }
    }

    private String header(Map<String, String> headers, String name) {
        return Optional.ofNullable(headers.get(name))
            .orElseGet(() -> headers.entrySet().stream()
                .filter(entry -> entry.getKey() != null && entry.getKey().equalsIgnoreCase(name))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(""));
    }

    public static Map<String, String> copyHeaders(javax.servlet.http.HttpServletRequest request) {
        Map<String, String> headers = new LinkedHashMap<>();
        java.util.Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames != null && headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            headers.put(headerName, request.getHeader(headerName));
        }
        return headers;
    }

    public static final class CallbackResult {

        private final boolean success;
        private final String message;

        private CallbackResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public static CallbackResult success() {
            return new CallbackResult(true, "成功");
        }

        public static CallbackResult fail(String message) {
            return new CallbackResult(false, message);
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }
    }
}
