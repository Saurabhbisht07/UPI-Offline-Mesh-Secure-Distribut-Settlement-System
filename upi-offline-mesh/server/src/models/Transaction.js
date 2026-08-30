const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    packetHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    senderVpa: {
      type: String,
      required: true
    },
    receiverVpa: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    signedAt: {
      type: Date,
      required: true
    },
    settledAt: {
      type: Date,
      default: Date.now
    },
    bridgeNodeId: {
      type: String,
      required: true
    },
    hopCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['SETTLED', 'REJECTED'],
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);
