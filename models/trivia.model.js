const constants = require('../config/constants');

const triviaSchema = new mongoose.Schema({
  _adminId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users'
  },
  title: {
    type: String
  },
  enrollStartTime:{
    type: Number
  },
  enrollEndTime:{
    type: Number
  },
  startTime: {
    type: Number
  },
  endTime: {
    type: Number
  },
  entryFee: {
    type: Number
  },
  maxParticipants: {
    type: Number
  },
  minParticipants: {
    type: Number
  },
  totalQuestions:{
    type: Number,
  },
  totalPrize:{
    type: Number,
  },
  currentParticipants: {
    type: Number,
    default: 0,
  },
  status:{
    type: Number,
    default: constants.TRIVIA_STATUS.ENROLL
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

module.exports = mongoose.model('trivias', triviaSchema);