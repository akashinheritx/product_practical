const globalTeamSettingsSchema = new mongoose.Schema({
    minNoOfGoalKeeper: {
        type: Number,
    },
    maxNoOfGoalKeeper: {
        type: Number,
    },
    minNoOfDefender: {
        type: Number,
    },
    maxNoOfDefender: {
        type: Number,
    },
    minNoOfStrikers: {
        type: Number,
    },
    maxNoOfStrikers: {
        type: Number,
    },
    minNoOfMidfielders: {
        type: Number,
    },
    maxNoOfMidfielders: {
        type: Number,
    },
    substitutesInElevenFormat:{
        type: Number,
    },
    substitutesInThreeFormat:{
        type: Number,
    },
    creditToElevenTeam: {
        type: Number,
    },
    creditToThreeTeam: {
        type: Number,
    },
    creditToElevenTeamInLeague: {
        type: Number,
    },
    creditToThreeTeamInLeague: {
        type: Number,
    },
    maxPlayersFromSameTeamInEleven: {
        type: Number,
    },
    minPlayersFromSameTeamInEleven: {
        type: Number,
    },
    maxPlayersFromSameTeamInThree: {
        type: Number,
    },
    minPlayersFromSameTeamInThree: {
        type: Number,
    },
    noOfTeamInContest: {
        type: Number,
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

module.exports = mongoose.model('globalTeamSettings', globalTeamSettingsSchema);