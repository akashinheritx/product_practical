const constants = require('../config/constants');

const matchWiseParticipantsPointForLeagueSchema = new mongoose.Schema({
    _leagueContestId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'footballleaguecontests'
    },
    _matchId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'footballleagueweeks'
    },
    _teamId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'userleaguefootballteams'
    },
    weekNumber: {
      type: String
    },
    totalPointsEarned:{
      type: Number,
      default: constants.DEFAULT_NUMBER
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
      default: constants.DEFAULT_VALUE
    }
  });
  
  module.exports = mongoose.model('matchWiseParticipantsPointForLeague', matchWiseParticipantsPointForLeagueSchema);