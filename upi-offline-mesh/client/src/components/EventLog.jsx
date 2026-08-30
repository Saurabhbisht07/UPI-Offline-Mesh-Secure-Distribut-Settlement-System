import React, { useRef, useEffect } from 'react';
import { Terminal, Shield, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export default function EventLog({ logs = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogBadge = (type) => {
    switch (type) {
      case 'settled':
        return <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">SETTLED</span>;
      case 'duplicate':
        return <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">DUPLICATE DROPPED</span>;
      case 'tamper':
      case 'invalid':
        return <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 font-bold">INVALID / REJECTED</span>;
      case 'gossip':
        return <span className="text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 font-bold">MESH GOSSIP</span>;
      case 'injected':
        return <span className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 font-bold">INJECTED</span>;
      default:
        return <span className="text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-bold">INFO</span>;
    }
  };

  return (
    <div className="bg-[#0b0e17] border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col justify-between font-mono">
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            Real-Time System & Security Event Stream
          </h3>
          <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live WebSocket Feed
          </span>
        </div>

        <div
          ref={scrollRef}
          className="space-y-2 max-h-72 overflow-y-auto pr-2 text-xs text-slate-300 leading-relaxed scrollbar-thin"
        >
          {logs.length === 0 ? (
            <div className="text-slate-600 text-[11px] py-4 text-center">
              System ready. Waiting for mesh events...
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-1.5 hover:bg-slate-900/60 rounded transition-colors">
                <span className="text-slate-500 text-[10px] shrink-0 pt-0.5">[{log.timestamp}]</span>
                <div className="shrink-0">{getLogBadge(log.type)}</div>
                <div className="break-all text-[11px]">{log.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
