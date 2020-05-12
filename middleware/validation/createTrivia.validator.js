const { body } = require('express-validator');
const constants = require('../../config/constants');

//validate trivia form detail
exports.createTriviaValidator = [
body('title')
    .not()
    .isEmpty()
    .withMessage('CREATE_TRIVIA.TRIVIA_TITLE')
    .trim()
    .isString()
    .withMessage('CREATE_TRIVIA.TRIVIA_TITLE_STRING')
    .isLength({ min: 2, max: 50 })
    .withMessage('CREATE_TRIVIA.TRIVIA_TITLE_LENGTH'),
body('startTime')
    .not()
    .isEmpty()
    .withMessage('CREATE_TRIVIA.TRIVIA_START_TIME')
    .matches(/^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2} (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('CREATE_TRIVIA.TRIVIA_START_TIME_VALUE'),
body('enrollStartTime')
    .optional()
    .matches(/^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2} (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('CREATE_TRIVIA.ENROLL_START_TIME_VALUE'),
body('entryFee')
    .not()
    .isEmpty()
    .withMessage('CREATE_TRIVIA.ENTRY_FEE')
    .trim()
    .isNumeric()
    .withMessage('CREATE_TRIVIA.ENTRY_FEE_NUMERIC'),
body('maxParticipants')
    .not()
    .isEmpty()
    .withMessage('CREATE_TRIVIA.MAX_PARTICIPANT')
    .trim()
    .isNumeric()
    .withMessage('CREATE_TRIVIA.MAX_PARTICIPANT_NUMERIC')
    .custom((value, { req })=>{
        if (parseInt(value) < 1) {
            throw new Error('CREATE_TRIVIA.MAX_PARTICIPANT_VALUE');
        }
        return true;
    }),
body('minParticipants')
    .not()
    .isEmpty()
    .withMessage('CREATE_TRIVIA.MIN_PARTICIPANT')
    .trim()
    .isNumeric()
    .withMessage('CREATE_TRIVIA.MIN_PARTICIPANT_NUMERIC')
    .custom((value, { req })=>{
        if (parseInt(value) > parseInt(req.body.maxParticipants)) {
            throw new Error('CREATE_TRIVIA.MIN_PARTICIPANT_NUMBER');
        }
        return true;
    }),
body('totalPrize')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_TRIVIA.TOTAL_PRIZE')
    .isNumeric()
    .withMessage('CREATE_TRIVIA.TOTAL_PRIZE_NUMERIC'),
body('prizeBreakDowns')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_TRIVIA.PRIZE_BREAK_DOWN'),
body('prizeBreakDowns.*.from')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_TRIVIA.PRIZE_BREAK_DOWN_FROM')
    .isNumeric()
    .withMessage('CREATE_TRIVIA.PRIZE_BREAK_DOWN_FROM_NUMERIC'),
body('prizeBreakDowns.*.to')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_TRIVIA.PRIZE_BREAK_DOWN_TO')
    .isNumeric()
    .withMessage('CREATE_TRIVIA.PRIZE_BREAK_DOWN_TO_NUMERIC'),
body('prizeBreakDowns.*.amount')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_TRIVIA.PRIZE_BREAK_DOWN_AMOUNT')
    .isNumeric()
    .withMessage('CREATE_TRIVIA.PRIZE_BREAK_DOWN_AMOUNT_NUMERIC'),
body('questions.*.question')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_TRIVIA.TRIVIA_QUESTION'),
body('questions.*.answers') 
    .not()  
    .isEmpty()
    .withMessage('CREATE_TRIVIA.TRIVIA_ANSWER')
    .custom((value) => {
        if(value.length !== 4){
            throw new Error('CREATE_TRIVIA.TRIVIA_ANSWER_LENGTH');
        }else{
            return true;
        }
    }),
body('questions') 
    .not()  
    .isEmpty()
    .withMessage('CREATE_TRIVIA.TRIVIA_QUESTION_ANSWER')
    .custom((value) => {
        if(value.length>constants.MAX_QUESTIONS){
            throw new Error('CREATE_TRIVIA.TRIVIA_QUESTION_VALUE');
        }
        for(let i=0;i<value.length;i++){
            var k=0
                for(let j=0;j<value[i].answers.length;j++){
                    if(value[i].answers[j].isCorrectAnswer === 1){
                        k++;
                    } 
                }
                if(k!=1){
                    throw new Error('CREATE_TRIVIA.TRIVIA_QUESTION_CORRECT_ANSWER');
                }
            }
            return true;
    }),
body('questions.*.answers.*.answer')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_TRIVIA.TRIVIA_ANSWER_VALUE'),
body('questions.*.answers.*.isCorrectAnswer')  
    .not()  
    .isEmpty()
    .withMessage('CREATE_TRIVIA.TRIVIA_CORRECT_ANSWER')
    .matches(/^[0|1]$/)
    .withMessage('CREATE_TRIVIA.TRIVIA_CORRECT_ANSWER_VALUE'),
];

exports.editTriviaValidator = [
    body('questions.*.question')  
        .not()  
        .isEmpty()
        .withMessage('CREATE_TRIVIA.TRIVIA_QUESTION'),
    body('questions.*.answers') 
        .not()  
        .isEmpty()
        .withMessage('CREATE_TRIVIA.TRIVIA_ANSWER')
        .custom((value) => {
            if(value.length !== 4){
                throw new Error('CREATE_TRIVIA.TRIVIA_ANSWER_LENGTH');
            }else{
                return true;
            }
        }),
    body('questions') 
        .not()  
        .isEmpty()
        .withMessage('CREATE_TRIVIA.TRIVIA_QUESTION_ANSWER')
        .custom((value) => {
            if(value.length>constants.MAX_QUESTIONS){
                throw new Error('CREATE_TRIVIA.TRIVIA_QUESTION_VALUE');
            }
            for(let i=0;i<value.length;i++){
                var k=0
                    for(let j=0;j<value[i].answers.length;j++){
                        if(value[i].answers[j].isCorrectAnswer === 1){
                            k++;
                        } 
                    }
                    if(k!=1){
                        throw new Error('CREATE_TRIVIA.TRIVIA_QUESTION_CORRECT_ANSWER');
                    }
                }
                return true;
    }),
    body('questions.*.answers.*.answer')  
        .not()  
        .isEmpty()
        .withMessage('CREATE_TRIVIA.TRIVIA_ANSWER_VALUE'),
    body('questions.*.answers.*.isCorrectAnswer')  
        .not()  
        .isEmpty()
        .withMessage('CREATE_TRIVIA.TRIVIA_CORRECT_ANSWER')
        .matches(/^[0|1]$/)
        .withMessage('CREATE_TRIVIA.TRIVIA_CORRECT_ANSWER_VALUE'),
    ];