import React from 'react';
import { Smartphone, Wifi, Radio, Server, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

export default function MeshVisualizer({ devices = [] }) {
  const getDeviceData = (id) => {
    return devices.find((d) => d.deviceId === id) || { packetCount: 0, packetIds: [], hasInternet: false };
  };

  const alice = getDeviceData('phone-alice');
  const s1 = getDeviceData('phone-stranger1');
  const s2 = getDeviceData('phone-stranger2');
  const s3 = getDeviceData('phone-stranger3');
  const bridge = getDeviceData('phone-bridge');

  return (
    <div className="bg-[#111726]/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            Virtual BLE Mesh Topology Simulation
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Offline devices propagate encrypted packets hop-by-hop via Bluetooth until a Bridge node reaches internet.
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full">
          TTL Gossip Mode
        </span>
      </div>

      {/* Network Flow Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center relative z-10 py-4">
        {/* Node 1: Sender Alice */}
        <div className="bg-slate-900/80 border border-cyan-500/40 rounded-xl p-4 flex flex-col items-center text-center shadow-lg hover:border-cyan-400 transition-all group">
          <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
            <Smartphone className="w-6 h-6" />
          </div>
          <span className="font-mono text-sm font-semibold text-slate-200">phone-alice</span>
          <span className="text-[10px] text-rose-400 font-mono mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Offline (Basement)
          </span>

          <div className="mt-3 w-full bg-slate-950/60 rounded-lg p-2 border border-slate-800 text-xs">
            <span className="text-slate-400 font-mono">Held Packets:</span>
            <span className="font-mono font-bold text-cyan-400 ml-2">{alice.packetCount}</span>
            {alice.packetIds.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1 justify-center">
                {alice.packetIds.map((id, i) => (
                  <span key={i} className="px-1.5 py-0.5 text-[9px] font-mono bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                    #{id}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Node 2: Intermediate Strangers */}
        <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 flex flex-col items-center text-center shadow-lg hover:border-slate-500 transition-all group">
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300 mb-2 group-hover:scale-110 transition-transform">
            <Radio className="w-6 h-6 text-slate-400" />
          </div>
          <span className="font-mono text-sm font-semibold text-slate-300">phone-strangers</span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">3 Peer Nodes (No Internet)</span>

          <div className="mt-3 w-full bg-slate-950/60 rounded-lg p-2 border border-slate-800 text-xs">
            <span className="text-slate-400 font-mono">Total Packets:</span>
            <span className="font-mono font-bold text-sky-400 ml-2">{s1.packetCount + s2.packetCount + s3.packetCount}</span>
          </div>
        </div>

        {/* Node 3: Bridge Node */}
        <div className="bg-slate-900/80 border border-emerald-500/40 rounded-xl p-4 flex flex-col items-center text-center shadow-lg hover:border-emerald-400 transition-all group">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
            <Wifi className="w-6 h-6" />
          </div>
          <span className="font-mono text-sm font-semibold text-emerald-300">phone-bridge</span>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> 4G / Internet Access
          </span>

          <div className="mt-3 w-full bg-slate-950/60 rounded-lg p-2 border border-slate-800 text-xs">
            <span className="text-slate-400 font-mono">Held Packets:</span>
            <span className="font-mono font-bold text-emerald-400 ml-2">{bridge.packetCount}</span>
            {bridge.packetIds.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1 justify-center">
                {bridge.packetIds.map((id, i) => (
                  <span key={i} className="px-1.5 py-0.5 text-[9px] font-mono bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                    #{id}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Node 4: HTTP Ingestion Gateway */}
        <div className="flex flex-col items-center justify-center text-slate-500">
          <ArrowRight className="w-8 h-8 text-cyan-400 animate-pulse hidden md:block" />
          <span className="text-[10px] font-mono text-slate-400 mt-1">POST /api/bridge/ingest</span>
        </div>

        {/* Node 5: Backend Server */}
        <div className="bg-slate-900/90 border border-indigo-500/50 rounded-xl p-4 flex flex-col items-center text-center shadow-lg hover:border-indigo-400 transition-all group">
          <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
            <Server className="w-6 h-6" />
          </div>
          <span className="font-mono text-sm font-semibold text-indigo-300">Bank Server</span>
          <span className="text-[10px] text-indigo-400 font-mono mt-0.5">Decryption & Settlement</span>

          <div className="mt-3 w-full bg-slate-950/60 rounded-lg p-2 border border-slate-800 text-xs text-slate-300 font-mono">
            RSA-2048 + AES-GCM
          </div>
        </div>
      </div>
    </div>
  );
}
