const constants = require('../config/constants');

const userFootBallTeamSchema = new mongoose.Schema({
    _userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users'
    },
    _dfsContestId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'footballdfscontests'
    },
    _matchId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'footballleagueweeks'
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
  
  module.exports = mongoose.model('userFootBallTeams', userFootBallTeamSchema);