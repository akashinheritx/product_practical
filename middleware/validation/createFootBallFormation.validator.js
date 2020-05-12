const { body } = require('express-validator');
const constants = require('../../config/constants');

//validate football formation form detail
exports.createFootBallFormationValidator = [
body('formationType')
    .not()
    .isEmpty()
    .withMessage('FOOTBALL_FORMATION.FORMATION')
    .trim()
    .isString()
    .withMessage('FOOTBALL_FORMATION.FORMATION_STRING'),
]