import React from 'react';
import { ShieldCheck, Wifi, Database, Cpu, Radio } from 'lucide-react';

export default function Header({ isConnected, isDbConnected, isRedisConnected }) {
  return (
    <header className="border-b border-slate-800 bg-[#0d1322]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent tracking-wide">
              UPI Offline Mesh
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Bluetooth Network Simulation & RSA-2048/AES-GCM Settlement System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 ${
            isConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`}></span>
            <Radio className="w-3.5 h-3.5" />
            Backend WS: {isConnected ? 'Online' : 'Disconnected'}
          </div>

          <div className="px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center gap-2">
            <Database className="w-3.5 h-3.5" />
            MongoDB: Connected
          </div>

          <div className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5" />
            Redis SET-NX: Active
          </div>
        </div>
      </div>
    </header>
  );
}
