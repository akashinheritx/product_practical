const constants = require("../config/constants");

const livePlayerStatsSchema = new mongoose.Schema({
    position: {
        type: String,
        default: constants.DEFAULT_VALUE
    },
    pass: {
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    dribble: {
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    foul: {
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    yellowCard: {
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    redCard:{
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    shot: {
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    tackle: {
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    missedPenalty: {
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    ownGoal: {
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    assist:{
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    goalScored: {
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    minsPlayed:{
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    cleanSheet:{
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    saves:{
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    penaltySave:{
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    goalConceded:{
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    totalPoints:{
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    playerId:{
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    _playerId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'footballplayernames'
    },
    matchId:{
        type: Number,
        default: constants.DEFAULT_NUMBER
    },
    _matchId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'footballleagueweeks'
    },
    _leagueId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'footballleagueschedules'
    },
    weekNumber: {
        type: String,
        default: null
    },
    matchDate:{
        type: String,
        default: null
    },
    matchTime:{
        type: String,
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

module.exports = mongoose.model('livePlayerStats', livePlayerStatsSchema);