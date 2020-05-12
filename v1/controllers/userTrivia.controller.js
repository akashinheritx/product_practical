const User = require('../../models/user.model');
const Trivia = require('../../models/trivia.model');
const Question = require('../../models/question.model');
const TriviaAnswer = require('../../models/triviaAnswer.model');
const WalletHistory = require('../../models/walletHistory.model');
const EnrollTrivia = require('../../models/enrollTrivia.model');
const SubmitTriviaAnswer = require('../../models/submitTriviaAnswers.model');
const PrizeBreakDown = require('../../models/prizeBreakDown.model');
const TriviaWinnerListWithPrizeAmount = require('../../models/triviaWinnerListwithPrizeAmounts.model');
const GlobalGeneralSettings = require('../../models/globalGeneralSettings.model');
const Badge = require('../../models/badge.model');
const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');


//Get a list of upcoming trivia
exports.getUpComingTriviaList = async (req, res) => {
    try {
            let field, value; 
            
            let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            
            const search = req.query.q ? req.query.q : ''; // for searching
            
            if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            field = parts[0];
            parts[1] ==='desc' ? value=-1 : value= 1;
            }else{
                field = "hasValue",
                value = 1;
            }
            const pageOptions = {
                page: parseInt(req.query.page) || constants.PAGE,
                limit: parseInt(req.query.limit) || constants.LIMIT
            }
            let query = {
                deletedAt: null,
                enrollEndTime :{$gt: currentTimeStamp},
                enrollStartTime : {$lt : currentTimeStamp},
                status:constants.TRIVIA_STATUS.ENROLL,
            }
            if (search) {
                query.$or = [
                    { 'title': new RegExp(search, 'i') }
                ]
            }
            let total = await Trivia.countDocuments(query);
            const allTrivias = await Trivia.aggregate([
            {$match:query},       
            { $addFields: 
                { 
                    currentTimeStamp,
                    participatedIn: constants.USER.NOT_PARTICIPANT,
                    spotLeft: {$subtract: [ "$maxParticipants", "$currentParticipants" ]},
                    hasValue : { $cond: [ { $eq: [ "$entryFee", 0 ] }, 2, 1 ] },
                }
            },
            {
                $sort:{[field] : value, startTime : value, createdAt : value}
            },        
            ])
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });
            
            let enrolledCount = 0;
            
            for(let a=0; a<allTrivias.length;a++){
                const trviaData = await EnrollTrivia.findOne({_userId : req.user._id, _triviaId : allTrivias[a]._id})
                if(trviaData){
                    allTrivias[a].participatedIn = constants.USER.PARTICIPANT
                    enrolledCount = enrolledCount + 1
                }    
            }

            let page = pageOptions.page ;
            let limit = pageOptions.limit;

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("TRIVIA.TRIVIA_FOUND", req.headers.lang),
            error: false,
            data: {allTrivias, page, limit, total, enrolledCount}
            });
            // logService.responseData(req, allTrivias);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
        // logService.responseData(req, error);
    }
}

//get single trivia details
exports.getTrivia = async (req, res, next) => {
    try {
        let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        const _triviaId = req.params._triviaId;
        const _userId = req.user._id;
        const trivia = await Trivia.aggregate([
            {$match: { _id: mongoose.Types.ObjectId(_triviaId), deletedAt: null}},       
            {
                $lookup:{
                    from: 'prizebreakdowns',
                    localField: '_id',
                    foreignField: '_triviaId',
                    as: 'prizeBreakDowns',
                }
            },
            { $addFields: 
                { 
                    currentTimeStamp,
                    participatedIn: constants.USER.NOT_PARTICIPANT,
                    attendStatus : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    rank : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    totalCorrectAnswer : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    totalTimeSpent : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    totalTimeSpentInMilliSec : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    leaderBoardStatus: constants.USER_TRIVIA_STATUS.LEADERBOARD_NOT_GENERATED,
                    spotLeft: {$subtract: [ "$maxParticipants", "$currentParticipants" ]}
                }
            },        
            ])
        if(trivia.length<=0){
            return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("TRIVIA.TRIVIA_NOT_FOUND", req.headers.lang),
                    error: true,
                    data: {}
                });
        }

        const trviaData = await EnrollTrivia.findOne({_userId , _triviaId : trivia[0]._id})
                    if(trviaData){
                        trivia[0].participatedIn = constants.USER.PARTICIPANT;
                        trivia[0].attendStatus = trviaData.attendStatus
                    }
        const leaderBoard = await TriviaWinnerListWithPrizeAmount.findOne({_triviaId : trivia[0]._id})
                    if(leaderBoard){
                        trivia[0].leaderBoardStatus = constants.USER_TRIVIA_STATUS.LEADERBOARD_GENERATED;
                    }
        const leaderBoardRank = await TriviaWinnerListWithPrizeAmount.findOne({_triviaId : trivia[0]._id, _userId })
                    if(leaderBoardRank){
                        trivia[0].rank = leaderBoardRank.rank;
                        trivia[0].totalCorrectAnswer = leaderBoardRank.totalCorrectAnswer;
                        trivia[0].totalTimeSpent = leaderBoardRank.totalTimeSpent;
                        trivia[0].totalTimeSpentInMilliSec = leaderBoardRank.totalTimeSpentInMilliSec;
                    }

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("TRIVIA.TRIVIA_FOUND", req.headers.lang),
            error: false,
            data: trivia
        });
        // logService.responseData(req, trivia);
    } catch (error) {
      console.log(error);
      res.status(400).send({
        status: constants.STATUS_CODE.FAIL,
        message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
        error: true,
        data: {}
      });
    //   logService.responseData(req, error);
    }
};

//Enroll in trivia
exports.enrollInTrivia = async (req, res) => {
    let session = await mongoose.startSession({
        readPreference: { mode: 'primary' }
      });
      session.startTransaction();
    try {
        let user = req.user;
        let _userId = user._id;

        let reqdata = req.body;

        let _triviaId = reqdata.triviaId;
     
        let triviaData = await Trivia.findById(_triviaId);

        if(!triviaData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.TRIVIA_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        if(triviaData.status != constants.TRIVIA_STATUS.ENROLL){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.TRIVIA_CLOSE", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let currentTimeStamp = dateFormat.setCurrentTimestamp();
            
        if(currentTimeStamp >= triviaData.enrollEndTime){
            return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("TRIVIA.TRIVIA_CLOSE", req.headers.lang),
                    error: true,
                    data: {}
                });
        }

        if(triviaData.currentParticipants >= triviaData.maxParticipants){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.TRIVIA_PARTICIPATE_FULL", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let enrolledTriviaData = await EnrollTrivia.findOne({_userId, _triviaId})
        
        if(enrolledTriviaData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.USER_TRIVIA_ALREADY_JOINED", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let entryFee = triviaData.entryFee;

        let totalBalance = user.referralBalance + user.winningBalance + user.depositBalance;
        
        if(totalBalance < entryFee){
            return res.status(402).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.NOT_ENOUGH_BALANCE", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let walletHistoryObj = {
            _userId,
            _triviaId,
            triviaName : triviaData.title,
            amount : entryFee,
            competitionType : constants.COMPETITION_TYPE.TRIVIA,
            transactionType : constants.TRANSACTION_TYPE.MINUS,
            transactionFor : constants.TRANSACTION_FOR.PARTICIPATE,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp()
        }        

        enrollTrivia = new EnrollTrivia({
            _userId,
            userName: user.userName,
            _triviaId,
            createdAt: dateFormat.setCurrentTimestamp(),
            updatedAt: dateFormat.setCurrentTimestamp()
        })
        
        // let enrolledTriviaData = await enrollTrivia.save();
        let enrollTriviaData = await enrollTrivia.save({session});
        
        let updatedTriviaData, badgeUpdated = 0;
        
        if(enrollTriviaData){
            // updatedTriviaData = await Trivia.updateOne({_id: _triviaId},
            // {
            //     $inc : {currentParticipants : 1}
            // },{session});
            
            if(entryFee > 0) {

                //payment for participate
                let userWallets = await User.findOne({_id : _userId},{referralBalance :1, winningBalance: 1, depositBalance: 1, participatedInCount: 1, badgeKey : 1, userName : 1});
                let totalBalance = userWallets.referralBalance + userWallets.winningBalance + userWallets.depositBalance;

                if(totalBalance < entryFee){
                    console.log('comes in payment');
                    
                    return res.status(402).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("USER.NOT_ENOUGH_BALANCE", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }else if(userWallets.referralBalance >= entryFee){
                    userWallets.referralBalance = userWallets.referralBalance - entryFee;
                    // await userWallets.save();
                    await userWallets.save({session});

                    walletHistoryObj = new WalletHistory(walletHistoryObj)
                    walletHistoryObj.referralWallet = entryFee;
                    // await walletHistoryObj.save();
                    await walletHistoryObj.save({session});

                }else if((userWallets.referralBalance + userWallets.winningBalance) >= entryFee){
                    let lastReferralAmount = userWallets.referralBalance
                    let remainPaidAmount = entryFee - userWallets.referralBalance;
                    userWallets.referralBalance = 0;
                    userWallets.winningBalance = userWallets.winningBalance - remainPaidAmount;
                    // await userWallets.save();
                    await userWallets.save({session});

                    walletHistoryObj = new WalletHistory(walletHistoryObj)
                    walletHistoryObj.referralWallet = lastReferralAmount;
                    walletHistoryObj.winningWallet = remainPaidAmount;
                    // await walletHistoryObj.save();
                    await walletHistoryObj.save({session});

                }else if(totalBalance >= entryFee){
                    let lastReferralAmount = userWallets.referralBalance;
                    let lastWinningAmount = userWallets.winningBalance;
                    let remainAmount1 = entryFee - userWallets.referralBalance;
                    userWallets.referralBalance = 0;
                    let remainAmount2 = remainAmount1 - userWallets.winningBalance;
                    userWallets.winningBalance = 0;
                    userWallets.depositBalance = user.depositBalance - remainAmount2;
                    // await userWallets.save();
                    await userWallets.save({session});

                    walletHistoryObj = new WalletHistory(walletHistoryObj)
                    walletHistoryObj.referralWallet = lastReferralAmount;
                    walletHistoryObj.winningWallet = lastWinningAmount;
                    walletHistoryObj.depositWallet = remainAmount2;
                    // await walletHistoryObj.save();
                    await walletHistoryObj.save({session});

                }else{
                    console.log('you don\'t have anything here');
                }
                
                userWallets.participatedInCount += 1;
    
                let closestBadge = await Badge.findOne({contestCount: {$lte: userWallets.participatedInCount}}).sort({contestCount: -1}).limit(1);
                if(closestBadge){

                    if(userWallets.badgeKey !== closestBadge.badgeKey){
                        userWallets.badgeKey = closestBadge.badgeKey;
                        badgeUpdated = 1;
                    }
                }

                // let userData = await userWallets.save();
                let userData = await userWallets.save({session});
            }   

        }

        let totalEnrolledCount = await EnrollTrivia.countDocuments({_triviaId});
        console.log(totalEnrolledCount, 'totalEnrolledCount before');
        if(totalEnrolledCount >= triviaData.maxParticipants){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.TRIVIA_PARTICIPATE_FULL", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let enrolledTriviaDataBefore = await EnrollTrivia.findOne({_userId, _triviaId});
        console.log(enrolledTriviaDataBefore, 'enrolledTriviaData before');
        
        if(enrolledTriviaData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.USER_TRIVIA_ALREADY_JOINED", req.headers.lang),
                error:true,
                data:{}
            })
        }
        updatedTriviaData = await Trivia.updateOne({_id: _triviaId, $expr: { $lt: [ "$currentParticipants" , "$maxParticipants" ] }},
            {
                $inc : {currentParticipants : 1}
            });

        if(updatedTriviaData.nModified === 0){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.TRIVIA_PARTICIPATE_FULL", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        await session.commitTransaction();
        session.endSession();

        if(badgeUpdated == 1){
            await commonFunction.sendNotificationToFollower(user, constants.NOTIFICATION_STATUS.LEVEL_UP)
        }

        let totalEnrolledCountAfter = await EnrollTrivia.countDocuments({_triviaId});
        console.log(totalEnrolledCountAfter, 'totalEnrolledCountAfter after');

        let enrolledTriviaDataAfter = await EnrollTrivia.findOne({_userId, _triviaId});
        console.log(enrolledTriviaDataAfter, 'enrolledTriviaDataAfter');

        let userWallets = await commonFunction.getUserLatestBalance(_userId)

        res.status(201).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("TRIVIA.USER_TRIVIA_JOINED_SUCCESS", req.headers.lang),
            error: false,
            data: {enrollTriviaData, userWallets}
        })
        logService.responseData(req, {enrollTriviaData, userWallets, updatedTriviaData});
    } catch (error) {
        console.log(error);
        await session.abortTransaction();
        session.endSession();
        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
        logService.responseData(req, error);
    }
}

//Get trivia questions
exports.getTriviaQuestion = async (req, res, next) => {
    try {
        const currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        const _triviaId = req.params._triviaId;
        let _userId = req.user._id;
        
        let globalGeneralSettings = await GlobalGeneralSettings.findOne();
        if(!globalGeneralSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message:Lang.responseIn("ADMIN_GENERAL.GLOBAL_GENERAL_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let enrollTriviaData = await EnrollTrivia.findOne({_userId, _triviaId})
        if(!enrollTriviaData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                error:true,
                data:{}
            })
        }

        const questionTime = currentTimeStamp + (globalGeneralSettings.minuteInMilisec * globalGeneralSettings.getTriviaQuestionTiming);
        
        const triviaData = await Trivia.findById(_triviaId);
        if(!triviaData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.TRIVIA_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        if(triviaData.startTime > questionTime){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.QUESTION_GET_TIME_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }
        if(triviaData.endTime < currentTimeStamp ){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.QUESTION_GET_END_TIME_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }
      const questions = await Question.aggregate([
        { $match : { _triviaId : mongoose.Types.ObjectId(_triviaId) }  },
        { $addFields: 
            { 
                currentTimeStamp,
            }
        },
        {
            $lookup:{
                from: 'triviaanswers',
                localField: '_id',
                foreignField: '_questionId',
                as: 'answers',        
            }
        },
        {
            $project : {
                "_id" : 1,
                "_triviaId" : 1,
                "question" : 1,
                "currentTimeStamp" : 1,
                "answers._id" : 1,
                "answers._triviaId" : 1,
                "answers._questionId" : 1,
                "answers.answer" : 1,
            }
        },
      ])
      
      res.status(200).send({
        status: constants.STATUS_CODE.SUCCESS,
        message: Lang.responseIn("TRIVIA.QUESTION_FOUND_SUCCESS", req.headers.lang),
        error: false,
        data: questions
      });
    //   logService.responseData(req, questions);
    } catch (error) {
      console.log(error);
      res.status(400).send({
        status: constants.STATUS_CODE.FAIL,
        message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
        error: true,
        data: {}
      });
    //   logService.responseData(req, error);
    }
};

//Submit trivia answer
exports.submitTriviaAnswer =  async (req, res) => {
    let session = await mongoose.startSession({
        readPreference: { mode: 'primary' }
      });
      session.startTransaction();
    try {
        let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        console.log(currentTimeStamp, 'currentTimeStamp');
        let reqdata = req.body;
        let _triviaId = reqdata._triviaId;
        let _userId = req.user._id;
        console.log(_userId, '_userId');

        let globalGeneralSettings = await GlobalGeneralSettings.findOne();
        if(!globalGeneralSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message:Lang.responseIn("ADMIN_GENERAL.GLOBAL_GENERAL_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        const submitAnswerTime = currentTimeStamp + (globalGeneralSettings.minuteInMilisec * globalGeneralSettings.triviaWinnerListGenerateTime);
        
        let triviaData = await Trivia.findById(_triviaId);
        if(!triviaData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.TRIVIA_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        if(triviaData.startTime > currentTimeStamp ){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.ANSWER_SUBMIT_TIME_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }
        if(submitAnswerTime < currentTimeStamp ){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.ANSWER_SUBMIT_END_TIME_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }
        if(triviaData.status != constants.TRIVIA_STATUS.OPEN ){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.ANSWER_SUBMIT_OPEN_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }
        // if(triviaData.endTime < currentTimeStamp ){
        //     return res.status(400).send({
        //         status:constants.STATUS_CODE.FAIL,
        //         message: Lang.responseIn("TRIVIA.ANSWER_SUBMIT_END_TIME_ERROR", req.headers.lang),
        //         error:true,
        //         data:{}
        //     })
        // }
        let enrollTriviaData = await EnrollTrivia.findOne({_userId, _triviaId})
        if(!enrollTriviaData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                error:true,
                data:{}
            })
        }
        let answerSubmitted = await SubmitTriviaAnswer.findOne({_userId, _triviaId})
        if(answerSubmitted){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.ANSWER_ALREADY_SUBMIT_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }
        let submitAnswers = reqdata.submitAnswers;
        console.log(submitAnswers.length, 'submitAnswers.length');
        // TODO: keep let in for loop
        for(let i=0;i<submitAnswers.length;i++){
            console.log(i, 'i');
            console.log(submitAnswers[i]._answerId, 'submitAnswers[i]._answerId');
            let answer, isCorrect;
            if(submitAnswers[i]._answerId == null){
                answer = submitAnswers[i]._answerId;
                isCorrect = 0;
            }else{
                let checkAnswer = await TriviaAnswer.findOne({_id: submitAnswers[i]._answerId, _questionId: submitAnswers[i]._questionId, _triviaId})
                if(!checkAnswer){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("TRIVIA.TRIVIA_ANSWER_NOT_FOUND", req.headers.lang),
                        error:true,
                        data:{}
                    })  
                }
                answer = submitAnswers[i]._answerId;
                isCorrect = checkAnswer.isCorrectAnswer;
            }

            let timeSpent = 0;
            let timeSpentInMilliSec = 0;
            if(submitAnswers[i].timeSpentInMilliSec){
                console.log(submitAnswers[i].timeSpentInMilliSec, 'submitAnswers[i].timeSpentInMilliSec');
                timeSpentInMilliSec = submitAnswers[i].timeSpentInMilliSec;
                timeSpent = submitAnswers[i].timeSpentInMilliSec / constants.TIME_DIFF_MILISEC.GET_SECOND;
            }else if(submitAnswers[i].timeSpent){
                console.log(submitAnswers[i].timeSpent, 'submitAnswers[i].timeSpent');
                timeSpent = submitAnswers[i].timeSpent;
                timeSpentInMilliSec = submitAnswers[i].timeSpent * constants.TIME_DIFF_MILISEC.GET_SECOND;
            }else{
                console.log(submitAnswers[i]);
                console.log('please check the code in submit trivia answer');
            }
            console.log(timeSpent, 'timeSpent');
            console.log(timeSpentInMilliSec, 'timeSpentInMilliSec');
            submitTriviaAnswer = new SubmitTriviaAnswer({
                _userId,
                _triviaId,
                _questionId: submitAnswers[i]._questionId,
                _answerId: answer,
                isCorrectAnswer: isCorrect,
                timeSpent,
                timeSpentInMilliSec,
                createdAt: dateFormat.setCurrentTimestamp(),
                updatedAt: dateFormat.setCurrentTimestamp()
            })
            // let submittedData = await submitTriviaAnswer.save();
            let submittedData = await submitTriviaAnswer.save({session});

            if(submittedData.isCorrectAnswer == constants.IS_CORRECT){
                enrollTriviaData.totalCorrectAnswer = enrollTriviaData.totalCorrectAnswer + 1;
                enrollTriviaData.totalAnswer = enrollTriviaData.totalAnswer + 1;
                enrollTriviaData.totalTimeSpentForCorrectAnswer = enrollTriviaData.totalTimeSpentForCorrectAnswer + submittedData.timeSpent;
                enrollTriviaData.totalTimeSpentForCorrectAnswerInMilliSec = enrollTriviaData.totalTimeSpentForCorrectAnswerInMilliSec + submittedData.timeSpentInMilliSec;
                enrollTriviaData.totalTimeSpent = enrollTriviaData.totalTimeSpent + submittedData.timeSpent;
                enrollTriviaData.totalTimeSpentInMilliSec = enrollTriviaData.totalTimeSpentInMilliSec + submittedData.timeSpentInMilliSec;
                enrollTriviaData.attendStatus = constants.USER_TRIVIA_STATUS.ATTENDED
                enrollTriviaData.updatedAt = dateFormat.setCurrentTimestamp();
                // await enrollTriviaData.save();
                await enrollTriviaData.save({session});

            }else if(submittedData.isCorrectAnswer == constants.IS_INCORRECT && submittedData._answerId != null){
                enrollTriviaData.totalWrongAnswer = enrollTriviaData.totalWrongAnswer + 1;
                enrollTriviaData.totalAnswer = enrollTriviaData.totalAnswer + 1;
                enrollTriviaData.totalTimeSpentForWrongAnswer = enrollTriviaData.totalTimeSpentForWrongAnswer + submittedData.timeSpent;
                enrollTriviaData.totalTimeSpentForWrongAnswerInMilliSec = enrollTriviaData.totalTimeSpentForWrongAnswerInMilliSec + submittedData.timeSpentInMilliSec;
                enrollTriviaData.totalTimeSpent = enrollTriviaData.totalTimeSpent + submittedData.timeSpent;
                enrollTriviaData.totalTimeSpentInMilliSec = enrollTriviaData.totalTimeSpentInMilliSec + submittedData.timeSpentInMilliSec;
                enrollTriviaData.attendStatus = constants.USER_TRIVIA_STATUS.ATTENDED
                enrollTriviaData.updatedAt = dateFormat.setCurrentTimestamp();
                // await enrollTriviaData.save();
                await enrollTriviaData.save({session});

            }else{
                enrollTriviaData.totalNotGivenAnswer = enrollTriviaData.totalNotGivenAnswer + 1;
                enrollTriviaData.totalTimeSpentForNotGivenAnswer = enrollTriviaData.totalTimeSpentForNotGivenAnswer + submittedData.timeSpent;
                enrollTriviaData.totalTimeSpentForNotGivenAnswerInMilliSec = enrollTriviaData.totalTimeSpentForNotGivenAnswerInMilliSec + submittedData.timeSpentInMilliSec;
                enrollTriviaData.totalTimeSpent = enrollTriviaData.totalTimeSpent + submittedData.timeSpent;
                enrollTriviaData.totalTimeSpentInMilliSec = enrollTriviaData.totalTimeSpentInMilliSec + submittedData.timeSpentInMilliSec;
                enrollTriviaData.attendStatus = constants.USER_TRIVIA_STATUS.ATTENDED
                enrollTriviaData.updatedAt = dateFormat.setCurrentTimestamp();
                // await enrollTriviaData.save();
                await enrollTriviaData.save({session});

            }
        }

        //Check whether answer submitted or not before transaction commits

        console.log('comes here before transaction commits');
        let answerSubmittedCheck = await SubmitTriviaAnswer.findOne({_userId, _triviaId})
        if(answerSubmittedCheck){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.ANSWER_ALREADY_SUBMIT_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("TRIVIA.ANSWER_SUBMITTED_SUCCESS", req.headers.lang),
            error: false,
            data: enrollTriviaData
        })
        logService.responseData(req, enrollTriviaData);
    } catch (error) {
        console.log(error);

        await session.abortTransaction();
        session.endSession();
        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
        logService.responseData(req, error);
    }
}

exports.getTriviaWinnerList =  async (req, res) => {
    try {
            let _triviaId = req.params._triviaId;
            let _userId = req.user._id;

            let triviaData = await EnrollTrivia.findOne({_triviaId, _userId})
            if(!triviaData){
                return res.status(400).send({
                            status:constants.STATUS_CODE.FAIL,
                            message: Lang.responseIn("TRIVIA.TRIVIA_NOT_FOUND", req.headers.lang),
                            error:true,
                            data:{}
                        })
            }
            let field, value; 
            
            let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            
            const search = req.query.q ? req.query.q : ''; // for searching
            
            if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            field = parts[0];
            parts[1] ==='desc' ? value=-1 : value= 1;
            }else{
                field = "hasValue",
                value = 1;
            }
            const pageOptions = {
                page: parseInt(req.query.page) || constants.PAGE,
                limit: parseInt(req.query.limit) || constants.LIMIT
            }
            let query = {
                _triviaId: triviaData._triviaId,
            }
            if (search) {
                query.$or = [
                    { 'userName': new RegExp(search, 'i') }
                ]
            }

            let myRank = await TriviaWinnerListWithPrizeAmount.findOne({_triviaId, _userId })
            let total = await TriviaWinnerListWithPrizeAmount.countDocuments(query);
            let triviaWinnerListWithPrizeAmountData = await TriviaWinnerListWithPrizeAmount.aggregate([
                {$match : query},
                { $addFields: 
                    { 
                        hasValue : { $cond: [ { $eq: [ "$rank", null ] }, 2, 1 ] },
                    }
                },
            ])
            .sort({[field] : value, rank : value, userName: value})
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

            let page = pageOptions.page ;
            let limit = pageOptions.limit;

            res.status(200).send({
                status: constants.STATUS_CODE.SUCCESS,
                message: Lang.responseIn("GENERAL.WINNER_LIST", req.headers.lang),
                error: false,
                // data: {myRank, triviaWinnerListWithPrizeAmountData, triviaNotRanker, total}
                data: {myRank, triviaWinnerListWithPrizeAmountData, page, limit, total}
            })

            // logService.responseData(req, {myRank, triviaWinnerListWithPrizeAmountData, page, limit, total});
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
        // logService.responseData(req, error);
    }
}

//Find all enrolled trivia details
exports.getEnrolledTriviaDetails =  async (req, res) => {
    try {
        let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        let _userId = req.user._id;

        let field, value;
        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            field = parts[0];
            parts[1] ==='desc' ? value=-1 : value= 1;
            }else{
                field = "_triviaId.startTime",
                value = 1;
            }
        const pageOptions = {
            page: parseInt(req.query.page) || constants.PAGE,
            limit: parseInt(req.query.limit) || constants.LIMIT
        }
        let triviaData = await EnrollTrivia.aggregate([
            {
                $lookup : {
                    from: 'trivias',
                    localField: '_triviaId',
                    foreignField: '_id',
                    as: '_triviaId',
                }
            },
            { $unwind: '$_triviaId' },
            { $addFields: 
                { 
                    currentTimeStamp,
                    participatedIn: constants.USER.PARTICIPANT,
                    rank : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    totalCorrectAnswer : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    totalTimeSpent : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    totalTimeSpentInMilliSec : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    leaderBoardStatus: constants.USER_TRIVIA_STATUS.LEADERBOARD_NOT_GENERATED,
                    spotLeft: {$subtract: [ "$_triviaId.maxParticipants", "$_triviaId.currentParticipants" ]}
                }
            },
            {$match : {$and: [{_userId }, {"_triviaId.status": {$in : [constants.TRIVIA_STATUS.ENROLL, constants.TRIVIA_STATUS.OPEN, constants.TRIVIA_STATUS.CONFIRMED]}}]}},
        ])
        .sort({[field] : value})
        .skip((pageOptions.page - 1) * pageOptions.limit)
        .limit(pageOptions.limit)
        .collation({ locale: "en" });

        for(let i=0; i<triviaData.length;i++){
            const leaderBoard = await TriviaWinnerListWithPrizeAmount.findOne({_triviaId : mongoose.Types.ObjectId(triviaData[i]._triviaId._id)})

            if(leaderBoard){
                triviaData[i].leaderBoardStatus = constants.USER_TRIVIA_STATUS.LEADERBOARD_GENERATED;
            }
            const leaderBoardRank = await TriviaWinnerListWithPrizeAmount.findOne({_triviaId : mongoose.Types.ObjectId(triviaData[i]._triviaId._id), _userId })
            if(leaderBoardRank){
                triviaData[i].rank = leaderBoardRank.rank;
                triviaData[i].totalCorrectAnswer = leaderBoardRank.totalCorrectAnswer;
                triviaData[i].totalTimeSpent = leaderBoardRank.totalTimeSpent;
                triviaData[i].totalTimeSpentInMilliSec = leaderBoardRank.totalTimeSpentInMilliSec;
            }    
        }
        
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("TRIVIA.USER_ENROLLED_DETAIL", req.headers.lang),
            error: false,
            data: triviaData
        })
        // logService.responseData(req, triviaData);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message:Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
        // logService.responseData(req, error);
    }
}

//Find all closed or cancelled enrolled trivia details
exports.getPastEnrolledTriviaDetails =  async (req, res) => {
    try {
        let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        let _userId = req.user._id;

        let field, value;
        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            field = parts[0];
            parts[1] ==='desc' ? value=-1 : value= 1;
            }else{
                field = "_triviaId.startTime",
                value = -1;
            }
            const pageOptions = {
                page: parseInt(req.query.page) || constants.PAGE,
                limit: parseInt(req.query.limit) || constants.LIMIT
            }

        let upcomingTriviaData = await EnrollTrivia.aggregate([
            {
                $match : {_userId}
            },
            {
                $lookup : {
                    from: 'trivias',
                    localField: '_triviaId',
                    foreignField: '_id',
                    as: '_triviaId',
                }
            },
            { $unwind: '$_triviaId' },
            { $addFields: 
                { 
                    currentTimeStamp,
                    participatedIn: constants.USER.PARTICIPANT,
                    rank : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    totalCorrectAnswer : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    totalTimeSpent : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    totalTimeSpentInMilliSec : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    leaderBoardStatus: constants.USER_TRIVIA_STATUS.LEADERBOARD_NOT_GENERATED,
                    spotLeft: {$subtract: [ "$_triviaId.maxParticipants", "$_triviaId.currentParticipants" ]}
                }
            },
            {$match : {$and: [{_userId }, {"_triviaId.status": {$in : [constants.TRIVIA_STATUS.ENROLL, constants.TRIVIA_STATUS.OPEN, constants.TRIVIA_STATUS.CONFIRMED]}}]}},
        ])
        .sort({"_triviaId.startTime" : 1})
        .collation({ locale: "en" });
        
        for(let i=0; i<upcomingTriviaData.length;i++){
            const leaderBoard = await TriviaWinnerListWithPrizeAmount.findOne({_triviaId : mongoose.Types.ObjectId(upcomingTriviaData[i]._triviaId._id)})

            if(leaderBoard){
                upcomingTriviaData[i].leaderBoardStatus = constants.USER_TRIVIA_STATUS.LEADERBOARD_GENERATED;
            }
            const leaderBoardRank = await TriviaWinnerListWithPrizeAmount.findOne({_triviaId : mongoose.Types.ObjectId(upcomingTriviaData[i]._triviaId._id), _userId })
            
            if(leaderBoardRank){
                upcomingTriviaData[i].rank = leaderBoardRank.rank;
                upcomingTriviaData[i].totalCorrectAnswer = leaderBoardRank.totalCorrectAnswer;
                upcomingTriviaData[i].totalTimeSpent = leaderBoardRank.totalTimeSpent;
                upcomingTriviaData[i].totalTimeSpentInMilliSec = leaderBoardRank.totalTimeSpentInMilliSec;
            }    
        }

        // let triviaData = await EnrollTrivia.find({ _userId}).populate("_triviaId")
        // let total = await EnrollTrivia.countDocuments({$and: [{_userId}, {$or:[{status: constants.TRIVIA_STATUS.CANCELLED}, {status: constants.TRIVIA_STATUS.CLOSED}]}]})

        let triviaDatatotal = await EnrollTrivia.aggregate([
            {
                $lookup : {
                    from: 'trivias',
                    localField: '_triviaId',
                    foreignField: '_id',
                    as: '_triviaId',
                }
            },
            { $unwind: '$_triviaId' },
            {$match : { $and: [{_userId }, {"_triviaId.status": {$in : [constants.TRIVIA_STATUS.CANCELLED, constants.TRIVIA_STATUS.CLOSED]}}]}},
        ])

        let total = triviaDatatotal.length;

        let pastTriviaData = await EnrollTrivia.aggregate([
            {
                $match : {_userId }
            },
            {
                $lookup : {
                    from: 'trivias',
                    localField: '_triviaId',
                    foreignField: '_id',
                    as: '_triviaId',
                }
            },
            { $unwind: '$_triviaId' },
            { $addFields: 
                { 
                    currentTimeStamp,
                    participatedIn: constants.USER.PARTICIPANT,
                    rank : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    totalCorrectAnswer : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    totalTimeSpent : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    totalTimeSpentInMilliSec : constants.USER_TRIVIA_STATUS.NOT_ATTENDED,
                    leaderBoardStatus: constants.USER_TRIVIA_STATUS.LEADERBOARD_NOT_GENERATED,
                    spotLeft: {$subtract: [ "$_triviaId.maxParticipants", "$_triviaId.currentParticipants" ]}
                }
            },
            {$match : { $and: [{_userId}, {"_triviaId.status": {$in : [constants.TRIVIA_STATUS.CANCELLED, constants.TRIVIA_STATUS.CLOSED]}}]}},
        ])
        .sort({[field] : value})
        .skip((pageOptions.page - 1) * pageOptions.limit)
        .limit(pageOptions.limit)
        .collation({ locale: "en" });

        for(let i=0; i<pastTriviaData.length;i++){
            const leaderBoard = await TriviaWinnerListWithPrizeAmount.findOne({_triviaId : mongoose.Types.ObjectId(pastTriviaData[i]._triviaId._id)})

            if(leaderBoard){
                pastTriviaData[i].leaderBoardStatus = constants.USER_TRIVIA_STATUS.LEADERBOARD_GENERATED;
            }
            const leaderBoardRank = await TriviaWinnerListWithPrizeAmount.findOne({_triviaId : mongoose.Types.ObjectId(pastTriviaData[i]._triviaId._id), _userId })
            
            if(leaderBoardRank){
                pastTriviaData[i].rank = leaderBoardRank.rank;
                pastTriviaData[i].totalCorrectAnswer = leaderBoardRank.totalCorrectAnswer;
                pastTriviaData[i].totalTimeSpent = leaderBoardRank.totalTimeSpent;
                pastTriviaData[i].totalTimeSpentInMilliSec = leaderBoardRank.totalTimeSpentInMilliSec;
            }    
        }

        let page = pageOptions.page ;
        let limit = pageOptions.limit;

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("TRIVIA.USER_ENROLLED_DETAIL", req.headers.lang),
            error: false,
            data: {upcomingTriviaData, pastTriviaData, page, limit, total}
        })
        // logService.responseData(req, {upcomingTriviaData, pastTriviaData, page, limit, total});
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message:Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
        // logService.responseData(req, error);
    }
}

//Find all enrolled trivia details
exports.getQuetionAnswerSummary =  async (req, res) => {
    try {
        const _triviaId = req.params._triviaId;
        const _userId = req.user._id;

        let triviaData = await Trivia.findById(_triviaId);
        if(!triviaData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.TRIVIA_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let enrolledTriviaData = await EnrollTrivia.findOne({_triviaId, _userId})
        if(!enrolledTriviaData){
            return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("TRIVIA.TRIVIA_NOT_FOUND", req.headers.lang),
                        error:true,
                        data:{}
                    })
        }

        if(triviaData.status != constants.TRIVIA_STATUS.CLOSED ){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("TRIVIA.TRIVIA_QUESTION_ANSWER_SUMMARY_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }

        const questionSummary = await Question.aggregate([
            { $match : { _triviaId : mongoose.Types.ObjectId(_triviaId) }  },
            {
              $lookup:{
                  from: 'triviaanswers',
                  localField: '_id',
                  foreignField: '_questionId',
                  as: 'answers',        
              }
            },
            { $addFields: 
                { 
                    givenAnswer : constants.USER_TRIVIA_STATUS.DEFAULT_RANK,
                }
            },
          ])

          for(let i=0;i<questionSummary.length;i++){
              let givenAnswer = await SubmitTriviaAnswer.findOne({_triviaId : mongoose.Types.ObjectId(_triviaId), _userId, _questionId : questionSummary[i]._id})
              if(givenAnswer){
                questionSummary[i].givenAnswer = givenAnswer._answerId;
              }

          }
        
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("TRIVIA.TRIVIA_QUESTION_SUMMARY", req.headers.lang),
            error: false,
            data: questionSummary
        })
        // logService.responseData(req, questionSummary);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message:Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
        // logService.responseData(req, error);
    }
}