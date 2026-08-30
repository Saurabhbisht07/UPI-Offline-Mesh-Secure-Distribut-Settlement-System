import React from 'react';
import { Smartphone, Package, RefreshCw, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    {
      title: 'Virtual Devices',
      value: stats.virtualDevicesCount || 5,
      subText: '4 Offline + 1 Bridge',
      icon: Smartphone,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Packets in Mesh',
      value: stats.packetsInMesh || 0,
      subText: 'Pending gossip delivery',
      icon: Package,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Gossip Transfers',
      value: stats.gossipRounds || 0,
      subText: 'Mesh hops executed',
      icon: RefreshCw,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      title: 'Idempotency Cache',
      value: stats.idempotencyCacheSize || 0,
      subText: 'Redis SET-NX keys',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Settled Transactions',
      value: stats.settledTransactions || 0,
      subText: 'Ledger debited & credited',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Rejected / Duplicate',
      value: stats.rejectedTransactions || 0,
      subText: 'Dropped / Mismatched',
      icon: XCircle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${card.bgColor} backdrop-blur-sm flex flex-col justify-between transition-all hover:scale-[1.02] shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">{card.title}</span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="mt-3">
              <div className={`text-2xl font-bold font-mono ${card.color}`}>{card.value}</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">{card.subText}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
