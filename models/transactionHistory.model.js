const constants = require('../config/constants');

const transactionHistorySchema = new mongoose.Schema({
  _userId:{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users'
  },
  orderId: {
    type: String,
    default: null
  },
  referenceId:{
    type: String,
    default: null
  },
  orderAmount:{
    type: Number,
    default: null
  },
  orderCurrency:{
    type: String,
    default: null
  },
  orderNote:{
    type: String,
    default: null
  },
  source: {
    type: String,
    default: null
  },
  customerEmail:{
    type: String,
    default: null
  },
  customerName:{
    type: String,
    default: null
  },
  customerPhone:{
    type: String,
    default: null
  },
  tokenData:{
    type: String,
    default: null
  },
  txStatus: {
    type: String,
    default: null
  },
  txMsg: {
    type: String,
    default: null
  },
  txTime: {
    type: String,
    default: null
  },
  paymentMode: {
    type: String,
    default: null
  },
  acknowledged: {
    type: Number,
    default: null
  },
  reason: {
    type: String,
    default: null
  },
  utr: {
    type: String,
    default: null
  },
  signature: {
    type: String,
    default: null
  },
  transactionVia:{
    type: Number,
    default: constants.TRANSACTION_VIA.CASH_FREE
  },
  transactionFor:{
    type: Number,
    default: constants.REAL_TRANSACTION_FOR.DEPOSIT
  },
  boosters: [{
    _boosterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'globalboostersettings'
    },
    boosterType:{
      type: Number,
		},
    boosterQty:{
      type: Number,
      default: 0,
    },
    boosterPrice:{
      type: Number,
      default: 0,
    }
  }],
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

module.exports = mongoose.model('transactionHistories', transactionHistorySchema);