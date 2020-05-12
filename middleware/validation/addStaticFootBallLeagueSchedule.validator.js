const { body } = require('express-validator');

//validate badge form detail
exports.addStaticFootBallLeagueValidator = [
    body('countryName')
        .not()
        .isEmpty()
        .withMessage('CREATE_FOOTBALL_LEAGUE.COUNTRY_NAME')
        .trim()
        .isString()
        .isLength({ min: 2, max: 50 })
        .withMessage('CREATE_FOOTBALL_LEAGUE.COUNTRY_NAME_LENGTH'),
    body('leagueName')
        .not()
        .isEmpty()
        .withMessage('CREATE_FOOTBALL_LEAGUE.LEAGUE_NAME')
        .trim()
        .isString()
        .isLength({ min: 2, max: 50 })
        .withMessage('CREATE_FOOTBALL_LEAGUE.LEAGUE_NAME_LENGTH'),
    body('season')
        .not()
        .isEmpty()
        .withMessage('CREATE_FOOTBALL_LEAGUE.SEASON')
        .trim()
        .matches(/^\d{4}\/\d{4}$/)
        .withMessage('CREATE_FOOTBALL_LEAGUE.SEASON_INPUT'),
    body('startTime')
        .not()
        .isEmpty()
        .withMessage('CREATE_FOOTBALL_LEAGUE.LEAGUE_START_TIME')
        .matches(/^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2} (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage('CREATE_FOOTBALL_LEAGUE.LEAGUE_START_TIME_VALUE'),
];