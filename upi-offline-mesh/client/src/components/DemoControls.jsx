import React from 'react';
import { RefreshCw, Zap, ShieldAlert, Copy, Layers, Trash2, Cpu } from 'lucide-react';

export default function DemoControls({
  onRunGossip,
  onFlushBridge,
  onTamperDemo,
  onReplayDemo,
  onConcurrentDemo,
  onResetMesh,
  loading
}) {
  return (
    <div className="bg-[#111726]/90 border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Security & Simulation Control Deck
          </h3>
          <span className="text-[10px] font-mono px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-md">
            Interactive Demos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          {/* Gossip Round */}
          <button
            onClick={onRunGossip}
            disabled={loading}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 rounded-xl transition-all flex items-center gap-2.5 shadow-md group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-200">Run Gossip Round</div>
              <div className="text-[10px] text-slate-400">Propagate BLE packets</div>
            </div>
          </button>

          {/* Flush Bridge */}
          <button
            onClick={onFlushBridge}
            disabled={loading}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 rounded-xl transition-all flex items-center gap-2.5 shadow-md group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-200">Flush Bridge Node</div>
              <div className="text-[10px] text-slate-400">Upload to backend API</div>
            </div>
          </button>

          {/* Tamper Packet */}
          <button
            onClick={onTamperDemo}
            disabled={loading}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-rose-500/30 hover:border-rose-400 text-rose-300 rounded-xl transition-all flex items-center gap-2.5 shadow-md group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-200">Tamper Ciphertext</div>
              <div className="text-[10px] text-slate-400">Verify AES-GCM failure</div>
            </div>
          </button>

          {/* Replay Packet */}
          <button
            onClick={onReplayDemo}
            disabled={loading}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-400 text-amber-300 rounded-xl transition-all flex items-center gap-2.5 shadow-md group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-200">Replay Attack Demo</div>
              <div className="text-[10px] text-slate-400">Verify duplicate drop</div>
            </div>
          </button>

          {/* 3 Concurrent Bridges */}
          <button
            onClick={onConcurrentDemo}
            disabled={loading}
            className="sm:col-span-2 p-3 bg-gradient-to-r from-indigo-950/80 to-slate-900 hover:from-indigo-900/80 hover:to-slate-850 border border-indigo-500/40 hover:border-indigo-400 text-indigo-200 rounded-xl transition-all flex items-center gap-3 shadow-lg group text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-100 flex items-center gap-2">
                Simulate 3 Concurrent Bridges (Killer Demo)
                <span className="px-2 py-0.5 text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                  Redis SET-NX
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                POSTs identical packet simultaneously from 3 bridges. Expects 1 SETTLED & 2 DUPLICATE_DROPPED.
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800">
        <button
          onClick={onResetMesh}
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 text-xs font-mono py-2 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Reset Mesh & Idempotency Cache
        </button>
      </div>
    </div>
  );
}
