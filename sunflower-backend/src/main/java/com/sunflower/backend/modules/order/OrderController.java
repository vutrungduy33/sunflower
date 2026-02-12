package com.sunflower.backend.modules.order;

import com.sunflower.backend.common.api.ApiResponse;
import com.sunflower.backend.modules.order.dto.CancelOrderRequest;
import com.sunflower.backend.modules.order.dto.CreateOrderRequest;
import com.sunflower.backend.modules.order.dto.OrderDto;
import java.util.List;
import javax.validation.Valid;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ApiResponse<OrderDto> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return ApiResponse.ok(orderService.createOrder(request));
    }

    @GetMapping
    public ApiResponse<List<OrderDto>> getOrders() {
        return ApiResponse.ok(orderService.getCurrentUserOrders());
    }

    @GetMapping("/{orderId}")
    public ApiResponse<OrderDto> getOrderDetail(@PathVariable String orderId) {
        return ApiResponse.ok(orderService.getCurrentUserOrder(orderId));
    }

    @PostMapping("/{orderId}/pay")
    public ApiResponse<OrderDto> payOrder(@PathVariable String orderId) {
        return ApiResponse.ok(orderService.payCurrentUserOrder(orderId));
    }

    @PostMapping("/{orderId}/cancel")
    public ApiResponse<OrderDto> cancelOrder(
        @PathVariable String orderId,
        @RequestBody(required = false) CancelOrderRequest request
    ) {
        return ApiResponse.ok(orderService.cancelCurrentUserOrder(orderId));
    }
}
