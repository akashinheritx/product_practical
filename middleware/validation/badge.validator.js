const { body } = require('express-validator');

//validate badge form detail
exports.badgeValidator = [
    body('badgeName')
        .not()
        .isEmpty()
        .withMessage('BADGE.BADGE_NAME')
        .trim()
        .isString()
        .isLength({ min: 2, max: 16 })
        .withMessage('BADGE.BADGE_NAME_LENGTH'),
    body('contestCount')
        .not()
        .isEmpty()
        .withMessage('BADGE.CONTEST_COUNT')
        .trim()
        .matches(/^(0|[1-9][0-9]*)$/)
        .withMessage('BADGE.CONTEST_COUNT_NUMERIC'),
];

//validate update badge form detail
exports.updateBadgeValidator = [
    body('badgeName')
        .optional()
        .trim()
        .isString()
        .isLength({ min: 2, max: 16 })
        .withMessage('BADGE.BADGE_NAME_LENGTH'),
    body('contestCount')
        .optional()
        .trim()
        .matches(/^(0|[1-9][0-9]*)$/)
        .withMessage('BADGE.CONTEST_COUNT_NUMERIC'),
];