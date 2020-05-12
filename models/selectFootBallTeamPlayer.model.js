const constants = require('../config/constants');

const selectFootBallTeamPlayerSchema = new mongoose.Schema({
    gameWeek : {
      type : String,
    },
    _teamId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'userfootballteams'
    },
    _playerId:{
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'footballplayernames'
    },
    gameTeamId:{
      type: String,
      required: true,
    },
    teamName:{
      type: String,
      required: true,
    },
    gamePlayerId:{
      type: String,
      required: true,
    },
    playerName:{
      type: String,
      required: true,
    },
    playerPosition:{
      type: String,
      required: true,
    },
    playerRating:{
      type: Number,
      required: true,
    },
    playerRole:{
      type: String,
      required: true,
    },
    isCaptain:{
      type: Number,
      required: true,
      default: constants.IS_CAPTAIN.NO
    },
    isViceCaptain:{
      type: Number,
      required: true,
      default: constants.IS_VICE_CAPTAIN.NO
    },  
    totalPoints:{
      type: Number,
      default:0
    },
    status:{
      type: Number,
      default:constants.STATUS.ACTIVE,
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
  
  module.exports = mongoose.model('selectFootBallTeamPlayers', selectFootBallTeamPlayerSchema);