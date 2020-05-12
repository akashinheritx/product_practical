const router = express.Router();
const {registerValidator, updateUserProfileValidator, updateUserPasswordValidator, updateUserMobileNumberValidator, updateUserEmailValidator} = require('../../middleware/validation/register.validator');
const {createFootBallLeagueContestValidator} = require('../../middleware/validation/createFootBallLeagueContest.validator');
const {createFootBallDFSContestValidator} = require('../../middleware/validation/createFootBallDFSContest.validator');
const {panCardValidator} = require('../../middleware/validation/panCard.validator');
const {kitValidator, updateKitValidator} = require('../../middleware/validation/kit.validator');
const {boosterPurchaseValidator, appleBoosterPurchaseValidator} = require('../../middleware/validation/booster.validator');
const {validatorFunc} = require('../../helper/commonFunction.helper');
const userController = require('../controllers/user.controller');
const userTriviaController = require('../controllers/userTrivia.controller');
const followerController = require('../controllers/follower.controller');
const userDFSController = require('../controllers/userDFS.controller');
const userLeagueController = require('../controllers/userLeague.controller');
const cmsController = require('../controllers/cms.controller');
const cashFreePGController = require('../controllers/cashFreePaymentGateway.controller');
const cashFreePayOutController = require('../controllers/cashFreePayOut.controller');
const auth = require('../../middleware/auth.middleware');
const profileUpload = require('../../middleware/uploadProfileImage');
const kitImageController = require('../controllers/kitImage.controller');
const kitImageUpload = require('../../middleware/uploadKitImage');

router.post('/register', profileUpload, registerValidator, validatorFunc, userController.register);
router.post('/register-pancard-details', auth, profileUpload, panCardValidator, validatorFunc, userController.registerPanCardDetails);
router.post('/user-login', userController.userLogin);
router.post('/user-social-login', userController.userSocialLogin);
router.post('/resend-otp', userController.resendOtp);
router.post('/verify-account', userController.verifyUser);

router.post('/send-otp-to-mobile', auth, updateUserMobileNumberValidator, validatorFunc, userController.sendOtpForMobileVerification);
router.post('/verify-user-mobile-number', auth, userController.verifyUserMobileNumber);
router.post('/send-otp-to-email', auth, updateUserEmailValidator, validatorFunc, userController.sendOtpForEmailVerification);
router.post('/verify-user-email', auth, userController.verifyUserEmail);

router.post('/change-password', auth, updateUserPasswordValidator, validatorFunc, userController.changePassword);
router.get('/get-user-boosters', auth, userController.getUserBoosters);
router.get('/get-user-profile', auth, userController.getUserProfile);
router.get('/get-user-badge', auth, userController.getUserBadgeDetail);
router.get('/get-any-user-profile/:_userId', auth, userController.getAnyUserProfile);
router.get('/get-all-refrred-users', auth, userController.getAllReferredUserData);
router.post('/update-user-profile', auth, profileUpload, updateUserProfileValidator, validatorFunc, userController.updateUserProfile);
router.post('/forgot-password', userController.forgotPassword);
router.post('/set-password', updateUserPasswordValidator, validatorFunc, userController.setNewPassword);
router.get('/logout', auth, userController.logoutSingleDevice);
router.get('/logout-all', auth, userController.logoutAllDevice);

// Download APK File
router.get('/download-apk', userController.downloadAPKFile);

//Notification routes
router.get('/get-all-notifications', auth, userController.getAllNotifications);
router.get('/read-all-notifications', auth, userController.readAllNotifications);
router.get('/get-notification-count', auth, userController.getNotificationCount);

router.post('/forgot-password-with-otp', userController.sendOtp);
router.post('/set-new-password-with-otp', userController.setNewPasswordByOTP);

//Kit roues:
router.post('/add-user-kit', auth, kitImageUpload, kitValidator, validatorFunc, kitImageController.addUserKit);
router.get('/get-user-kit', auth, kitImageController.getUserKit);
router.post('/update-user-kit', auth, kitImageUpload, updateKitValidator, validatorFunc, kitImageController.updateUserKit);

// Followers/Following routes:
router.get('/getFollowers', auth, followerController.getFollowersList)
router.get('/getFollowing', auth, followerController.getFollowingList)
router.post('/followUser/:id', auth, followerController.followUser)
router.post('/unfollowUser/:id', auth, followerController.unfollowUser)

// User trivia routes
router.post('/enroll-in-trivia',auth, userTriviaController.enrollInTrivia);
router.post('/submit-trivia-answers', auth, userTriviaController.submitTriviaAnswer);
router.get('/get-upcoming-trivia-list', auth, userTriviaController.getUpComingTriviaList);
router.get('/get-single-trivia-details/:_triviaId',auth, userTriviaController.getTrivia);
router.get('/get-single-trivia-questions/:_triviaId',auth, userTriviaController.getTriviaQuestion);
router.get('/get-trivia-question-answer-summary/:_triviaId',auth, userTriviaController.getQuetionAnswerSummary);
router.get('/get-winner-list/:_triviaId', auth, userTriviaController.getTriviaWinnerList);
router.get('/get-enrolled-trivia-details', auth, userTriviaController.getEnrolledTriviaDetails);
router.get('/get-past-enrolled-trivia-details', auth, userTriviaController.getPastEnrolledTriviaDetails);

//Get single cms details
router.get('/cms/get-single-cms/:id', auth, cmsController.getSingleCms);

//User Cashfree routes
router.post('/deposit-balance', auth, cashFreePGController.depositBalance);

router.post('/notify-deposit-balance', cashFreePGController.notifyDepositBalance);

router.post('/verify-transaction-status', auth, cashFreePGController.verifyTransactionStatus);

router.post('/booster-purchase', auth, boosterPurchaseValidator, validatorFunc, cashFreePGController.boosterPurchase);
router.post('/verify-appstore-receipt', auth, appleBoosterPurchaseValidator, validatorFunc, cashFreePGController.verifyAppStoreReceipt);
router.post('/notify-booster-balance', cashFreePGController.notifyBoosterBalance);
router.post('/verify-booster-transaction-status', auth, cashFreePGController.verifyBoosterTransactionStatus);

//Payout cashfree routes

// router.post('/generate-token', cashFreePayOutController.generateToken);
router.post('/add-beneficiary', auth, cashFreePayOutController.addBeneficiary);
router.get('/get-beneficiary', auth, cashFreePayOutController.getBeneficiary);
router.get('/remove-beneficiary', auth, cashFreePayOutController.removeUserBeneficiary)
// router.post('/remove-beneficiary-by-id', auth, cashFreePayOutController.removeBeneficiary);
router.post('/request-transfer', auth, cashFreePayOutController.requestTransfer);
router.post('/notify-transaction-details', cashFreePayOutController.notifyTransactionDetails);

router.get('/get-balance', cashFreePayOutController.getBalance);
router.get('/get-all-beneficiaries', cashFreePayOutController.getAllBeneficiaries);
router.get('/get-beneficiary-by-id/:beneId', cashFreePayOutController.getBeneficiaryById);
router.get('/get-beneficiary-by-account-and-ifsc-code', cashFreePayOutController.getBeneficiaryByAccountAndIFSCCode);
router.get('/validate-bank-details', cashFreePayOutController.validateBankAccountAndIFSCCode);

//User wallet History
router.get('/get-wallet-history', auth, userController.getUserWalletHistory);

//User dfs routes
router.get('/get-up-coming-matches', auth, userDFSController.getUpComingMatchList);
router.get('/get-match-player-list/:_id', auth, userDFSController.getMatchPlayerList);
router.get('/get-single-match-details/:_matchId', auth, userDFSController.getSingleMatchDetails);
router.get('/get-up-coming-dfs-contest/:_matchId', auth, userDFSController.getUpComingDFSContestList);
router.get('/get-single-dfs-contest/:_dfsContestId', auth, userDFSController.getSingleDFSContest);
router.get('/get-single-dfs-contest-by-referral/:referralCode', auth, userDFSController.getSingleDFSContestByReferralCode);
router.get('/get-all-football-formations', auth, userDFSController.getAllFootBallFormations);
router.post('/enroll-in-football-dfs-contest',auth, userDFSController.enrollInDFSContest);
router.get('/get-enrolled-football-dfs-contest-details/:_matchId', auth, userDFSController.getEnrolledFootBallDFSContestDetails);
router.get('/get-past-enrolled-football-dfs-contest-details', auth, userDFSController.getPastEnrolledFootBallDFSContestDetails);
router.post('/create-user-dfs-contest', auth, createFootBallDFSContestValidator, validatorFunc, userDFSController.createUserDFSContest);
router.get('/get-contest-team-player-list/:_teamId', auth, userDFSController.getContestTeamPlayerList);
router.post('/update-contest-team-player-list', auth, userDFSController.updateTeamInDFSContest);
router.get('/get-participated-user-list/:_dfsContestId', auth, userDFSController.getContestParticipatedUserList);
router.get('/get-participated-user-player-list/:_dfsContestId/:_dfsTeamId', auth, userDFSController.getContestParticipatedUserPlayerList);
router.get('/get-live-upcoming-past-match-list', auth, userDFSController.getLiveUpComingPastFootBallDFSMatchDetails);
router.get('/get-past-enrolled-contest-list/:_matchId', auth, userDFSController.getPastFootBallDFSEnrolledContests);
router.post('/get-ai-team-player-list', auth, userDFSController.getAITeamPlayerList);
router.get('/get-dfs-winner-list/:_dfsContestId/:_dfsTeamId', auth, userDFSController.getDFSWinnerList);
router.get('/get-player-stats/:_dfsTeamId/:_playerId', auth, userDFSController.getPlayerStats);
router.get('/get-team-image/:gameTeamId', userDFSController.getTeamImage);
router.get('/get-player-image/:gamePlayerId', userDFSController.getplayerImage);

//User league rotes
router.get('/get-up-coming-leagues', auth, userLeagueController.getUpComingLeagueList);
router.get('/get-league-player-list/:_id', auth, userLeagueController.getLeaguePlayerList);
router.get('/get-up-coming-league-contest/:_leagueId', auth, userLeagueController.getUpComingLeagueContestList);
router.get('/get-single-league-contest/:_leagueContestId', auth, userLeagueController.getSingleLeagueContest);
router.get('/get-single-league-contest-by-referral/:referralCode', auth, userLeagueController.getSingleLeagueContestByReferralCode);
router.get('/get-league-contest-team-player-list/:_leagueTeamId/:gameWeek', auth, userLeagueController.getLeagueContestTeamPlayerList);
router.post('/enroll-in-football-league-contest',auth, userLeagueController.enrollInLeagueContest);
router.post('/create-user-league-contest', auth, createFootBallLeagueContestValidator, validatorFunc, userLeagueController.createUserLeagueContest);
router.get('/get-live-upcoming-past-league-list', auth, userLeagueController.getLiveUpComingPastFootBallLeagueDetails);
router.get('/get-enrolled-football-league-contest-details/:_leagueId', auth, userLeagueController.getEnrolledFootBallLeagueContestDetails);
router.get('/get-past-enrolled-league-contest-list/:_leagueId', auth, userLeagueController.getPastFootBallEnrolledLeagueContests);
router.get('/get-league-contest-participated-user-list/:_leagueContestId', auth, userLeagueController.getLeagueContestParticipatedUserList);
router.get('/get-working-leaderboard/:_leagueContestId/:_leagueTeamId', auth, userLeagueController.getWorkingLeaderBoard);
router.get('/get-league-contest-participated-user-player-list/:_leagueContestId/:_leagueTeamId/:weekNumber', auth, userLeagueController.getLeagueContestParticipatedUserPlayerList);
router.post('/get-league-ai-team-player-list', auth, userLeagueController.getAITeamPlayerList);
router.get('/get-league-contest-winner-list/:_leagueContestId/:_leagueTeamId', auth, userLeagueController.getLeagueWinnerList);
router.post('/update-league-contest-team-player-list', auth, userLeagueController.updateTeamInLeagueContest);
router.get('/get-previous-current-next-weeks/:_leagueId', auth, userLeagueController.getPreviousCurrentNextWeek);
router.get('/get-league-player-stats/:_leagueTeamId/:_playerId/:weekNumber', auth, userLeagueController.getPlayerStatsForLeagueWeek);

module.exports = router;