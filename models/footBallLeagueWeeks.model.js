const constants = require('../config/constants');

const footBallLeagueWeeksSchema = new mongoose.Schema({
    _leagueId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'footBallLeagueSchedules'
    },
    leagueName:{
      type: String
    },
    leagueSeason:{
      type: String
    },
    gameId:{
      type: String,
      default : null,
    },
    stage: {
      type: String,
      default: null
    },
    weekNumber: {
      type: String
    },
    round: {
      type: String,
      default: null
    },
    status:{
      type: Number,
      default : constants.MATCH_STATUS.OPEN
    },
    startTime:{
      type: Number
    },
    startMatchDate:{
      type: String,
      default: null
    },
    startMatchTime:{
      type: String,
      default: null
    },
    matchStatus:{
      type: String
    },
    matchVenue: {
      type: String
    },
    matchVenueId: {
      type: String
    },
    matchVenueCity: {
      type: String
    },
    matchStaticId: {
      type: String
    },
    matchId: {
      type: String
    },
    localTeam:{
      type: String
    },
    localTeamId:{
      type: String
    },
    visitorTeam: {
      type: String
    },
    visitorTeamId: {
      type: String
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
  
  module.exports = mongoose.model('footBallLeagueWeeks', footBallLeagueWeeksSchema);