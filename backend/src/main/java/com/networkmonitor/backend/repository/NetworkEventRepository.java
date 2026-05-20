package com.networkmonitor.backend.repository;

import com.networkmonitor.backend.model.NetworkEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NetworkEventRepository extends JpaRepository<NetworkEvent, Long> {

    List<NetworkEvent> findTop50ByOrderByTimestampDesc();

    List<NetworkEvent> findByIpAddressOrderByTimestampDesc(String ipAddress);
}
