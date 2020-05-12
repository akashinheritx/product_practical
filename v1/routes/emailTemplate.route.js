const router = express.Router();
const emailFormatController = require('../controllers/emailTemplate.controller');
const {emailTemplateValidator} = require('../../middleware/validation/emailTemplate.validator');
const {validatorFunc} = require('../../helper/commonFunction.helper');
const auth = require('../../middleware/auth.middleware');
const adminAccess = require('../../middleware/adminAccess.middleware');
const adminSubAdminAccess = require('../../middleware/adminSubAdminAccess.middleware');

router.post('/createEmailTemplate', auth, adminSubAdminAccess, emailTemplateValidator, validatorFunc, emailFormatController.createEmailTemplate);
router.post('/updateEmailTemplate/:id', auth, adminSubAdminAccess, emailTemplateValidator, validatorFunc, emailFormatController.updateEmailTemplate);

router.get('/getSingleEmailTemplate/:id',auth, adminSubAdminAccess, emailFormatController.getSingleEmailTemplate);
router.get('/getAllEmailTemplate',auth, adminSubAdminAccess, emailFormatController.getAllEmailTemplate);
router.delete('/deleteEmailTemplate/:id',auth, adminSubAdminAccess, emailFormatController.deleteEmailTemplate);

module.exports = router;