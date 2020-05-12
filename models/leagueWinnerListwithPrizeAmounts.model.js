const constants = require('../config/constants');

const leagueWinnerListwithPrizeAmountsSchema = new mongoose.Schema({
    _userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users'
    },
    userName:{
      type: String,
      required: true,
    },
    _leagueTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'userfootballteams'
    },
    _leagueContestId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'footballleaguecontests'
    },
    totalPointsEarned:{
      type: Number,
      default: constants.DEFAULT_NUMBER,
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
    additionalGift:{
      type: Number,
      default : constants.ADDITIONAL_GIFT.NO,
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
  
  module.exports = mongoose.model('leagueWinnerListwithPrizeAmounts', leagueWinnerListwithPrizeAmountsSchema);