const constants = require('../config/constants');

const globalGeneralSettingsSchema = new mongoose.Schema({
    referralAmount:{
        type: Number,
        default:0,
    },
    welcomeEmail:{
        type:String,
    },
    supportEmail:{
        type:String,
    },
    adminProfitPercentage:{
        type:Number,
        default:0,
    },
    triviaAnswerTiming:{
        type:Number,
        default:0,
    },
    triviaAdminCut:{
        type:Number,
        default:0,
    },
    triviaMaxQuestions:{
        type:Number,
        default:0,
    },
    getTriviaQuestionTiming:{
        type: Number,
        default: 3,
    },
    triviaMinStartHours:{
        type:Number,
        default: 2,
    },
    triviaMinStartDay:{
        type:Number,
        default:0,
    },
    triviaMaxStartDay:{
        type:Number,
        default:0,
    },
    triviaMinEnrollStartHours:{
        type:Number,
        default:1,
    },
    triviaMinEnrollStartDay:{
        type:Number,
        default:0,
    },
    triviaMaxEnrollStartDay:{
        type:Number,
        default:0,
    },
    triviaEnrollEndTime:{
        type:Number,
        default:0,
    },
    triviaNotifyTime:{
        type:Number,
        default:0,
    },
    triviaWinnerListGenerateTime:{
        type:Number,
        default:0,
    },
    dfsAdminCut:{
        type:Number,
        default:0,
    },
    dfsMinStartDay:{
        type:Number,
        default:0,
    },
    dfsMaxStartDay:{
        type:Number,
        default:0,
    },
    dfsMinEnrollStartDay:{
        type:Number,
        default:0,
    },
    dfsMaxEnrollStartDay:{
        type:Number,
        default:0,
    },
    dfsEnrollEndTime:{
        type:Number,
        default:0,
    },
    dfsNotifyTime:{
        type:Number,
        default:0,
    },
    dfsWinnerListGenerateTime:{
        type:Number,
        default:0,
    },
    leagueAdminCut:{
        type:Number,
        default:0,
    },
    leagueMinStartDay:{
        type:Number,
        default:0,
    },
    leagueMaxStartDay:{
        type:Number,
        default:0,
    },
    leagueMinEnrollStartDay:{
        type:Number,
        default:0,
    },
    leagueMaxEnrollStartDay:{
        type:Number,
        default:0,
    },
    leagueEnrollEndTime:{
        type:Number,
        default:0,
    },
    leagueNotifyTime:{
        type:Number,
        default:0,
    },
    leagueWinnerListGenerateTime:{
        type:Number,
        default:0,
    },
    showStaticLeague:{
        type:Number,
        default:0,
    },
    privateContestMinCreateTime:{
        type:Number,
        default:0,
    },
    dayInNumber:{
        type:Number,
        default:0,
    },
    hourInNumber:{
        type:Number,
        default:0,
    },
    minuteInNumber:{
        type:Number,
        default:0,
    },
    secondInNumber:{
        type:Number,
        default:0,
    },
    weekInMilisec:{
        type:Number,
    },
    dayInMilisec:{
        type:Number,
    },
    hourInMilisec:{
        type:Number,
    },
    minuteInMilisec:{
        type:Number,
    },
    secInMilisec:{
        type:Number,
    },
    botUserPercentInPlatform:{
        type:Number,
    },
    pointDeductionPerExtraTransfer:{
        type:Number,
        default:0,
    },
    keepAmountInUserWinningWallet:{
        type:Number,
        default:0,
    },
    giftClaimEmail : {
        type: String,
    },
    join12TH30Count : {
        type: Number,
    },
    join12TH50Count : {
        type: Number,
    },
    join12TH75Count : {
        type: Number,
    },
    join12TH110Count : {
        type: Number,
    },
    join12TH250Count : {
        type: Number,
    },
    adminEmailForTDS : {
        type: String,
    },
    tdsPercentage : {
        type: Number,
    },
    tdsAmount : {
        type: Number,
    },
    captainPoints:{
        type: Number
    },
    viceCaptainPoints:{
        type: Number
    },
    isDepositFunctinalityAvailable:{
        type: Number,
        default : constants.STATUS.ACTIVE
    },
    isPayOutFunctinalityAvailable:{
        type: Number,
        default : constants.STATUS.ACTIVE
    },
    payOutNotifyTime:{
        type: Number,
        default : constants.NOTIFY_TIME
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

module.exports = mongoose.model('globalGeneralSettings', globalGeneralSettingsSchema);