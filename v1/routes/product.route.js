const router = express.Router();

const {registerValidator} = require('../../middleware/validation/register.validator');
const {validatorFunc} = require('../../helper/commonFunction.helper');
const productController = require('../controllers/product.controller');

const productUpload = require('../../middleware/multer/imageUpload');

// router.post('/register', productUpload, registerValidator, validatorFunc, productController);


module.exports = router;