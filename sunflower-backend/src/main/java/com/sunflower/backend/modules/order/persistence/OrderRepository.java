package com.sunflower.backend.modules.order.persistence;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<OrderEntity, String> {

    List<OrderEntity> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<OrderEntity> findByIdAndUserId(String id, String userId);

    boolean existsByOrderNo(String orderNo);
}
