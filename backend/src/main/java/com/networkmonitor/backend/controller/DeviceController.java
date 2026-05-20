package com.networkmonitor.backend.controller;

import com.networkmonitor.backend.model.Device;
import com.networkmonitor.backend.service.DeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")

public class DeviceController {

    private final DeviceService deviceService;

    @PostMapping
    public ResponseEntity<Device> receiveDevice(@RequestBody Device device) {
        Device saved = deviceService.saveOrUpdateDevice(device);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<Device>> getAllDevices() {
        List<Device> devices = deviceService.getAllDevices();
        return ResponseEntity.ok(devices);
    }
}

