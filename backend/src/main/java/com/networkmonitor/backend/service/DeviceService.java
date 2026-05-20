package com.networkmonitor.backend.service;

import com.networkmonitor.backend.model.Device;
import com.networkmonitor.backend.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor

public class DeviceService {

    private final DeviceRepository deviceRepository;

    public Device saveOrUpdateDevice(Device incomingDevice) {
        Optional<Device> existing = deviceRepository.findByIpAddress(incomingDevice.getIpAddress());

        if (existing.isPresent()) {
            Device device = existing.get();
            device.setLatencyMs(incomingDevice.getLatencyMs());
            device.setStatus(incomingDevice.getStatus());
            device.setDeviceName(incomingDevice.getDeviceName());
            device.setLastSeen(LocalDateTime.now());
            return deviceRepository.save(device);
        }

        incomingDevice.setLastSeen(LocalDateTime.now());
        return deviceRepository.save(incomingDevice);
    }

    public List<Device> getAllDevices() {
        return deviceRepository.findAll();
    }
}

