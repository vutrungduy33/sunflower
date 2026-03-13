package com.sunflower.backend.modules.order.admin;

import com.sunflower.backend.common.api.ApiResponse;
import com.sunflower.backend.modules.order.admin.dto.AdminOrderDto;
import com.sunflower.backend.modules.order.admin.dto.AdminOrderOverviewDto;
import com.sunflower.backend.modules.order.admin.dto.RejectAfterSaleRequest;
import com.sunflower.backend.modules.order.dto.RefundOrderRequest;
import com.sunflower.backend.modules.order.dto.RescheduleOrderRequest;
import java.util.List;
import javax.validation.Valid;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/admin")
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    public AdminOrderController(AdminOrderService adminOrderService) {
        this.adminOrderService = adminOrderService;
    }

    @GetMapping("/orders")
    public ApiResponse<List<AdminOrderDto>> getOrders(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String checkInStartDate,
        @RequestParam(required = false) String checkInEndDate
    ) {
        return ApiResponse.ok(adminOrderService.listOrders(status, keyword, checkInStartDate, checkInEndDate));
    }

    @GetMapping("/orders/{orderId}")
    public ApiResponse<AdminOrderDto> getOrderDetail(@PathVariable String orderId) {
        return ApiResponse.ok(adminOrderService.getOrderDetail(orderId));
    }

    @PostMapping("/orders/{orderId}/reschedule")
    public ApiResponse<AdminOrderDto> rescheduleOrder(
        @PathVariable String orderId,
        @Valid @RequestBody RescheduleOrderRequest request
    ) {
        return ApiResponse.ok(adminOrderService.rescheduleOrder(orderId, request));
    }

    @PostMapping("/orders/{orderId}/refund")
    public ApiResponse<AdminOrderDto> refundOrder(
        @PathVariable String orderId,
        @RequestBody(required = false) RefundOrderRequest request
    ) {
        return ApiResponse.ok(adminOrderService.refundOrder(orderId, request));
    }

    @PostMapping("/orders/{orderId}/after-sale/{requestId}/approve")
    public ApiResponse<AdminOrderDto> approveAfterSaleRequest(
        @PathVariable String orderId,
        @PathVariable Long requestId
    ) {
        return ApiResponse.ok(adminOrderService.approveAfterSaleRequest(orderId, requestId));
    }

    @PostMapping("/orders/{orderId}/after-sale/{requestId}/reject")
    public ApiResponse<AdminOrderDto> rejectAfterSaleRequest(
        @PathVariable String orderId,
        @PathVariable Long requestId,
        @RequestBody(required = false) RejectAfterSaleRequest request
    ) {
        return ApiResponse.ok(
            adminOrderService.rejectAfterSaleRequest(orderId, requestId, request == null ? "" : request.getRejectReason())
        );
    }

    @PostMapping("/orders/{orderId}/check-in")
    public ApiResponse<AdminOrderDto> checkInOrder(@PathVariable String orderId) {
        return ApiResponse.ok(adminOrderService.checkInOrder(orderId));
    }

    @PostMapping("/orders/{orderId}/check-out")
    public ApiResponse<AdminOrderDto> checkOutOrder(@PathVariable String orderId) {
        return ApiResponse.ok(adminOrderService.checkOutOrder(orderId));
    }

    @PostMapping("/orders/{orderId}/no-show")
    public ApiResponse<AdminOrderDto> noShowOrder(@PathVariable String orderId) {
        return ApiResponse.ok(adminOrderService.markNoShowOrder(orderId));
    }

    @GetMapping("/reports/summary")
    public ApiResponse<AdminOrderOverviewDto> getOrderOverview() {
        return ApiResponse.ok(adminOrderService.getOrderOverview());
    }
}
