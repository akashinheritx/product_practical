const constants = require('../config/constants');

const usedPromosBySameDeviceSchema = new mongoose.Schema({
    deviceId: {
      type: String,
      default: null
    },
    usedPromoCode: {
        type: String,
        default: null
    },
    _userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users'
    },
    createdAt: {
      type: Number
    },
    updatedAt: {
      type: Number
    },
    syncAt: {
      type: Number
    },
    deletedAt: {
      type: Number,
      default: null
    }
  });
  
  module.exports = mongoose.model('usedPromosBySameDevices', usedPromosBySameDeviceSchema);
  