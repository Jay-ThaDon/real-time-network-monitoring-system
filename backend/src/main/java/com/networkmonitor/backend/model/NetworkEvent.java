package com.networkmonitor.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "network_events")
@Data

public class NetworkEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "device_name")
    private String deviceName;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "latency_ms")
    private Double latencyMs;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;
}

