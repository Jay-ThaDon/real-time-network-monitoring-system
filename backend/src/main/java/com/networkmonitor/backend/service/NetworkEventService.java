package com.networkmonitor.backend.service;

import com.networkmonitor.backend.model.NetworkEvent;
import com.networkmonitor.backend.repository.NetworkEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor

public class NetworkEventService {

    private final NetworkEventRepository networkEventRepository;

    public void logEvent(String ipAddress, String deviceName, String eventType, Double latencyMs) {
        NetworkEvent event = new NetworkEvent();
        event.setIpAddress(ipAddress);
        event.setDeviceName(deviceName);
        event.setEventType(eventType);
        event.setLatencyMs(latencyMs);
        event.setTimestamp(LocalDateTime.now());
        networkEventRepository.save(event);
    }

    public List<NetworkEvent> getRecentEvents() {
        return networkEventRepository.findTop50ByOrderByTimestampDesc();
    }
}

