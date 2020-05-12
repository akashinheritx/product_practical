const { body } = require('express-validator');
const constants = require('../../config/constants');

//validate contest form detail
exports.createFootBallDFSContestValidator = [
body('contestName')
    .not()
    .isEmpty()
    .withMessage('CREATE_FOOTBALL_DFS.CONTEST_NAME')
    .trim()
    .isString()
    .withMessage('CREATE_FOOTBALL_DFS.CONTEST_NAME_STRING')
    .isLength({ min: 2, max: 50 })
    .withMessage('CREATE_FOOTBALL_DFS.CONTEST_NAME_LENGTH'),
body('_matchId')
    .not()
    .isEmpty()
    .withMessage('CREATE_FOOTBALL_DFS.MATCH_ID')
    .trim(),
body('enrollStartTime')
    .optional()
    .matches(/^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2} (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('CREATE_FOOTBALL_DFS.ENROLL_START_TIME'),
body('entryFee')
    .not()
    .isEmpty()
    .withMessage('CREATE_FOOTBALL_DFS.ENTRY_FEE')
    .trim()
    .isNumeric()
    .withMessage('CREATE_FOOTBALL_DFS.ENTRY_FEE_NUMERIC'),
body('maxParticipants')
    .optional()
    .trim()
    .isNumeric()
    .withMessage('CREATE_FOOTBALL_DFS.MAX_PARTICIPANT_NUMERIC'),
body('minParticipants')
    .optional()
    .trim()
    .isNumeric()
    .withMessage('CREATE_FOOTBALL_DFS.MIN_PARTICIPANT_NUMERIC')
    .custom((value, { req })=>{
        if (parseInt(value) > parseInt(req.body.maxParticipants)) {
            throw new Error('CREATE_FOOTBALL_DFS.MIN_PARTICIPANT_NUMBER');
        }
        return true;
    }),
body('totalPrize')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_FOOTBALL_DFS.TOTAL_PRIZE')
    .isNumeric()
    .withMessage('CREATE_FOOTBALL_DFS.TOTAL_PRIZE_NUMERIC'),
body('contestType')
    .not()  
    .isEmpty()
    .withMessage('CREATE_FOOTBALL_DFS.CONTEST_TYPE')
    .isNumeric()
    .withMessage('CREATE_FOOTBALL_DFS.CONTEST_TYPE_NUMERIC')
    .matches(/^(1|2)/)
    .withMessage('CREATE_FOOTBALL_DFS.CONTEST_TYPE_VALUE'),
body('optionType')
    .not()  
    .isEmpty()
    .withMessage('CREATE_FOOTBALL_DFS.OPTION_TYPE')
    .isNumeric()
    .withMessage('CREATE_FOOTBALL_DFS.OPTION_TYPE_NUMERIC')
    .matches(/^(0|1)/)
    .withMessage('CREATE_FOOTBALL_DFS.OPTION_TYPE_VALUE'),
body('teamFormat')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_FOOTBALL_DFS.TEAM_FORMAT')
    .isNumeric()
    .withMessage('CREATE_FOOTBALL_DFS.TEAM_FORMAT_NUMERIC')
    .matches(/^(11|3)/)
    .withMessage('CREATE_FOOTBALL_DFS.TEAM_FORMAT_VALUE'),
body('playerLimit')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_FOOTBALL_DFS.PLAYER_LIMIT')
    .isNumeric()
    .withMessage('CREATE_FOOTBALL_DFS.PLAYER_LIMIT_NUMERIC')
    .custom((value, { req })=>{
        if(req.body.teamFormat == constants.TEAM_FORMAT.ELEVEN){
            if (parseInt(value) > (parseInt(req.body.teamFormat) ) || parseInt(value) < parseInt(req.body.teamFormat)) {
                throw new Error('CREATE_FOOTBALL_DFS.PLAYER_LIMIT_NUMBER');
            } 
        }else if (parseInt(value) > (parseInt(req.body.teamFormat) ) || parseInt(value) < parseInt(req.body.teamFormat)){
            throw new Error('CREATE_FOOTBALL_DFS.PLAYER_LIMIT_NUMBER');
        }
        return true;
    }),
body('boosters')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_FOOTBALL_DFS.BOOSTER'),
body('boosters.*._boosterId')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_FOOTBALL_DFS.BOOSTER_ID')
    .isString()
    .withMessage('CREATE_FOOTBALL_DFS.BOOSTER_ID_STRING'),
body('boosters.*.boosterCount')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_FOOTBALL_DFS.BOOSTER_COUNT')
    .isNumeric()
    .withMessage('CREATE_FOOTBALL_DFS.BOOSTER_COUNT_NUMERIC'),
body('footBallPrizeBreakDowns')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_FOOTBALL_DFS.PRIZE_BREAK_DOWN'),
body('footBallPrizeBreakDowns.*.from')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_FOOTBALL_DFS.PRIZE_BREAK_DOWN_FROM')
    .isNumeric()
    .withMessage('CREATE_FOOTBALL_DFS.PRIZE_BREAK_DOWN_FROM_NUMERIC'),
body('footBallPrizeBreakDowns.*.to')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_FOOTBALL_DFS.PRIZE_BREAK_DOWN_TO')
    .isNumeric()
    .withMessage('CREATE_FOOTBALL_DFS.PRIZE_BREAK_DOWN_TO_NUMERIC'),
body('footBallPrizeBreakDowns.*.amount')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_FOOTBALL_DFS.PRIZE_BREAK_DOWN_AMOUNT')
    .isNumeric()
    .withMessage('CREATE_FOOTBALL_DFS.PRIZE_BREAK_DOWN_AMOUNT_NUMERIC'),
];