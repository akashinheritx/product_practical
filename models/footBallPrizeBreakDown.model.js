const constants = require('../config/constants');

const footBallPrizeBreakDownSchema = new mongoose.Schema({
  _dfsContestId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'footballdfscontests'
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
  
  module.exports = mongoose.model('footBallPrizeBreakDowns', footBallPrizeBreakDownSchema);