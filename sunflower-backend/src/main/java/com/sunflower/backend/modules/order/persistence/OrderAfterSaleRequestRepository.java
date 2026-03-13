package com.sunflower.backend.modules.order.persistence;

import com.sunflower.backend.modules.order.AfterSaleRequestStatus;
import com.sunflower.backend.modules.order.AfterSaleRequestType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderAfterSaleRequestRepository extends JpaRepository<OrderAfterSaleRequestEntity, Long> {

    Optional<OrderAfterSaleRequestEntity> findByIdAndOrderId(Long id, String orderId);

    Optional<OrderAfterSaleRequestEntity> findTopByOrderIdOrderByRequestedAtDescIdDesc(String orderId);

    List<OrderAfterSaleRequestEntity> findByOrderIdOrderByRequestedAtDescIdDesc(String orderId);

    boolean existsByOrderIdAndStatus(String orderId, AfterSaleRequestStatus status);

    long countByOrderIdAndTypeAndStatus(String orderId, AfterSaleRequestType type, AfterSaleRequestStatus status);
}
