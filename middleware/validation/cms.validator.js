const { body } = require('express-validator');

//validate cms form detail
exports.cmsValidator = [
    body('title')
        .not()
        .isEmpty()
        .withMessage('CMS.TITLE')
        .trim()
        .isString()
        .withMessage('CMS.TITLE_STRING')
        .isLength({ min: 2, max: 25 })
        .withMessage('CMS.TITLE_LENGTH'),
    body('slug')
        .not()
        .isEmpty()
        .withMessage('CMS.SLUG')
        .trim()
        .isString()
        .withMessage('CMS.SLUG_STRING')
        .isLength({ min: 2, max: 25 })
        .withMessage('CMS.SLUG_LENGTH'),
    body('content')
        .not()
        .isEmpty()
        .withMessage('CMS.CONTENT')
        .trim()
        .isString()
        .withMessage('CMS.CONTENT_STRING'),
];

//validate update cms form detail
exports.updateCmsValidator = [
    body('title')
        .optional()
        .trim()
        .isString()
        .withMessage('CMS.TITLE_STRING')
        .isLength({ min: 2, max: 25 })
        .withMessage('CMS.TITLE_LENGTH'),
    body('slug')
        .optional()
        .trim()
        .isString()
        .withMessage('CMS.SLUG_STRING')
        .isLength({ min: 2, max: 25 })
        .withMessage('CMS.SLUG_LENGTH'),
    body('content')
        .optional()
        .trim()
        .isString()
        .withMessage('CMS.CONTENT_STRING'),
];