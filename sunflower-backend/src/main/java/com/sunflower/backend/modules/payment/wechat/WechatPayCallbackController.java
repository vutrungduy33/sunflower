package com.sunflower.backend.modules.payment.wechat;

import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/wechat")
public class WechatPayCallbackController {

    private final WechatPayCallbackService wechatPayCallbackService;

    public WechatPayCallbackController(WechatPayCallbackService wechatPayCallbackService) {
        this.wechatPayCallbackService = wechatPayCallbackService;
    }

    @PostMapping("/transactions/notify")
    public ResponseEntity<WechatNotifyAckResponse> handleTransactionNotify(@RequestBody String body, HttpServletRequest request) {
        WechatPayCallbackService.CallbackResult result = wechatPayCallbackService.handleTransactionNotify(
            WechatPayCallbackService.copyHeaders(request),
            body
        );
        return buildResponse(result);
    }

    @PostMapping("/refunds/notify")
    public ResponseEntity<WechatNotifyAckResponse> handleRefundNotify(@RequestBody String body, HttpServletRequest request) {
        WechatPayCallbackService.CallbackResult result = wechatPayCallbackService.handleRefundNotify(
            WechatPayCallbackService.copyHeaders(request),
            body
        );
        return buildResponse(result);
    }

    private ResponseEntity<WechatNotifyAckResponse> buildResponse(WechatPayCallbackService.CallbackResult result) {
        if (result.isSuccess()) {
            return ResponseEntity.ok(WechatNotifyAckResponse.success());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(WechatNotifyAckResponse.fail(result.getMessage()));
    }
}
