package com.sunflower.backend.modules.room.persistence;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomPriceRepository extends JpaRepository<RoomPriceEntity, Long> {

    List<RoomPriceEntity> findByRoomIdAndBizDateBetweenOrderByBizDateAsc(
        String roomId,
        LocalDate startDate,
        LocalDate endDate
    );

    List<RoomPriceEntity> findByRoomIdInAndBizDate(Collection<String> roomIds, LocalDate bizDate);
}
