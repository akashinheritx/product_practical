const constants = require('../config/constants');

const enrollFootBallLeagueContestSchema = new mongoose.Schema({
    _userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users'
    },
    userName:{
      type: String,
      required: true,
    },
    _leagueId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'footballleagueschedules'
    },
    _leagueContestId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'footballleaguecontests'
    },
    _leagueTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'userleaguefootballteams'
    },
    appliedBoosters:[{
      _boosterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'globalboostersettings'
      },
      boosterCount : {
        type: Number,
      },
      boosterAssignedBy : {
        type: Number,
        default : constants.BOOSTER_ASSIGNED_BY.SYSTEM,
      },
      weekNumber : {
        type: String,
      },
      teamIds : [],
      playerIds : [],
    }],
    temporaryBoosters:[{
      _boosterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'globalboostersettings'
      },
      boosterCount : {
        type: Number,
      },
      boosterAssignedBy : {
        type: Number,
        default : constants.BOOSTER_ASSIGNED_BY.SYSTEM,
      },
      weekNumber : {
        type: String,
      },
      teamIds : [],
      playerIds : [],
    }],
    totalPointsEarned:{
      type: Number,
      default:0
    },
    pointsEarnedInLastWeek:{
      type: Number,
      default:0
    },
    transferAvailable : {
      type: Number,
      default:0
    },
    transferCount : {
      type: Number,
      default:0
    },
    rank : {
      type: Number,
      default: null
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
  
  module.exports = mongoose.model('enrollFootBallLeagueContests', enrollFootBallLeagueContestSchema);