const mongoose = require('mongoose');

const constants = require('../config/constants');

const footBallPlayerNamesSchema = new mongoose.Schema({
    teamId: {
      type: String
    },
    teamName: {
      type: String
    },
    playerId: {
      type: String
    },
    playerName: {
      type: String
    },
    playerNumber:{
      type: String
    },
    playerPosition:{
      type: String
    },
    playerRating:{
      type: Number
    },
    playerImage:{
      type: String,
      default : constants.DEFAULT_PLAYER_IMAGE,
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
  
  module.exports = mongoose.model('footBallPlayerNames', footBallPlayerNamesSchema);