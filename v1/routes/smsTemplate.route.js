const router = express.Router();
const smsFormatController = require('../controllers/smsTemplate.controller');
const {smsTemplateValidator} = require('../../middleware/validation/smsTemplate.validator');
const {validatorFunc} = require('../../helper/commonFunction.helper');
const auth = require('../../middleware/auth.middleware');
const adminAccess = require('../../middleware/adminAccess.middleware');

router.post('/createSMSTemplate', auth, adminAccess, smsTemplateValidator, validatorFunc, smsFormatController.createSMSTemplate);
router.post('/updateSMSTemplate/:id', auth, adminAccess, smsTemplateValidator, validatorFunc, smsFormatController.updateSMSTemplate);

router.get('/getSingleSMSTemplate/:id',auth, adminAccess, smsFormatController.getSingleSMSTemplate);
router.get('/getAllSMSTemplate',auth, adminAccess, smsFormatController.getAllSMSTemplate);

router.delete('/deleteSMSTemplate/:id',auth, adminAccess, smsFormatController.deleteSMSTemplate);

module.exports = router;