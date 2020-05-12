const { body } = require('express-validator');
const constants = require('../../config/constants');

//validate create kit form detail
exports.kitValidator = [
body('kitUserName')
    .not()
    .isEmpty()
    .withMessage('KIT.USER_NAME')
    .trim()
    .isString()
    .withMessage('KIT.USER_NAME_STRING'),
body('kitLogoPosition')
    .not()
    .isEmpty()
    .withMessage('KIT.LOGO_POSITION')
    .trim()
    .isNumeric()
    .withMessage('KIT.LOGO_POSITION_NUMERIC')
    .matches(/^[1-3]$/)
    .withMessage('KIT.LOGO_POSITION_VALUE'),
body('kitColor')
    .not()
    .isEmpty()
    .withMessage('KIT.KIT_COLOR')
    .trim()
    .isString()
    .withMessage('KIT.KIT_COLOR_STRING'),
]

//validate update kit form detail
exports.updateKitValidator = [
    body('kitUserName')
        .optional()
        .trim()
        .isString()
        .withMessage('KIT.USER_NAME_STRING'),
    body('kitLogoPosition')
        .optional()
        .trim()
        .isNumeric()
        .withMessage('KIT.LOGO_POSITION_NUMERIC')
        .matches(/^[1-3]$/)
        .withMessage('KIT.LOGO_POSITION_VALUE'),
    body('kitColor')
        .optional()
        .trim()
        .isString()
        .withMessage('KIT.KIT_COLOR_STRING'),
    ]