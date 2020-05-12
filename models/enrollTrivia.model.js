const constants = require('../config/constants');

const enrollTriviaSchema = new mongoose.Schema({
    _userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users'
    },
    userName:{
      type: String,
      required: true,
    },
    _triviaId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'trivias'
    },
    attendStatus:{
      type: String,
      default: constants.USER_TRIVIA_STATUS.NOT_ATTENDED
    },
    totalCorrectAnswer:{
      type: Number,
      default: null,
    },
    totalTimeSpentForCorrectAnswer:{
      type: Number,
      default: null,
    },
    totalTimeSpentForCorrectAnswerInMilliSec:{
      type: Number,
      default: null,
    },
    totalWrongAnswer:{
      type: Number,
      default: null,
    },
    totalTimeSpentForWrongAnswer:{
      type: Number,
      default: null,
    },
    totalTimeSpentForWrongAnswerInMilliSec:{
      type: Number,
      default: null,
    },
    totalNotGivenAnswer:{
      type: Number,
      default: null,
    },
    totalTimeSpentForNotGivenAnswer:{
      type: Number,
      default: null,
    },
    totalTimeSpentForNotGivenAnswerInMilliSec:{
      type: Number,
      default: null,
    },
    totalAnswer:{
      type: Number,
      default: null,
    },
    totalTimeSpent:{
      type: Number,
      default: null,
    },
    totalTimeSpentInMilliSec:{
      type: Number,
      default: null,
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
  
  module.exports = mongoose.model('enrollTrivias', enrollTriviaSchema);