package com.sunflower.backend.modules.room.persistence;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomInventoryRepository extends JpaRepository<RoomInventoryEntity, Long> {

    List<RoomInventoryEntity> findByRoomIdAndBizDateBetweenOrderByBizDateAsc(
        String roomId,
        LocalDate startDate,
        LocalDate endDate
    );

    List<RoomInventoryEntity> findByRoomIdInAndBizDate(Collection<String> roomIds, LocalDate bizDate);
}
