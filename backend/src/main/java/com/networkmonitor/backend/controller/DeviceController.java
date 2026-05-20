package com.networkmonitor.backend.controller;

import com.networkmonitor.backend.model.Device;
import com.networkmonitor.backend.model.NetworkEvent;
import com.networkmonitor.backend.service.DeviceService;
import com.networkmonitor.backend.service.NetworkEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/events")
    public ResponseEntity<List<NetworkEvent>> getRecentEvents() {
        return ResponseEntity.ok(networkEventService.getRecentEvents());
    }
}

