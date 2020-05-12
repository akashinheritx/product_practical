const GlobalGeneralSettings = require('../../models/globalGeneralSettings.model');
const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');


/**
 * Create global general settings
 * @function
 * @param {Number} referralAmount - .
 * @param {String} welcomeEmail - .
 * @param {String} supportEmail - .
 * @param {Number} adminProfitPercentage - .
 * @param {Number} triviaAnswerTiming - .
 * @param {Number} triviaAdminCut - .
 * @param {Number} triviaMaxQuestions - .
 * @param {Number} getTriviaQuestionTiming - .
 * @param {Number} triviaMinStartHours - .
 * @param {Number} triviaMinStartDay - .
 * @param {Number} triviaMaxStartDay - .
 * @param {Number} triviaMinEnrollStartHours - .
 * @param {Number} triviaMinEnrollStartDay - .
 * @param {Number} triviaMaxEnrollStartDay - .
 * @param {Number} triviaEnrollEndTime - .
 * @param {Number} triviaNotifyTime - .
 * @param {Number} triviaWinnerListGenerateTime - .
 * @param {Number} dfsAdminCut - .
 * @param {Number} dfsMinStartDay - .
 * @param {Number} dfsMaxStartDay - .
 * @param {Number} dfsMinEnrollStartDay - .
 * @param {Number} dfsMaxEnrollStartDay - .
 * @param {Number} dfsEnrollEndTime - .
 * @param {Number} dfsNotifyTime - .
 * @param {Number} dfsWinnerListGenerateTime - .
 * @param {Number} leagueAdminCut - .
 * @param {Number} leagueMinStartDay - .
 * @param {Number} leagueMaxStartDay - .
 * @param {Number} leagueMinEnrollStartDay - .
 * @param {Number} leagueMaxEnrollStartDay - .
 * @param {Number} leagueEnrollEndTime - .
 * @param {Number} leagueNotifyTime - .
 * @param {Number} leagueWinnerListGenerateTime - .
 * @param {Number} showStaticLeague - .
 * @param {Number} privateContestMinCreateTime - .
 * @param {Number} dayInNumber - .
 * @param {Number} hourInNumber - .
 * @param {Number} minuteInNumber - .
 * @param {Number} secondInNumber - .
 * @param {Number} weekInMilisec - .
 * @param {Number} dayInMilisec - .
 * @param {Number} hourInMilisec - .
 * @param {Number} minuteInMilisec - .
 * @param {Number} secInMilisec - .
 * @param {Number} botUserPercentInPlatform - .
 * @param {Number} pointDeductionPerExtraTransfer - .
 * @param {Number} keepAmountInUserWinningWallet - .
 * @param {Number} giftClaimEmail - .
 * @param {Number} join12TH30Count - .
 * @param {Number} join12TH50Count - .
 * @param {Number} join12TH75Count - .
 * @param {Number} join12TH110Count - .
 * @param {Number} join12TH250Count - .
 * @param {String} adminEmailForTDS - .
 * @param {Number} tdsPercentage - .
 * @param {Number} tdsAmount - .
 * @param {Number} captainPoints - .
 * @param {Number} viceCaptainPoints - .
 * @param {Number} isDepositFunctinalityAvailable - .
 * @param {Number} isPayOutFunctinalityAvailable - .
 * @param {Number} payOutNotifyTime - .
 * @param {Number} createdAt - .
 * @param {Number} updatedAt - .
 * @returns {Object} globalGeneralSettingsData - Returns globalGeneralSettingsData.
 */
exports.createGlobalGeneralSettings = async (req, res) => {

    try{
        let reqdata = req.body;

        globalGeneralSettings = new GlobalGeneralSettings({
            referralAmount : reqdata.referralAmount,
            welcomeEmail : reqdata.welcomeEmail,
            supportEmail : reqdata.supportEmail,
            adminProfitPercentage : reqdata.adminProfitPercentage,
            triviaAnswerTiming : reqdata.triviaAnswerTiming,
            triviaAdminCut : reqdata.triviaAdminCut,  
            triviaMaxQuestions : reqdata.triviaMaxQuestions,    
            getTriviaQuestionTiming : reqdata.getTriviaQuestionTiming,    
            triviaMinStartHours : reqdata.triviaMinStartHours,
            triviaMinStartDay : reqdata.triviaMinStartDay,
            triviaMaxStartDay : reqdata.triviaMaxStartDay,
            triviaMinEnrollStartHours : reqdata.triviaMinEnrollStartHours,
            triviaMinEnrollStartDay : reqdata.triviaMinEnrollStartDay,
            triviaMaxEnrollStartDay : reqdata.triviaMaxEnrollStartDay,
            triviaEnrollEndTime : reqdata.triviaEnrollEndTime,
            triviaNotifyTime : reqdata.triviaNotifyTime,
            triviaWinnerListGenerateTime : reqdata.triviaWinnerListGenerateTime,
            dfsAdminCut : reqdata.dfsAdminCut,
            dfsMinStartDay : reqdata.dfsMinStartDay,
            dfsMaxStartDay : reqdata.dfsMaxStartDay,
            dfsMinEnrollStartDay : reqdata.dfsMinEnrollStartDay,  
            dfsMaxEnrollStartDay : reqdata.dfsMaxEnrollStartDay,
            dfsEnrollEndTime : reqdata.dfsEnrollEndTime,
            dfsNotifyTime : reqdata.dfsNotifyTime,
            dfsWinnerListGenerateTime : reqdata.dfsWinnerListGenerateTime,
            leagueAdminCut : reqdata.leagueAdminCut,
            leagueMinStartDay : reqdata.leagueMinStartDay,
            leagueMaxStartDay : reqdata.leagueMaxStartDay,
            leagueMinEnrollStartDay : reqdata.leagueMinEnrollStartDay,
            leagueMaxEnrollStartDay : reqdata.leagueMaxEnrollStartDay,
            leagueEnrollEndTime : reqdata.leagueEnrollEndTime,
            leagueNotifyTime : reqdata.leagueNotifyTime,
            leagueWinnerListGenerateTime : reqdata.leagueWinnerListGenerateTime,
            showStaticLeague : reqdata.showStaticLeague,
            privateContestMinCreateTime : reqdata.privateContestMinCreateTime,
            dayInNumber : reqdata.dayInNumber,
            hourInNumber : reqdata.hourInNumber,
            minuteInNumber : reqdata.minuteInNumber,
            secondInNumber : reqdata.secondInNumber,
            weekInMilisec : reqdata.weekInMilisec,
            dayInMilisec : reqdata.dayInMilisec,
            hourInMilisec : reqdata.hourInMilisec,
            minuteInMilisec : reqdata.minuteInMilisec,
            secInMilisec : reqdata.secInMilisec,
            botUserPercentInPlatform : reqdata.botUserPercentInPlatform,
            pointDeductionPerExtraTransfer : reqdata.pointDeductionPerExtraTransfer,
            keepAmountInUserWinningWallet : reqdata.keepAmountInUserWinningWallet,
            giftClaimEmail : reqdata.giftClaimEmail,
            join12TH30Count : reqdata.join12TH30Count,
            join12TH50Count : reqdata.join12TH50Count,
            join12TH75Count : reqdata.join12TH75Count,
            join12TH110Count : reqdata.join12TH110Count,
            join12TH250Count : reqdata.join12TH250Count,
            adminEmailForTDS : reqdata.adminEmailForTDS,
            tdsPercentage : reqdata.tdsPercentage,
            tdsAmount : reqdata.tdsAmount,
            captainPoints : reqdata.captainPoints,
            viceCaptainPoints : reqdata.viceCaptainPoints,
            isDepositFunctinalityAvailable : reqdata.isDepositFunctinalityAvailable,
            isPayOutFunctinalityAvailable : reqdata.isPayOutFunctinalityAvailable,
            payOutNotifyTime : reqdata.payOutNotifyTime,
    
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp(),

        });

        let globalGeneralSettingsData = await globalGeneralSettings.save();
        
        res.status(201).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_GENERAL_SETTINGS_CREATED_SUCCESS", req.headers.lang),
            error: false,
            data : globalGeneralSettingsData
        });

        logService.responseData(req, globalGeneralSettingsData);

    }catch(error){
        console.log(error)
        
        res.status(400).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data:{}
        });

        logService.responseData(req, error);
    }
}

/**
 * Get global general settings
 * @function
 * @returns {Object} globalGeneralSettingsData - Returns globalGeneralSettingsData.
 * It will get single object of global General Settings.
 * We don't need to pass any id as we are managing single object in Get global general settings.
 */
exports.getGlobalGeneralSettings = async (req, res) => {

    try{
        
        var globalGeneralSettings = await GlobalGeneralSettings.findOne();
        if(!globalGeneralSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_GENERAL_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        
        res.status(200).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_GENERAL_SETTINGS_RETRIEVE", req.headers.lang),
            error: false,
            data : globalGeneralSettings
        });

        // logService.responseData(req, globalGeneralSettings);

    }catch(error){
        console.log(error)
        
        res.status(400).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data:{}
        });

        // logService.responseData(req, error);
    }
}

/**
 * Update global general settings
 * @function
 * @param {ObjectId} _id - _id of global general settings.
 * @param {Number} referralAmount - .
 * @param {String} welcomeEmail - .
 * @param {String} supportEmail - .
 * @param {Number} adminProfitPercentage - .
 * @param {Number} triviaAnswerTiming - .
 * @param {Number} triviaAdminCut - .
 * @param {Number} triviaMaxQuestions - .
 * @param {Number} getTriviaQuestionTiming - .
 * @param {Number} triviaMinStartHours - .
 * @param {Number} triviaMinStartDay - .
 * @param {Number} triviaMaxStartDay - .
 * @param {Number} triviaMinEnrollStartHours - .
 * @param {Number} triviaMinEnrollStartDay - .
 * @param {Number} triviaMaxEnrollStartDay - .
 * @param {Number} triviaEnrollEndTime - .
 * @param {Number} triviaNotifyTime - .
 * @param {Number} triviaWinnerListGenerateTime - .
 * @param {Number} dfsAdminCut - .
 * @param {Number} dfsMinStartDay - .
 * @param {Number} dfsMaxStartDay - .
 * @param {Number} dfsMinEnrollStartDay - .
 * @param {Number} dfsMaxEnrollStartDay - .
 * @param {Number} dfsEnrollEndTime - .
 * @param {Number} dfsNotifyTime - .
 * @param {Number} dfsWinnerListGenerateTime - .
 * @param {Number} leagueAdminCut - .
 * @param {Number} leagueMinStartDay - .
 * @param {Number} leagueMaxStartDay - .
 * @param {Number} leagueMinEnrollStartDay - .
 * @param {Number} leagueMaxEnrollStartDay - .
 * @param {Number} leagueEnrollEndTime - .
 * @param {Number} leagueNotifyTime - .
 * @param {Number} leagueWinnerListGenerateTime - .
 * @param {Number} showStaticLeague - .
 * @param {Number} privateContestMinCreateTime - .
 * @param {Number} dayInNumber - .
 * @param {Number} hourInNumber - .
 * @param {Number} minuteInNumber - .
 * @param {Number} secondInNumber - .
 * @param {Number} weekInMilisec - .
 * @param {Number} dayInMilisec - .
 * @param {Number} hourInMilisec - .
 * @param {Number} minuteInMilisec - .
 * @param {Number} secInMilisec - .
 * @param {Number} botUserPercentInPlatform - .
 * @param {Number} pointDeductionPerExtraTransfer - .
 * @param {Number} keepAmountInUserWinningWallet - .
 * @param {Number} giftClaimEmail - .
 * @param {Number} join12TH30Count - .
 * @param {Number} join12TH50Count - .
 * @param {Number} join12TH75Count - .
 * @param {Number} join12TH110Count - .
 * @param {Number} join12TH250Count - .
 * @param {String} adminEmailForTDS - .
 * @param {Number} tdsPercentage - .
 * @param {Number} tdsAmount - .
 * @param {Number} captainPoints - .
 * @param {Number} viceCaptainPoints - .
 * @param {Number} isDepositFunctinalityAvailable - .
 * @param {Number} isPayOutFunctinalityAvailable - .
 * @param {Number} payOutNotifyTime - .
 * @param {Number} updatedAt - .
 * @returns {Object} globalGeneralSettingsData - Returns globalGeneralSettingsData.
 * It will update a field of global General Settings which you have passed in req.body related to globalGeneralSettingsData.
 */
exports.updateGlobalGeneralSettings = async (req, res) => {

    try{
        let reqdata = req.body;

        var globalGeneralSettings = await GlobalGeneralSettings.findById(reqdata._id);
        if(!globalGeneralSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_GENERAL_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        if(reqdata.referralAmount){
            globalGeneralSettings.referralAmount = reqdata.referralAmount;
        }
        if(reqdata.welcomeEmail){
            globalGeneralSettings.welcomeEmail = reqdata.welcomeEmail;
        }
        if(reqdata.supportEmail){
            globalGeneralSettings.supportEmail = reqdata.supportEmail;
        }
        if(reqdata.adminProfitPercentage){
            globalGeneralSettings.adminProfitPercentage = reqdata.adminProfitPercentage;
        }
        if(reqdata.triviaAnswerTiming){
            globalGeneralSettings.triviaAnswerTiming = reqdata.triviaAnswerTiming;
        }
        if(reqdata.triviaAdminCut){
            globalGeneralSettings.triviaAdminCut = reqdata.triviaAdminCut;
        }
        if(reqdata.triviaMaxQuestions){
            globalGeneralSettings.triviaMaxQuestions = reqdata.triviaMaxQuestions;
        }

        if(reqdata.getTriviaQuestionTiming){
            globalGeneralSettings.getTriviaQuestionTiming = reqdata.getTriviaQuestionTiming;
        }

        if(reqdata.triviaMinStartHours){
            globalGeneralSettings.triviaMinStartHours = reqdata.triviaMinStartHours;
        }

        if(reqdata.triviaMinStartDay){
            globalGeneralSettings.triviaMinStartDay = reqdata.triviaMinStartDay;
        }
        if(reqdata.triviaMaxStartDay){
            globalGeneralSettings.triviaMaxStartDay = reqdata.triviaMaxStartDay;
        }

        if(reqdata.triviaMinEnrollStartHours){
            globalGeneralSettings.triviaMinEnrollStartHours = reqdata.triviaMinEnrollStartHours;
        }

        if(reqdata.triviaMinEnrollStartDay){
            globalGeneralSettings.triviaMinEnrollStartDay = reqdata.triviaMinEnrollStartDay;
        }
        if(reqdata.triviaMaxEnrollStartDay){
            globalGeneralSettings.triviaMaxEnrollStartDay = reqdata.triviaMaxEnrollStartDay;
        }
        if(reqdata.triviaEnrollEndTime){
            globalGeneralSettings.triviaEnrollEndTime = reqdata.triviaEnrollEndTime;
        }
        if(reqdata.triviaNotifyTime){
            globalGeneralSettings.triviaNotifyTime = reqdata.triviaNotifyTime;
        }
        if(reqdata.triviaWinnerListGenerateTime){
            globalGeneralSettings.triviaWinnerListGenerateTime = reqdata.triviaWinnerListGenerateTime;
        }
        if(reqdata.dfsAdminCut){
            globalGeneralSettings.dfsAdminCut = reqdata.dfsAdminCut;
        }
        if(reqdata.dfsMinStartDay){
            globalGeneralSettings.dfsMinStartDay = reqdata.dfsMinStartDay;
        }
        if(reqdata.dfsMaxStartDay){
            globalGeneralSettings.dfsMaxStartDay = reqdata.dfsMaxStartDay;
        }
        if(reqdata.dfsMinEnrollStartDay){
            globalGeneralSettings.dfsMinEnrollStartDay = reqdata.dfsMinEnrollStartDay;
        }
        if(reqdata.dfsMaxEnrollStartDay){
            globalGeneralSettings.dfsMaxEnrollStartDay = reqdata.dfsMaxEnrollStartDay;
        }
        if(reqdata.dfsEnrollEndTime){
            globalGeneralSettings.dfsEnrollEndTime = reqdata.dfsEnrollEndTime;
        }
        if(reqdata.dfsNotifyTime){
            globalGeneralSettings.dfsNotifyTime = reqdata.dfsNotifyTime;
        }
        if(reqdata.dfsWinnerListGenerateTime){
            globalGeneralSettings.dfsWinnerListGenerateTime = reqdata.dfsWinnerListGenerateTime;
        }
        if(reqdata.leagueAdminCut){
            globalGeneralSettings.leagueAdminCut = reqdata.leagueAdminCut;
        }
        if(reqdata.leagueMinStartDay){
            globalGeneralSettings.leagueMinStartDay = reqdata.leagueMinStartDay;
        }
        if(reqdata.leagueMaxStartDay){
            globalGeneralSettings.leagueMaxStartDay = reqdata.leagueMaxStartDay;
        }
        if(reqdata.leagueMinEnrollStartDay){
            globalGeneralSettings.leagueMinEnrollStartDay = reqdata.leagueMinEnrollStartDay;
        }
        if(reqdata.leagueMaxEnrollStartDay){
            globalGeneralSettings.leagueMaxEnrollStartDay = reqdata.leagueMaxEnrollStartDay;
        }
        if(reqdata.leagueEnrollEndTime){
            globalGeneralSettings.leagueEnrollEndTime = reqdata.leagueEnrollEndTime;
        }
        if(reqdata.leagueNotifyTime){
            globalGeneralSettings.leagueNotifyTime = reqdata.leagueNotifyTime;
        }
        if(reqdata.leagueWinnerListGenerateTime){
            globalGeneralSettings.leagueWinnerListGenerateTime = reqdata.leagueWinnerListGenerateTime;
        }
        if(reqdata.showStaticLeague){
            globalGeneralSettings.showStaticLeague = reqdata.showStaticLeague;
        }
        if(reqdata.privateContestMinCreateTime){
            globalGeneralSettings.privateContestMinCreateTime = reqdata.privateContestMinCreateTime;
        }

        if(reqdata.dayInNumber){
            globalGeneralSettings.dayInNumber = reqdata.dayInNumber;
        }
        if(reqdata.hourInNumber){
            globalGeneralSettings.hourInNumber = reqdata.hourInNumber;
        }
        if(reqdata.minuteInNumber){
            globalGeneralSettings.minuteInNumber = reqdata.minuteInNumber;
        }
        if(reqdata.secondInNumber){
            globalGeneralSettings.secondInNumber = reqdata.secondInNumber;
        }
        if(reqdata.weekInMilisec){
            globalGeneralSettings.weekInMilisec = reqdata.weekInMilisec;
        }
        if(reqdata.dayInMilisec){
            globalGeneralSettings.dayInMilisec = reqdata.dayInMilisec;
        }
        if(reqdata.hourInMilisec){
            globalGeneralSettings.hourInMilisec = reqdata.hourInMilisec;
        }
        if(reqdata.minuteInMilisec){
            globalGeneralSettings.minuteInMilisec = reqdata.minuteInMilisec;
        }
        if(reqdata.secInMilisec){
            globalGeneralSettings.secInMilisec = reqdata.secInMilisec;
        }
        if(reqdata.botUserPercentInPlatform){
            globalGeneralSettings.botUserPercentInPlatform = reqdata.botUserPercentInPlatform;
        }

        if(reqdata.pointDeductionPerExtraTransfer){
            globalGeneralSettings.pointDeductionPerExtraTransfer = reqdata.pointDeductionPerExtraTransfer;
        }

        if(reqdata.keepAmountInUserWinningWallet){
            globalGeneralSettings.keepAmountInUserWinningWallet = reqdata.keepAmountInUserWinningWallet;
        }

        if(reqdata.giftClaimEmail){
            globalGeneralSettings.giftClaimEmail = reqdata.giftClaimEmail;
        }

        if(reqdata.join12TH30Count){
            globalGeneralSettings.join12TH30Count = reqdata.join12TH30Count;
        }
        
        if(reqdata.join12TH50Count){
            globalGeneralSettings.join12TH50Count = reqdata.join12TH50Count;
        }

        if(reqdata.join12TH75Count){
            globalGeneralSettings.join12TH75Count = reqdata.join12TH75Count;
        }

        if(reqdata.join12TH110Count){
            globalGeneralSettings.join12TH110Count = reqdata.join12TH110Count;
        }

        if(reqdata.join12TH250Count){
            globalGeneralSettings.join12TH250Count = reqdata.join12TH250Count;
        }

        if(reqdata.adminEmailForTDS){
            globalGeneralSettings.adminEmailForTDS = reqdata.adminEmailForTDS;
        }

        if(reqdata.tdsPercentage){
            globalGeneralSettings.tdsPercentage = reqdata.tdsPercentage;
        }

        if(reqdata.tdsAmount){
            globalGeneralSettings.tdsAmount = reqdata.tdsAmount;
        }

        if(reqdata.captainPoints){
            globalGeneralSettings.captainPoints = reqdata.captainPoints;
        }

        if(reqdata.viceCaptainPoints){
            globalGeneralSettings.viceCaptainPoints = reqdata.viceCaptainPoints;
        }

        if(reqdata.isDepositFunctinalityAvailable){
            globalGeneralSettings.isDepositFunctinalityAvailable = reqdata.isDepositFunctinalityAvailable;
        }

        if(reqdata.isPayOutFunctinalityAvailable){
            globalGeneralSettings.isPayOutFunctinalityAvailable = reqdata.isPayOutFunctinalityAvailable;
        }

        if(reqdata.payOutNotifyTime){
            globalGeneralSettings.payOutNotifyTime = reqdata.payOutNotifyTime;
        }

        globalGeneralSettings.updatedAt = dateFormat.setCurrentTimestamp();

        let globalGeneralSettingsData = await globalGeneralSettings.save();
        
        res.status(200).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_GENERAL_SETTINGS_UPDATED_SUCCESS", req.headers.lang),
            error: false,
            data : globalGeneralSettingsData
        });

        logService.responseData(req, globalGeneralSettingsData);

    }catch(error){
        console.log(error)
        
        res.status(400).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data:{}
        });

        logService.responseData(req, error);
    }
}