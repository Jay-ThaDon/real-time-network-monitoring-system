package com.networkmonitor.backend.service;

import com.networkmonitor.backend.model.Device;
import com.networkmonitor.backend.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate; // <-- ADD THIS IMPORT
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final NetworkEventService networkEventService;
    private final SimpMessagingTemplate messagingTemplate; // <-- ADD THIS FOR WEBSOCKETS

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

            // Save the updated device state to the database
            deviceRepository.save(device);

            // <-- ADD THIS: Broadcast the updated device status to the React frontend
            messagingTemplate.convertAndSend("/topic/devices", device);

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

        // Save the brand-new discovered device to the database
        deviceRepository.save(incomingDevice);

        // <-- ADD THIS: Broadcast the brand-new device to the React frontend
        messagingTemplate.convertAndSend("/topic/devices", incomingDevice);

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

