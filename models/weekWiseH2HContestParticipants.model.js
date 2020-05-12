const constants = require('../config/constants');

const weekWiseH2HContestParticipantsSchema = new mongoose.Schema({
  _leagueContestId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'footballleaguecontests'
  },
  _leagueTeamId1: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'userleaguefootballteams'
  },
  _leagueTeamId2: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'userleaguefootballteams'
  },
  weekNumber : {
    type: String,
    default: 1
  },
  team1Points: {
    type: Number,
    default: constants.DEFAULT_NUMBER
  },
  team2Points: {
    type: Number,
    default: constants.DEFAULT_NUMBER
  },
  team1GameWeekPoints: {
    type: Number,
    default: constants.DEFAULT_NUMBER
  },
  team2GameWeekPoints: {
    type: Number,
    default: constants.DEFAULT_NUMBER
  },
  createdAt: {
    type: Number
  },
  updatedAt: {
    type: Number
  },
  deletedAt: {
    type: Number,
    default: null
  }
});

module.exports = mongoose.model('weekWiseH2HContestParticipants', weekWiseH2HContestParticipantsSchema);