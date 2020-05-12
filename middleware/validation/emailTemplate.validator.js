const { body } = require('express-validator');

//validate user form detail
exports.emailTemplateValidator = [
  body('title')
    .not()
    .isEmpty()
    .withMessage('EMAIL_TEMPLATE.EMAIL_TITLE')
    .trim()
    .isLength({ min: 3 })
    .withMessage('EMAIL_TEMPLATE.EMAIL_TITLE_LENGTH'),  
  body('keys')
    .not()
    .isEmpty()
    .withMessage('EMAIL_TEMPLATE.EMAIL_KEYS')
    .trim(),
  body('subject')
    .not()
    .isEmpty()
    .withMessage('EMAIL_TEMPLATE.EMAIL_SUBJECT')
    .trim()
    .isLength({ min: 2, max: 16 })
    .withMessage('EMAIL_TEMPLATE.EMAIL_SUBJECT_LENGTH'),
  body('body')
    .not()
    .isEmpty()
    .withMessage('EMAIL_TEMPLATE.EMAIL_BODY')
    .trim()
    .isLength({ min: 10 })
    .withMessage('EMAIL_TEMPLATE.EMAIL_BODY_VALUE'),
  body('status')
    .not()
    .isEmpty()
    .withMessage('EMAIL_TEMPLATE.EMAIL_STATUS')
    .trim()
    .isNumeric()
    .withMessage('EMAIL_TEMPLATE.EMAIL_STATUS_NUMERIC'),
  
];