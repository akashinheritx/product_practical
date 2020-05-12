const constants = require('../config/constants');

const footBallDFSContestSchema = new mongoose.Schema({
  _createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users'
  },
  userName:{
    type: String,
    default :null,
  },
  _matchId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'footballleagueweeks'
  },
  contestName: {
    type: String
  },
  enrollStartTime:{
    type: Number
  },
  enrollEndTime:{
    type: Number,
    required : true
  },
  startTime: {
    type: Number
  },
  entryFee: {
    type: Number
  },
  totalPrize:{
    type: Number,
  },
  maxParticipants: {
    type: Number,
    default : constants.DEFAULT_VALUE,
  },
  minParticipants: {
    type: Number,
    default : constants.DEFAULT_VALUE,
  },
  currentParticipants: {
    type: Number,
    default: 0,
  },
  status:{
    type: Number,
    default: constants.DFS_STATUS.ENROLL
  },
  boosters: [{
    _boosterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'globalboostersettings'
    },
    boosterCount:{
      type: Number,
      default: 0,
    }
  }],
  contestVisibility:{
    type: Number,
    default: constants.CONTEST_VISIBILITY.PUBLIC,
  },
  contestType:{
    type: Number,
    default: constants.CONTEST_TYPE.REGULAR,
  },
  optionType:{
    type: Number,
    default: constants.OPTION_TYPE.COMMON,
  },
  teamFormat:{
    type: Number,
    default: constants.TEAM_FORMAT.ELEVEN,
  },
  playerLimit:{
    type: Number,
  },
  referralCode: {
    type: String,
    default: null,
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

module.exports = mongoose.model('footBallDFSContests', footBallDFSContestSchema);