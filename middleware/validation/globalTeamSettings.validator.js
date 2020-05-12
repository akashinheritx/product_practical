const { body } = require('express-validator');
const constants = require('../../config/constants');

//validate global team settings form detail
exports.globalTeamSettingsValidator = [
    body('minNoOfGoalKeeper')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_TEAM.MIN_GOAL')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MIN_GOAL_NUMERIC'),
    body('maxNoOfGoalKeeper')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_TEAM.MAX_GOAL')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MAX_GOAL_NUMERIC'),
    body('minNoOfDefender')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_TEAM.MIN_DEF')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MIN_DEF_NUMERIC'),
    body('maxNoOfDefender')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_TEAM.MAX_DEF')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MAX_DEF_NUMERIC'),
    body('minNoOfStrikers')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_TEAM.MIN_ATT')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MIN_ATT_NUMERIC'),
    body('maxNoOfStrikers')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_TEAM.MAX_ATT')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MAX_ATT_NUMERIC'),
    body('minNoOfMidfielders')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_TEAM.MIN_MID')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MIN_MID_NUMERIC'),
    body('maxNoOfMidfielders')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_TEAM.MAX_MID')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MAX_MID_NUMERIC'),
    body('substitutesInElevenFormat')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_TEAM.ELEVEN_SUB')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.ELEVEN_SUB_NUMERIC'),
    body('substitutesInThreeFormat')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_TEAM.THREE_SUB')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.THREE_SUB_NUMERIC'),
    body('creditToElevenTeam')  
        .not()  
        .isEmpty()
        .withMessage('GLOBAL_TEAM.ELEVEN_CREDIT')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.ELEVEN_CREDIT_NUMERIC'),
    body('creditToThreeTeam')  
        .not()  
        .isEmpty()
        .withMessage('GLOBAL_TEAM.THREE_CREDIT')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.THREE_CREDIT_NUMERIC'),
    body('creditToElevenTeamInLeague')  
        .not()  
        .isEmpty()
        .withMessage('GLOBAL_TEAM.ELEVEN_LEAGUE_CREDIT')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.ELEVEN_LEAGUE_CREDIT_NUMERIC'),
    body('creditToThreeTeamInLeague')  
        .not()  
        .isEmpty()
        .withMessage('GLOBAL_TEAM.THREE_LEAGUE_CREDIT')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.THREE_LEAGUE_CREDIT_NUMERIC'),
    body('maxPlayersFromSameTeamInEleven')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_TEAM.MAX_PLAYER_FROM_SAME_TEAM_IN_ELEVEN')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MAX_PLAYER_FROM_SAME_TEAM_IN_ELEVEN_NUMERIC')
        .custom((value, { req })=>{
            if (parseInt(value) > (parseInt(constants.TEAM_FORMAT.ELEVEN) ) || parseInt(value) < 0) {
                throw new Error('GLOBAL_TEAM.MAX_PLAYER_FROM_SAME_TEAM_IN_ELEVEN_VALUE');
            } 
            return true;
        }),
    body('maxPlayersFromSameTeamInThree')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_TEAM.MAX_PLAYER_FROM_SAME_TEAM_IN_THREE')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MAX_PLAYER_FROM_SAME_TEAM_IN_THREE_NUMERIC')
        .custom((value, { req })=>{
            if (parseInt(value) > (parseInt(constants.TEAM_FORMAT.THREE) ) || parseInt(value) < 0) {
                throw new Error('GLOBAL_TEAM.MAX_PLAYER_FROM_SAME_TEAM_IN_THREE_VALUE');
            } 
            return true;
        }),
    body('noOfTeamInContest')  
        .not()  
        .isEmpty()
        .withMessage('GLOBAL_TEAM.TEAM_IN_CONTEST')
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.TEAM_IN_CONTEST_NUMERIC'),
];

//validate update global team settings form detail
exports.updateGlobalTeamSettingsValidator = [
    body('_id')
        .not()
        .isEmpty()
        .withMessage('GLOBAL_TEAM.TEAM_ID')
        .isString()
        .withMessage('GLOBAL_TEAM.TEAM_ID_STRING'),
    body('minNoOfGoalKeeper')
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MIN_GOAL_NUMERIC'),
    body('maxNoOfGoalKeeper')
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MAX_GOAL_NUMERIC'),
    body('minNoOfDefender')
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MIN_DEF_NUMERIC'),
    body('maxNoOfDefender')
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MAX_DEF_NUMERIC'),
    body('minNoOfStrikers')
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MIN_ATT_NUMERIC'),
    body('maxNoOfStrikers')
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MAX_ATT_NUMERIC'),
    body('minNoOfMidfielders')
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MIN_MID_NUMERIC'),
    body('maxNoOfMidfielders')
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MAX_MID_NUMERIC'),
    body('substitutesInElevenFormat')
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.ELEVEN_SUB_NUMERIC'),
    body('substitutesInThreeFormat')
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.THREE_SUB_NUMERIC'),
    body('creditToElevenTeam')  
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.ELEVEN_CREDIT_NUMERIC'),
    body('creditToThreeTeam')  
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.THREE_CREDIT_NUMERIC'),
    body('creditToElevenTeamInLeague')  
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.ELEVEN_LEAGUE_CREDIT_NUMERIC'),
    body('creditToThreeTeamInLeague')  
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.THREE_LEAGUE_CREDIT_NUMERIC'),
    body('maxPlayersFromSameTeamInEleven')
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MAX_PLAYER_FROM_SAME_TEAM_IN_ELEVEN_NUMERIC')
        .custom((value, { req })=>{
            if (parseInt(value) > (parseInt(constants.TEAM_FORMAT.ELEVEN) ) || parseInt(value) < 0) {
                throw new Error('GLOBAL_TEAM.MAX_PLAYER_FROM_SAME_TEAM_IN_ELEVEN_VALUE');
            } 
            return true;
        }),
    body('maxPlayersFromSameTeamInThree')
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.MAX_PLAYER_FROM_SAME_TEAM_IN_THREE_NUMERIC')
        .custom((value, { req })=>{
            if (parseInt(value) > (parseInt(constants.TEAM_FORMAT.THREE) ) || parseInt(value) < 0) {
                throw new Error('GLOBAL_TEAM.MAX_PLAYER_FROM_SAME_TEAM_IN_THREE_VALUE');
            } 
            return true;
        }),
    body('noOfTeamInContest')  
        .optional()
        .trim()
        .isNumeric()
        .withMessage('GLOBAL_TEAM.TEAM_IN_CONTEST_NUMERIC'),
];