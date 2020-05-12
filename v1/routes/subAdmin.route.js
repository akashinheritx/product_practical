const router = express.Router();
const subAdminController = require('../controllers/subAdmin.controller');

//sub admin routes
router.post('/sub-admin-login', subAdminController.subAdminLogin);

module.exports = router;