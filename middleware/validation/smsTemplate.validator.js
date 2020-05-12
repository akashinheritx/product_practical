const { body } = require('express-validator');

//validate user form detail
exports.smsTemplateValidator = [
  body('title')
    .not()
    .isEmpty()
    .withMessage('SMS_TEMPLATE.SMS_TITLE')
    .trim()
    .isLength({ min: 3 })
    .withMessage('SMS_TEMPLATE.SMS_TITLE_LENGTH'),  
  body('keys')
    .not()
    .isEmpty()
    .withMessage('SMS_TEMPLATE.KEYS')
    .trim(),
  body('subject')
    .not()
    .isEmpty()
    .withMessage('SMS_TEMPLATE.SMS_SUBJECT')
    .trim()
    .isLength({ min: 2, max: 16 })
    .withMessage('SMS_TEMPLATE.SMS_SUBJECT_LENGTH'),
  body('body')
    .not()
    .isEmpty()
    .withMessage('SMS_TEMPLATE.BODY')
    .trim()
    .isLength({ min: 10 })
    .withMessage('SMS_TEMPLATE.BODY_VALUE_LENGTH'),
  body('status')
    .not()
    .isEmpty()
    .withMessage('SMS_TEMPLATE.STATUS')
    .trim()
    .isNumeric()
    .withMessage('SMS_TEMPLATE.STATUS_NUMERIC'),  
];