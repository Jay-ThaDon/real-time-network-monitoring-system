import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { Activity, Shield, ShieldAlert, Cpu, Wifi, WifiOff, Clock, X, Pencil } from 'lucide-react';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

function LatencyChart({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: '#64748b' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#64748b' }}
          unit="ms"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#f8fafc'
          }}
          formatter={(value) => [`${value} ms`, 'Latency']}
        />
        <Line
          type="monotone"
          dataKey="latency"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function DeviceModal({ device, onClose, onRename }) {
  const [history, setHistory] = useState([]);
  const [latencyData, setLatencyData] = useState([]);
  const [newName, setNewName] = useState(device.deviceName || '');
  const [saving, setSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingLatency, setLoadingLatency] = useState(true);

  const encodedIp = encodeURIComponent(device.ipAddress);

  useEffect(() => {
    // Fetch connection history
    fetch(`http://localhost:8080/api/devices/${encodedIp}/history`)
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        setLoadingHistory(false);
      })
      .catch(() => setLoadingHistory(false));

    // Fetch latency history
    fetch(`http://localhost:8080/api/devices/${encodedIp}/latency`)
      .then(res => res.json())
      .then(data => {
        const chartData = data.map(event => ({
          time: new Date(event.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          latency: parseFloat(event.latencyMs.toFixed(2))
        }));
        setLatencyData(chartData);
        setLoadingLatency(false);
      })
      .catch(() => setLoadingLatency(false));

  }, [encodedIp]);

  const handleRename = () => {
    if (!newName.trim()) return;
    setSaving(true);

    fetch(`http://localhost:8080/api/devices/${encodedIp}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceName: newName.trim() })
    })
      .then(res => res.json())
      .then(updated => {
        onRename(updated);
        setSaving(false);
      })
      .catch(() => setSaving(false));
  };

  const isOnline = device.status === 'ONLINE';

  // Determine line color based on avg latency
  const avgLatency = latencyData.length > 0
    ? latencyData.reduce((sum, d) => sum + d.latency, 0) / latencyData.length
    : 0;
  const latencyColor = avgLatency < 50 ? '#34d399' : avgLatency < 150 ? '#fbbf24' : '#f87171';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex justify-between items-start p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{device.deviceName}</h2>
            <p className="text-xs font-mono text-slate-400 mt-1">{device.ipAddress}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {device.status}
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Rename Section */}
        <div className="p-6 border-b border-slate-800">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
            <Pencil className="w-3.5 h-3.5 inline mr-1" />
            Rename Device
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              placeholder="Enter device name..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              onClick={handleRename}
              disabled={saving || !newName.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            This name will persist and update on the dashboard immediately.
          </p>
        </div>

        {/* Device Stats */}
        <div className="px-6 py-4 border-b border-slate-800 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Current Latency</p>
            <p className={`text-lg font-bold mt-0.5 ${isOnline ? 'text-cyan-400' : 'text-slate-500'}`}>
              {isOnline ? `${device.latencyMs?.toFixed(1)} ms` : '--'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Last Seen</p>
            <p className="text-sm font-semibold text-slate-300 mt-0.5">
              {device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>

        {/* Latency Chart */}
        <div className="p-6 border-b border-slate-800">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">
            <Activity className="w-3.5 h-3.5 inline mr-1" />
            Latency History
            {avgLatency > 0 && (
              <span className="ml-2 normal-case font-normal text-slate-500">
                avg {avgLatency.toFixed(1)} ms
              </span>
            )}
          </p>

          {loadingLatency ? (
            <p className="text-sm text-slate-500 text-center py-4">Loading chart...</p>
          ) : latencyData.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No latency data yet. Data builds up over time as the scanner runs.
            </p>
          ) : (
            <LatencyChart data={latencyData} color={latencyColor} />
          )}
        </div>

        {/* Connection History */}
        <div className="p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            Connection History
          </p>

          <div className="max-h-52 overflow-y-auto flex flex-col gap-2">
            {loadingHistory ? (
              <p className="text-sm text-slate-500 text-center py-4">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No history found.</p>
            ) : (
              history.map((event, index) => {
                const isOnlineEvent = event.eventType === 'DEVICE_ONLINE';
                return (
                  <div
                    key={`${event.id}-${index}`}
                    className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isOnlineEvent ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span className={`text-xs font-bold ${isOnlineEvent ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isOnlineEvent ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function App() {
  const [devices, setDevices] = useState([]);
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8080/api/devices')
      .then(res => res.json())
      .then(data => setDevices(data))
      .catch(err => console.error("Error fetching devices:", err));

    fetch('http://localhost:8080/api/events')
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setEvents(sorted);
      })
      .catch(err => console.error("Error fetching events:", err));
  }, []);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws', null, {
      transports: ['xhr-streaming', 'xhr-polling']
    });
    const stompClient = Stomp.over(socket);
    stompClient.debug = () => {};

    stompClient.connect({}, () => {
      setConnected(true);

      stompClient.subscribe('/topic/devices', (message) => {
        const updatedDevice = JSON.parse(message.body);
        setDevices(prevDevices => {
          const index = prevDevices.findIndex(d => d.ipAddress === updatedDevice.ipAddress);
          if (index !== -1) {
            const newDevices = [...prevDevices];
            newDevices[index] = updatedDevice;
            return newDevices;
          }
          return [...prevDevices, updatedDevice];
        });

        // Keep selected device in sync if it's open
        setSelectedDevice(prev =>
          prev && prev.ipAddress === updatedDevice.ipAddress ? updatedDevice : prev
        );
      });

      stompClient.subscribe('/topic/events', (message) => {
        const newEvent = JSON.parse(message.body);
        setEvents(prevEvents => {
          const merged = [newEvent, ...prevEvents];
          const unique = merged.filter(
            (event, index, self) =>
              index === self.findIndex(e => e.id === event.id)
          );
          return unique
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 50);
        });
      });

    }, (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    return () => {
      if (stompClient && stompClient.connected) {
        try { stompClient.disconnect(); } catch (e) {}
      }
    };
  }, []);

  const handleRename = (updatedDevice) => {
    setDevices(prev => {
      const index = prev.findIndex(d => d.ipAddress === updatedDevice.ipAddress);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = updatedDevice;
        return updated;
      }
      return prev;
    });
    setSelectedDevice(updatedDevice);
  };

  const handleClearOffline = () => {
    fetch('http://localhost:8080/api/devices/offline', {
      method: 'DELETE'
    })
      .then(() => {
        setDevices(prev => prev.filter(d => d.status !== 'OFFLINE'));
      })
      .catch(err => console.error("Error clearing offline devices:", err));
  };

  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'ONLINE').length;
  const offlineDevices = totalDevices - onlineDevices;
  const activeOnlineDevices = devices.filter(d => d.status === 'ONLINE' && d.latencyMs != null);
  const avgLatency = activeOnlineDevices.length > 0
    ? (activeOnlineDevices.reduce((sum, d) => sum + d.latencyMs, 0) / activeOnlineDevices.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            PulseNet Ops
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-Time Core Infrastructure Network Monitor</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700/50">
          <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            {connected ? 'Live Stream Connected' : 'Stream Disconnected'}
          </span>
        </div>
      </header>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Monitored</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-100">{totalDevices}</h3>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Cpu className="w-6 h-6" /></div>
        </div>
        <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Systems Operational</p>
            <h3 className="text-2xl font-bold mt-1 text-emerald-400">{onlineDevices}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><Wifi className="w-6 h-6" /></div>
        </div>
        <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Critical Alerts</p>
            <h3 className="text-2xl font-bold mt-1 text-rose-400">{offlineDevices}</h3>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400"><WifiOff className="w-6 h-6" /></div>
        </div>
        <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Avg Link Latency</p>
            <h3 className="text-2xl font-bold mt-1 text-cyan-400">{avgLatency} <span className="text-sm font-normal text-slate-400">ms</span></h3>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400"><Clock className="w-6 h-6" /></div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* DEVICE INVENTORY */}
        <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-slate-200">Live Device Inventory</h2>
                <span className="text-xs text-slate-500 ml-1">(click a device to rename or view history)</span>
            </div>
            {offlineDevices > 0 && (
              <button
                onClick={handleClearOffline}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 border border-rose-900/50 hover:border-rose-500/50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Clear {offlineDevices} Offline
              </button>
            )}
        </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {devices.map((device) => {
              const isOnline = device.status === 'ONLINE';
              return (
                <div
                  key={`device-${device.ipAddress}`}
                  onClick={() => setSelectedDevice(device)}
                  className={`bg-slate-800/30 border rounded-2xl p-5 transition-all duration-300 relative overflow-hidden cursor-pointer ${
                    isOnline
                      ? 'border-slate-800 hover:border-emerald-500/40'
                      : 'border-rose-900/50 bg-rose-950/5 hover:border-rose-500/40'
                  }`}
                >
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h4 className="font-bold text-slate-100 text-lg tracking-tight">{device.deviceName || 'Unlabeled Host'}</h4>
                      <p className="text-xs font-mono text-slate-400 mt-0.5 bg-slate-900/60 inline-block px-2 py-0.5 rounded border border-slate-800">
                        {device.ipAddress}
                      </p>
                    </div>
                    <span className={`text-xs font-bold tracking-wider px-2.5 py-1 rounded-full uppercase border ${
                      isOnline
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {device.status}
                    </span>
                  </div>

                  <div className="mt-5 flex justify-between items-center border-t border-slate-800/80 pt-3 pl-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Last Seen: {device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString() : 'Never'}
                    </span>
                    <span className={`font-semibold ${isOnline ? 'text-cyan-400' : 'text-slate-500'}`}>
                      {isOnline ? `${device.latencyMs?.toFixed(1) || '0.0'} ms` : '--'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        {/* EVENT FEED */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-slate-200">Real-Time Event Feed</h2>
          </div>

          <div className="bg-slate-800/20 border border-slate-800 rounded-2xl p-4 max-h-[550px] overflow-y-auto flex flex-col gap-3">
            {events.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Awaiting network state variations...</p>
            ) : (
              events.map((event, index) => {
                const isOnlineEvent = event.eventType === 'DEVICE_ONLINE';
                return (
                  <div
                    key={`event-${event.id || index}-${event.timestamp}-${event.ipAddress}`}
                    className="flex items-start gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60"
                  >
                    <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${isOnlineEvent ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {isOnlineEvent ? <Shield className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline gap-2">
                        <p className="text-xs font-mono text-slate-400 truncate">{event.ipAddress}</p>
                        <span className="text-[10px] font-medium text-slate-500 shrink-0">
                          {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-200 mt-0.5 truncate">
                        {event.deviceName || 'Unknown Host'}
                      </p>
                      <p className={`text-[11px] font-bold mt-0.5 tracking-wide ${isOnlineEvent ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isOnlineEvent ? '● RECONNECTED ONLINE' : '▲ DISCONNECTED OFFLINE'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* DEVICE MODAL */}
      {selectedDevice && (
        <DeviceModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onRename={handleRename}
        />
      )}

    </div>
  );
}

export default App;

