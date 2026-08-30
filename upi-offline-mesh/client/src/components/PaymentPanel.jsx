import React, { useState } from 'react';
import { Send, Lock, DollarSign, UserCheck, Key, ShieldCheck } from 'lucide-react';

export default function PaymentPanel({ onInjectPayment, loading }) {
  const [senderVpa, setSenderVpa] = useState('alice@demo');
  const [receiverVpa, setReceiverVpa] = useState('bob@demo');
  const [amount, setAmount] = useState('500');
  const [pin, setPin] = useState('1234');
  const [ttl, setTtl] = useState(5);
  const [startDevice, setStartDevice] = useState('phone-alice');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onInjectPayment({
      senderVpa,
      receiverVpa,
      amount: parseFloat(amount),
      pin,
      ttl: parseInt(ttl, 10),
      startDevice
    });
  };

  return (
    <div className="bg-[#111726]/90 border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            Inject Offline Payment Intent
          </h3>
          <span className="text-[10px] font-mono px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-md flex items-center gap-1">
            <Lock className="w-3 h-3" /> RSA Encrypted
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1">Sender VPA (Offline Device)</label>
            <div className="relative">
              <select
                value={senderVpa}
                onChange={(e) => setSenderVpa(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="alice@demo">alice@demo (₹5,000.00)</option>
                <option value="bob@demo">bob@demo (₹1,000.00)</option>
                <option value="carol@demo">carol@demo (₹2,500.00)</option>
                <option value="dave@demo">dave@demo (₹500.00)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Receiver VPA</label>
            <select
              value={receiverVpa}
              onChange={(e) => setReceiverVpa(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="bob@demo">bob@demo</option>
              <option value="alice@demo">alice@demo</option>
              <option value="carol@demo">carol@demo</option>
              <option value="dave@demo">dave@demo</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">UPI PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Max Hop TTL</label>
              <input
                type="number"
                value={ttl}
                min="1"
                max="10"
                onChange={(e) => setTtl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Injection Node</label>
              <select
                value={startDevice}
                onChange={(e) => setStartDevice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="phone-alice">phone-alice</option>
                <option value="phone-stranger1">phone-stranger1</option>
                <option value="phone-bridge">phone-bridge</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 text-xs"
          >
            <Send className="w-4 h-4" />
            Inject Payment Into Mesh
          </button>
        </form>
      </div>
    </div>
  );
}
