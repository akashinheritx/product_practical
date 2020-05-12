const dfsWinnerListwithPrizeAmountsSchema = new mongoose.Schema({
    _userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users'
    },
    userName:{
      type: String,
      required: true,
    },
    _dfsTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'userfootballteams'
    },
    _dfsContestId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'footballdfscontests'
    },
    totalPointsEarned:{
      type: Number,
      default:0
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
  
  module.exports = mongoose.model('dfsWinnerListwithPrizeAmounts', dfsWinnerListwithPrizeAmountsSchema);