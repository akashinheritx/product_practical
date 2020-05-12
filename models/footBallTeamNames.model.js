const constants = require('../config/constants');

const footBallTeamNamesSchema = new mongoose.Schema({
    teamCountry: {
        type: String
    },
    teamId: {
      type: String
    },
    teamName: {
      type: String
    },
    teamImage: {
      type: String,
      default : constants.DEFAULT_TEAM_IMAGE,
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
  
  module.exports = mongoose.model('footBallTeamNames', footBallTeamNamesSchema);