const router = express.Router();

const {registerValidator} = require('../../middleware/validation/register.validator');
const adminController = require('../controllers/admin.controller');
const subAdminController = require('../controllers/subAdmin.controller');
const accountantController = require('../controllers/accountant.controller');
const userController = require('../controllers/user.controller');
const globalGeneralSettingsController = require('../controllers/globalGeneralSettings.controller');
const globalTeamSettingsController = require('../controllers/globalTeamSettings.controller');
const globalBoosterSettingsController = require('../controllers/globalBoosterSettings.controller');
const globalPointSettingsController = require('../controllers/globalPointSettings.controller');
const botController = require('../controllers/bot.controller');
const adminTriviaController = require('../controllers/adminTrivia.controller');
const footBallFormationController = require('../controllers/footBallFormation.controller');
const adminDFSController = require('../controllers/adminDFS.controller');
const adminLeagueController = require('../controllers/adminLeague.controller');
const auth = require('../../middleware/auth.middleware');
const adminAccess = require('../../middleware/adminAccess.middleware');
const adminSubAdminAccess = require('../../middleware/adminSubAdminAccess.middleware');
const profileUpload = require('../../middleware/uploadProfileImage');
const badgeController = require('../controllers/badge.controller');
const cmsController = require('../controllers/cms.controller');
const badgeUpload = require('../../middleware/uploadBadgeImage');
const apkUpload = require('../../middleware/uploadAPKFile');
const { addStaticFootBallLeagueValidator } = require('../../middleware/validation/addStaticFootBallLeagueSchedule.validator');
const { badgeValidator, updateBadgeValidator } = require('../../middleware/validation/badge.validator');
const { cmsValidator, updateCmsValidator } = require('../../middleware/validation/cms.validator');
const { globalGeneralSettingsValidator, updateGlobalGeneralSettingsValidator } = require('../../middleware/validation/globalGeneralSettings.validator');
const { globalTeamSettingsValidator, updateGlobalTeamSettingsValidator } = require('../../middleware/validation/globalTeamSettings.validator');
const { globalBoosterSettingsValidator, updateGlobalBoosterSettingsValidator } = require('../../middleware/validation/globalBoosterSettings.validator');
const { globalPointSettingsValidator, updateGlobalPointSettingsValidator } = require('../../middleware/validation/globalPointSettings.validator');
const {createTriviaValidator, editTriviaValidator} = require('../../middleware/validation/createTrivia.validator');
const {createFootBallDFSContestValidator} = require('../../middleware/validation/createFootBallDFSContest.validator');
const {createFootBallLeagueContestValidator} = require('../../middleware/validation/createFootBallLeagueContest.validator');
const {createFootBallFormationValidator} = require('../../middleware/validation/createFootBallFormation.validator');
const {validatorFunc} = require('../../helper/commonFunction.helper');

//admin routes
router.post('/admin-login', adminController.adminLogin);

router.get('/get-dashboard', auth, adminSubAdminAccess, adminController.adminDashBoard);

router.get('/user-transactions', auth, adminSubAdminAccess, adminController.getUserTransactions);
router.get('/generate-csv-for-transactions', auth, adminSubAdminAccess, adminController.generateCsvForTransactions);
router.get('/user-stat-by-locations', auth, adminSubAdminAccess, adminController.getUserStatByCountry);
router.get('/user-stat-by-locations/:country', auth, adminSubAdminAccess, adminController.getUserStatByState);
router.get('/user-stat-by-locations/:country/:state', auth, adminSubAdminAccess, adminController.getUserStatByCity);
router.get('/user-stat-by-age', auth, adminSubAdminAccess, adminController.getUserStatByAge);

router.post('/create-sub-admin', auth, adminAccess, profileUpload, registerValidator, validatorFunc, userController.register);
router.get('/get-all-sub-admins', auth, adminAccess, subAdminController.getSubAdminData);
router.post('/active-deactive-sub-admin/:id', auth, adminAccess, subAdminController.activateDeactivateSubAdmin);

router.post('/create-accountant', auth, adminAccess, profileUpload, registerValidator, validatorFunc, userController.register);
router.get('/get-all-accountants', auth, adminAccess, accountantController.getAccountantData);
router.post('/active-deactive-accountant/:id', auth, adminAccess, accountantController.activateDeactivateAccountant);

router.get('/get-all-users', auth, adminAccess, userController.getAllUsersProfile);
router.post('/active-deactive-user/:id', auth, adminAccess, userController.activateDeactivateUser);

//Upload apk File
router.post('/upload-apk', auth, adminAccess, apkUpload, adminController.uploadAPKFile);

// Badge routes
router.post('/badge/create-badge', auth, adminSubAdminAccess, badgeUpload, badgeValidator, validatorFunc, badgeController.addBadge);
router.get('/badge/get-badge/:id', auth, adminSubAdminAccess, badgeController.getBadge);
router.get('/badge/get-badge-list', auth, adminSubAdminAccess, badgeController.getBadgeList);
router.post('/badge/update-badge/:id', auth, adminSubAdminAccess, badgeUpload, updateBadgeValidator, validatorFunc, badgeController.updateBadge);
router.delete('/badge/delete-badge/:id', auth, adminSubAdminAccess, badgeController.deleteBadge);

// CMS routes
router.post('/cms/create-cms', auth, adminSubAdminAccess, cmsValidator, validatorFunc, cmsController.addCms);
router.get('/cms/get-cms-list', cmsController.getCmsList);
router.get('/cms/get-single-cms/:id', auth, adminSubAdminAccess, cmsController.getSingleCms);
router.post('/cms/update-cms/:id', auth, adminSubAdminAccess, updateCmsValidator, validatorFunc, cmsController.updateCms);
router.delete('/cms/delete-cms/:id', auth, adminSubAdminAccess, cmsController.deleteCms);

//Global general settings routes
router.post('/create-global-general-settings', auth, adminSubAdminAccess, globalGeneralSettingsValidator, validatorFunc, globalGeneralSettingsController.createGlobalGeneralSettings);
router.post('/update-global-general-settings', auth, adminSubAdminAccess, updateGlobalGeneralSettingsValidator, validatorFunc, globalGeneralSettingsController.updateGlobalGeneralSettings);
router.get('/get-global-general-settings', globalGeneralSettingsController.getGlobalGeneralSettings);

//Global team settings routes
router.post('/create-global-team-settings', auth, adminSubAdminAccess, globalTeamSettingsValidator, validatorFunc, globalTeamSettingsController.createGlobalTeamSettings);
router.post('/update-global-team-settings', auth, adminSubAdminAccess, updateGlobalTeamSettingsValidator, validatorFunc, globalTeamSettingsController.updateGlobalTeamSettings);
router.get('/get-global-team-settings', auth, globalTeamSettingsController.getGlobalTeamSettings);

//Global booster settings routes
router.post('/create-global-booster-settings', auth, adminSubAdminAccess, globalBoosterSettingsValidator, validatorFunc, globalBoosterSettingsController.createGlobalBoosterSettings);
router.post('/update-global-booster-settings', auth, adminSubAdminAccess, updateGlobalBoosterSettingsValidator, validatorFunc, globalBoosterSettingsController.updateGlobalBoosterSettings);
router.get('/get-global-booster-settings/:_boosterId', auth, adminSubAdminAccess, globalBoosterSettingsController.getGlobalBoosterSettings);
router.get('/get-all-global-booster-settings', auth, globalBoosterSettingsController.getAllGlobalBoosterSettings);

//Global point settings routes
router.post('/create-global-point-settings', auth, adminSubAdminAccess, globalPointSettingsValidator, validatorFunc, globalPointSettingsController.createGlobalPointSettings);
// router.post('/update-global-point-settings', auth, adminSubAdminAccess, updateGlobalPointSettingsValidator, validatorFunc, globalPointSettingsController.updateGlobalPointSettings);
router.post('/update-global-point-settings', auth, adminSubAdminAccess, globalPointSettingsValidator, validatorFunc, globalPointSettingsController.updateGlobalPointSettings);
router.get('/get-all-global-point-settings', auth, globalPointSettingsController.getAllGlobalPointSettings);
router.get('/get-global-point-settings/:actionName', auth, adminSubAdminAccess, globalPointSettingsController.getGlobalPointSettings);

//Bot routes
router.post('/addBots', auth, adminSubAdminAccess, botController.addBots);
router.post('/add-bots-via-admin', auth, adminSubAdminAccess, adminController.addBotUserToPlatformViaAdmin);
router.get('/duplicateBots', auth, adminSubAdminAccess, botController.getDuplicates);

//Trivia routes
router.post('/createTrivia', auth, adminSubAdminAccess, createTriviaValidator, validatorFunc, adminTriviaController.createTrivia);
router.get('/getAllTrivias', auth, adminSubAdminAccess, adminTriviaController.getAllTrivias);
router.get('/getTrivia/:_triviaId', auth, adminSubAdminAccess, adminTriviaController.getTrivia);
router.post('/editTrivia/:id', auth, adminSubAdminAccess, editTriviaValidator, validatorFunc, adminTriviaController.editTrivia);
router.get('/get-single-trivia-winner-list/:_triviaId', auth, adminSubAdminAccess, adminTriviaController.getSingleTriviaWinnerList);
router.get('/cancel-trivia/:_triviaId', auth, adminSubAdminAccess, adminTriviaController.cancelTrivia);

//Football formation
router.post('/create-football-formation', auth, adminSubAdminAccess, createFootBallFormationValidator, validatorFunc, footBallFormationController.createFootBallFormation);
router.get('/get-all-football-formations', auth, adminSubAdminAccess, footBallFormationController.getAllFootBallFormations);

//DFS routes
router.get('/get-up-coming-matches', auth, adminSubAdminAccess, adminDFSController.getUpComingMatchList);
router.get('/get-match-player-list/:_id', auth, adminSubAdminAccess, adminDFSController.getMatchPlayerList);
router.post('/create-dfs-contest', auth, adminSubAdminAccess, createFootBallDFSContestValidator, validatorFunc, adminDFSController.createDFSContest);
router.get('/get-up-coming-dfs-contest/:_matchId', auth, adminSubAdminAccess, adminDFSController.getUpComingDFSContestList);
router.get('/get-single-dfs-contest/:_dfsContestId', auth, adminSubAdminAccess, adminDFSController.getSingleDFSContest);
router.get('/get-past-matches', auth, adminSubAdminAccess, adminDFSController.getPastMatchList);
router.get('/get-past-dfs-contest/:_matchId', auth, adminSubAdminAccess, adminDFSController.getPastDFSContestList);
router.get('/get-single-dfs-winner-list/:_dfsContestId', auth, adminSubAdminAccess, adminDFSController.getSingleDFSWinnerList);
router.get('/cancel-single-dfs-contest/:_dfsContestId', auth, adminSubAdminAccess, adminDFSController.cancelSingleDFSContest);
router.get('/cancel-all-dfs-contests/:_matchId', auth, adminSubAdminAccess, adminDFSController.cancelAllDFSContestForMatch);
router.get('/generate-single-dfs-contest-leaderboard/:_dfsContestId', auth, adminSubAdminAccess, adminDFSController.generateLeaderBoardForSingleDFSContest);
router.get('/generate-all-dfs-contests-leaderboard/:_matchId', auth, adminSubAdminAccess, adminDFSController.generateLeaderBoardForAllDFSContests);

//League routes
router.post('/add-static-league', auth, adminAccess, addStaticFootBallLeagueValidator, validatorFunc, adminLeagueController.addStaticLeagues);
router.delete('/delete-static-league/:_leagueId', auth, adminAccess, adminLeagueController.deleteStaticLeague);
router.get('/get-up-coming-leagues', auth, adminSubAdminAccess, adminLeagueController.getUpComingLeagueList);
router.get('/get-league-player-list/:_id', auth, adminSubAdminAccess, adminLeagueController.getLeaguePlayerList);
router.post('/create-league-contest', auth, adminSubAdminAccess, createFootBallLeagueContestValidator, validatorFunc, adminLeagueController.createLeagueContest);
router.get('/get-up-coming-league-contest/:_leagueId', auth, adminSubAdminAccess, adminLeagueController.getUpComingLeagueContestList);
router.get('/get-single-league-contest/:_leagueContestId', auth, adminSubAdminAccess, adminLeagueController.getSingleLeagueContest);
router.get('/get-past-leagues', auth, adminSubAdminAccess, adminLeagueController.getPastLeagueList);
router.get('/get-past-league-contest/:_leagueId', auth, adminSubAdminAccess, adminLeagueController.getPastLeagueContestList);
router.get('/get-single-league-winner-list/:_leagueContestId', auth, adminSubAdminAccess, adminLeagueController.getSingleLeagueWinnerList);
router.get('/cancel-single-league-contest/:_leagueContestId', auth, adminSubAdminAccess, adminLeagueController.cancelSingleLeagueContest);
router.get('/cancel-all-league-contests/:_leagueId', auth, adminSubAdminAccess, adminLeagueController.cancelAllLeagueContests);
router.get('/generate-single-league-contest-leaderboard/:_leagueContestId', auth, adminSubAdminAccess, adminLeagueController.generateLeaderBoardForSingleLeagueContest);
router.get('/generate-all-league-contests-leaderboard/:_leagueId', auth, adminSubAdminAccess, adminLeagueController.generateLeaderBoardForAllLeagueContests);

module.exports = router;