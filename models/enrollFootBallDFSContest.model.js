const constants = require('../config/constants');

const enrollFootBallDFSContestSchema = new mongoose.Schema({
    _userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users'
    },
    userName:{
      type: String,
      required: true,
    },
    _dfsContestId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'footballdfscontests'
    },
    _dfsTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'userfootballteams'
    },
    boosters:[{
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
      teamIds : [],
      playerIds : [],
    }],
    totalPointsEarned:{
      type: Number,
      default:0
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
  
  module.exports = mongoose.model('enrollFootBallDFSContests', enrollFootBallDFSContestSchema);