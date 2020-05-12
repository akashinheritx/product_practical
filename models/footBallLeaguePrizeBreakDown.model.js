const constants = require('../config/constants');

const footBallLeaguePrizeBreakDownSchema = new mongoose.Schema({
    _leagueContestId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'footballleaguecontests'
    },
    from: {
      type: Number
    },
    to:{
      type: Number
    },
    amount:{
      type: Number
    },
    additionalGift : {
      type: Number,
      default : constants.ADDITIONAL_GIFT.NO
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
  
  module.exports = mongoose.model('footBallLeaguePrizeBreakDowns', footBallLeaguePrizeBreakDownSchema);