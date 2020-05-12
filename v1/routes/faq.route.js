const router = express.Router();
const faqController = require('../controllers/faq.controller');

router.post('/create-faq', faqController.createFAQ);
router.get('/get-faq/:id', faqController.getFAQ);
router.get('/edit-faq/:id', faqController.editFAQ);
router.delete('/delete-faq/:id', faqController.deleteFAQ);
router.get('/get-all-faqs', faqController.getAllFAQs);

module.exports = router;
