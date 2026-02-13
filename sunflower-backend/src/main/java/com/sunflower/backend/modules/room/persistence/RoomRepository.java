package com.sunflower.backend.modules.room.persistence;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<RoomEntity, String> {

    List<RoomEntity> findByStatusOrderByIdAsc(String status);

    Optional<RoomEntity> findByIdAndStatus(String id, String status);
}
