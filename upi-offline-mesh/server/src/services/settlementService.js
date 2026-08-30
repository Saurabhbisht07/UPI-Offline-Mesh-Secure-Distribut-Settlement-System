const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const demoService = require('./demoService');

const inMemoryTransactions = [];

class SettlementService {
  getInMemoryTransactions() {
    return inMemoryTransactions;
  }

  async settle(instruction, packetHash, bridgeNodeId, hopCount) {
    const { senderVpa, receiverVpa, amount, signedAt } = instruction;

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    if (mongoose.connection.readyState === 1) {
      const session = await mongoose.startSession().catch(() => null);
      if (session) {
        session.startTransaction();
      }

      try {
        const opts = session ? { session } : {};

        const sender = await Account.findOne({ vpa: senderVpa }, null, opts);
        const receiver = await Account.findOne({ vpa: receiverVpa }, null, opts);

        if (!sender) {
          throw new Error(`Unknown sender VPA: ${senderVpa}`);
        }
        if (!receiver) {
          throw new Error(`Unknown receiver VPA: ${receiverVpa}`);
        }

        if (sender.balance < amount) {
          console.warn(
            `[Settlement] Insufficient balance: ${sender.vpa} has ₹${sender.balance}, tried to send ₹${amount}`
          );
          const rejectedTx = await this.recordRejected(instruction, packetHash, bridgeNodeId, hopCount, opts);
          if (session) await session.commitTransaction();
          return rejectedTx;
        }

        sender.balance = parseFloat((sender.balance - amount).toFixed(2));
        receiver.balance = parseFloat((receiver.balance + amount).toFixed(2));
        sender.version = (sender.version || 0) + 1;
        receiver.version = (receiver.version || 0) + 1;

        await sender.save(opts);
        await receiver.save(opts);

        const tx = new Transaction({
          packetHash,
          senderVpa,
          receiverVpa,
          amount,
          signedAt: new Date(signedAt),
          settledAt: new Date(),
          bridgeNodeId,
          hopCount,
          status: 'SETTLED'
        });

        await tx.save(opts);

        if (session) {
          await session.commitTransaction();
        }

        console.log(
          `[Settlement] SETTLED ₹${amount} from ${senderVpa} to ${receiverVpa} (packetHash=${packetHash.substring(
            0,
            12
          )}..., bridge=${bridgeNodeId}, hops=${hopCount})`
        );

        return tx;
      } catch (err) {
        if (session) {
          await session.abortTransaction();
        }
        throw err;
      } finally {
        if (session) {
          session.endSession();
        }
      }
    } else {
      // In-memory settlement fallback for unit tests and standalone mode
      const accounts = demoService.getInMemoryAccounts();
      const sender = accounts.get(senderVpa);
      const receiver = accounts.get(receiverVpa);

      if (!sender) throw new Error(`Unknown sender VPA: ${senderVpa}`);
      if (!receiver) throw new Error(`Unknown receiver VPA: ${receiverVpa}`);

      if (sender.balance < amount) {
        console.warn(
          `[Settlement] Insufficient balance: ${sender.vpa} has ₹${sender.balance}, tried to send ₹${amount}`
        );
        return this.recordRejected(instruction, packetHash, bridgeNodeId, hopCount);
      }

      sender.balance = parseFloat((sender.balance - amount).toFixed(2));
      receiver.balance = parseFloat((receiver.balance + amount).toFixed(2));
      sender.version = (sender.version || 0) + 1;
      receiver.version = (receiver.version || 0) + 1;

      const tx = {
        _id: 'in-mem-tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        packetHash,
        senderVpa,
        receiverVpa,
        amount,
        signedAt: new Date(signedAt),
        settledAt: new Date(),
        bridgeNodeId,
        hopCount,
        status: 'SETTLED'
      };

      inMemoryTransactions.unshift(tx);

      console.log(
        `[Settlement] SETTLED ₹${amount} from ${senderVpa} to ${receiverVpa} (in-memory)`
      );

      return tx;
    }
  }

  async recordRejected(instruction, packetHash, bridgeNodeId, hopCount, opts = {}) {
    if (mongoose.connection.readyState === 1) {
      const tx = new Transaction({
        packetHash,
        senderVpa: instruction.senderVpa,
        receiverVpa: instruction.receiverVpa,
        amount: instruction.amount,
        signedAt: new Date(instruction.signedAt),
        settledAt: new Date(),
        bridgeNodeId,
        hopCount,
        status: 'REJECTED'
      });
      return await tx.save(opts);
    } else {
      const tx = {
        _id: 'in-mem-tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        packetHash,
        senderVpa: instruction.senderVpa,
        receiverVpa: instruction.receiverVpa,
        amount: instruction.amount,
        signedAt: new Date(instruction.signedAt),
        settledAt: new Date(),
        bridgeNodeId,
        hopCount,
        status: 'REJECTED'
      };
      inMemoryTransactions.unshift(tx);
      return tx;
    }
  }
}

module.exports = new SettlementService();
