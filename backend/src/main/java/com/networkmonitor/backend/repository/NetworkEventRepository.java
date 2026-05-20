package com.networkmonitor.backend.repository;

import com.networkmonitor.backend.model.NetworkEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface NetworkEventRepository extends JpaRepository<NetworkEvent, Long> {

    List<NetworkEvent> findTop50ByOrderByTimestampDesc();

    List<NetworkEvent> findByIpAddressOrderByTimestampDesc(String ipAddress);

    @Query("SELECT e FROM NetworkEvent e WHERE e.ipAddress = :ip AND e.latencyMs > 0 ORDER BY e.timestamp ASC")
    List<NetworkEvent> findLatencyHistoryByIp(@Param("ip") String ipAddress);
}
