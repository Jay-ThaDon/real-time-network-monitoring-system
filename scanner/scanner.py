from ping3 import ping
import socket
import time
import requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from getmac import get_mac_address


BACKEND_URL = "https://network-monitor-backend.onrender.com/api/devices"
SESSION_URL = "https://network-monitor-backend.onrender.com/api/session/start"
MAX_THREADS = 50

# Cache manufacturer lookups so we don't spam the API
manufacturer_cache = {}


def get_timestamp():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def get_manufacturer(ip):
    try:
        mac = get_mac_address(ip=ip)

        if not mac or mac == "00:00:00:00:00:00":
            return None

        # Use first 6 characters of MAC (OUI prefix) as cache key
        oui = mac.replace(":", "").upper()[:6]

        if oui in manufacturer_cache:
            return manufacturer_cache[oui]

        # Look up manufacturer from free public API
        response = requests.get(
            f"https://api.maclookup.app/v2/macs/{mac}",
            timeout=3
        )

        if response.status_code == 200:
            data = response.json()
            company = data.get("company", "").strip()

            if company and company != "":
                # Shorten verbose manufacturer names
                clean_name = company.split(" ")[0].title()
                manufacturer_cache[oui] = clean_name
                return clean_name
        manufacturer_cache[oui] = None
        return None

    except Exception:
        return None

def get_device_name(ip, hostname):
    return hostname

    # Try to get manufacturer from MAC address
    manufacturer = get_manufacturer(ip)
    if manufacturer:
        return f"{manufacturer} Device"

    # Fall back to hostname if DNS resolved it
    if hostname and hostname != "Unknown Device":
        return hostname

    return "Unknown Device"


def send_to_backend(device):
    try:
        response = requests.post(BACKEND_URL, json=device, timeout=5)
        if response.status_code == 200:
            print(f"  → Saved: {device['deviceName']} ({device['ipAddress']}) - {device['status']}")
        else:
            print(f"  → Backend error {response.status_code} for {device['ipAddress']}")
    except requests.exceptions.ConnectionError:
        print(f"  → Backend unreachable. Is Spring Boot running?")

def start_session(network_prefix):
    try:
        response = requests.post(SESSION_URL, json={"networkPrefix": network_prefix}, timeout=5)
        if response.status_code == 200:
            print(f"[{get_timestamp()}] Session started for network: {network_prefix}0/24")
        else:
            print(f"  → Session start failed: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print(f"  → Backend unreachable. Is the backend running?")

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


def get_network_prefix():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()

        parts = local_ip.split(".")
        prefix = f"{parts[0]}.{parts[1]}.{parts[2]}."
        print(f"[{get_timestamp()}] Detected local IP: {local_ip}")
        print(f"[{get_timestamp()}] Scanning network: {prefix}0/24\n")
        return prefix

    except Exception as e:
        print(f"[ERROR] Could not detect network: {e}")
        print("Falling back to 192.168.100.")
        return "192.168.100."


def scan_network(network_prefix):
    ips = [network_prefix + str(i) for i in range(1, 255)]
    results = []

    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        futures = {executor.submit(scan_device, ip): ip for ip in ips}

        for future in as_completed(futures):
            result = future.result()
            if result:
                results.append(result)

    return results


# --- MAIN LOOP ---

network_prefix = get_network_prefix()
previous_devices = {}

print(f"[{get_timestamp()}] Network monitor started.\n")

# Tell backend we're starting fresh on this network
start_session(network_prefix)

while True:
    print(f"[{get_timestamp()}] Scanning network...\n")

    scan_start = time.time()
    current_scan = scan_network(network_prefix)
    scan_duration = round(time.time() - scan_start, 2)

    current_devices = {}

    for device in current_scan:
        ip = device["ipAddress"]
        current_devices[ip] = device

        if ip not in previous_devices:
            print(f"[{get_timestamp()}] [NEW DEVICE] {device['deviceName']} ({ip}) - {device['latencyMs']} ms")

        send_to_backend(device)

    for ip in previous_devices:
        if ip not in current_devices:
            old_device = previous_devices[ip]
            print(f"[{get_timestamp()}] [OFFLINE] {old_device['deviceName']} ({ip})")

            offline_device = {
                "ipAddress": ip,
                "deviceName": old_device["deviceName"],
                "latencyMs": 0.0,
                "status": "OFFLINE",
                "lastSeen": datetime.now().isoformat()
            }
            send_to_backend(offline_device)

    previous_devices = current_devices

    print(f"\n[{get_timestamp()}] Scan complete in {scan_duration}s. Found {len(current_devices)} devices.")
    print(f"[{get_timestamp()}] Waiting 30 seconds...\n")
    time.sleep(30)
