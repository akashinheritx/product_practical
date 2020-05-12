const constants = require('../config/constants');

const leagueWeekMasterSchema = new mongoose.Schema({
  _leagueId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'footballleagueschedules'
  },
  weekNumber: {
    type: String
  },
  weekFirstMatchStartTime:{
    type: Number
  },
  weekFirstMatchDate:{
    type: String,
    default : null
  },
  weekFirstMatchTime:{
    type: String,
    default : null
  },
  weekLastMatchStartTime:{
    type: Number,
  },
  weekLastMatchDate:{
    type: String,
    default : null
  },
  weekLastMatchTime:{
    type: String,
    default : null
  },
  status:{
    type: Number,
    default: constants.LEAGUE_WEEK_STATUS.ENROLL
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

module.exports = mongoose.model('leagueWeekMasters', leagueWeekMasterSchema);