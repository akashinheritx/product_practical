const constants = require('../config/constants');

const footBallLeagueSchedulesSchema = new mongoose.Schema({
  countryName: {
    type: String
  },
  leagueName:{
    type: String
  },
  season:{
    type: String
  },
  leagueId: {
    type: String
  },
  stageId: {
    type: String
  },
  status : {
    type: Number,
    default : constants.LEAGUE_STATUS.ENROLL,
  },
  startTime:{
    type: Number,
    default : null,
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

module.exports = mongoose.model('footBallLeagueSchedules', footBallLeagueSchedulesSchema);