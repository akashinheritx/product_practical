const { body } = require('express-validator');

//validate user edit form detail
exports.panCardValidator = [
    body('nameOnPanCard')
        .not()
        .isEmpty()
        .withMessage('PAN_CARD_REGISTER.PANCARD_NAME')
        .trim()
        .isString()
        .withMessage('PAN_CARD_REGISTER.PANCARD_NAME_STRING'),
    body('panCardNumber')
        .not()
        .isEmpty()
        .withMessage('PAN_CARD_REGISTER.PANCARD_NUMBER')
        .trim()
        .isAlphanumeric()
        .withMessage('PAN_CARD_REGISTER.PANCARD_NUMBER_NUMERIC')
        .isLength({ min: 10, max: 10 })
        .withMessage('PAN_CARD_REGISTER.PANCARD_NUMBER_VALUE'),
    body('dobOnPanCard')
        .not()
        .isEmpty()
        .withMessage('PAN_CARD_REGISTER.DOB_ON_PAN')
        .matches(/^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/)
        .withMessage('PAN_CARD_REGISTER.DOB_FORMAT'),
  ];