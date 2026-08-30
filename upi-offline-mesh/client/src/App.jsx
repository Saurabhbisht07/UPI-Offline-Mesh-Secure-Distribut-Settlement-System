import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import MeshVisualizer from './components/MeshVisualizer';
import PaymentPanel from './components/PaymentPanel';
import DemoControls from './components/DemoControls';
import PacketInspector from './components/PacketInspector';
import TransactionLedger from './components/TransactionLedger';
import AccountBalances from './components/AccountBalances';
import EventLog from './components/EventLog';

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const addLog = (type, message) => {
    const timeStr = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { type, message, timestamp: timeStr }].slice(-50));
  };

  const refreshAll = async () => {
    try {
      const [meshRes, accRes, txRes, statsRes] = await Promise.all([
        axios.get('/api/mesh/state'),
        axios.get('/api/accounts'),
        axios.get('/api/transactions'),
        axios.get('/api/stats')
      ]);

      if (meshRes.data) {
        setDevices(meshRes.data.devices || []);
      }
      if (accRes.data) setAccounts(accRes.data);
      if (txRes.data) setTransactions(txRes.data);
      if (statsRes.data) setStats(statsRes.data);
    } catch (err) {
      console.warn('Refresh error:', err.message);
    }
  };

  useEffect(() => {
    refreshAll();

    const socket = io('/', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setIsConnected(true);
      addLog('info', 'Connected to backend WebSocket server.');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      addLog('invalid', 'Disconnected from WebSocket server.');
    });

    socket.on('payment:injected', (data) => {
      addLog('injected', `Payment ₹${data.amount} injected at ${data.startDevice} (${data.senderVpa} -> ${data.receiverVpa}). Ciphertext Hash: ${data.ciphertextHash.substring(0, 16)}...`);
      refreshAll();
    });

    socket.on('gossip:round', (data) => {
      addLog('gossip', `Gossip round completed: ${data.transfers} packet transfers between mesh nodes.`);
      refreshAll();
    });

    socket.on('bridge:flush', (data) => {
      addLog('info', `Bridge node uploaded ${data.uploadsAttempted} packets to backend ingestion API.`);
      refreshAll();
    });

    socket.on('packet:ingested', (data) => {
      if (data.outcome === 'SETTLED') {
        addLog('settled', `Backend decrypted & SETTLED packet ${data.packetHash.substring(0, 12)}... via bridge ${data.bridgeNodeId}`);
      } else if (data.outcome === 'DUPLICATE_DROPPED') {
        addLog('duplicate', `Backend atomic idempotency claim rejected DUPLICATE packet ${data.packetHash.substring(0, 12)}...`);
      } else {
        addLog('invalid', `Backend REJECTED invalid packet ${data.packetHash.substring(0, 12)}... Reason: ${data.reason}`);
      }
      refreshAll();
    });

    socket.on('mesh:reset', () => {
      addLog('info', 'Mesh simulation and idempotency cache reset.');
      refreshAll();
    });

    socket.on('demo:tamper', (data) => {
      addLog('tamper', `Security Demo: Single ciphertext byte modified. AES-GCM tag verification failed as expected (${data.result.reason}).`);
      refreshAll();
    });

    socket.on('demo:replay', (data) => {
      addLog('duplicate', `Replay Security Demo: Duplicate packet submitted. Idempotency layer caught and dropped replay (${data.replayIngest.outcome}).`);
      refreshAll();
    });

    socket.on('demo:concurrent', (data) => {
      addLog('settled', `3-Bridge Concurrency Demo: 3 simultaneous uploads finished. Settled: ${data.settledCount}, Duplicates Dropped: ${data.duplicateCount}. Account debited exactly ONCE.`);
      refreshAll();
    });

    return () => socket.disconnect();
  }, []);

  const handleInjectPayment = async (payload) => {
    setLoading(true);
    try {
      await axios.post('/api/demo/send', payload);
    } catch (err) {
      addLog('invalid', `Failed to inject payment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunGossip = async () => {
    setLoading(true);
    try {
      await axios.post('/api/mesh/gossip');
    } catch (err) {
      addLog('invalid', `Gossip error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFlushBridge = async () => {
    setLoading(true);
    try {
      await axios.post('/api/mesh/flush');
    } catch (err) {
      addLog('invalid', `Flush error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTamperDemo = async () => {
    setLoading(true);
    try {
      await axios.post('/api/demo/tamper');
    } catch (err) {
      addLog('invalid', `Tamper demo error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReplayDemo = async () => {
    setLoading(true);
    try {
      await axios.post('/api/demo/replay');
    } catch (err) {
      addLog('invalid', `Replay demo error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConcurrentDemo = async () => {
    setLoading(true);
    try {
      await axios.post('/api/demo/concurrent-duplicate');
    } catch (err) {
      addLog('invalid', `Concurrent demo error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetMesh = async () => {
    setLoading(true);
    try {
      await axios.post('/api/mesh/reset');
    } catch (err) {
      addLog('invalid', `Reset error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans pb-12">
      <Header isConnected={isConnected} isDbConnected={true} isRedisConnected={true} />

      <main className="max-w-7xl w-full mx-auto px-6 mt-6 space-y-6 flex-1">
        {/* Top KPI Cards */}
        <StatsCards stats={stats} />

        {/* Mesh Topology Visualization */}
        <MeshVisualizer devices={devices} />

        {/* Action Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentPanel onInjectPayment={handleInjectPayment} loading={loading} />
          <DemoControls
            onRunGossip={handleRunGossip}
            onFlushBridge={handleFlushBridge}
            onTamperDemo={handleTamperDemo}
            onReplayDemo={handleReplayDemo}
            onConcurrentDemo={handleConcurrentDemo}
            onResetMesh={handleResetMesh}
            loading={loading}
          />
        </div>

        {/* Inspector & Event Log Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PacketInspector devices={devices} />
          <EventLog logs={logs} />
        </div>

        {/* Account Balances */}
        <AccountBalances accounts={accounts} />

        {/* Transaction Ledger */}
        <TransactionLedger transactions={transactions} />
      </main>
    </div>
  );
}
