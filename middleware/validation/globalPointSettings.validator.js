const { body } = require('express-validator');

//validate global point settings form detail
exports.globalPointSettingsValidator = [
    body('actionName')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_POINT.ACTION_NAME')
        .trim()
        .isString()
        .withMessage('GLOBAL_POINT.ACTION_NAME_STRING'),
    body('actionPoint')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_POINT.ACTION_POINT')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_POINT.ACTION_POINT_NUMERIC')
        .matches(/^(\-?[0-9]{1,2}?)$/)
        .withMessage('GLOBAL_POINT.ACTION_POINT_VALUE'),
    body('actionCount')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_POINT.ACTION_COUNT')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_POINT.ACTION_COUNT_NUMERIC'),
];

//validate update global point settings form detail
exports.updateGlobalPointSettingsValidator = [
    body('_id')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_POINT.POINT_ID')
        .isString()
        .withMessage('GLOBAL_POINT.POINT_ID_STRING'),
    body('actionName')
        .optional()
        .trim()
        .isString()
        .withMessage('GLOBAL_POINT.ACTION_NAME_STRING'),
    body('actionPoint')
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_POINT.ACTION_POINT_NUMERIC')
        .matches(/^(\-?[0-9]{1,2}?)$/)
        .withMessage('GLOBAL_POINT.ACTION_POINT_VALUE'),
    body('actionCount')
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_POINT.ACTION_COUNT_NUMERIC'),
];