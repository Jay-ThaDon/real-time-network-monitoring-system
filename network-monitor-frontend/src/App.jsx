import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { Activity, Shield, ShieldAlert, Cpu, Wifi, WifiOff, Clock } from 'lucide-react';

function App() {
  const [devices, setDevices] = useState([]);
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  // 1. Fetch initial state from the Spring Boot REST API on component load
  useEffect(() => {
    // Fetch Devices
    fetch('http://localhost:8080/api/devices')
      .then(res => res.json())
      .then(data => setDevices(data))
      .catch(err => console.error("Error fetching devices:", err));

    // Fetch Recent Events
    fetch('http://localhost:8080/api/events')
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error("Error fetching events:", err));
  }, []);

  // 2. Establish Real-Time WebSocket Connection
  useEffect(() => {
    // Force stable XHR streaming/polling to eliminate 'Invalid frame header' errors on localhost
    const socket = new SockJS('http://localhost:8080/ws', null, {
      transports: ['xhr-streaming', 'xhr-polling']
    });
    const stompClient = Stomp.over(socket);

    // Disable verbose console logging from stompjs to keep terminal clean
    stompClient.debug = () => {};

    // Disable verbose console logging from stompjs to keep terminal clean
    stompClient.debug = () => {};

    stompClient.connect({}, () => {
      setConnected(true);
      console.log('Connected to Spring Boot WebSockets!');

      // Listen for Device updates or discoveries
      stompClient.subscribe('/topic/devices', (message) => {
        const updatedDevice = JSON.parse(message.body);
        setDevices((prevDevices) => {
          const index = prevDevices.findIndex(d => d.ipAddress === updatedDevice.ipAddress);
          if (index !== -1) {
            // Update existing device card data inline
            const newDevices = [...prevDevices];
            newDevices[index] = updatedDevice;
            return newDevices;
          } else {
            // Append brand new device to the current UI inventory list
            return [...prevDevices, updatedDevice];
          }
        });
      });

     stompClient.subscribe('/topic/events', (message) => {
  const newEvent = JSON.parse(message.body);
  setEvents((prevEvents) => {
    // Combine new event with old ones, then sort descending by timestamp
    const updatedEvents = [newEvent, ...prevEvents];
    return updatedEvents
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50); // Keep only the top 50 newest events
  });
});
    }, (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    // SAFE CLEANUP: Prevents connection teardown crashes during dev mode double-renders
    return () => {
      if (stompClient && stompClient.connected) {
        try {
          stompClient.disconnect();
        } catch (e) {
          console.log("WebSocket cleanup skipped safely:", e);
        }
      }
    };
  }, []);

  // 3. Compute Live Dashboard Analytical Metrics
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'ONLINE').length;
  const offlineDevices = totalDevices - onlineDevices;
  const activeOnlineDevices = devices.filter(d => d.status === 'ONLINE' && d.latencyMs != null);
  const avgLatency = activeOnlineDevices.length > 0
    ? (activeOnlineDevices.reduce((sum, d) => sum + d.latencyMs, 0) / activeOnlineDevices.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      
      {/* GLOBAL HEADER CONTAINER */}
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

      {/* METRICS ROW CARDS */}
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

      {/* DASHBOARD GRID AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LIVE DEVICE INVENTORY GRID (Occupies left 2 columns) */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-slate-200">Live Device Inventory</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {devices.map((device) => {
              const isOnline = device.status === 'ONLINE';
              return (
                <div 
                  key={`device-${device.ipAddress}`} 
                  className={`bg-slate-800/30 border rounded-2xl p-5 transition-all duration-300 relative overflow-hidden ${
                    isOnline ? 'border-slate-800 hover:border-emerald-500/40' : 'border-rose-900/50 bg-rose-950/5 hover:border-rose-500/40'
                  }`}
                >
                  {/* Left-side status border bar */}
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

        {/* REAL-TIME NETWORK EVENT TIMELINE FEED (Occupies rightmost column) */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-slate-200">Real-Time Event Feed</h2>
          </div>
          
          <div className="bg-slate-800/20 border border-slate-800 rounded-2xl p-4 max-h-[550px] overflow-y-auto custom-scrollbar flex flex-col gap-3">
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
    </div>
  );
}

export default App;

