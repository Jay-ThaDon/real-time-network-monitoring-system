from ping3 import ping
import socket
import time
import requests
from datetime import datetime


BACKEND_URL = "http://localhost:8080/api/devices"

known_devices = {
    "192.168.100.36": "Joel Phone",
    "192.168.100.34": "Joel Laptop"
}


def get_device_name(ip, hostname):
    if ip in known_devices:
        return known_devices[ip]
    return hostname


def get_timestamp():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def send_to_backend(device):
    try:
        response = requests.post(BACKEND_URL, json=device)
        if response.status_code == 200:
            print(f"  → Saved to backend: {device['deviceName']} ({device['ipAddress']})")
        else:
            print(f"  → Backend error {response.status_code} for {device['ipAddress']}")
    except requests.exceptions.ConnectionError:
        print(f"  → Backend unreachable. Is Spring Boot running?")


def scan_device(ip):
    try:
        response = ping(ip, timeout=1)

        if response:
            latency = round(response * 1000, 2)

            try:
                hostname = socket.gethostbyaddr(ip)[0]
            except:
                hostname = "Unknown Device"

            device_name = get_device_name(ip, hostname)

            return {
                "ipAddress": ip,
                "deviceName": device_name,
                "latencyMs": latency,
                "status": "ONLINE",
                "lastSeen": datetime.now().isoformat()
            }

    except Exception as e:
        print(f"[ERROR] Failed to scan {ip}: {e}")

    return None


def scan_network(network_prefix, start=1, end=254):
    devices = []

    for i in range(start, end + 1):
        ip = network_prefix + str(i)
        device = scan_device(ip)

        if device:
            devices.append(device)

    return devices


network_prefix = "192.168.100."

previous_devices = {}

print(f"[{get_timestamp()}] Network monitor started.\n")

while True:
    print(f"[{get_timestamp()}] Scanning network...\n")

    current_scan = scan_network(network_prefix)

    current_devices = {}

    for device in current_scan:
        ip = device["ipAddress"]
        current_devices[ip] = device

        if ip not in previous_devices:
            print(f"[{get_timestamp()}] [NEW DEVICE ONLINE] {device['deviceName']} ({ip}) - {device['latencyMs']} ms")

        send_to_backend(device)

    for ip in previous_devices:
        if ip not in current_devices:
            old_device = previous_devices[ip]
            print(f"[{get_timestamp()}] [DEVICE OFFLINE] {old_device['deviceName']} ({ip})")

            offline_device = {
                "ipAddress": ip,
                "deviceName": old_device["deviceName"],
                "latencyMs": 0.0,
                "status": "OFFLINE",
                "lastSeen": datetime.now().isoformat()
            }
            send_to_backend(offline_device)

    previous_devices = current_devices

    print(f"\n[{get_timestamp()}] Waiting 30 seconds...\n")
    time.sleep(30)
    