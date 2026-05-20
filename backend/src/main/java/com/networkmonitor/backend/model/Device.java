package com.networkmonitor.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "devices")
@Data
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "device_name")
    private String deviceName;

    @Column(name = "latency_ms")
    private Double latencyMs;

    @Column(name = "status")
    private String status;

    @Column(name = "last_seen")
    private LocalDateTime lastSeen;
}
