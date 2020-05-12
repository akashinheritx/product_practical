const walletHistorySchema = new mongoose.Schema({
    _userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    amount: {
        type: Number
    },
    referredStatus:{
        type: Number,
        default: null,
    },
    referredByName:{
        type: String,
        default: null
    },
    _teamId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
    _leagueContestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'footballleaguecontests',
        default: null,
    },
    leagueContestName:{
        type: String,
        default: null
    },
    _triviaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'trivias',
        default: null,
    },
    triviaName:{
        type: String,
        default: null
    },
    _dfsContestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'footballdfscontests',
        default: null,
    },
    dfsContestName:{
        type: String,
        default: null
    },
    orderId:{
        type: String,
        default: null
    },
    competitionType:{
        type: Number,
        default: null,
    },
    reason:{
        type: String,
        default: null
    },
    transactionType:{
        type: Number
    },
    transactionFor:{
        type: Number
    },
    referralWallet:{
        type: Number,
        default: 0,
    },
    winningWallet:{
        type: Number,
        default: 0,
    },
    depositWallet:{
        type: Number,
        default: 0,
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

module.exports = mongoose.model('walletHistories', walletHistorySchema);