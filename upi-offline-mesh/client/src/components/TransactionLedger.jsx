import React from 'react';
import { History, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

export default function TransactionLedger({ transactions = [] }) {
  return (
    <div className="bg-[#111726]/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          Permanent Transaction Ledger
        </h3>
        <span className="text-[10px] font-mono px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-md">
          Immutable DB Ledger
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-xs font-mono text-slate-500">
          No transactions settled yet. Inject a payment and flush the bridge node.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Sender</th>
                <th className="pb-3 px-3">Receiver</th>
                <th className="pb-3 px-3">Amount</th>
                <th className="pb-3 px-3">Ciphertext SHA-256 Hash</th>
                <th className="pb-3 px-3">Bridge Node</th>
                <th className="pb-3 px-3">Hops</th>
                <th className="pb-3 px-3">Settled At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.map((tx, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition-colors text-slate-300">
                  <td className="py-3 px-3">
                    {tx.status === 'SETTLED' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3" /> SETTLED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold flex items-center gap-1 w-max">
                        <XCircle className="w-3 h-3" /> REJECTED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-cyan-300 font-semibold">{tx.senderVpa}</td>
                  <td className="py-3 px-3 text-indigo-300 font-semibold">{tx.receiverVpa}</td>
                  <td className="py-3 px-3 font-bold text-slate-100">
                    ₹{parseFloat(tx.amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[10px] font-mono">
                    {tx.packetHash ? `${tx.packetHash.substring(0, 16)}...` : 'N/A'}
                  </td>
                  <td className="py-3 px-3 text-slate-400">{tx.bridgeNodeId}</td>
                  <td className="py-3 px-3 text-slate-400">{tx.hopCount}</td>
                  <td className="py-3 px-3 text-slate-500 text-[10px]">
                    {new Date(tx.settledAt || tx.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
