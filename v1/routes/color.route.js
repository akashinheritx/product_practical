const router = express.Router();
const colorController = require('../controllers/color.controller');

// Colors Routes
router.post('/add-color', colorController.addColor);
router.get('/get-colors', colorController.getColors);

module.exports = router;
