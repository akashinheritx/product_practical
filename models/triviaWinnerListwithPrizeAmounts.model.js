const triviaWinnerListwithPrizeAmountsSchema = new mongoose.Schema({
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
    totalCorrectAnswer:{
      type: Number,
      default:0
    },
    totalTimeSpent:{
      type: Number,
      default:0
    },
    totalTimeSpentInMilliSec:{
      type: Number,
      default: null,
    },
    rank:{
      type: Number,
    },
    count:{
      type: Number,
    },
    prizeAmountEarned:{
      type: Number,
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
  
  module.exports = mongoose.model('triviaWinnerListwithPrizeAmounts', triviaWinnerListwithPrizeAmountsSchema);