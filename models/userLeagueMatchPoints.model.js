const constants = require("../config/constants");

const userLeagueMatchPointsSchema = new mongoose.Schema({
    _leagueId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'footballleagueschedules'
    },
    weekNumber: {
        type: String,
        default: null
    },
    _lgContestId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'footballdfscontests'
    },
    _matchId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'footballleagueweeks'
    },
    _lgTeamId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'userfootballteams'
    },
    matchPoints: {
        type: Number,
        default: constants.DEFAULT_VALUE
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
        default: constants.DEFAULT_VALUE
    }
});

module.exports = mongoose.model('userLeagueMatchPoints', userLeagueMatchPointsSchema);