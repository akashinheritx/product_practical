const router = express.Router();

const cashFreePayOutController = require('../controllers/cashFreePayOut.controller');
const auth = require('../../middleware/auth.middleware');

router.post('/generate-token', cashFreePayOutController.generateToken);
router.post('/add-beneficiary', auth, cashFreePayOutController.addBeneficiary);
router.post('/remove-beneficiary-by-id', cashFreePayOutController.removeBeneficiary);
router.post('/request-transfer', cashFreePayOutController.requestTransfer);

router.get('/get-balance', cashFreePayOutController.getBalance);
router.get('/get-all-beneficiaries', cashFreePayOutController.getAllBeneficiaries);
router.get('/get-beneficiary-by-id/:beneId', cashFreePayOutController.getBeneficiaryById);
router.get('/get-beneficiary-by-account-and-ifsc-code', cashFreePayOutController.getBeneficiaryByAccountAndIFSCCode);
router.get('/validate-beneficiary-by-account-details', cashFreePayOutController.validateBankAccountAndIFSCCode);

module.exports = router;