const FootBallLeagueSchedule = require('../../models/footBallLeagueSchedules.model');
const FootBallLeagueWeek = require('../../models/footBallLeagueWeeks.model');
const FootBallPlayerName = require('../../models/footBallPlayerNames.model');
const FootBallPrizeBreakDowns = require('../../models/footBallPrizeBreakDown.model');
const FootBallDFSContest = require('../../models/footBallDFSContest.model');
const DFSWinnerListWithPrizeAmount = require('../../models/dfsWinnerListwithPrizeAmounts.model');
const GlobalGeneralSettings = require('../../models/globalGeneralSettings.model');
const GlobalBoosterSettings = require('../../models/globalBoosterSettings.model');
const EnrollFootBallDFSContest = require('../../models/enrollFootBallDFSContest.model');
const WalletHistory = require('../../models/walletHistory.model');
const User = require('../../models/user.model');

const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const soccer = require('../../config/soccer');
const commonFunction = require('../../helper/commonFunction.helper');
const notificationFunction = require('../../helper/notificationFunction.helper');
const requestHelper = require('../../helper/requestHelper.helper');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');
const keys = require('../../keys/keys');


/**
 * Get a list of upcoming matches
 * @function
 * @returns {Object} footballMatches - Returns footballMatches data.
 * Will filter matches between current timestamp and upcoming 5 days timestamp.
 * Will get the matches between those days with pagination.
 */
exports.getUpComingMatchList = async (req, res) => {
    try {            
            var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            var upComingDays = currentTimeStamp + (constants.UPCOMIG_DAYS * constants.TIME_DIFF_MILISEC.GET_DAY);
            var field, value; 
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
            var query = {
                deletedAt: null,
                startTime :{$gte: currentTimeStamp, $lte: upComingDays},
                // status: constants.MATCH_STATUS.OPEN,
                status: {$in :[constants.MATCH_STATUS.CONFIRMED, constants.MATCH_STATUS.OPEN, constants.MATCH_STATUS.DELAY, constants.MATCH_STATUS.RUNNING]}
            }
            if (search) {
                query.$or = [
                    { 'leagueName': new RegExp(search, 'i') },
                    { 'localTeam': new RegExp(search, 'i') },
                    { 'visitorTeam': new RegExp(search, 'i') },
                ]
            }
            var total = await FootBallLeagueWeek.countDocuments(query);
            const footballMatches = await FootBallLeagueWeek.aggregate([
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

            for(let i=0;i<footballMatches.length;i++){
                let count = await FootBallDFSContest.countDocuments({_matchId : footballMatches[i]._id, status : {$in : [constants.DFS_STATUS.ENROLL, constants.DFS_STATUS.CONFIRMED, constants.DFS_STATUS.OPEN, constants.DFS_STATUS.DELAYED]}})
                footballMatches[i].contestCount = count
            }

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.MATCH_LIST", req.headers.lang),
            error: false,
            data: {footballMatches, page, limit, total}
            });
            // logService.responseData(req, footballMatches);
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
 * Get a list of upcoming match player list
 * @function
 * @param {ObjectId} _matchId - will get an id from url params.
 * @returns {Object} footballMatchPlayers - Returns footballMatchPlayers data.
 * Will check match with _matchId first.
 * If match exist then from it's local and visitor team id we will get player list for only two teams.
 */
exports.getMatchPlayerList = async (req, res) => {
    try {            
            var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            var _matchId = req.params._id;

            const isMatchExist = await FootBallLeagueWeek.findOne({_id: _matchId});
            if(!isMatchExist){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.MATCH_NOT_FOUND", req.headers.lang),
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
            console.log(query);
            var total = await FootBallPlayerName.countDocuments({$or:[{teamId: isMatchExist.localTeamId},{teamId: isMatchExist.visitorTeamId}]});
            const footballMatchPlayers = await FootBallPlayerName.find({$or:[{teamId: isMatchExist.localTeamId},{teamId: isMatchExist.visitorTeamId}]})
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
            data: {footballMatchPlayers, page, limit, total}
            });
            // logService.responseData(req, footballMatchPlayers);
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
 * Create DFS contest
 * @function
 * @param {ObjectId} _createdBy - .
 * @param {ObjectId} _matchId - Will get an id from body.
 * @param {String} contestName - .
 * @param {String} startTime - It will be the match start time.
 * @param {String} enrollStartTime - Enroll start time when you want to start enrollment for that contest.
 * @param {String} enrollEndTime - Enroll end time when you want to end enrollment for that contest. It will be from global general settings. Right now it's set to 1 hour milisec before contest or match starttime.
 * @param {Number} entryFee - Entry fee which you want to deduct from your user wallets.
 * @param {Number} maxParticipants - Maximum participant limit of how many users can participant. This is only for regular type contest. For H2H contest it will be set to null value.
 * @param {Number} minParticipants - Minimum participant limit of users participants, So if we have mimimum users for particular contest we can start that contest. This is only for regular type contest. For H2H contest it will be set to null value.
 * @param {Number} totalPrize - Total prize that we want distribute among participated users according their ranks.
 * @param {Number} createdAt - Timestamp of trivia creation.
 * @param {Number} updatedAt - Timestamp of trivia update else will set creation time.
 * @param {Array} prizeBreakDown - Prize break down for contest.
 * @param {Number} from - From which rank.
 * @param {Number} to - To which rank.
 * @param {Number} amount - We want to give an amount between those ranks.
 * @returns {Object} footballMatchPlayers - Returns footballMatchPlayers data.
 * Will check match with _matchId first.
 * If match exist then we will check that it's must be 24 hr or more from time of contest creation.
 * If we meet the require validation then It will create a contest
 */
exports.createDFSContest = async (req, res) => {
    try {            
        const _createdBy = req.user._id

        var reqdata = req.body
        var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        var _matchId = reqdata._matchId;
        let boosters = reqdata.boosters
        if(reqdata.contestType == constants.CONTEST_TYPE.REGULAR && (reqdata.maxParticipants == null || reqdata.maxParticipants < 1 || reqdata.minParticipants == null || reqdata.minParticipants < 1)){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.PARTICIPANTS_REQUIRED", req.headers.lang),
                error:true,
                data:{}
            })
        }
        const isMatchExist = await FootBallLeagueWeek.findOne({_id: _matchId});
        if(!isMatchExist){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.MATCH_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        var contestName = (reqdata.contestName).trim()
            
        var regex = new RegExp('^' + contestName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
            
        var isContestNameExist = await FootBallDFSContest.findOne({contestName: {$regex : regex}});
    
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
        var startTime = isMatchExist.startTime;
        var dayInMilisec = globalGeneralSettings.dayInMilisec;
        // var diffInDays = (-1 * dateFormat.getDaysDifference(reqdata.startTime));
        // var diffInDays = (startTime - currentTimeStamp)/constants.TIME_DIFF_MILISEC.GET_DAY;
        var diffInDays =  (startTime - currentTimeStamp)/dayInMilisec;
        if(diffInDays>globalGeneralSettings.dfsMaxStartDay || diffInDays<globalGeneralSettings.dfsMinStartDay){
            return   res.status(400).send({
              status: constants.STATUS_CODE.VALIDATION,
              message: Lang.responseIn("SOCCER.CONTEST_CREATE_TIME_ERROR", req.headers.lang),
              error: true,
              data: {},
            });
        }
    
        var enrollStartTime, enrollEndTime;
        if(reqdata.enrollStartTime){
          enrollStartTime = parseInt(dateFormat.setDateFormatToTimeStamp(reqdata.enrollStartTime));
            var daysLeft = (startTime - enrollStartTime) / dayInMilisec;
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
            }else if(daysLeft>globalGeneralSettings.dfsMaxEnrollStartDay || daysLeft<globalGeneralSettings.dfsMinEnrollStartDay){
              return   res.status(400).send({
                status: constants.STATUS_CODE.VALIDATION,
                message: Lang.responseIn("SOCCER.CONTEST_ENROLL_START_TIME_ERROR", req.headers.lang),
                error: true,
                data: {},
              });
          }
        }else{
            enrollStartTime = dateFormat.setCurrentTimestamp();
            var daysLeft = (startTime - enrollStartTime) / dayInMilisec;
            if(startTime < enrollStartTime){
                return   res.status(400).send({
                  status: constants.STATUS_CODE.VALIDATION,
                  message: Lang.responseIn("SOCCER.CONTEST_ENROLL_TIME_ERROR", req.headers.lang),
                  error: true,
                  data: {},
                });
              }else if(daysLeft>globalGeneralSettings.dfsMaxEnrollStartDay || daysLeft<globalGeneralSettings.dfsMinEnrollStartDay){
              return   res.status(400).send({
                status: constants.STATUS_CODE.VALIDATION,
                message: Lang.responseIn("SOCCER.CONTEST_ENROLL_START_TIME_ERROR", req.headers.lang),
                error: true,
                data: {},
              });
          } 
        }
        let maxParticipants, minParticipants;
        if(reqdata.contestType === constants.CONTEST_TYPE.H2H){
            maxParticipants = constants.DEFAULT_VALUE;
            minParticipants = constants.DEFAULT_VALUE;
        }else{
            if(!reqdata.maxParticipants || !reqdata.minParticipants){
                return   res.status(400).send({
                    status: constants.STATUS_CODE.VALIDATION,
                    message: Lang.responseIn("SOCCER.CONTEST_PARTICIPANT_LIMIT", req.headers.lang),
                    error: true,
                    data: {},
                  });
            }else{
                maxParticipants = reqdata.maxParticipants;
                minParticipants = reqdata.minParticipants;
            }
        }
        // enrollEndTime = startTime - constants.TIME_DIFF_MILISEC.GET_HOUR
        enrollEndTime = startTime - globalGeneralSettings.dfsEnrollEndTime
        // var totalAssumeCollection = req.body.entryFee * req.body.maxParticipants;
        // var totalPrize = totalAssumeCollection - (totalAssumeCollection * (globalGeneralSettings.triviaAdminCut / 100));
        
        const newFootBallDFSContest = new FootBallDFSContest({
          _createdBy : _createdBy,
          userName : req.user.userName,
          _matchId : _matchId,
          contestName: reqdata.contestName,
          startTime : startTime,
          enrollStartTime : enrollStartTime,
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
    
        // newTrivia.enrollEndTime = dateFormat.subtractHourAndSetDateToTimestamp(reqdata.startTime, globalGeneralSettings.triviaEnrollEndTime);

        for(let i=0;i<boosters.length;i++){
            newFootBallDFSContest.boosters = newFootBallDFSContest.boosters.concat({_boosterId : boosters[i]._boosterId, boosterCount : boosters[i].boosterCount});
        }
        var footBallDFSContestData = await newFootBallDFSContest.save();
    
        var footBallPrizeBreakDowns = req.body.footBallPrizeBreakDowns;
        for(let k=0;k<footBallPrizeBreakDowns.length;k++){
          var newFootBallPrizeBreakDown = new FootBallPrizeBreakDowns({
            _dfsContestId: footBallDFSContestData._id,
            from: footBallPrizeBreakDowns[k].from,
            to: footBallPrizeBreakDowns[k].to,
            amount: footBallPrizeBreakDowns[k].amount,
            createdAt: dateFormat.setCurrentTimestamp(),
            updatedAt: dateFormat.setCurrentTimestamp()
          })
          var footBallPrizeBreakDownsData = await newFootBallPrizeBreakDown.save();
        }

        var dfsContestData = await FootBallDFSContest.aggregate([
                {$match : {_id : footBallDFSContestData._id}},
                {
                    $lookup : {
                        from: "footballprizebreakdowns",
                        localField: "_id",
                        foreignField: "_dfsContestId",
                        as: "footBallPrizeBreakDowns"
                    }
                },
            ])

            for(let j=0; j<dfsContestData.length;j++){
                let booster = dfsContestData[j].boosters
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
            data: dfsContestData
            });
            logService.responseData(req, dfsContestData);
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

/**
 * Get a list of upcoming dfs contest
 * @function
 * @param {ObjectId} _matchId - Will get an id from request params.
 * @returns {Object} footballDFSContest - Returns footballDFSContest data.
 * Will check match with _matchId first.
 * If match exist then we will check that it's contest enrollment endtime is greater then current time and must be in enroll stat.
 * Will retrieve contests according to query with contestType and teamFormat.
 */
exports.getUpComingDFSContestList = async (req, res) => {
    try {            
            var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            var _matchId = req.params._matchId;
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
                // status:constants.DFS_STATUS.ENROLL,
                status : {$in : [constants.DFS_STATUS.ENROLL, constants.DFS_STATUS.CONFIRMED, constants.DFS_STATUS.OPEN, constants.DFS_STATUS.DELAYED]},
                _matchId: mongoose.Types.ObjectId(_matchId),
                contestType,
                teamFormat,
            }
            if (search) {
                query.$or = [
                    { 'contestName': new RegExp(search, 'i') },
                ]
            }
            const isMatchExist = await FootBallLeagueWeek.findOne({_id: _matchId});
            if(!isMatchExist){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.MATCH_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            var total = await FootBallDFSContest.countDocuments(query);
            const footballDFSContest = await FootBallDFSContest.aggregate([
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
            data: {footballDFSContest, page, limit, total}
            });
            // logService.responseData(req, footballDFSContest);
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
 * Get a single dfs contest
 * @function
 * @param {ObjectId} _dfsContestId - Will get an id from request params.
 * @returns {Object} footballDFSContest - Returns single footballDFSContest data from an id.
 */
exports.getSingleDFSContest = async (req, res) => {
    try {            
            var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            var _dfsContestId = req.params._dfsContestId
            const footballDFSContest = await FootBallDFSContest.aggregate([
                {$match: {_id: mongoose.Types.ObjectId(_dfsContestId)}},
                {
                    $lookup : {
                        from: "footballprizebreakdowns",
                        localField: "_id",
                        foreignField: "_dfsContestId",
                        as: "footBallPrizeBreakDowns"
                    }
                },
                { $addFields: 
                            { 
                                currentTimeStamp,
                            }
                        },
            ])

            let booster = footballDFSContest[0].boosters
            for(let k=0;k<booster.length;k++){
                let boosterDetails = await GlobalBoosterSettings.findOne({_id : booster[k]._boosterId});
                booster[k].boosterName = boosterDetails.boosterName;
                booster[k].boosterType = boosterDetails.boosterType;
                
            }

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.MATCH_LIST", req.headers.lang),
            error: false,
            data: footballDFSContest
            });
            // logService.responseData(req, footballDFSContest);
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
 * Get a list of past matches with contest already exists
 * @function
 * @returns {Object} pastFootballMatches - Returns single pastFootballMatches data from an id.
 * It will return only those matches who has contest in it and there status is closed or cancelled.
 */
exports.getPastMatchList = async (req, res) => {
    try {            
            var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            // var upComingDays = currentTimeStamp + (constants.UPCOMIG_DAYS * constants.TIME_DIFF_MILISEC.GET_DAY);
            let pastContests = await FootBallDFSContest.find({status : {$in :[constants.DFS_STATUS.CLOSED, constants.DFS_STATUS.CANCELLED]}},{_matchId : 1, _id:0})
            
            let matchIds = [];
            for(let i=0;i<pastContests.length;i++){
                matchIds.push(pastContests[i]._matchId)
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
                _id : {$in: matchIds}
                // status:constants.MATCH_STATUS.CLOSED
            }
            if (search) {
                query.$or = [
                    { 'leagueName': new RegExp(search, 'i') },
                    { 'localTeam': new RegExp(search, 'i') },
                    { 'visitorTeam': new RegExp(search, 'i') },
                ]
            }
            var total = await FootBallLeagueWeek.countDocuments(query);
            const pastFootballMatches = await FootBallLeagueWeek.aggregate([
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

            for(let i=0;i<pastFootballMatches.length;i++){
                let count = await FootBallDFSContest.countDocuments({_matchId : pastFootballMatches[i]._id})
                pastFootballMatches[i].contestCount = count
            }

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.MATCH_LIST", req.headers.lang),
            error: false,
            data: {pastFootballMatches, page, limit, total}
            });
            // logService.responseData(req, {pastFootballMatches, page, limit, total});
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
 * Get a list of past dfs contest
 * @function
 * @param {ObjectId} _matchId - Will get an id from request params.
 * @returns {Object} pastFootballDFSContest - Returns pastFootballDFSContest data from an id.
 * It will return only those contests whom status is closed or cancelled.
 */
exports.getPastDFSContestList = async (req, res) => {
    try {            
            var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            var _matchId = req.params._matchId;
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
                enrollEndTime :{$lte: currentTimeStamp},
                status:{$in : [constants.DFS_STATUS.CLOSED, constants.DFS_STATUS.CANCELLED]},
                _matchId: mongoose.Types.ObjectId(_matchId),
                contestType,
                teamFormat,
            }
            if (search) {
                query.$or = [
                    { 'contestName': new RegExp(search, 'i') },
                ]
            }
            var total = await FootBallDFSContest.countDocuments(query);
            const pastFootballDFSContest = await FootBallDFSContest.aggregate([
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
            message: Lang.responseIn("SOCCER.MATCH_LIST", req.headers.lang),
            error: false,
            data: {pastFootballDFSContest, page, limit, total}
            });
            // logService.responseData(req, {pastFootballDFSContest, page, limit, total});
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
 * Get a list of past dfs contest
 * @function
 * @param {ObjectId} _dfsContestId - Will get an id from request params.
 * @returns {Object} dfsWinnerListWithPrizeAmountData - Returns dfsWinnerListWithPrizeAmountData data from an id.
 * It will return DFS winner list with prize amount earn.
 */
exports.getSingleDFSWinnerList =  async (req, res) => {
    try {
        var _dfsContestId = req.params._dfsContestId;
        
        var dfsData = await FootBallDFSContest.findById(_dfsContestId)
          if(!dfsData){
              return res.status(400).send({
                      status: constants.STATUS_CODE.FAIL,
                      message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                      error: true,
                      data: {}
                    });
          }
        var field, value; 
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
            _dfsContestId: mongoose.Types.ObjectId(_dfsContestId),
        }
        if (search) {
            query.$or = [
                { 'userName': new RegExp(search, 'i') }
            ]
        }
        let total = await DFSWinnerListWithPrizeAmount.countDocuments(query);
        let dfsWinnerListWithPrizeAmountData = await DFSWinnerListWithPrizeAmount.aggregate([
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
            data: {dfsWinnerListWithPrizeAmountData, page, limit, total}
        })
        // logService.responseData(req, {dfsWinnerListWithPrizeAmountData, page, limit, total});
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
 * Cancel single DFS contest
 * @function
 * @param {ObjectId} _dfsContestId - .
 * @returns {Object} .
 * Will cancel single contest and refund money to users who have participated in it.
 */
exports.cancelSingleDFSContest = async (req, res) => {
    try {
      
        let _dfsContestId = req.params._dfsContestId;
  
        let dfsData = await FootBallDFSContest.findOne({_id : _dfsContestId, status: {$in : [constants.DFS_STATUS.ENROLL, constants.DFS_STATUS.CONFIRMED, constants.DFS_STATUS.OPEN, constants.DFS_STATUS.DELAYED]}})
        
        if(!dfsData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        if(dfsData.contestVisibility !== constants.CONTEST_VISIBILITY.PUBLIC){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.PRIVATE_CONTEST_CANCEL_VIA_ADMIN", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let contestName = dfsData.contestName;
        let entryFee = dfsData.entryFee;

        let enrollUserData = await EnrollFootBallDFSContest.find({_dfsContestId})
            
        for(let l=0;l<enrollUserData.length;l++){

            let user = await User.findOne({_id : enrollUserData[l]._userId})

            let _dfsTeamId = enrollUserData[l]._dfsTeamId;
            
            if(entryFee > 0 ){

                await notificationFunction.sendContestStatusNotification(user._id, _dfsContestId, contestName, constants.NOTIFICATION_STATUS.CANCELLED_VIA_ADMIN, _dfsTeamId);
                // console.log('notification send');
                
                let walletHistoryData = await WalletHistory.findOne({_userId:user._id, _dfsContestId, _teamId : _dfsTeamId})
            
                user.depositBalance += walletHistoryData.depositWallet;
                user.referralBalance += walletHistoryData.referralWallet;
                user.winningBalance += walletHistoryData.winningWallet;

                var updatedData = await user.save();

                if(updatedData){
                    var walletHistoryObj = new WalletHistory({
                    _userId : updatedData._id,
                    _teamId : walletHistoryData._teamId,
                    _dfsContestId,
                    dfsContestName : walletHistoryData.dfsContestName,
                    depositWallet : walletHistoryData.depositWallet,
                    referralWallet: walletHistoryData.referralWallet,
                    winningWallet: walletHistoryData.winningWallet,
                    amount: walletHistoryData.amount,
                    competitionType : constants.COMPETITION_TYPE.DFS,
                    transactionType : constants.TRANSACTION_TYPE.PLUS,
                    transactionFor : constants.TRANSACTION_FOR.REFUND,
                    createdAt : dateFormat.setCurrentTimestamp(),
                    updatedAt : dateFormat.setCurrentTimestamp()
                    })

                    await walletHistoryObj.save();
                }
            }else{
                await notificationFunction.sendContestStatusNotification(user._id, _dfsContestId, contestName, constants.NOTIFICATION_STATUS.FREE_CANCELLED_VIA_ADMIN, _dfsTeamId);
                // console.log('notification send for free contest');
                let appliedBooster = enrollUserData[l].boosters;
                let _userId = enrollUserData[l]._userId;
                
                for(let j=0;j<appliedBooster.length;j++){

                    if(appliedBooster[j].boosterAssignedBy === constants.BOOSTER_ASSIGNED_BY.PRIVATE){
                        
                        await commonFunction.giveBoosterBackToUser(_userId, appliedBooster[j]._boosterId)

                    }
                }
            }
        }
        dfsData.status = constants.DFS_STATUS.CANCELLED;
        await dfsData.save();
  
      res.status(200).send({
        status: constants.STATUS_CODE.SUCCESS,
        message: Lang.responseIn("SOCCER.CONTEST_CANCEL_VIA_ADMIN", req.headers.lang),
        error: false,
        data: dfsData
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
 * Cancel all the DFS contests for particular match
 * @function
 * @param {ObjectId} _matchId - Will get an id from request params.
 * @returns {Object} .
 * Will cancel all the contest for a single match and refund money to users who have participated in it.
 */
exports.cancelAllDFSContestForMatch = async (req, res) => {
    try {
      
        let _matchId = req.params._matchId;

        let matchData = await FootBallLeagueWeek.findOne({_id : _matchId, status: {$in :[constants.MATCH_STATUS.CONFIRMED, constants.MATCH_STATUS.OPEN, constants.MATCH_STATUS.DELAY, constants.MATCH_STATUS.RUNNING]}});
  
        if(!matchData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.MATCH_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let dfsData = await FootBallDFSContest.find({_matchId, contestVisibility : constants.CONTEST_VISIBILITY.PUBLIC, status: {$in : [constants.DFS_STATUS.ENROLL, constants.DFS_STATUS.CONFIRMED, constants.DFS_STATUS.OPEN, constants.DFS_STATUS.DELAYED]}})
        
        for(let i=0;i<dfsData.length;i++){

            let _dfsContestId = dfsData[i]._id;
            let contestName = dfsData[i].contestName;
            let entryFee = dfsData[i].entryFee;
    
            let enrollUserData = await EnrollFootBallDFSContest.find({_dfsContestId})
                
            for(let l=0;l<enrollUserData.length;l++){
    
                let user = await User.findOne({_id : enrollUserData[l]._userId})
    
                let _dfsTeamId = enrollUserData[l]._dfsTeamId;
                
                if(entryFee > 0 ){
    
                    await notificationFunction.sendContestStatusNotification(user._id, _dfsContestId, contestName, constants.NOTIFICATION_STATUS.CANCELLED_VIA_ADMIN, _dfsTeamId);
                    // console.log('notification send');
                    
                    let walletHistoryData = await WalletHistory.findOne({_userId:user._id, _dfsContestId, _teamId : _dfsTeamId})
                
                    user.depositBalance += walletHistoryData.depositWallet;
                    user.referralBalance += walletHistoryData.referralWallet;
                    user.winningBalance += walletHistoryData.winningWallet;
    
                    var updatedData = await user.save();
    
                    if(updatedData){
                        var walletHistoryObj = new WalletHistory({
                        _userId : updatedData._id,
                        _teamId : walletHistoryData._teamId,
                        _dfsContestId,
                        dfsContestName : walletHistoryData.dfsContestName,
                        depositWallet : walletHistoryData.depositWallet,
                        referralWallet: walletHistoryData.referralWallet,
                        winningWallet: walletHistoryData.winningWallet,
                        amount: walletHistoryData.amount,
                        competitionType : constants.COMPETITION_TYPE.DFS,
                        transactionType : constants.TRANSACTION_TYPE.PLUS,
                        transactionFor : constants.TRANSACTION_FOR.REFUND,
                        createdAt : dateFormat.setCurrentTimestamp(),
                        updatedAt : dateFormat.setCurrentTimestamp()
                        })
    
                        await walletHistoryObj.save();
                    }
                }else{
                    await notificationFunction.sendContestStatusNotification(user._id, _dfsContestId, contestName, constants.NOTIFICATION_STATUS.FREE_CANCELLED_VIA_ADMIN, _dfsTeamId);
                    // console.log('notification send for free contest');
                    let appliedBooster = enrollUserData[l].boosters;
                    let _userId = enrollUserData[l]._userId;
                    
                    for(let j=0;j<appliedBooster.length;j++){
    
                        if(appliedBooster[j].boosterAssignedBy === constants.BOOSTER_ASSIGNED_BY.PRIVATE){
                            
                            await commonFunction.giveBoosterBackToUser(_userId, appliedBooster[j]._boosterId)
    
                        }
                    }
                }
            }
            dfsData[i].status = constants.DFS_STATUS.CANCELLED;
            await dfsData[i].save();
        }

  
      res.status(200).send({
        status: constants.STATUS_CODE.SUCCESS,
        message: Lang.responseIn("SOCCER.CONTEST_CANCEL_VIA_ADMIN", req.headers.lang),
        error: false,
        data: matchData
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
 * Generate leader board for single DFS contest
 * @function
 * @param {ObjectId} _dfsContestId - Will get an id from request params.
 * @returns {Object} .
 * Will check match status with goalserve live match API.
 * Will check status of a particular match 
 * Will generate leaderboard for a contest.
 */
exports.generateLeaderBoardForSingleDFSContest = async (req, res) => {
    try {
      
        let _dfsContestId = req.params._dfsContestId;

        let dfsData = await FootBallDFSContest.findOne({_id : _dfsContestId, status: {$in : [constants.DFS_STATUS.ENROLL, constants.DFS_STATUS.DELAYED, constants.DFS_STATUS.CONFIRMED, constants.DFS_STATUS.OPEN]}});

        let matchData = await FootBallLeagueWeek.findOne({_id: dfsData._matchId});
            
        let url = `https://www.goalserve.com/getfeed/${keys.GOAL_SERVE_API_KEY}/commentaries/${matchData.gameId}?date=${matchData.startMatchDate}&json=1`
        let result = await requestHelper.callApi(url);
        if(!result){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.GOAL_SERVE_RESPONSE_FAILURE", req.headers.lang),
                error:true,
                data:{}
            })
        }else{
            
            let matchDataObj = result.commentaries.tournament.match;
    
            let matchResponse = [];

            //if match data is in object format then convert it to Array
            if(matchDataObj.constructor === Object){
                matchResponse[0] = result.commentaries.tournament.match;
            }else{
                matchResponse = result.commentaries.tournament.match;
            }

            //if data not found then return
            if(matchResponse.length === 0){
                console.log('No any matches are running');
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.GOAL_SERVE_RESPONSE_FAILURE", req.headers.lang),
                    error:true,
                    data:{}
                })
            }else{
                for(let j=0; j < matchResponse.length; j++){
                    let matchId = matchResponse[j]['@id'];
                    let matchStatus = matchResponse[j]['@status'];
                    let matchTime = matchResponse[j]['@time']

                    if(matchId == matchData.matchId){

                        if(matchStatus == soccer.MATCH_STATUS.POSTP){
                            matchData.status = constants.MATCH_STATUS.POSTPONED;
                            matchData.matchStatus = matchStatus;
                            await matchData.save();
                            return res.status(400).send({
                                status:constants.STATUS_CODE.FAIL,
                                message: Lang.responseIn("SOCCER.MATCH_POSTPONED", req.headers.lang),
                                error:true,
                                data:{}
                            })

                        }else if(matchStatus == soccer.MATCH_STATUS.ABAN || matchStatus == soccer.MATCH_STATUS.CANCEL || matchStatus == soccer.MATCH_STATUS.SUSP || matchStatus == soccer.MATCH_STATUS.INT || matchStatus == soccer.MATCH_STATUS.WO){
                            matchData.status = constants.MATCH_STATUS.CANCELLED;
                            matchData.matchStatus = matchStatus;
                            await matchData.save();
                            return res.status(400).send({
                                status:constants.STATUS_CODE.FAIL,
                                message: Lang.responseIn("SOCCER.MATCH_CANCELLED", req.headers.lang),
                                error:true,
                                data:{}
                            })

                        }else if((matchStatus == soccer.MATCH_STATUS.FT || matchStatus == soccer.MATCH_STATUS.PEN || matchStatus == soccer.MATCH_STATUS.AET)){

                            let dfsContestData = await FootBallDFSContest.findOne({_matchId : matchData._id, status: {$in : [constants.DFS_STATUS.ENROLL, constants.DFS_STATUS.DELAYED, constants.DFS_STATUS.CONFIRMED]}});
                            if(!dfsContestData){
                                matchData.status = constants.MATCH_STATUS.MATCH_FINISHED;
                                matchData.matchStatus = matchStatus;
                                await matchData.save();
                                console.log(matchData.status, 'x in finish', matchData);
                            }else{
                                matchData.status = constants.MATCH_STATUS.CONFIRMED;
                                matchData.matchStatus = matchStatus;
                                await matchData.save();
                                console.log(matchData.status, 'x in finish', matchData);
                            }

                        }else{
                            return res.status(400).send({
                                status:constants.STATUS_CODE.FAIL,
                                message: Lang.responseIn("SOCCER.MATCH_NOT_FINISHED", req.headers.lang),
                                error:true,
                                data:{}
                            })
                        }
                    }
                }
            }
        }
          
      res.status(200).send({
        status: constants.STATUS_CODE.SUCCESS,
        message: Lang.responseIn("SOCCER.MATCH_STAT_CHANGED", req.headers.lang),
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
 * Generate leader board for all DFS contests
 * @function
 * @param {ObjectId} _matchId - Will get an id from request params.
 * @returns {Object} .
 * Will check match status with goalserve live match API.
 * If match is finished then it will generate leaderboard for a contest.
 */
exports.generateLeaderBoardForAllDFSContests = async (req, res) => {
    try {
      
        let _matchId = req.params._matchId;

        let matchData = await FootBallLeagueWeek.findOne({_id: _matchId});
            
        let url = `https://www.goalserve.com/getfeed/${keys.GOAL_SERVE_API_KEY}/commentaries/${matchData.gameId}?date=${matchData.startMatchDate}&json=1`
        let result = await requestHelper.callApi(url);
        if(!result){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.GOAL_SERVE_RESPONSE_FAILURE", req.headers.lang),
                error:true,
                data:{}
            })
        }else{
            
            let matchDataObj = result.commentaries.tournament.match;
    
            let matchResponse = [];

            //if match data is in object format then convert it to Array
            if(matchDataObj.constructor === Object){
                matchResponse[0] = result.commentaries.tournament.match;
            }else{
                matchResponse = result.commentaries.tournament.match;
            }

            //if data not found then return
            if(matchResponse.length === 0){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.GOAL_SERVE_RESPONSE_FAILURE", req.headers.lang),
                    error:true,
                    data:{}
                })
            }else{

                for(let j=0; j < matchResponse.length; j++){
                    let matchId = matchResponse[j]['@id'];
                    let matchStatus = matchResponse[j]['@status'];
                    let matchTime = matchResponse[j]['@time']

                    if(matchId == matchData.matchId){

                        if(matchStatus == soccer.MATCH_STATUS.POSTP){
                            matchData.status = constants.MATCH_STATUS.POSTPONED;
                            matchData.matchStatus = matchStatus;
                            await matchData.save();
                            return res.status(400).send({
                                status:constants.STATUS_CODE.FAIL,
                                message: Lang.responseIn("SOCCER.MATCH_POSTPONED", req.headers.lang),
                                error:true,
                                data:{}
                            })

                        }else if(matchStatus == soccer.MATCH_STATUS.ABAN || matchStatus == soccer.MATCH_STATUS.CANCEL || matchStatus == soccer.MATCH_STATUS.SUSP || matchStatus == soccer.MATCH_STATUS.INT || matchStatus == soccer.MATCH_STATUS.WO){
                            matchData.status = constants.MATCH_STATUS.CANCELLED;
                            matchData.matchStatus = matchStatus;
                            await matchData.save();
                            return res.status(400).send({
                                status:constants.STATUS_CODE.FAIL,
                                message: Lang.responseIn("SOCCER.MATCH_CANCELLED", req.headers.lang),
                                error:true,
                                data:{}
                            })

                        }else if((matchStatus == soccer.MATCH_STATUS.FT || matchStatus == soccer.MATCH_STATUS.PEN || matchStatus == soccer.MATCH_STATUS.AET)){

                            let dfsContestData = await FootBallDFSContest.findOne({_matchId : matchData._id, status: {$in : [constants.DFS_STATUS.ENROLL, constants.DFS_STATUS.DELAYED, constants.DFS_STATUS.CONFIRMED]}});
                            if(!dfsContestData){
                                matchData.status = constants.MATCH_STATUS.MATCH_FINISHED;
                                matchData.matchStatus = matchStatus;
                                await matchData.save();
                                console.log(matchData.status, 'x in finish', matchData);
                            }else{
                                matchData.status = constants.MATCH_STATUS.CONFIRMED;
                                matchData.matchStatus = matchStatus;
                                await matchData.save();
                                console.log(matchData.status, 'x in finish', matchData);
                            }

                        }else{
                            return res.status(400).send({
                                status:constants.STATUS_CODE.FAIL,
                                message: Lang.responseIn("SOCCER.MATCH_NOT_FINISHED", req.headers.lang),
                                error:true,
                                data:{}
                            })
                        }
                    }
                }
            }
        }
          
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.MATCH_STAT_CHANGED", req.headers.lang),
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