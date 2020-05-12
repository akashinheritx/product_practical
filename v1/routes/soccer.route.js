const router = express.Router();

const soccerController = require('../controllers/soccer.controller');
const auth = require('../../middleware/auth.middleware');

router.get('/get-league-schedule', soccerController.getLeagueSchedule);
router.get('/get-league-team-list', soccerController.getLeagueTeamList);
router.get('/get-team-player-list', soccerController.getTeamPlayerList);
router.get('/get-single-player-data', soccerController.getSinglePlayerData);
router.get('/get-match-score', soccerController.getMatchScore);
router.get('/get-live-commentary', soccerController.getLiveCommentaryData);
router.get('/get-injury-data', soccerController.getInjuryData);

module.exports = router;