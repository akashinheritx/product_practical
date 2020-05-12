const router = express.Router();
const demoController = require('../controllers/demo.controller');
const auth = require('../../middleware/auth.middleware');
const {appleBoosterPurchaseValidator} = require('../../middleware/validation/booster.validator');
const {validatorFunc} = require('../../helper/commonFunction.helper');

router.get('/send-text-message', demoController.sendTextMessage);
router.get('/get-feed-data', demoController.getFeedData);
router.get('/update-points', demoController.updatePoints);
router.get('/add-bot', demoController.addBots);
router.get('/assign-team-to-bot', demoController.assignTeamToBot);
router.get('/get-uefa-fixture', demoController.getUEFAFixture);
router.get('/check-uefa-match-status', demoController.checkUEFAMatchFixture);
router.get('/update-league-points-for-cancelled-match', demoController.updateMatchPointsForCancelledMatch);

module.exports = router;