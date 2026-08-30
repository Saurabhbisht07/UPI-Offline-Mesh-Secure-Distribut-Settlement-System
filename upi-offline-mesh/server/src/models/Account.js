const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    vpa: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    holderName: {
      type: String,
      required: true
    },
    balance: {
      type: Number,
      required: true,
      min: 0
    },
    version: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Account', accountSchema);
