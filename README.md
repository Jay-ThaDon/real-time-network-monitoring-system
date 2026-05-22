# Real-Time Network Monitoring System

A full-stack network monitoring platform that discovers devices on a local area network (LAN), tracks their online/offline status, measures latency, and visualizes everything on a live dashboard.

Built with Python, Spring Boot, PostgreSQL, React, and WebSockets.

---

## Live Demo

Frontend: https://real-time-network-monitoring-system.vercel.app

> To see live data, the scanner must be running on a machine connected to the network being monitored.

---

## Architecture
Scanner (Python) → Spring Boot API → PostgreSQL
↓
React Dashboard ← WebSockets

The Python scanner runs locally on any machine connected to the target network. It auto-detects the network, scans for active devices, and ships data to the cloud backend. The React dashboard displays live updates via WebSockets.

---

## Features

- **Auto Network Detection** — scanner detects the local network automatically, no configuration needed
- **Threaded Scanning** — scans 254 IPs concurrently, full network scan completes in 6-8 seconds
- **Live Device Dashboard** — real-time online/offline status with latency readings
- **WebSocket Updates** — dashboard updates instantly without page refresh
- **Event History** — every state change (online/offline) is logged with timestamps
- **Device Renaming** — click any device to assign a custom name
- **Latency Chart** — per-device latency history visualized as a line graph
- **Manufacturer Detection** — identifies device manufacturers via MAC address lookup
- **Export Reports** — download network snapshot as CSV or PDF
- **Clear Offline Devices** — one-click removal of stale offline devices
- **Dockerized** — backend, frontend, and database fully containerized

---

## Tech Stack

| Layer | Technology |
|---|---|
| Scanner | Python 3, ping3, getmac, requests |
| Backend | Java 21, Spring Boot 4, Spring Data JPA, WebSockets |
| Database | PostgreSQL (Supabase in production) |
| Frontend | React, Vite, Tailwind CSS, Recharts |
| Containerization | Docker, Docker Compose |
| Deployment | Render (backend), Vercel (frontend), Supabase (database) |

---

## Project Structure

```
real-time-network-monitoring-system/
├── scanner/                  # Python network scanner
│   └── scanner.py
├── backend/                  # Spring Boot REST API
│   ├── src/
│   └── Dockerfile
├── network-monitor-frontend/ # React dashboard
│   ├── src/
│   └── Dockerfile
├── docker-compose.yml        # Local Docker setup
└── README.md
```

---

## Running Locally

### Prerequisites
- Python 3.10+
- Java 21+
- Node.js 18+
- Docker Desktop
- PostgreSQL (or use Docker Compose)

### Option A — Docker Compose (recommended)

```bash
git clone https://github.com/Jay-ThaDon/real-time-network-monitoring-system
cd real-time-network-monitoring-system
```

Create `backend/src/main/resources/application.properties` from the example:

```bash
cp backend/src/main/resources/application.properties.example backend/src/main/resources/application.properties
```

Fill in your database credentials, then:

```bash
docker-compose up --build
```

Dashboard available at `http://localhost`

### Option B — Manual Setup

**Database**
```sql
CREATE DATABASE network_monitor;
```

**Backend**
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend**
```bash
cd network-monitor-frontend
npm install
npm run dev
```

---

## Running the Scanner

The scanner must run on a machine physically connected to the network you want to monitor.

```bash
cd scanner
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install ping3 requests getmac
python scanner.py
```

The scanner will:
1. Auto-detect your local network (e.g. `192.168.1.0/24`)
2. Scan all 254 possible IP addresses concurrently
3. POST discovered devices to the backend every 30 seconds
4. Detect and report when devices go offline

### Pointing the Scanner at a Deployed Backend

Open `scanner/scanner.py` and update:

```python
BACKEND_URL = "https://your-render-backend-url.onrender.com/api/devices"
```

---

## Deployment

| Service | Purpose | Config |
|---|---|---|
| Render | Spring Boot backend | Set `DATABASE_URL`, `PORT` env vars |
| Supabase | PostgreSQL database | Create `devices` and `network_events` tables |
| Vercel | React frontend | Set `VITE_API_URL` env var |

### Required Environment Variables

**Render (Backend)**
DATABASE_URL=jdbc:postgresql://your-supabase-url:5432/postgres?sslmode=require&user=your-user&password=your-password
PORT=10000

**Vercel (Frontend)**
VITE_API_URL=https://your-render-backend-url.onrender.com

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/devices` | Get all devices |
| POST | `/api/devices` | Add or update a device |
| PUT | `/api/devices/{ip}/rename` | Rename a device |
| DELETE | `/api/devices/offline` | Remove offline devices |
| GET | `/api/devices/{ip}/history` | Get device event history |
| GET | `/api/devices/{ip}/latency` | Get device latency history |
| GET | `/api/events` | Get recent network events |

---

## Notes

- The scanner uses ICMP ping packets which require the scanning machine to be on the same LAN as the monitored devices
- Devices with MAC address randomization enabled (most modern phones) will appear as "Unknown Device" until manually renamed
- Render free tier spins down after inactivity — first request may take 30-60 seconds to wake the backend
- The scanner automatically detects the network prefix so it works on any LAN without configuration

