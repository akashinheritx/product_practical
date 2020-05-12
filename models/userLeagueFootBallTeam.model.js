const constants = require('../config/constants');

const userLeagueFootBallTeamSchema = new mongoose.Schema({
    _userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users'
    },
    _leagueContestId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'footballleaguecontests'
    },
    _leagueId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'footballleagueschedules'
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
  
  module.exports = mongoose.model('userLeagueFootBallTeams', userLeagueFootBallTeamSchema);