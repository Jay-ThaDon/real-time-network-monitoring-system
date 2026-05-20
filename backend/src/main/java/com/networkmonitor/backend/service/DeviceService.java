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
    private final NetworkEventService networkEventService;

    public Device saveOrUpdateDevice(Device incomingDevice) {
        Optional<Device> existing = deviceRepository.findByIpAddress(incomingDevice.getIpAddress());

        if (existing.isPresent()) {
            Device device = existing.get();

            String previousStatus = device.getStatus();
            String newStatus = incomingDevice.getStatus();

            device.setLatencyMs(incomingDevice.getLatencyMs());
            device.setStatus(newStatus);
            device.setDeviceName(incomingDevice.getDeviceName());
            device.setLastSeen(LocalDateTime.now());
            deviceRepository.save(device);

            if (!previousStatus.equals(newStatus)) {
                networkEventService.logEvent(
                        device.getIpAddress(),
                        device.getDeviceName(),
                        newStatus.equals("ONLINE") ? "DEVICE_ONLINE" : "DEVICE_OFFLINE",
                        incomingDevice.getLatencyMs()
                );
            }

            return device;
        }

        incomingDevice.setLastSeen(LocalDateTime.now());
        deviceRepository.save(incomingDevice);

        networkEventService.logEvent(
                incomingDevice.getIpAddress(),
                incomingDevice.getDeviceName(),
                "DEVICE_ONLINE",
                incomingDevice.getLatencyMs()
        );

        return incomingDevice;
    }

    public List<Device> getAllDevices() {
        return deviceRepository.findAll();
    }
}
