package com.sunflower.backend.modules.order.persistence;

import com.sunflower.backend.modules.order.OrderStatus;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<OrderEntity, String>, JpaSpecificationExecutor<OrderEntity> {

    List<OrderEntity> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<OrderEntity> findByIdAndUserId(String id, String userId);

    boolean existsByOrderNo(String orderNo);

    long countByStatus(OrderStatus status);

    long countByStatusIn(Set<OrderStatus> statuses);

    @Query("select coalesce(sum(o.totalAmount), 0) from OrderEntity o where o.status in :statuses")
    Long sumTotalAmountByStatusIn(@Param("statuses") Set<OrderStatus> statuses);
}
