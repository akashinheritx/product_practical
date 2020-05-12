const constants = require('../config/constants');

const staticFootBallLeagueSchedulesSchema = new mongoose.Schema({
  countryName: {
    type: String
  },
  leagueName:{
    type: String
  },
  season:{
    type: String
  },
  status : {
    type: Number,
    default : constants.LEAGUE_STATUS.STATIC_LEAGUE,
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

module.exports = mongoose.model('staticFootBallLeagueSchedules', staticFootBallLeagueSchedulesSchema);