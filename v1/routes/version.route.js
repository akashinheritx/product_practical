const router = express.Router();
const {versionValidator} = require('../../middleware/validation/version.validator');
const {validatorFunc} = require('../../helper/commonFunction.helper');
const versionController = require('../controllers/version.controller');
const auth = require('../../middleware/auth.middleware');
const adminAccess = require('../../middleware/adminAccess.middleware');
const adminSubAdminAccess = require('../../middleware/adminSubAdminAccess.middleware');

router.post('/createVersionNumber', auth, adminSubAdminAccess, versionValidator, validatorFunc, versionController.createVersion);
router.get('/getAllVersionNumber', auth, adminSubAdminAccess, versionController.getAllVersionData);
router.post('/getAppVersion', versionController.getAppVersion);

module.exports = router;