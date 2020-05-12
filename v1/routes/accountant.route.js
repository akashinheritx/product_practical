const router = express.Router();
const accountantController = require('../controllers/accountant.controller');

//sub admin routes
router.post('/accountant-login', accountantController.accountantLogin);

module.exports = router;