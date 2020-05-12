const { body } = require('express-validator');

//validate user form detail
exports.versionValidator = [
  body('versionNumber')
    .not()
    .isEmpty()
    .withMessage('VERSION.VERSION_NUMBER')
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage('VERSION.VERSION_NUMBER_FORMAT')
    .trim(),
  body('deviceType')
    .not()
    .isEmpty()
    .withMessage('VERSION.DEVICE_TYPE')
    .isAlpha()
    .withMessage('VERSION.DEVICE_TYPE_APLHA')
    .trim(),
  body('isForceUpdate')
    .not()
    .isEmpty()
    .withMessage('VERSION.IS_FORCE_UPDATE')
    .isNumeric()
    .withMessage('VERSION.IS_FORCE_UPDATE_NUMERIC')
    .matches(/^[0-1]$/)
    .withMessage('VERSION.IS_FORCE_UPDATE_VALUE')
    .trim(),
];