import React, { useState } from 'react';
import { Eye, Lock, ShieldCheck, FileText, ChevronRight } from 'lucide-react';

export default function PacketInspector({ devices = [] }) {
  // Collect all packets currently held in mesh
  const allPackets = [];
  devices.forEach((d) => {
    (d.packets || d.heldPackets || []).forEach((p) => {
      allPackets.push({
        ...p,
        heldBy: d.deviceId,
        hasInternet: d.hasInternet
      });
    });
  });

  const [selectedPacketId, setSelectedPacketId] = useState(null);

  const selectedPacket = allPackets.find((p) => p.packetId === selectedPacketId) || allPackets[0];

  return (
    <div className="bg-[#111726]/90 border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            Packet Inspector (Intermediary View)
          </h3>
          <span className="text-[10px] font-mono px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-md flex items-center gap-1">
            <Lock className="w-3 h-3" /> Encrypted Payload
          </span>
        </div>

        {allPackets.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-xs font-mono text-slate-500">
            No packets currently in the mesh. Inject a payment to inspect over-the-wire data.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Packet selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {allPackets.map((pkt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPacketId(pkt.packetId)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono whitespace-nowrap transition-all ${
                    (selectedPacket && selectedPacket.packetId === pkt.packetId)
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  #{pkt.packetId.substring(0, 8)} ({pkt.heldBy})
                </button>
              ))}
            </div>

            {selectedPacket && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500">Packet ID:</span>
                    <div className="font-bold text-cyan-400 break-all">{selectedPacket.packetId}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Hop TTL Remaining:</span>
                    <div className="font-bold text-indigo-400">{selectedPacket.ttl} hops</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Location Node:</span>
                    <div className="font-bold text-slate-200">{selectedPacket.heldBy}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Created At:</span>
                    <div className="text-slate-400">{new Date(selectedPacket.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Opaque RSA-OAEP + AES-GCM Ciphertext:</span>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-[10px] text-cyan-300/80 break-all max-h-24 overflow-y-auto leading-relaxed">
                    {selectedPacket.ciphertext}
                  </div>
                </div>

                <div className="p-2.5 bg-cyan-950/30 border border-cyan-500/20 rounded-lg text-[11px] text-cyan-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-cyan-200">Security Guarantee:</strong>
                    Intermediate phones only route opaque ciphertext bytes and routing metadata. VPA, Amount, PIN, and Nonce remain strictly confidential until backend HSM/RSA private key decryption.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
