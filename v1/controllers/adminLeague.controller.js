const FootBallLeagueSchedule = require('../../models/footBallLeagueSchedules.model');
const FootBallLeagueWeek = require('../../models/footBallLeagueWeeks.model');
const FootBallPlayerName = require('../../models/footBallPlayerNames.model');
const FootBallLeaguePrizeBreakDowns = require('../../models/footBallLeaguePrizeBreakDown.model');
const FootBallLeagueContest = require('../../models/footBallLeagueContest.model');
const LeagueWinnerListWithPrizeAmount = require('../../models/leagueWinnerListwithPrizeAmounts.model');
const GlobalGeneralSettings = require('../../models/globalGeneralSettings.model');
const GlobalBoosterSettings = require('../../models/globalBoosterSettings.model');
const StaticFootBallLeagueSchedule = require('../../models/staticFootBallLeagueSchedule.model');
const EnrollFootBallLeagueContest = require('../../models/enrollFootBallLeagueContest.model');
const WalletHistory = require('../../models/walletHistory.model');
const LeagueWeekMaster = require('../../models/leagueWeekMaster.model');
const User = require('../../models/user.model');

const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const notificationFunction = require('../../helper/notificationFunction.helper');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');
const keys = require('../../keys/keys');

//Get a list of upcoming leagues
exports.getUpComingLeagueList = async (req, res) => {
    try {            
            let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            let upComingDays = currentTimeStamp + (constants.UPCOMIG_DAYS * constants.TIME_DIFF_MILISEC.GET_DAY);
            let field, value; 
            const search = req.query.q ? req.query.q : ''; // for searching
            if (req.query.sortBy) {
                const parts = req.query.sortBy.split(':');
                field = parts[0];
                parts[1] ==='desc' ? value=-1 : value= 1;
            }else{
                field = "startTime",
                value = 1;
            }
            const pageOptions = {
                page: parseInt(req.query.page) || constants.PAGE,
                limit: parseInt(req.query.limit) || constants.LIMIT
            }
            let query = {
                $and : [
                {deletedAt: null},
                // {startTime :{$gte: currentTimeStamp, $lte: upComingDays}},                       //Uncomment this when going live
                {startTime : {$exists : true}},
                {startTime : {$ne : null}},
                // {status:constants.LEAGUE_STATUS.ENROLL},
                {status: {$in :[constants.LEAGUE_STATUS.CONFIRMED, constants.LEAGUE_STATUS.OPEN, constants.LEAGUE_STATUS.ENROLL, constants.LEAGUE_STATUS.RUNNING]}}
                ]
            }
            if (search) {
                query.$or = [
                    { 'leagueName': new RegExp(search, 'i') },
                ]
            }

            let globalGeneralSettings = await GlobalGeneralSettings.findOne();
            if(!globalGeneralSettings){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message:Lang.responseIn("ADMIN_GENERAL.GLOBAL_GENERAL_SETTINGS_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let footballLeagues, total;

            let showStaticLeague = globalGeneralSettings.showStaticLeague;

            if(showStaticLeague === constants.SHOW_STATIC_LEAGUE.NO){
                
                total = await FootBallLeagueSchedule.countDocuments(query);
                footballLeagues = await FootBallLeagueSchedule.aggregate([
                    {$match: query},
                    { $addFields: 
                                { 
                                    currentTimeStamp,
                                    contestCount : constants.DEFAULT_NUMBER,
                                }
                            },
                ])
                .sort({[field]:value})
                .skip((pageOptions.page - 1) * pageOptions.limit)
                .limit(pageOptions.limit)
                .collation({ locale: "en" });

                for(let i=0;i<footballLeagues.length;i++){
                    let count = await FootBallLeagueContest.countDocuments({_leagueId : footballLeagues[i]._id, status : {$in : [constants.LEAGUE_STATUS.ENROLL, constants.LEAGUE_STATUS.CONFIRMED, constants.LEAGUE_STATUS.OPEN]}})
                    footballLeagues[i].contestCount = count
                }

            }else{
                total = await StaticFootBallLeagueSchedule.countDocuments(query);
                footballLeagues = await StaticFootBallLeagueSchedule.aggregate([
                    {$match: query},
                    { $addFields: 
                                { 
                                    currentTimeStamp,
                                    contestCount : constants.DEFAULT_NUMBER,
                                }
                            },
                ])
                .sort({[field]:value})
                .skip((pageOptions.page - 1) * pageOptions.limit)
                .limit(pageOptions.limit)
                .collation({ locale: "en" });
            }


            var page = pageOptions.page ;
            var limit = pageOptions.limit;


            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.LEAGUE_LIST", req.headers.lang),
            error: false,
            data: {footballLeagues, page, limit, total}
            });
            // logService.responseData(req, footballLeagues);
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

//Get a list of upcoming league player list
exports.getLeaguePlayerList = async (req, res) => {
    try {            
            var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            var _leagueId = req.params._id;

            const isLeagueExist = await FootBallLeagueSchedule.findOne({_id: _leagueId});
            if(!isLeagueExist){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.LEAGUE_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            var field, value; 
            const search = req.query.q ? req.query.q : ''; // for searching
            if (req.query.sortBy) {
                const parts = req.query.sortBy.split(':');
                field = parts[0];
                parts[1] ==='desc' ? value=-1 : value= 1;
            }else{
                field = "createdAt",
                value = 1;
            }
            const pageOptions = {
                page: parseInt(req.query.page) || constants.PAGE,
                limit: parseInt(req.query.limit) || constants.LIMIT
            }
            var query = {
                deletedAt: null, 
            }
            if (search) {
                query.$or = [
                    { 'playerName': new RegExp(search, 'i') },
                ]
            }

            let teamIdsArr = await commonFunction.leagueTeamArr(_leagueId);

            let total = await FootBallPlayerName.countDocuments({teamId : {$in : teamIdsArr}});
            const footballLeaguePlayers = await FootBallPlayerName.find({teamId : {$in : teamIdsArr}})
            .sort({[field]:value})
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

            var page = pageOptions.page ;
            var limit = pageOptions.limit;

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.PLAYER_LIST", req.headers.lang),
            error: false,
            data: {footballLeaguePlayers, page, limit, total}
            });
            // logService.responseData(req, footballLeaguePlayers);
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

//Create League contest
exports.createLeagueContest = async (req, res) => {
    try {            
        const _createdBy = req.user._id

        var reqdata = req.body
        var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        var _leagueId = reqdata._leagueId;
        let boosters = reqdata.boosters
        
        const isLeagueExist = await FootBallLeagueSchedule.findOne({_id: _leagueId});
        if(!isLeagueExist){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.LEAGUE_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        var contestName = (reqdata.contestName).trim()
            
        var regex = new RegExp('^' + contestName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
            
        var isContestNameExist = await FootBallLeagueContest.findOne({contestName: {$regex : regex}});
    
        if(isContestNameExist){
          return res.status(400).send({
              status:constants.STATUS_CODE.FAIL,
              message: Lang.responseIn("SOCCER.CONTEST_EXSITS", req.headers.lang),
              error:true,
              data:{}
          })
        }
        
        var globalGeneralSettings = await GlobalGeneralSettings.findOne();
        if(!globalGeneralSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message:Lang.responseIn("ADMIN_GENERAL.GLOBAL_GENERAL_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        for(let a=0; a<boosters.length;a++){
            var globalBoosterSettings = await GlobalBoosterSettings.findOne({_id : boosters[a]._boosterId});
            if(!globalBoosterSettings){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message:Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_SETTINGS_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

        }
        let startTime = isLeagueExist.startTime;
        let dayInMilisec = globalGeneralSettings.dayInMilisec;
        let diffInDays =  (startTime - currentTimeStamp)/dayInMilisec;
        //Uncomment this when going live
        
        if(diffInDays>globalGeneralSettings.leagueMaxStartDay || diffInDays<globalGeneralSettings.leagueMinStartDay){
            return   res.status(400).send({
              status: constants.STATUS_CODE.VALIDATION,
              message: Lang.responseIn("SOCCER.CONTEST_CREATE_TIME_ERROR", req.headers.lang),
              error: true,
              data: {},
            });
        }
        
    
        let enrollStartTime, daysLeft;
        
        if(reqdata.enrollStartTime){
          enrollStartTime = parseInt(dateFormat.setDateFormatToTimeStamp(reqdata.enrollStartTime));
            daysLeft = (startTime - enrollStartTime) / dayInMilisec;
            if(startTime < enrollStartTime){
                return   res.status(400).send({
                  status: constants.STATUS_CODE.VALIDATION,
                  message: Lang.responseIn("SOCCER.CONTEST_ENROLL_TIME_ERROR", req.headers.lang),
                  error: true,
                  data: {},
                });
              }else if(enrollStartTime < currentTimeStamp){
                return res.status(400).send({
                    status: constants.STATUS_CODE.VALIDATION,
                    message: Lang.responseIn("SOCCER.ENROLL_START_TIME_ERROR", req.headers.lang),
                    error: true,
                    data: {},
              })
            }else if(daysLeft>globalGeneralSettings.leagueMaxEnrollStartDay || daysLeft<globalGeneralSettings.leagueMinEnrollStartDay){
              return   res.status(400).send({
                status: constants.STATUS_CODE.VALIDATION,
                message: Lang.responseIn("SOCCER.CONTEST_ENROLL_START_TIME_ERROR", req.headers.lang),
                error: true,
                data: {},
              });
          }
        }else{
            enrollStartTime = dateFormat.setCurrentTimestamp();
            daysLeft = (startTime - enrollStartTime) / dayInMilisec;
            if(startTime < enrollStartTime){
                return   res.status(400).send({
                  status: constants.STATUS_CODE.VALIDATION,
                  message: Lang.responseIn("SOCCER.CONTEST_ENROLL_TIME_ERROR", req.headers.lang),
                  error: true,
                  data: {},
                });
              }else if(daysLeft>globalGeneralSettings.leagueMaxEnrollStartDay || daysLeft<globalGeneralSettings.leagueMinEnrollStartDay){
              return res.status(400).send({
                status: constants.STATUS_CODE.VALIDATION,
                message: Lang.responseIn("SOCCER.CONTEST_ENROLL_START_TIME_ERROR", req.headers.lang),
                error: true,
                data: {},
              });
          } 
        }

        let maxParticipants = reqdata.maxParticipants;
        let minParticipants = reqdata.minParticipants;
        
        let enrollEndTime = startTime - globalGeneralSettings.leagueEnrollEndTime

    //    let enrollEndTime = currentTimeStamp + (constants.ONE_DAY_MILISEC * 50)

        const newFootBallLeagueContest = new FootBallLeagueContest({
          _createdBy : _createdBy,
          userName : req.user.userName,
          _leagueId : _leagueId,
          contestName: reqdata.contestName,
          startTime : startTime,
          enrollStartTime : enrollStartTime,
        //   enrollStartTime : startTime,              // keep enrollStartTime when going live
          enrollEndTime : enrollEndTime,
          entryFee: reqdata.entryFee,
          maxParticipants: maxParticipants,
          minParticipants: minParticipants,
          totalPrize: reqdata.totalPrize,
          contestVisibility: constants.CONTEST_VISIBILITY.PUBLIC,
          contestType: reqdata.contestType,
          optionType: reqdata.optionType,
          teamFormat: reqdata.teamFormat,
          playerLimit : reqdata.playerLimit,
          createdAt: dateFormat.setCurrentTimestamp(),
          updatedAt: dateFormat.setCurrentTimestamp()
        });
    

        for(let i=0;i<boosters.length;i++){
            newFootBallLeagueContest.boosters = newFootBallLeagueContest.boosters.concat({_boosterId : boosters[i]._boosterId, boosterCount : boosters[i].boosterCount});
        }
        var footBallLeagueContestData = await newFootBallLeagueContest.save();
    
        var footBallPrizeBreakDowns = req.body.footBallPrizeBreakDowns;
        for(let k=0;k<footBallPrizeBreakDowns.length;k++){
          var newFootBallLeaguePrizeBreakDown = new FootBallLeaguePrizeBreakDowns({
            _leagueContestId: footBallLeagueContestData._id,
            from: footBallPrizeBreakDowns[k].from,
            to: footBallPrizeBreakDowns[k].to,
            amount: footBallPrizeBreakDowns[k].amount,
            additionalGift : footBallPrizeBreakDowns[k].additionalGift ? footBallPrizeBreakDowns[k].additionalGift : constants.ADDITIONAL_GIFT.NO,
            createdAt: dateFormat.setCurrentTimestamp(),
            updatedAt: dateFormat.setCurrentTimestamp()
          })
          var footBallPrizeBreakDownsData = await newFootBallLeaguePrizeBreakDown.save();
        }

        var leagueContestData = await FootBallLeagueContest.aggregate([
                {$match : {_id : footBallLeagueContestData._id}},
                {
                    $lookup : {
                        from: "footballleagueprizebreakdowns",
                        localField: "_id",
                        foreignField: "_leagueContestId",
                        as: "footBallPrizeBreakDowns"
                    }
                },
            ])

            for(let j=0; j<leagueContestData.length;j++){
                let booster = leagueContestData[j].boosters
                for(let k=0;k<booster.length;k++){
                    let boosterDetails = await GlobalBoosterSettings.findOne({_id : booster[k]._boosterId});
                    booster[k].boosterName = boosterDetails.boosterName;
                    booster[k].boosterType = boosterDetails.boosterType;
                }
            }

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.CONTEST_CREATE_SUCCESS", req.headers.lang),
            error: false,
            data: leagueContestData
            });
            logService.responseData(req, leagueContestData);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
        logService.responseData(req, error);
    }
}

//Get a list of upcoming league contest
exports.getUpComingLeagueContestList = async (req, res) => {
    try {            
            var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            var _leagueId = req.params._leagueId;
            var field, value, contestType, teamFormat; 
            const search = req.query.q ? req.query.q : ''; // for searching
            if (req.query.sortBy) {
                const parts = req.query.sortBy.split(':');
                field = parts[0];
                parts[1] ==='desc' ? value=-1 : value= 1;
            }else{
                field = "startTime",
                value = 1;
            }
            if(req.query.contestType){
                contestType = parseInt(req.query.contestType);
            }else{
                contestType = constants.CONTEST_TYPE.REGULAR;
            }
            if(req.query.teamFormat){
                teamFormat = parseInt(req.query.teamFormat);
            }else{
                teamFormat = constants.TEAM_FORMAT.ELEVEN
            }
            const pageOptions = {
                page: parseInt(req.query.page) || constants.PAGE,
                limit: parseInt(req.query.limit) || constants.LIMIT
            }
            var query = {
                deletedAt: null,
                enrollEndTime :{$gt: currentTimeStamp},
                // status:constants.LEAGUE_STATUS.ENROLL,
                status : {$in : [constants.LEAGUE_STATUS.ENROLL, constants.LEAGUE_STATUS.CONFIRMED, constants.LEAGUE_STATUS.OPEN]},
                _leagueId: mongoose.Types.ObjectId(_leagueId),
                contestType,
                teamFormat,
            }
            if (search) {
                query.$or = [
                    { 'contestName': new RegExp(search, 'i') },
                ]
            }
            var total = await FootBallLeagueContest.countDocuments(query);
            const footballLeagueContest = await FootBallLeagueContest.aggregate([
                {$match: query},
                { $addFields: 
                            { 
                                currentTimeStamp,
                            }
                        },
            ])
            .sort({[field]:value})
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

            var page = pageOptions.page ;
            var limit = pageOptions.limit;

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.CONTEST_LIST", req.headers.lang),
            error: false,
            data: {footballLeagueContest, page, limit, total}
            });
            // logService.responseData(req, footballLeagueContest);
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

//Get a single League contest
exports.getSingleLeagueContest = async (req, res) => {
    try {            
            var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            var _leagueContestId = req.params._leagueContestId
            const footballLeagueContest = await FootBallLeagueContest.aggregate([
                {$match: {_id: mongoose.Types.ObjectId(_leagueContestId)}},
                {
                    $lookup : {
                        from: "footballleagueprizebreakdowns",
                        localField: "_id",
                        foreignField: "_leagueContestId",
                        as: "footBallPrizeBreakDowns"
                    }
                },
                { $addFields: 
                            { 
                                currentTimeStamp,
                            }
                        },
            ])

            let booster = footballLeagueContest[0].boosters
            for(let k=0;k<booster.length;k++){
                let boosterDetails = await GlobalBoosterSettings.findOne({_id : booster[k]._boosterId});
                booster[k].boosterName = boosterDetails.boosterName;
                booster[k].boosterType = boosterDetails.boosterType;
                
            }

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.CONTEST_FOUND", req.headers.lang),
            error: false,
            data: footballLeagueContest
            });
            // logService.responseData(req, footballLeagueContest);
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

//Get a list of past leagues with contest already exists
exports.getPastLeagueList = async (req, res) => {
    try {            
            var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            // var upComingDays = currentTimeStamp + (constants.UPCOMIG_DAYS * constants.TIME_DIFF_MILISEC.GET_DAY);
            let pastContests = await FootBallLeagueContest.find({status : {$in :[constants.LEAGUE_STATUS.CLOSED, constants.LEAGUE_STATUS.ENROLL, constants.LEAGUE_STATUS.CANCELLED]}},{_leagueId : 1, _id:0})   //Remove ENROLL when required
            
            let leagueIds = [];
            for(let i=0;i<pastContests.length;i++){
                leagueIds.push(pastContests[i]._leagueId)
            }
            var field, value; 
            const search = req.query.q ? req.query.q : ''; // for searching
            if (req.query.sortBy) {
                const parts = req.query.sortBy.split(':');
                field = parts[0];
                parts[1] ==='desc' ? value=-1 : value= 1;
            }else{
                field = "startTime",
                value = -1;
            }
            const pageOptions = {
                page: parseInt(req.query.page) || constants.PAGE,
                limit: parseInt(req.query.limit) || constants.LIMIT
            }
            var query = {
                deletedAt: null,
                startTime :{$lte: currentTimeStamp},
                _id : {$in: leagueIds},
                // status:constants.LEAGUE_STATUS.CLOSED
            }
            if (search) {
                query.$or = [
                    { 'leagueName': new RegExp(search, 'i') },
                ]
            }
            var total = await FootBallLeagueSchedule.countDocuments(query);
            const pastFootballLeagues = await FootBallLeagueSchedule.aggregate([
                {$match: query},
                { $addFields: 
                            { 
                                currentTimeStamp,
                                contestCount : constants.DEFAULT_NUMBER,
                            }
                        },
            ])
            .sort({[field]:value})
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

            var page = pageOptions.page ;
            var limit = pageOptions.limit;

            for(let i=0;i<pastFootballLeagues.length;i++){
                let count = await FootBallLeagueContest.countDocuments({_leagueId : pastFootballLeagues[i]._id})
                pastFootballLeagues[i].contestCount = count
            }

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.LEAGUE_LIST", req.headers.lang),
            error: false,
            data: {pastFootballLeagues, page, limit, total}
            });
            // logService.responseData(req, {pastFootballLeagues, page, limit, total});
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

//Get a list of past league contest
exports.getPastLeagueContestList = async (req, res) => {
    try {            
            var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            var _leagueId = req.params._leagueId;
            var field, value, contestType, teamFormat; 
            const search = req.query.q ? req.query.q : ''; // for searching
            if (req.query.sortBy) {
                const parts = req.query.sortBy.split(':');
                field = parts[0];
                parts[1] ==='desc' ? value=-1 : value= 1;
            }else{
                field = "startTime",
                value = -1;
            }
            if(req.query.contestType){
                contestType = parseInt(req.query.contestType);
            }else{
                contestType = constants.CONTEST_TYPE.REGULAR;
            }
            if(req.query.teamFormat){
                teamFormat = parseInt(req.query.teamFormat);
            }else{
                teamFormat = constants.TEAM_FORMAT.ELEVEN
            }
            const pageOptions = {
                page: parseInt(req.query.page) || constants.PAGE,
                limit: parseInt(req.query.limit) || constants.LIMIT
            }
            var query = {
                deletedAt: null,
                // enrollEndTime :{$lte: currentTimeStamp},                 //uncomment this when required.
                status:{$in : [constants.LEAGUE_STATUS.CLOSED, constants.LEAGUE_STATUS.CANCELLED, constants.LEAGUE_STATUS.ENROLL]},     //Remove ENROLL when required
                _leagueId: mongoose.Types.ObjectId(_leagueId),
                contestType,
                teamFormat,
            }
            if (search) {
                query.$or = [
                    { 'contestName': new RegExp(search, 'i') },
                ]
            }
            var total = await FootBallLeagueContest.countDocuments(query);
            const pastFootballLeagueContest = await FootBallLeagueContest.aggregate([
                {$match: query},
                { $addFields: 
                            { 
                                currentTimeStamp,
                            }
                        },
            ])
            .sort({[field]:value})
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

            var page = pageOptions.page ;
            var limit = pageOptions.limit;

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.CONTEST_LIST", req.headers.lang),
            error: false,
            data: {pastFootballLeagueContest, page, limit, total}
            });
            // logService.responseData(req, {pastFootballLeagueContest, page, limit, total});
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

//Get single 
exports.getSingleLeagueWinnerList =  async (req, res) => {
    try {
        let _leagueContestId = req.params._leagueContestId;
        
        let leagueData = await FootBallLeagueContest.findById(_leagueContestId)
          if(!leagueData){
              return res.status(400).send({
                      status: constants.STATUS_CODE.FAIL,
                      message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                      error: true,
                      data: {}
                    });
          }
        let field, value; 
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
        var query = {
            _leagueContestId: mongoose.Types.ObjectId(_leagueContestId),
        }
        if (search) {
            query.$or = [
                { 'userName': new RegExp(search, 'i') }
            ]
        }
        let total = await LeagueWinnerListWithPrizeAmount.countDocuments(query);
        let leagueWinnerListWithPrizeAmountData = await LeagueWinnerListWithPrizeAmount.aggregate([
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
        var page = pageOptions.page ;
        var limit = pageOptions.limit;
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("GENERAL.WINNER_LIST", req.headers.lang),
            error: false,
            data: {leagueWinnerListWithPrizeAmountData, page, limit, total}
        })
        // logService.responseData(req, {leagueWinnerListWithPrizeAmountData, page, limit, total});
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

//Add static leagues
exports.addStaticLeagues = async (req, res) => {
    try {
    
        let reqdata = req.body;

        let startTime = dateFormat.setDateFormatToTimeStamp(reqdata.startTime);

        let addStaticLeague = new StaticFootBallLeagueSchedule({
            countryName : reqdata.countryName,
            leagueName : reqdata.leagueName,
            season : reqdata.season,
            status : constants.LEAGUE_STATUS.STATIC_LEAGUE,
            startTime,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp(),
        })

        let staticLeagueData = await addStaticLeague.save();

        res.status(201).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.ADD_STATIC_LEAGUE", req.headers.lang),
            error: false,
            data: staticLeagueData
        })
        
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
    }
}

//Delete static league
exports.deleteStaticLeague = async (req, res) => {
    try {
        let _leagueId = req.params._leagueId;
        
        let leagueData = await StaticFootBallLeagueSchedule.findOneAndDelete({_id : _leagueId})

        if(!leagueData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.LEAGUE_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.LEAGUE_DELETE_SUCCESS", req.headers.lang),
            error: false,
            data: leagueData
        })
        // logService.responseData(req, weeks);
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

/**
 * Cancel single League contest
 * @function
 * @param {ObjectId} _leagueContestId - .
 * @returns {Object} .
 * Will cancel single league contest and refund money to users who have participated in it.
 */
exports.cancelSingleLeagueContest = async (req, res) => {
    try {
      
        let _leagueContestId = req.params._leagueContestId;
  
        let leagueData = await FootBallLeagueContest.findOne({_id : _leagueContestId, status: {$in : [constants.LEAGUE_STATUS.ENROLL, constants.LEAGUE_STATUS.CONFIRMED, constants.LEAGUE_STATUS.OPEN]}})
        
        if(!leagueData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        if(leagueData.contestVisibility !== constants.CONTEST_VISIBILITY.PUBLIC){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.PRIVATE_CONTEST_CANCEL_VIA_ADMIN", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let contestName = leagueData.contestName;
        let entryFee = leagueData.entryFee;

        let enrollUserData = await EnrollFootBallLeagueContest.find({_leagueContestId})
            
        for(let l=0;l<enrollUserData.length;l++){

            let user = await User.findOne({_id : enrollUserData[l]._userId})

            let _leagueTeamId = enrollUserData[l]._leagueTeamId;
            
            if(entryFee > 0 ){

                await notificationFunction.sendLeagueContestStatusNotification(user._id, _leagueContestId, contestName, constants.NOTIFICATION_STATUS.CANCELLED_VIA_ADMIN, _leagueTeamId);
                // console.log('notification send');
                
                let walletHistoryData = await WalletHistory.findOne({_userId:user._id, _leagueContestId, _teamId : _leagueTeamId})
            
                user.depositBalance += walletHistoryData.depositWallet;
                user.referralBalance += walletHistoryData.referralWallet;
                user.winningBalance += walletHistoryData.winningWallet;

                var updatedData = await user.save();

                if(updatedData){
                    var walletHistoryObj = new WalletHistory({
                        _userId : updatedData._id,
                        _teamId : walletHistoryData._teamId,
                        _leagueContestId,
                        leagueContestName : walletHistoryData.leagueContestName,
                        depositWallet : walletHistoryData.depositWallet,
                        referralWallet: walletHistoryData.referralWallet,
                        winningWallet: walletHistoryData.winningWallet,
                        amount: walletHistoryData.amount,
                        competitionType : constants.COMPETITION_TYPE.LEAGUE,
                        transactionType : constants.TRANSACTION_TYPE.PLUS,
                        transactionFor : constants.TRANSACTION_FOR.REFUND,
                        createdAt : dateFormat.setCurrentTimestamp(),
                        updatedAt : dateFormat.setCurrentTimestamp()
                      })
    
                      await walletHistoryObj.save();
                }
            }else{
                await notificationFunction.sendLeagueContestStatusNotification(user._id, _leagueContestId, contestName, constants.NOTIFICATION_STATUS.FREE_CANCELLED_VIA_ADMIN, _leagueTeamId);
                // console.log('notification send for free contest');
                let temporaryBoosters = enrollUserData[l].temporaryBoosters;
                let _userId = enrollUserData[l]._userId;
                
                for(let j=0;j<temporaryBoosters.length;j++){

                    if(temporaryBoosters[j].boosterAssignedBy === constants.BOOSTER_ASSIGNED_BY.PRIVATE){
                        
                        await commonFunction.giveBoosterBackToUser(_userId, temporaryBoosters[j]._boosterId)

                    }
                }
            }
        }
        leagueData.status = constants.LEAGUE_STATUS.CANCELLED;
        await leagueData.save();
  
      res.status(200).send({
        status: constants.STATUS_CODE.SUCCESS,
        message: Lang.responseIn("SOCCER.CONTEST_CANCEL_VIA_ADMIN", req.headers.lang),
        error: false,
        data: leagueData
      });
  
    } catch (error) {
      console.log(error);
        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
    }
  
}

/**
 * Cancel all League contest
 * @function
 * @param {ObjectId} _leagueId - .
 * @returns {Object} .
 * Will cancel single league contest and refund money to users who have participated in it.
 */
exports.cancelAllLeagueContests = async (req, res) => {
    try {
      
        let _leagueId = req.params._leagueId;

        let leagueData = await FootBallLeagueSchedule.findOne({_id : _leagueId, status: {$in :[constants.LEAGUE_STATUS.ENROLL, constants.LEAGUE_STATUS.CONFIRMED, constants.LEAGUE_STATUS.OPEN, constants.LEAGUE_STATUS.RUNNING]}});
        
        if(!leagueData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.LEAGUE_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let leagueContestData = await FootBallLeagueContest.find({_leagueId, contestVisibility : constants.CONTEST_VISIBILITY.PUBLIC, status: {$in : [constants.LEAGUE_STATUS.ENROLL, constants.LEAGUE_STATUS.CONFIRMED, constants.LEAGUE_STATUS.OPEN]}})

        for(let i=0;i<leagueContestData.length;i++){

            let _leagueContestId = leagueContestData[i]._id
            let contestName = leagueContestData[i].contestName;
            let entryFee = leagueContestData[i].entryFee;
    
            let enrollUserData = await EnrollFootBallLeagueContest.find({_leagueContestId})
               console.log(enrollUserData, 'enrollUserData'); 
            for(let l=0;l<enrollUserData.length;l++){
    
                let user = await User.findOne({_id : enrollUserData[l]._userId})
    
                let _leagueTeamId = enrollUserData[l]._leagueTeamId;
                
                if(entryFee > 0 ){
    
                    await notificationFunction.sendLeagueContestStatusNotification(user._id, _leagueContestId, contestName, constants.NOTIFICATION_STATUS.CANCELLED_VIA_ADMIN, _leagueTeamId);
                    // console.log('notification send');
                    
                    let walletHistoryData = await WalletHistory.findOne({_userId:user._id, _leagueContestId, _teamId : _leagueTeamId})

                    user.depositBalance += walletHistoryData.depositWallet;
                    user.referralBalance += walletHistoryData.referralWallet;
                    user.winningBalance += walletHistoryData.winningWallet;
    
                    var updatedData = await user.save();
    
                    if(updatedData){
                        var walletHistoryObj = new WalletHistory({
                            _userId : updatedData._id,
                            _teamId : walletHistoryData._teamId,
                            _leagueContestId,
                            leagueContestName : walletHistoryData.leagueContestName,
                            depositWallet : walletHistoryData.depositWallet,
                            referralWallet: walletHistoryData.referralWallet,
                            winningWallet: walletHistoryData.winningWallet,
                            amount: walletHistoryData.amount,
                            competitionType : constants.COMPETITION_TYPE.LEAGUE,
                            transactionType : constants.TRANSACTION_TYPE.PLUS,
                            transactionFor : constants.TRANSACTION_FOR.REFUND,
                            createdAt : dateFormat.setCurrentTimestamp(),
                            updatedAt : dateFormat.setCurrentTimestamp()
                          })
        
                          await walletHistoryObj.save();
                    }
                }else{
                    await notificationFunction.sendLeagueContestStatusNotification(user._id, _leagueContestId, contestName, constants.NOTIFICATION_STATUS.FREE_CANCELLED_VIA_ADMIN, _leagueTeamId);
                    // console.log('notification send for free contest');
                    let temporaryBoosters = enrollUserData[l].temporaryBoosters;
                    let _userId = enrollUserData[l]._userId;
                    
                    for(let j=0;j<temporaryBoosters.length;j++){
    
                        if(temporaryBoosters[j].boosterAssignedBy === constants.BOOSTER_ASSIGNED_BY.PRIVATE){
                            
                            await commonFunction.giveBoosterBackToUser(_userId, temporaryBoosters[j]._boosterId)
    
                        }
                    }
                }
            }
            leagueContestData[i].status = constants.LEAGUE_STATUS.CANCELLED;
            await leagueContestData[i].save();
        }

  
      res.status(200).send({
        status: constants.STATUS_CODE.SUCCESS,
        message: Lang.responseIn("SOCCER.CONTEST_CANCEL_VIA_ADMIN", req.headers.lang),
        error: false,
        data: leagueData
      });
  
    } catch (error) {
      console.log(error);
        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
    }
  
}

/**
 * Generate leader board for single league contest
 * @function
 * @param {ObjectId} _leagueContestId - Will get an id from request params.
 * @returns {Object} .
 * Will check match status with goalserve live match API.
 * Will check status of a particular match 
 * Will generate leaderboard for a contest if all matches and weeks are closed.
 */
exports.generateLeaderBoardForSingleLeagueContest = async (req, res) => {
    try {
      
        let _leagueContestId = req.params._leagueContestId;

        let leagueContestData = await FootBallLeagueContest.findOne({_id : _leagueContestId, status: {$in : [constants.LEAGUE_STATUS.ENROLL, constants.LEAGUE_STATUS.CONFIRMED, constants.LEAGUE_STATUS.OPEN]}})
        
        if(!leagueContestData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let matchData = await FootBallLeagueWeek.findOne({_leagueId : leagueContestData._leagueId, status : {$ne : constants.MATCH_STATUS.CLOSED}});
            
        if(matchData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.MATCH_NOT_FINISHED_IN_LEAGUE", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let leagueWeekData = await LeagueWeekMaster.findOne({_leagueId : leagueContestData._leagueId, status : {$ne : constants.LEAGUE_WEEK_STATUS.CLOSED}});

        if(leagueWeekData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.LEAGUE_WEEK_STATUS_NOT_CLOSED", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        let leagueData = await FootBallLeagueSchedule.findOne({_id : leagueContestData._leagueId, status: {$in :[ constants.LEAGUE_STATUS.OPEN]}});

        if(leagueContestData.status === constants.LEAGUE_STATUS.OPEN){
            leagueData.status = constants.LEAGUE_STATUS.FINAL_STATS_RETRIEVED;
            await leagueData.save();
        }else if(leagueContestData.status === constants.LEAGUE_STATUS.ENROLL || leagueContestData.status === constants.LEAGUE_STATUS.CONFIRMED){
            leagueData.status = constants.LEAGUE_STATUS.CONFIRMED;
            await leagueData.save();
        }
          
      res.status(200).send({
        status: constants.STATUS_CODE.SUCCESS,
        message: Lang.responseIn("SOCCER.LEAGUE_STAT_CHANGED", req.headers.lang),
        error: false,
        data: {}
      });
  
    } catch (error) {
      console.log(error);
        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
    }
  
}

/**
 * Generate leader board for single league contest
 * @function
 * @param {ObjectId} _leagueId - Will get an id from request params.
 * @returns {Object} .
 * Will check match status with goalserve live match API.
 * Will check status of a particular match 
 * Will generate leaderboard for all contests if all matches and weeks are closed.
 */
exports.generateLeaderBoardForAllLeagueContests = async (req, res) => {
    try {
      
        let _leagueId = req.params._leagueId;
        
        let matchData = await FootBallLeagueWeek.findOne({_leagueId, status : {$ne : constants.MATCH_STATUS.CLOSED}});
            
        if(matchData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.MATCH_NOT_FINISHED_IN_LEAGUE", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let leagueWeekData = await LeagueWeekMaster.findOne({_leagueId, status : {$ne : constants.LEAGUE_WEEK_STATUS.CLOSED}});

        if(leagueWeekData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.LEAGUE_WEEK_STATUS_NOT_CLOSED", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        let leagueData = await FootBallLeagueSchedule.findOne({_id : _leagueId, status: {$in :[ constants.LEAGUE_STATUS.OPEN]}});
        
        let leagueContestData = await FootBallLeagueContest.findOne({_leagueId, status: {$in : [constants.LEAGUE_STATUS.ENROLL, constants.LEAGUE_STATUS.CONFIRMED, constants.LEAGUE_STATUS.OPEN]}})
        
        if(!leagueContestData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        if(leagueContestData.status === constants.LEAGUE_STATUS.OPEN){
            leagueData.status = constants.LEAGUE_STATUS.FINAL_STATS_RETRIEVED;
            await leagueData.save();
        }else if(leagueContestData.status === constants.LEAGUE_STATUS.ENROLL || leagueContestData.status === constants.LEAGUE_STATUS.CONFIRMED){
            leagueData.status = constants.LEAGUE_STATUS.CONFIRMED;
            await leagueData.save();
        }
          
      res.status(200).send({
        status: constants.STATUS_CODE.SUCCESS,
        message: Lang.responseIn("SOCCER.LEAGUE_STAT_CHANGED", req.headers.lang),
        error: false,
        data: {}
      });
  
    } catch (error) {
      console.log(error);
        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
    }
  
}