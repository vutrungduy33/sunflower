package com.sunflower.backend.modules.room.persistence;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import javax.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomInventoryRepository extends JpaRepository<RoomInventoryEntity, Long> {

    List<RoomInventoryEntity> findByRoomIdAndBizDateBetweenOrderByBizDateAsc(
        String roomId,
        LocalDate startDate,
        LocalDate endDate
    );

    List<RoomInventoryEntity> findByRoomIdInAndBizDate(Collection<String> roomIds, LocalDate bizDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
        "select inventory from RoomInventoryEntity inventory "
            + "where inventory.roomId = :roomId and inventory.bizDate between :startDate and :endDate "
            + "order by inventory.bizDate asc"
    )
    List<RoomInventoryEntity> findForUpdateByRoomIdAndBizDateBetweenOrderByBizDateAsc(
        @Param("roomId") String roomId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
