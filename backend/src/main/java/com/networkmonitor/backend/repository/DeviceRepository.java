package com.networkmonitor.backend.repository;

import com.networkmonitor.backend.model.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends JpaRepository<Device, Long> {

    Optional<Device> findByIpAddress(String ipAddress);

    List<Device> findByStatus(String status);
}

