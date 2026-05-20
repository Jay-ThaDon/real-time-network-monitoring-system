from ping3 import ping
import socket
import time
from datetime import datetime


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
                "ip_address": ip,
                "device_name": device_name,
                "latency_ms": latency,
                "status": "ONLINE",
                "timestamp": get_timestamp()
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
        ip = device["ip_address"]
        current_devices[ip] = device

        if ip not in previous_devices:
            print(f"[{device['timestamp']}] [NEW DEVICE ONLINE] {device['device_name']} ({ip}) - {device['latency_ms']} ms")

    for ip in previous_devices:
        if ip not in current_devices:
            old_device = previous_devices[ip]
            print(f"[{get_timestamp()}] [DEVICE OFFLINE] {old_device['device_name']} ({ip})")

    previous_devices = current_devices

    print(f"\n[{get_timestamp()}] Waiting 30 seconds...\n")
    time.sleep(30)
    