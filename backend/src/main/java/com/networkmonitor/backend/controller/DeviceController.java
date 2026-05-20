package com.networkmonitor.backend.controller;

import com.networkmonitor.backend.model.Device;
import com.networkmonitor.backend.model.NetworkEvent;
import com.networkmonitor.backend.service.DeviceService;
import com.networkmonitor.backend.service.NetworkEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DeviceController {

    private final DeviceService deviceService;
    private final NetworkEventService networkEventService;

    @PostMapping("/devices")
    public ResponseEntity<Device> receiveDevice(@RequestBody Device device) {
        Device saved = deviceService.saveOrUpdateDevice(device);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/devices")
    public ResponseEntity<List<Device>> getAllDevices() {
        return ResponseEntity.ok(deviceService.getAllDevices());
    }

    @PutMapping("/devices/{ipAddress}/rename")
    public ResponseEntity<Device> renameDevice(
            @PathVariable String ipAddress,
            @RequestBody Map<String, String> body) {
        String newName = body.get("deviceName");
        Device updated = deviceService.renameDevice(ipAddress, newName);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/devices/offline")
    public ResponseEntity<Void> clearOfflineDevices() {
        deviceService.clearOfflineDevices();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/devices/{ipAddress}/history")
    public ResponseEntity<List<NetworkEvent>> getDeviceHistory(
            @PathVariable String ipAddress) {
        return ResponseEntity.ok(networkEventService.getDeviceHistory(ipAddress));
    }

    @GetMapping("/devices/{ipAddress}/latency")
    public ResponseEntity<List<NetworkEvent>> getLatencyHistory(
            @PathVariable String ipAddress) {
        return ResponseEntity.ok(networkEventService.getLatencyHistory(ipAddress));
    }

    @GetMapping("/events")
    public ResponseEntity<List<NetworkEvent>> getRecentEvents() {
        return ResponseEntity.ok(networkEventService.getRecentEvents());
    }
}
