const router = express.Router();
const kitImageController = require('../controllers/kitImage.controller');
const kitLogoController = require('../controllers/kitLogo.controller');
const kitImageUpload = require('../../middleware/uploadKitImage');
const kitLogoUpload = require('../../middleware/uploadKitLogo');
const auth = require('../../middleware/auth.middleware');

//Kit image routes
router.post(
  '/add-kit-images',
  auth,
  kitImageUpload,
  kitImageController.addKitImage
);
router.get('/list-kit-images', auth, kitImageController.getAllKitImages);
router.get('/get-kit-image/:id', auth, kitImageController.getKitImageById);
router.delete('/delete-kit-image/:id', auth, kitImageController.deleteKitImage);

//Kit logo routes
router.post('/add-kit-logo', auth, kitLogoUpload, kitLogoController.addKitLogo);
router.get('/list-kit-logo', auth, kitLogoController.getAllKitLogo);
router.get('/get-kit-logo/:id', auth, kitLogoController.getKitLogoById);
router.delete('/delete-kit-logo/:id', auth, kitLogoController.deleteKitLogo);

// USER KIT ROUTES
router.post(
  '/add-user-kit',
  auth,
  kitImageUpload,
  kitImageController.addUserKit
);
router.get('/get-user-kit', auth, kitImageController.getUserKit);
// router.get('/get-kit-image/:id', auth, kitImageController.getKitImageById);
// router.delete('/delete-kit-image/:id', auth, kitImageController.deleteKitImage);

module.exports = router;
