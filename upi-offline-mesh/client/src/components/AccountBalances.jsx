import React from 'react';
import { CreditCard, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function AccountBalances({ accounts = [] }) {
  return (
    <div className="bg-[#111726]/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-cyan-400" />
          Simulated Core Bank Accounts
        </h3>
        <span className="text-[10px] font-mono px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md">
          Live Ledger Balances
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc, idx) => (
          <div
            key={idx}
            className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-md hover:border-cyan-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 font-mono">{acc.holderName}</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {acc.vpa}
              </span>
            </div>

            <div className="mt-4">
              <span className="text-[10px] text-slate-400 font-mono block">Available Balance</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                ₹{parseFloat(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="mt-3 text-[10px] font-mono text-slate-500 flex justify-between border-t border-slate-800/80 pt-2">
              <span>OptLock Version: #{acc.version || 0}</span>
              <span className="text-slate-400">Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
