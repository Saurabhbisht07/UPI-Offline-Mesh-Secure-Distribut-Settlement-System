const mongoose = require('mongoose');
const serverKeyHolder = require('../crypto/serverKeyHolder');
const demoService = require('../services/demoService');
const meshSimulatorService = require('../simulator/meshSimulatorService');
const bridgeIngestionService = require('../services/bridgeIngestionService');
const idempotencyService = require('../services/idempotencyService');
const settlementService = require('../services/settlementService');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { emitEvent } = require('../sockets/socketHandler');

class ApiController {
  // GET /api/server-key
  async getServerKey(req, res) {
    return res.json({
      publicKey: serverKeyHolder.getPublicKeyBase64(),
      algorithm: 'RSA-2048 / OAEP-SHA256',
      hybridScheme: 'RSA-OAEP encrypts an AES-256-GCM session key'
    });
  }

  // POST /api/demo/send
  async demoSend(req, res) {
    try {
      const { senderVpa, receiverVpa, amount, pin, ttl, startDevice } = req.body;

      if (!senderVpa || !receiverVpa || !amount) {
        return res.status(400).json({ error: 'senderVpa, receiverVpa, and amount are required' });
      }

      const packet = await demoService.createPacket(
        senderVpa,
        receiverVpa,
        amount,
        pin || '1234',
        ttl || 5
      );

      const targetDevice = startDevice || 'phone-alice';
      meshSimulatorService.inject(targetDevice, packet);

      emitEvent('payment:injected', {
        packetId: packet.packetId,
        senderVpa,
        receiverVpa,
        amount,
        startDevice: targetDevice,
        ttl: packet.ttl,
        ciphertextHash: require('../crypto/hybridCryptoService').hashCiphertext(packet.ciphertext)
      });

      return res.json({
        packetId: packet.packetId,
        ciphertextPreview: packet.ciphertext.substring(0, 64) + '...',
        ttl: packet.ttl,
        injectedAt: targetDevice,
        packet
      });
    } catch (err) {
      console.error('[API] demoSend error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/mesh/state
  async meshState(req, res) {
    try {
      const devices = meshSimulatorService.getDevices().map((d) => ({
        deviceId: d.getDeviceId(),
        hasInternet: d.hasInternet(),
        packetCount: d.packetCount(),
        packetIds: d.getHeldPackets().map((p) => p.packetId.substring(0, 8)),
        packets: d.getHeldPackets()
      }));

      const cacheSize = await idempotencyService.size();

      return res.json({
        devices,
        idempotencyCacheSize: cacheSize
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/mesh/gossip
  async meshGossip(req, res) {
    try {
      const result = meshSimulatorService.gossipOnce();

      emitEvent('gossip:round', {
        transfers: result.transfers,
        deviceCounts: result.deviceCounts
      });

      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/mesh/flush
  async meshFlush(req, res) {
    try {
      const uploads = meshSimulatorService.collectBridgeUploads();

      const results = await Promise.all(
        uploads.map(async (up) => {
          const r = await bridgeIngestionService.ingest(
            up.packet,
            up.bridgeNodeId,
            5 - up.packet.ttl
          );
          return {
            bridgeNode: up.bridgeNodeId,
            packetId: up.packet.packetId.substring(0, 8),
            fullPacketId: up.packet.packetId,
            outcome: r.outcome,
            reason: r.reason || '',
            transactionId: r.transactionId || null,
            packetHash: r.packetHash
          };
        })
      );

      emitEvent('bridge:flush', {
        uploadsAttempted: uploads.length,
        results
      });

      return res.json({
        uploadsAttempted: uploads.length,
        results
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/mesh/reset
  async meshReset(req, res) {
    try {
      meshSimulatorService.resetMesh();
      await idempotencyService.clear();

      emitEvent('mesh:reset', { status: 'mesh and idempotency cache cleared' });

      return res.json({ status: 'mesh and idempotency cache cleared' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/bridge/ingest
  async ingest(req, res) {
    try {
      const packet = req.body;
      const bridgeNodeId = req.headers['x-bridge-node-id'] || 'unknown';
      const hopCount = parseInt(req.headers['x-hop-count'] || '0', 10);

      const r = await bridgeIngestionService.ingest(packet, bridgeNodeId, hopCount);

      emitEvent('packet:ingested', {
        bridgeNodeId,
        hopCount,
        outcome: r.outcome,
        reason: r.reason,
        packetHash: r.packetHash
      });

      return res.json(r);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/accounts
  async listAccounts(req, res) {
    try {
      if (mongoose.connection.readyState === 1) {
        let accounts = await Account.find().sort({ vpa: 1 });
        if (accounts.length === 0) {
          await demoService.seedAccounts();
          accounts = await Account.find().sort({ vpa: 1 });
        }
        return res.json(accounts);
      } else {
        const map = demoService.getInMemoryAccounts();
        return res.json(Array.from(map.values()));
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/transactions
  async listTransactions(req, res) {
    try {
      if (mongoose.connection.readyState === 1) {
        const transactions = await Transaction.find().sort({ settledAt: -1 }).limit(50);
        return res.json(transactions);
      } else {
        return res.json(settlementService.getInMemoryTransactions().slice(0, 50));
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/demo/tamper
  async demoTamper(req, res) {
    try {
      const packet = await demoService.createPacket('alice@demo', 'bob@demo', 250, '1234', 5);

      // Mutate one character in the Base64 ciphertext
      const chars = packet.ciphertext.split('');
      const mid = Math.floor(chars.length / 2);
      chars[mid] = chars[mid] === 'A' ? 'B' : 'A';
      packet.ciphertext = chars.join('');

      const result = await bridgeIngestionService.ingest(packet, 'bridge-tamper-demo', 2);

      emitEvent('demo:tamper', {
        packetId: packet.packetId,
        result
      });

      return res.json({
        description: 'Tampered ciphertext byte; AES-GCM tag validation failed.',
        packet,
        result
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/demo/replay
  async demoReplay(req, res) {
    try {
      const packet = await demoService.createPacket('alice@demo', 'bob@demo', 150, '1234', 5);

      // Ingest 1st time
      const firstIngest = await bridgeIngestionService.ingest(packet, 'bridge-1', 1);

      // Replay identical packet
      const replayIngest = await bridgeIngestionService.ingest(packet, 'bridge-replay-attempt', 1);

      emitEvent('demo:replay', {
        packetId: packet.packetId,
        firstIngest,
        replayIngest
      });

      return res.json({
        description: 'Replayed identical encrypted packet.',
        firstIngest,
        replayIngest
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/demo/concurrent-duplicate
  async demoConcurrentDuplicate(req, res) {
    try {
      const packet = await demoService.createPacket('alice@demo', 'bob@demo', 300, '1234', 5);

      // Fire 3 simultaneous ingestion attempts
      const bridgeNodes = ['bridge-node-alpha', 'bridge-node-beta', 'bridge-node-gamma'];
      const results = await Promise.all(
        bridgeNodes.map((nodeId) => bridgeIngestionService.ingest(packet, nodeId, 3))
      );

      const settledCount = results.filter((r) => r.outcome === 'SETTLED').length;
      const duplicateCount = results.filter((r) => r.outcome === 'DUPLICATE_DROPPED').length;

      emitEvent('demo:concurrent', {
        packetId: packet.packetId,
        settledCount,
        duplicateCount,
        results
      });

      return res.json({
        description: 'Simulated 3 bridge nodes posting identical packet simultaneously.',
        settledCount,
        duplicateCount,
        results
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/stats
  async getStats(req, res) {
    try {
      const devices = meshSimulatorService.getDevices();
      let totalPacketsInMesh = 0;

      devices.forEach((d) => {
        totalPacketsInMesh += d.packetCount();
      });

      let settledCount = 0;
      let rejectedCount = 0;

      if (mongoose.connection.readyState === 1) {
        settledCount = await Transaction.countDocuments({ status: 'SETTLED' });
        rejectedCount = await Transaction.countDocuments({ status: 'REJECTED' });
      } else {
        const txs = settlementService.getInMemoryTransactions();
        settledCount = txs.filter((t) => t.status === 'SETTLED').length;
        rejectedCount = txs.filter((t) => t.status === 'REJECTED').length;
      }

      const cacheSize = await idempotencyService.size();

      return res.json({
        virtualDevicesCount: devices.length,
        packetsInMesh: totalPacketsInMesh,
        idempotencyCacheSize: cacheSize,
        settledTransactions: settledCount,
        rejectedTransactions: rejectedCount
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new ApiController();
