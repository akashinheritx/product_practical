const FootBallLeagueSchedule = require('../../models/footBallLeagueSchedules.model');
const FootBallLeagueWeek = require('../../models/footBallLeagueWeeks.model');
const FootBallPlayerName = require('../../models/footBallPlayerNames.model');
const LeagueWeekMaster = require('../../models/leagueWeekMaster.model');
const FootBallPrizeBreakDowns = require('../../models/footBallPrizeBreakDown.model');
const FootBallDFSContest = require('../../models/footBallDFSContest.model');
const FootBallFormation = require('../../models/footBallFormation.model');
const UserLeagueFootBallTeam = require('../../models/userLeagueFootBallTeam.model');
const SelectLeagueFootBallTeamPlayer = require('../../models/selectLeagueFootBallTeamPlayer.model');
const EnrollFootBallLeagueContest = require('../../models/enrollFootBallLeagueContest.model');
const FootBallLeaguePrizeBreakDowns = require('../../models/footBallLeaguePrizeBreakDown.model');
const FootBallLeagueContest = require('../../models/footBallLeagueContest.model');
const LeagueWinnerListWithPrizeAmount = require('../../models/leagueWinnerListwithPrizeAmounts.model');
const WalletHistory = require('../../models/walletHistory.model');
const GlobalGeneralSettings = require('../../models/globalGeneralSettings.model');
const GlobalTeamSettings = require('../../models/globalTeamSettings.model');
const GlobalBoosterSettings = require('../../models/globalBoosterSettings.model');
const GlobalPointSettings = require('../../models/globalPointSettings.model');
const Badge = require('../../models/badge.model');
const User = require('../../models/user.model');
const StaticFootBallLeagueSchedule = require('../../models/staticFootBallLeagueSchedule.model');
const LivePlayerStat = require('../../models/livePlayerStats.model');

const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const requestHelper = require('../../helper/requestHelper.helper');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');
const _ = require('lodash');

/**
 * Get a list of upcoming leagues
 * @function
 * @returns {Object} footballLeagues - Returns footballLeagues.
 */
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
                    // {status:constants.LEAGUE_STATUS.ENROLL}
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
                .sort({[field]:value, _id : value})
                .skip((pageOptions.page - 1) * pageOptions.limit)
                .limit(pageOptions.limit)
                .collation({ locale: "en" });
        
                let leagueIDS = [];
                const participateLeagueIds = await EnrollFootBallLeagueContest.find({_userId : req.user._id}, {_leagueContestId : 1 ,_id:0})
                for(let a=0;a<participateLeagueIds.length;a++){
                    leagueIDS.push(participateLeagueIds[a]._leagueContestId)
                }
    
                for(let i=0;i<footballLeagues.length;i++){
                    let count = await FootBallLeagueContest.countDocuments({_leagueId : footballLeagues[i]._id, $or:[{_id : {$in : leagueIDS}}, {$and:[{contestVisibility : constants.CONTEST_VISIBILITY.PUBLIC},{enrollStartTime :{$lte: currentTimeStamp}}]}]})
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

            let page = pageOptions.page;
            let limit = pageOptions.limit;

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

/**
 * Get a list of upcoming league player list
 * @function
 * @param {ObjectId} _leagueId - _leagueId of a league.
 * @returns {Object} footballLeaguePlayers - Returns footballLeaguePlayers.
 * It will find teamIds of that particular league.
 * Returns all players of a league according to their position.
 */
exports.getLeaguePlayerList = async (req, res) => {
    try {            
            let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            let _leagueId = req.params._id;

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
            
            let positionArr = [];

            if(req.query.playerPosition){
                positionArr = req.query.playerPosition.split(',');
            }else{
                positionArr = ['G', 'D', 'M', 'A']
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

            let total = await FootBallPlayerName.countDocuments({teamId : {$in : teamIdsArr}, playerPosition : {$in : positionArr}});
            const footballLeaguePlayers = await FootBallPlayerName.find({teamId : {$in : teamIdsArr}, playerPosition : {$in : positionArr}}, {playerImage : 0})
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

/**
 * Get a list of upcoming league contest
 * @function
 * @param {ObjectId} _userId - _userId of a logged in user.
 * @param {ObjectId} _leagueId - _leagueId of a league.
 * @returns {Object} footballLeagueContest - Returns footballLeagueContest with pagination.
 * Returns league contests.
 */
exports.getUpComingLeagueContestList = async (req, res) => {
    try {            
            const currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            const _leagueId = req.params._leagueId;
            const _userId = req.user._id;
            let field, value, contestType, teamFormat;
            let search = req.query.q ? req.query.q : ''; // for searching
            if (req.query.sortBy) {
                const parts = req.query.sortBy.split(':');
                field = parts[0];
                parts[1] ==='desc' ? value=-1 : value= 1;
            }else{
                field = "hasValue",
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
                enrollStartTime : {$lt : currentTimeStamp},
                status:constants.LEAGUE_STATUS.ENROLL,
                _leagueId : mongoose.Types.ObjectId(_leagueId),
                // contestVisibility: constants.CONTEST_VISIBILITY.PUBLIC,
                contestType,
                teamFormat,
            }
            
            // if (search) {
            //     query.$or = [
            //         { 'contestName': new RegExp(search, 'i') },
            //     ]
            // }
            let leagueIDS = [];
            const participateLeagueIds = await EnrollFootBallLeagueContest.find({_userId }, {_leagueContestId : 1 ,_id:0})
            for(let a=0;a<participateLeagueIds.length;a++){
                leagueIDS.push(participateLeagueIds[a]._leagueContestId)
            }
            
            // var total = await FootBallLeagueContest.countDocuments({$and:[{_leagueId : mongoose.Types.ObjectId(_leagueId)}, {$or:[query, {'_createdBy' : _userId, enrollEndTime :{$gt: currentTimeStamp}, enrollStartTime : {$lt : currentTimeStamp}}, {_id : {$in : leagueIDS}, enrollEndTime :{$gt: currentTimeStamp}, enrollStartTime : {$lt : currentTimeStamp}}]}, {contestType}, {teamFormat}, { 'contestName': new RegExp(search, 'i')}]});
            let total = await FootBallLeagueContest.countDocuments({$and:[query, {$or:[{contestVisibility: constants.CONTEST_VISIBILITY.PUBLIC},{_createdBy : _userId}, {_id : {$in : leagueIDS}}]}, { contestName : new RegExp(search, 'i')}]});
            const footballLeagueContest = await FootBallLeagueContest.aggregate([
                // {$match: {$and:[{_leagueId : mongoose.Types.ObjectId(_leagueId)}, {$or:[query, {'_createdBy' : _userId, enrollEndTime :{$gt: currentTimeStamp}, enrollStartTime : {$lt : currentTimeStamp}}, {_id : {$in : leagueIDS}, enrollEndTime :{$gt: currentTimeStamp}, enrollStartTime : {$lt : currentTimeStamp}}]}, {contestType}, {teamFormat}, { 'contestName': new RegExp(search, 'i')}]}},
                {$match: {$and:[query, {$or:[{contestVisibility: constants.CONTEST_VISIBILITY.PUBLIC},{_createdBy : _userId}, {_id : {$in : leagueIDS}}]}, { contestName : new RegExp(search, 'i')}]}},
                { $addFields: 
                            { 
                                currentTimeStamp,
                                participantCount : constants.DEFAULT_NUMBER,
                                participatedIn: constants.USER.NOT_PARTICIPANT,
                                spotLeft: {$subtract: [ "$maxParticipants", "$currentParticipants" ]},
                                hasValue : { $cond: [ { $eq: [ "$entryFee", 0 ] }, 2, 1 ] },
                            }
                        },
            ])
            .sort({[field]:value, optionType : value, startTime : value, createdAt : value})
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

            let allLeagueContests = await FootBallLeagueContest.find({_leagueId : mongoose.Types.ObjectId(_leagueId)},{_id : 1})

            let allLeagueContestsIds = []
            for(let x=0;x<allLeagueContests.length;x++){
                allLeagueContestsIds.push(allLeagueContests[x]._id)
            }
            let totalCount = await EnrollFootBallLeagueContest.countDocuments({_userId , _leagueContestId : {$in:allLeagueContestsIds}})
            let totalParticipantCount = totalCount;

            for(let a=0; a<footballLeagueContest.length;a++){
                let count = await EnrollFootBallLeagueContest.countDocuments({_userId , _leagueContestId : footballLeagueContest[a]._id})
                footballLeagueContest[a].participantCount = count;
                // totalParticipantCount += count;
                const leagueContestData = await EnrollFootBallLeagueContest.findOne({_userId , _leagueContestId : footballLeagueContest[a]._id})
                if(leagueContestData){
                    footballLeagueContest[a].participatedIn = constants.USER.PARTICIPANT
                }
                let booster = footballLeagueContest[a].boosters
                for(let k=0;k<booster.length;k++){
                    let boosterDetails = await GlobalBoosterSettings.findOne({_id : booster[k]._boosterId});
                    booster[k].boosterName = boosterDetails.boosterName;
                    booster[k].boosterType = boosterDetails.boosterType;
                }
            }

            var page = pageOptions.page ;
            var limit = pageOptions.limit;

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.CONTEST_LIST", req.headers.lang),
            error: false,
            data: {footballLeagueContest,totalParticipantCount, page, limit, total}
            });
            // logService.responseData(req, {footballLeagueContest,totalParticipantCount, page, limit, total});
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
 * Get a single league contest
 * @function
 * @param {ObjectId} _userId - _userId of a logged in user.
 * @param {ObjectId} _leagueContestId - _leagueContestId of a contest of league.
 * @returns {Object} footballLeagueContest - Returns footballLeagueContest.
 * Returns league contest details from referral code.
 */
exports.getSingleLeagueContest = async (req, res) => {
    try {            
            const currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            const _leagueContestId = req.params._leagueContestId;
            const _userId = req.user._id;
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
                {
                    $lookup : {
                        from: "footballleagueschedules",
                        localField: "_leagueId",
                        foreignField: "_id",
                        as: "_leagueId"
                    }
                },
                {
                    $unwind : "$_leagueId"
                },
                { $addFields: 
                            { 
                                currentTimeStamp,
                                participantCount : constants.DEFAULT_NUMBER,
                                participatedIn: constants.USER.NOT_PARTICIPANT,
                                leagueStatus : constants.USER_LEAGUE_STATUS.NOT_ATTENDED,
                                rank : constants.USER_LEAGUE_STATUS.NOT_ATTENDED,
                                totalPointsEarned : constants.USER_LEAGUE_STATUS.NOT_ATTENDED,
                                leaderBoardStatus: constants.USER_LEAGUE_STATUS.LEADERBOARD_NOT_GENERATED,
                                spotLeft: {$subtract: [ "$maxParticipants", "$currentParticipants" ]}
                            }
                        },
            ])

            if(footballLeagueContest.length < 1){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let count = await EnrollFootBallLeagueContest.countDocuments({_userId , _leagueContestId : footballLeagueContest[0]._id});
            footballLeagueContest[0].participantCount = count;
            const leagueContestData = await EnrollFootBallLeagueContest.findOne({_userId , _leagueContestId : footballLeagueContest[0]._id});
                if(leagueContestData){
                    footballLeagueContest[0].participatedIn = constants.USER.PARTICIPANT;
                    // footballLeagueContest[0]._leagueTeamId = leagueContestData._leagueTeamId;
                }
                let leaderBoardGenerated = await LeagueWinnerListWithPrizeAmount.findOne({_leagueContestId : mongoose.Types.ObjectId(footballLeagueContest[0]._id)})
                if(leaderBoardGenerated){
                    footballLeagueContest[0].leaderBoardStatus = constants.USER_LEAGUE_STATUS.LEADERBOARD_GENERATED;                   
                }
                let leaderBoard = await LeagueWinnerListWithPrizeAmount.findOne({_leagueContestId : mongoose.Types.ObjectId(footballLeagueContest[0]._id), _userId })
                if(leaderBoard){
                    footballLeagueContest[0].rank = leaderBoard.rank;
                    footballLeagueContest[0].totalPointsEarned = leaderBoard.totalPointsEarned;
                }
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

/**
 * Get a single league contest by refferal code
 * @function
 * @param {ObjectId} _userId - _userId of a logged in user.
 * @param {String} referralCode - referralCode of a league.
 * @returns {Object} footballLeagueContest - Returns footballLeagueContest.
 * Returns league contest details from referral code.
 */
exports.getSingleLeagueContestByReferralCode = async (req, res) => {
    try {            
            let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            let referralCode = req.params.referralCode;
            const _userId = req.user._id;
            const footballLeagueContest = await FootBallLeagueContest.aggregate([
                {$match: {referralCode}},
                {
                    $lookup : {
                        from: "footballleagueprizebreakdowns",
                        localField: "_id",
                        foreignField: "_leagueContestId",
                        as: "footBallPrizeBreakDowns"
                    }
                },
                {
                    $lookup : {
                        from: "footballleagueschedules",
                        localField: "_leagueId",
                        foreignField: "_id",
                        as: "_leagueId"
                    }
                },
                {
                    $unwind : "$_leagueId"
                },
                { $addFields: 
                            { 
                                currentTimeStamp,
                                participantCount : constants.DEFAULT_NUMBER,
                                participatedIn: constants.USER.NOT_PARTICIPANT,
                                leagueStatus : constants.USER_LEAGUE_STATUS.NOT_ATTENDED,
                                rank : constants.USER_LEAGUE_STATUS.NOT_ATTENDED,
                                totalPointsEarned : constants.USER_LEAGUE_STATUS.NOT_ATTENDED,
                                leaderBoardStatus: constants.USER_LEAGUE_STATUS.LEADERBOARD_NOT_GENERATED,
                                spotLeft: {$subtract: [ "$maxParticipants", "$currentParticipants" ]}
                            }
                        },
            ])

            if(footballLeagueContest.length < 1){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let count = await EnrollFootBallLeagueContest.countDocuments({_userId , _leagueContestId : footballLeagueContest[0]._id});
            footballLeagueContest[0].participantCount = count;
            const leagueContestData = await EnrollFootBallLeagueContest.findOne({_userId , _leagueContestId : footballLeagueContest[0]._id});
                if(leagueContestData){
                    footballLeagueContest[0].participatedIn = constants.USER.PARTICIPANT;
                    // footballLeagueContest[0]._leagueTeamId = leagueContestData._leagueTeamId;
                }
                let leaderBoard = await LeagueWinnerListWithPrizeAmount.findOne({_leagueContestId : mongoose.Types.ObjectId(footballLeagueContest[0]._id), _userId })
                if(leaderBoard){
                    footballLeagueContest[0].leaderBoardStatus = constants.USER_LEAGUE_STATUS.LEADERBOARD_GENERATED;
                    footballLeagueContest[0].rank = leaderBoard.rank;
                    footballLeagueContest[0].totalPointsEarned = leaderBoard.totalPointsEarned;
                }
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

/**
 * Get a contest team player list
 * @function
 * @param {ObjectId} _userId - _userId of a logged in user.
 * @param {ObjectId} _leagueTeamId - _leagueTeamId of a user team.
 * @param {String} gameWeek - gameWeek of a league.
 * @returns {Object} players - Returns players.
 * Returns selected players of a user team of particular week of particular league.
 */
exports.getLeagueContestTeamPlayerList = async (req, res) => {
    try {            

            let _leagueTeamId = req.params._leagueTeamId;
            let gameWeek = req.params.gameWeek;
            const _userId = req.user._id

            let userTeam = await UserLeagueFootBallTeam.findOne({_id : _leagueTeamId, _userId });

            if(!userTeam){
                
                return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_NOT_FOUND", req.headers.lang),
                    error: true,
                    data: {}
                });

            }

            let _leagueId = userTeam._leagueId;

            let currentTimeStamp = dateFormat.setCurrentTimestamp();

            // let gameWeek = await LeagueWeekMaster.findOne({_leagueId, weekFirstMatchStartTime :{$gte : currentTimeStamp}})

            // if(!gameWeek){
            //     return res.status(400).send({
            //         status:constants.STATUS_CODE.FAIL,
            //         message: Lang.responseIn("SOCCER.TEAM_UPDATE_WEEK_ERROR", req.headers.lang),
            //         error:true,
            //         data:{}
            //     })
            // }
    
            // let weekNumber = gameWeek.weekNumber;

            let players = await SelectLeagueFootBallTeamPlayer.find({_leagueTeamId, gameWeek});

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.PLAYER_LIST", req.headers.lang),
            error: false,
            data: players
            });
            // logService.responseData(req, players);
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
 * Enroll in football League contest
 * @function
 * @param {ObjectId} _userId - _userId of a logged in user.
 * @param {ObjectId} _leagueContestId - _leagueContestId of a contest id of a particular league.
 * @param {ObjectId} _leagueId - _leagueId of a league.
 * @returns {Object} enrollFootBallLeagueContestData - Returns enrollFootBallLeagueContestData.
 * Will check league with _leagueId first.
 * Will check contest with _leagueContestId.
 * If league exist then we will check that it's must be 2 hr or more from time of league is going to start.
 * Then It will check all team validation which we have in this function.
 * Team format, Players according to the formations and from the league, Player limit, Boosters, Credit points, Players from same team.
 * After doing all the validation user will enrol in contest with his team and money will be deducted from his wallet.
 */
exports.enrollInLeagueContest = async (req, res, done) => {
    var session = await mongoose.startSession({
        readPreference: { mode: 'primary' }
      });
      session.startTransaction();
    try {
        const user = req.user;
        const _userId = user._id;
        const reqdata = req.body;
        const _leagueId = reqdata._leagueId;
        
        const _leagueContestId = reqdata._leagueContestId;

        let globalTeamSettings = await GlobalTeamSettings.findOne();
        if(!globalTeamSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_TEAM_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        const isLeagueExist = await FootBallLeagueSchedule.findOne({_id: mongoose.Types.ObjectId(_leagueId)});
            if(!isLeagueExist){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.LEAGUE_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

        let teamIdsArr = await commonFunction.leagueTeamArr(_leagueId);

        let currentTimeStamp = dateFormat.setCurrentTimestamp();     
        //Uncomment this code on live 
        if(currentTimeStamp >= isLeagueExist.startTime){
            return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.LEAGUE_CLOSE", req.headers.lang),
                    error: true,
                    data: {}
                });
        }
        
        let _boosterId, boosterCount, invincibles, isUserBooster = 0;
        
        if(reqdata._boosterId){
            _boosterId = reqdata._boosterId;
            var globalBoosterSettings = await GlobalBoosterSettings.findOne({_id : _boosterId});
            if(!globalBoosterSettings){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_SETTINGS_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let isBoosterAvailable = await FootBallLeagueContest.findOne({_id: _leagueContestId, _leagueId : mongoose.Types.ObjectId(_leagueId), boosters : { $elemMatch: { _boosterId , boosterCount: {$gt:0}}}});
            if(!isBoosterAvailable){
                if(entryFee === 0 ){
                    // let isUserBoosterAvailable = await commonFunction.checkUserBoosters(_userId, _boosterId);
                    let isUserBoosterAvailable = await User.findOne({_id : _userId, boosters : { $elemMatch: { _boosterId, boosterQty: {$gt:0}}}})
                    if(isUserBoosterAvailable === null){
                        return res.status(400).send({
                            status:constants.STATUS_CODE.FAIL,
                            message: Lang.responseIn("SOCCER.BOOSTER_NOT_AVAILABLE", req.headers.lang),
                            error:true,
                            data:{}
                        })
                    }else{
                        isUserBooster = constants.BOOSTER_ASSIGNED_BY.PRIVATE;
                        boosterCount = 1;
                    }

                }else{
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.BOOSTER_NOT_AVAILABLE", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }

            }else{
                boosterCount = 1;
            }
            
            invincibles = reqdata.invincibles;

            if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.INVINCIBLES){
                if(!invincibles){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.BOOSTER_IDS_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                if(invincibles.length !== constants.BOOSTER_IDS_LENGTH.INVINCIBLES){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.BOOSTER_IDS_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                duplicateIds = await commonFunction.findDuplicates(invincibles)
                if(duplicateIds>0){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.DUPLICATE_IDS_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                for(let a=0;a<invincibles.length;a++){
                    let player = await commonFunction.getPlayer(invincibles[a], teamIdsArr);
                    if(player == null){
                        return res.status(400).send({
                            status:constants.STATUS_CODE.FAIL,
                            message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                            error:true,
                            data:{}
                        })
                    }
                }
            }
        }else{
            _boosterId = null;
            boosterCount = null;
        }

        let leagueData = await FootBallLeagueContest.findOne({_id: _leagueContestId, _leagueId : mongoose.Types.ObjectId(_leagueId)});
        
        
        if(!leagueData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        if(leagueData.status != constants.LEAGUE_STATUS.ENROLL){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.CONTEST_CLOSE", req.headers.lang),
                error:true,
                data:{}
            })
        }
      
        if(currentTimeStamp >= leagueData.enrollEndTime){
            return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.CONTEST_CLOSE", req.headers.lang),
                    error: true,
                    data: {}
                });
        }

        let oldcurrentParticipantsCount = leagueData.currentParticipants;
        
        if(leagueData.contestType !== constants.CONTEST_TYPE.H2H){
            if(oldcurrentParticipantsCount >= leagueData.maxParticipants){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.CONTEST_PARTICIPATE_FULL", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }
        
        let enrolledCount = await EnrollFootBallLeagueContest.countDocuments({_userId, _leagueContestId:leagueData._id})
        if(leagueData.contestType === constants.CONTEST_TYPE.H2H){
            if(enrolledCount >= constants.H2H_PARTICIPANT_LIMIT){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("GENERAL.PARTICIPANT_LIMIT", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }else if(leagueData.contestType === constants.CONTEST_TYPE.REGULAR){
            if(enrolledCount >= constants.PARTICIPANT_LIMIT){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("GENERAL.PARTICIPANT_LIMIT", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }

        let entryFee = leagueData.entryFee

        let totalBalance = user.referralBalance + user.winningBalance + user.depositBalance;
        
        if(totalBalance < entryFee){
            return res.status(402).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.NOT_ENOUGH_BALANCE", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let goalKeeperCount = reqdata.goalKeeperCount;
        let defenderCount = reqdata.defenderCount;
        let midFielderCount = reqdata.midFielderCount;
        let attackerCount = reqdata.attackerCount;

        let noOfGoalKeeper = reqdata.goalKeeper;
        let noOfDefender = reqdata.defender;
        let noOfMidFielder = reqdata.midFielder;
        let noOfAttacker = reqdata.attacker;

        let totalPlayer = noOfGoalKeeper.length + noOfDefender.length + noOfMidFielder.length + noOfAttacker.length;

        if(totalPlayer != leagueData.playerLimit){
            
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_VALIDATION", req.headers.lang),
                error:true,
                data:{}
            })
        }else if(noOfGoalKeeper.length !== goalKeeperCount){
            
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                error:true,
                data:{}
            })

        }else if(noOfDefender.length !== defenderCount){
            
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                error:true,
                data:{}
            })

        }else if(noOfMidFielder.length !== midFielderCount){
            
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                error:true,
                data:{}
            })

        }else if(noOfAttacker.length !== attackerCount){
            
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                error:true,
                data:{}
            })

        }

        let captain, viceCaptain;
        let totalRatings = 0;
        let captainCount = 0;
        let viceCaptainCount = 0;
        
        let goalPlayingCount = 0;
        let defPlayingCount = 0;
        let midPlayingCount = 0;
        let attPlayingCount = 0;
        let playerArr = [];

        for(let i=0;i<noOfGoalKeeper.length;i++){
            let gkPlayerRating = await commonFunction.getPlayerRatings(noOfGoalKeeper[i].player, teamIdsArr, constants.PLAYER_POSITION.GOAL_KEEPER);
            if(gkPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfGoalKeeper[i].playerRole == constants.PLAYER_ROLE.PLAYING){
                goalPlayingCount++;
            }
            if((noOfGoalKeeper[i].isCaptain == constants.IS_CAPTAIN.YES || noOfGoalKeeper[i].isViceCaptain == constants.IS_VICE_CAPTAIN.YES) && noOfGoalKeeper[i].playerRole == constants.PLAYER_ROLE.SUBSTITUTION){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.SUBSTITUTION_PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfGoalKeeper[i].isCaptain == constants.IS_CAPTAIN.YES && noOfGoalKeeper[i].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfGoalKeeper[i].isCaptain == constants.IS_CAPTAIN.YES){
                captainCount = captainCount + 1;
                captain = noOfGoalKeeper[i].player;
            }
            if(noOfGoalKeeper[i].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                viceCaptainCount = viceCaptainCount + 1;
                viceCaptain = noOfGoalKeeper[i].player;
            }
            totalRatings = totalRatings + gkPlayerRating.playerRating;
            playerArr.push(mongoose.Types.ObjectId(noOfGoalKeeper[i].player));
        }

        if(goalPlayingCount != globalTeamSettings.minNoOfGoalKeeper || noOfGoalKeeper.length < 2){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.GOAL_PLAYING_VALIDATION", req.headers.lang),
                error:true,
                data:{}
            })
        }

        for(let j=0;j<noOfDefender.length;j++){
            let dPlayerRating = await commonFunction.getPlayerRatings(noOfDefender[j].player, teamIdsArr, constants.PLAYER_POSITION.DEFENDER);
            if(dPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(noOfDefender[j].playerRole == constants.PLAYER_ROLE.PLAYING){
                defPlayingCount++;
            }

            if((noOfDefender[j].isCaptain == constants.IS_CAPTAIN.YES || noOfDefender[j].isViceCaptain == constants.IS_VICE_CAPTAIN.YES) && noOfDefender[j].playerRole == constants.PLAYER_ROLE.SUBSTITUTION){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.SUBSTITUTION_PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfDefender[j].isCaptain == constants.IS_CAPTAIN.YES && noOfDefender[j].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfDefender[j].isCaptain == constants.IS_CAPTAIN.YES){
                captainCount = captainCount + 1;
                captain = noOfDefender[j].player;
            }
            if(noOfDefender[j].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                viceCaptainCount = viceCaptainCount + 1;
                viceCaptain = noOfDefender[j].player;
            }
            totalRatings = totalRatings + dPlayerRating.playerRating;
            playerArr.push(mongoose.Types.ObjectId(noOfDefender[j].player));
        }

        for(let k=0;k<noOfMidFielder.length;k++){
            let mfPlayerRating = await commonFunction.getPlayerRatings(noOfMidFielder[k].player, teamIdsArr, constants.PLAYER_POSITION.MID_FIELDER);
            if(mfPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(noOfMidFielder[k].playerRole == constants.PLAYER_ROLE.PLAYING){
                midPlayingCount++;
            }

            if((noOfMidFielder[k].isCaptain == constants.IS_CAPTAIN.YES || noOfMidFielder[k].isViceCaptain == constants.IS_VICE_CAPTAIN.YES) && noOfMidFielder[k].playerRole == constants.PLAYER_ROLE.SUBSTITUTION){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.SUBSTITUTION_PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfMidFielder[k].isCaptain == constants.IS_CAPTAIN.YES && noOfMidFielder[k].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfMidFielder[k].isCaptain == constants.IS_CAPTAIN.YES){
                captainCount = captainCount + 1;
                captain = noOfMidFielder[k].player;
            }
            if(noOfMidFielder[k].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                viceCaptainCount = viceCaptainCount + 1;
                viceCaptain = noOfMidFielder[k].player;
            }
            totalRatings = totalRatings + mfPlayerRating.playerRating;
            playerArr.push(mongoose.Types.ObjectId(noOfMidFielder[k].player));
        }

        for(let l=0;l<noOfAttacker.length;l++){
            let aPlayerRating = await commonFunction.getPlayerRatings(noOfAttacker[l].player, teamIdsArr, constants.PLAYER_POSITION.ATTACKER);
            if(aPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(noOfAttacker[l].playerRole == constants.PLAYER_ROLE.PLAYING){
                attPlayingCount++;
            }

            if((noOfAttacker[l].isCaptain == constants.IS_CAPTAIN.YES || noOfAttacker[l].isViceCaptain == constants.IS_VICE_CAPTAIN.YES) && noOfAttacker[l].playerRole == constants.PLAYER_ROLE.SUBSTITUTION){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.SUBSTITUTION_PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfAttacker[l].isCaptain == constants.IS_CAPTAIN.YES && noOfAttacker[l].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfAttacker[l].isCaptain == constants.IS_CAPTAIN.YES){
                captainCount = captainCount + 1;
                captain = noOfAttacker[l].player;
            }
            if(noOfAttacker[l].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                viceCaptainCount = viceCaptainCount + 1;
                viceCaptain = noOfAttacker[l].player;
            }
            totalRatings = totalRatings + aPlayerRating.playerRating;
            playerArr.push(mongoose.Types.ObjectId(noOfAttacker[l].player));
        }

        if(captainCount !== 1){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.PLAYER_CAPTAIN_LIMIT_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }

        if(viceCaptainCount !== 1){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.PLAYER_VICE_CAPTAIN_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }

        // let playerData = await FootBallPlayerName.find({_id :{$in :playerArr}})
        let playingCount = goalPlayingCount + defPlayingCount + midPlayingCount + attPlayingCount;
        let leagueTeamCount = await commonFunction.leagueTeamCount(playerArr);
        console.log(leagueTeamCount);
        let maxPlayer, minPlayer, credit, teamSelectionMessage;
        if(leagueData.teamFormat == constants.TEAM_FORMAT.ELEVEN){

            if(playingCount !== leagueData.teamFormat){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.ELEVEN_TEAM_PLAYING_SUCCESS", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(defPlayingCount < globalTeamSettings.minNoOfDefender || defPlayingCount > globalTeamSettings.maxNoOfDefender){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.DEFENDER_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(midPlayingCount < globalTeamSettings.minNoOfMidfielders || midPlayingCount > globalTeamSettings.maxNoOfMidfielders){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.MID_FIELDER_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(attPlayingCount < globalTeamSettings.minNoOfStrikers || attPlayingCount > globalTeamSettings.maxNoOfStrikers){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.ATTACKER_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            // minPlayer = globalTeamSettings.minPlayersFromSameTeamInEleven;
            maxPlayer = globalTeamSettings.maxPlayersFromSameTeamInEleven;
            credit = globalTeamSettings.creditToElevenTeamInLeague;
            teamSelectionMessage = Lang.responseIn("SOCCER.TEAM_SELECTION_ELEVEN_ERROR", req.headers.lang);
        }else if(leagueData.teamFormat == constants.TEAM_FORMAT.THREE){
            
            if(playingCount !== leagueData.teamFormat){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.THREE_TEAM_PLAYING_SUCCESS", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(defenderCount > 0 && defPlayingCount > 1 ){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.DEFENDER_THREE_FORMAT_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(midFielderCount > 0 && midPlayingCount > 1 ){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.MID_FIELDER_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(attackerCount > 0 && attPlayingCount > 1){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.ATTACKER_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            // minPlayer = globalTeamSettings.minPlayersFromSameTeamInThree;
            maxPlayer = globalTeamSettings.maxPlayersFromSameTeamInThree;
            credit = globalTeamSettings.creditToThreeTeamInLeague;
            teamSelectionMessage = Lang.responseIn("SOCCER.TEAM_SELECTION_THREE_ERROR", req.headers.lang);
        }else{
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_FORMAT", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        for(let x=0;x<leagueTeamCount.length;x++){
            if(leagueTeamCount[x].count > maxPlayer){
    
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: teamSelectionMessage,
                    error:true,
                    data:{}
                })
            }
        }

        if(totalRatings > credit ){

            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_RATINGS_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        let newUserTeam = new UserLeagueFootBallTeam({
            _userId,
            _leagueContestId,
            _leagueId,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp()
        })
        // let userTeamData = await newUserTeam.save();
        let userTeamData = await newUserTeam.save({session});

        // let isTeamExist = await UserLeagueFootBallTeam.findOne({_id : userTeamData._id, _userId, _leagueContestId, _leagueId})

        // if(!isTeamExist){
        //     return res.status(400).send({
        //         status:constants.STATUS_CODE.FAIL,
        //         message: Lang.responseIn("SOCCER.CONTEST_ENROLL_TEAM_ERROR", req.headers.lang),
        //         error:true,
        //         data:{}
        //     })
        // }


        let weekNumber = 1;                              //Uncomment this when going live
        // let weekNumber = await commonFunction.getCurrentGameWeek(_leagueId);

        let playerIds = []; 
        let substitutePlayerIds = [];

        let checkPlayerRole = (playerRole, _playerId) => {
            
            playerIds.push(_playerId)
            
            if(playerRole == constants.PLAYER_ROLE.SUBSTITUTION){
                substitutePlayerIds.push(_playerId)
            }
        }

        for(let i=0;i<noOfGoalKeeper.length;i++){

            let _playerId = noOfGoalKeeper[i].player;
            
            let goalKeeperData = await FootBallPlayerName.findOne({_id: _playerId, playerPosition : constants.PLAYER_POSITION.GOAL_KEEPER})
            if(!goalKeeperData){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let playerRole = noOfGoalKeeper[i].playerRole;

            await checkPlayerRole(playerRole, _playerId);
            
            let selectTeamPlayer = new SelectLeagueFootBallTeamPlayer({
                gameWeek : weekNumber,
                _leagueId,
                gameTeamId : goalKeeperData.teamId,
                _leagueTeamId : userTeamData._id,
                _playerId,
                teamName : goalKeeperData.teamName,
                gamePlayerId : goalKeeperData.playerId,
                playerName : goalKeeperData.playerName,
                playerPosition : constants.PLAYER_POSITION.GOAL_KEEPER,
                playerRating : goalKeeperData.playerRating,
                playerRole,
                isCaptain : noOfGoalKeeper[i].isCaptain,
                isViceCaptain : noOfGoalKeeper[i].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }

        for(let j=0;j<noOfDefender.length;j++){

            let _playerId = noOfDefender[j].player;

            let defenderData = await FootBallPlayerName.findOne({_id: _playerId, playerPosition : constants.PLAYER_POSITION.DEFENDER})
            if(!defenderData){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let playerRole = noOfDefender[j].playerRole;

            await checkPlayerRole(playerRole, _playerId);

            let selectTeamPlayer = new SelectLeagueFootBallTeamPlayer({
                gameWeek : weekNumber,
                _leagueId,
                gameTeamId : defenderData.teamId,
                _leagueTeamId : userTeamData._id,
                _playerId,
                teamName : defenderData.teamName,
                gamePlayerId : defenderData.playerId,
                playerName : defenderData.playerName,
                playerPosition : constants.PLAYER_POSITION.DEFENDER,
                playerRating : defenderData.playerRating,
                playerRole,
                isCaptain : noOfDefender[j].isCaptain,
                isViceCaptain : noOfDefender[j].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }
        
        for(let k=0;k<noOfMidFielder.length;k++){
            
            let _playerId = noOfMidFielder[k].player;

            let midfielderData = await FootBallPlayerName.findOne({_id: _playerId, playerPosition : constants.PLAYER_POSITION.MID_FIELDER})
            if(!midfielderData){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
                
            }

            let playerRole = noOfMidFielder[k].playerRole;

            await checkPlayerRole(playerRole, _playerId);

            let selectTeamPlayer = new SelectLeagueFootBallTeamPlayer({
                gameWeek : weekNumber,
                _leagueId,
                gameTeamId : midfielderData.teamId,
                _leagueTeamId : userTeamData._id,
                _playerId,
                teamName : midfielderData.teamName,
                gamePlayerId : midfielderData.playerId,
                playerName : midfielderData.playerName,
                playerPosition : constants.PLAYER_POSITION.MID_FIELDER,
                playerRating : midfielderData.playerRating,
                playerRole,
                isCaptain : noOfMidFielder[k].isCaptain,
                isViceCaptain : noOfMidFielder[k].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }
        
        for(let l=0;l<noOfAttacker.length;l++){

            let _playerId = noOfAttacker[l].player;

            let attackerData = await FootBallPlayerName.findOne({_id: _playerId, playerPosition : constants.PLAYER_POSITION.ATTACKER})
            if(!attackerData){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let playerRole = noOfAttacker[l].playerRole;

            await checkPlayerRole(playerRole, _playerId);

            let selectTeamPlayer = new SelectLeagueFootBallTeamPlayer({
                gameWeek : weekNumber,
                _leagueId,
                gameTeamId : attackerData.teamId,
                _leagueTeamId : userTeamData._id,
                _playerId,
                teamName : attackerData.teamName,
                gamePlayerId : attackerData.playerId,
                playerName : attackerData.playerName,
                playerPosition : constants.PLAYER_POSITION.ATTACKER,
                playerRating : attackerData.playerRating,
                playerRole,
                isCaptain : noOfAttacker[l].isCaptain,
                isViceCaptain : noOfAttacker[l].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }    
       
        var walletHistoryObj = {
            _userId,
            _teamId: userTeamData._id,
            _leagueContestId,
            leagueContestName : leagueData.contestName,
            amount : entryFee,
            competitionType : constants.COMPETITION_TYPE.LEAGUE,
            transactionType : constants.TRANSACTION_TYPE.MINUS,
            transactionFor : constants.TRANSACTION_FOR.PARTICIPATE,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp()
        }

        let enrollFootBallLeagueContest = new EnrollFootBallLeagueContest({
            _userId,
            userName: user.userName,
            _leagueId,
            _leagueContestId,
            _leagueTeamId : userTeamData._id,
            createdAt: dateFormat.setCurrentTimestamp(),
            updatedAt: dateFormat.setCurrentTimestamp()
        })

        // let playerIds = await commonFunction.findLeagueTeamPlayersIds(userTeamData._id, weekNumber);
        console.log(playerIds, 'playerIds');

        // let substitutePlayerIds = await commonFunction.findLeagueTeamSubstitutePlayersIds(userTeamData._id, weekNumber);
        console.log(substitutePlayerIds, 'substitutePlayerIds');

        if(reqdata._boosterId){
            if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.OVERHAUL){
                enrollFootBallLeagueContest.temporaryBoosters = enrollFootBallLeagueContest.temporaryBoosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : userTeamData._id, playerIds : playerIds, weekNumber});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.LOAN_TRANSFER){
                enrollFootBallLeagueContest.temporaryBoosters = enrollFootBallLeagueContest.temporaryBoosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : userTeamData._id, playerIds : playerIds, weekNumber});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.BENCH_SUPPORT){
                enrollFootBallLeagueContest.temporaryBoosters = enrollFootBallLeagueContest.temporaryBoosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : userTeamData._id, playerIds : substitutePlayerIds, weekNumber});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.INVINCIBLES){
                enrollFootBallLeagueContest.temporaryBoosters = enrollFootBallLeagueContest.temporaryBoosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : userTeamData._id, playerIds : invincibles, weekNumber});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.CAPTAIN_BOOST){
                enrollFootBallLeagueContest.temporaryBoosters = enrollFootBallLeagueContest.temporaryBoosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : userTeamData._id, playerIds : captain, weekNumber});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.VICE_CAPTAIN_BOOST){
                enrollFootBallLeagueContest.temporaryBoosters = enrollFootBallLeagueContest.temporaryBoosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : userTeamData._id, playerIds : viceCaptain, weekNumber});
            }
        }
        // let enrollFootBallLeagueContestData = await enrollFootBallLeagueContest.save();
        let enrollFootBallLeagueContestData = await enrollFootBallLeagueContest.save({session});

        if(isUserBooster === constants.BOOSTER_ASSIGNED_BY.PRIVATE){
            
            // let boosteravail = await commonFunction.deductUserBoosters(_userId, _boosterId);
            let isUserBoosterAvailable = await User.findOneAndUpdate({_id : _userId, boosters : { $elemMatch: { _boosterId, boosterQty: {$gt:0}}}},{
                $inc : {"boosters.$.boosterQty" : -1}
                },{session});
                console.log(isUserBoosterAvailable, 'isUserBoosterAvailable');
            if(isUserBoosterAvailable == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.BOOSTER_NOT_AVAILABLE", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }
        
        let updatedLeagueData, badgeUpdated = 0;

        if(enrollFootBallLeagueContestData){

            // updatedLeagueData = await FootBallLeagueContest.updateOne({_id: _leagueContestId, _leagueId : mongoose.Types.ObjectId(_leagueId)},
            // {
            //     $inc : {currentParticipants : 1}
            // },{session});
            
            if(entryFee > 0){

                //payment for participate
                let userWallets = await User.findOne({_id : _userId},{referralBalance :1, winningBalance: 1, depositBalance: 1, participatedInCount: 1, badgeKey : 1, userName : 1});
                let totalBalance = userWallets.referralBalance + userWallets.winningBalance + userWallets.depositBalance;

                if(totalBalance < entryFee){
                    console.log('you don\'t have anything here');
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

        let againEnrolledCount = await EnrollFootBallLeagueContest.countDocuments({_userId, _leagueContestId:leagueData._id});
        console.log(againEnrolledCount, 'againEnrolledCount');
        if(leagueData.contestType === constants.CONTEST_TYPE.H2H){
            if(againEnrolledCount >= constants.H2H_PARTICIPANT_LIMIT){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("GENERAL.PARTICIPANT_LIMIT", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }else if(leagueData.contestType === constants.CONTEST_TYPE.REGULAR){
            if(againEnrolledCount >= constants.PARTICIPANT_LIMIT){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("GENERAL.PARTICIPANT_LIMIT", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }

        let participantCountBefore = await EnrollFootBallLeagueContest.countDocuments({_leagueContestId: leagueData._id});
        console.log(participantCountBefore, 'participantCountBefore');
        if(leagueData.contestType !== constants.CONTEST_TYPE.H2H){
            if(participantCountBefore >= leagueData.maxParticipants){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.CONTEST_PARTICIPATE_FULL", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }
        updatedLeagueData = await FootBallLeagueContest.updateOne({_id: _leagueContestId, _leagueId : mongoose.Types.ObjectId(_leagueId), $expr: { $lt: [ "$currentParticipants" , "$maxParticipants" ] }},
        {
            $inc : {currentParticipants : 1}
        });

        if(updatedLeagueData.nModified === 0){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.CONTEST_PARTICIPATE_FULL", req.headers.lang),
                error:true,
                data:{}
            })
        }

        await session.commitTransaction();
        session.endSession();

        if(badgeUpdated == 1){
            await commonFunction.sendNotificationToFollower(user, constants.NOTIFICATION_STATUS.LEVEL_UP)
        }

        let againEnrolledCountAfter = await EnrollFootBallLeagueContest.countDocuments({_userId, _leagueContestId:leagueData._id});
        console.log(againEnrolledCountAfter, 'againEnrolledCountAfter');

        let participantCountAfter = await EnrollFootBallLeagueContest.countDocuments({_leagueContestId: leagueData._id});
        console.log(participantCountAfter, 'participantCountAfter');

        let userWallets = await commonFunction.getUserLatestBalance(_userId)
        res.status(201).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.USER_CONTEST_JOINED_SUCCESS", req.headers.lang),
            error: false,
            data: {enrollFootBallLeagueContestData, userWallets}
        })
        logService.responseData(req, {enrollFootBallLeagueContestData, userWallets, updatedLeagueData});
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

/**
 * Update enrolled team in football League contest
 * @function
 * @param {ObjectId} _userId - _userId of a logged in user.
 * @param {ObjectId} _leagueContestId - _leagueContestId of a contest id of a particular league.
 * @param {ObjectId} _leagueId - _leagueId of a league.
 * @param {ObjectId} _leagueTeamId - _leagueTeamId, Team id which user wants to update.
 * @returns {Object} userTeam - Returns userTeam.
 * Will check league with _leagueId first.
 * Will check contest with _leagueContestId.
 * Will check team with _leagueTeamId.
 * If league exist then we will check that it's must be 2 hr or more from time of league is going to start.
 * Then It will check all team validation which we have in this function.
 * Team format, Players according to the formations and from the league, Player limit, Boosters, Credit points, Players from same team.
 * After doing all the validation it will remove previous selected players for particular week, Team will get updated with new players.
 */
exports.updateTeamInLeagueContest = async (req, res, done) => {
    let session = await mongoose.startSession({
        readPreference: { mode: 'primary' }
      });
      session.startTransaction();
    try {
        const user = req.user;
        const _userId = user._id;
        const reqdata = req.body;

        const _leagueContestId = reqdata._leagueContestId;
        const _leagueId = reqdata._leagueId;
        const _leagueTeamId = reqdata._leagueTeamId;
        const transferCount = reqdata.transferCount;

        let currentTimeStamp = dateFormat.setCurrentTimestamp();      
        
        let globalTeamSettings = await GlobalTeamSettings.findOne();
        if(!globalTeamSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_TEAM_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        const isLeagueExist = await FootBallLeagueSchedule.findOne({_id: _leagueId});
        if(!isLeagueExist){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.LEAGUE_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let teamIdsArr = await commonFunction.leagueTeamArr(_leagueId);
        
        let leagueData = await FootBallLeagueContest.findOne({_id: _leagueContestId, _leagueId : mongoose.Types.ObjectId(_leagueId)});
        
        if(!leagueData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        if(leagueData.status === constants.LEAGUE_STATUS.CLOSED){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.CONTEST_CLOSE", req.headers.lang),
                error:true,
                data:{}
            })
        }
        const entryFee = leagueData.entryFee;

        let enrolledTeam = await EnrollFootBallLeagueContest.findOne({_userId, _leagueContestId, _leagueTeamId})

        if(!enrolledTeam){
            return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_NOT_FOUND", req.headers.lang),
                    error: true,
                    data: {}
                });
        }

        let gameWeek = await LeagueWeekMaster.findOne({_leagueId, weekFirstMatchStartTime :{$gte : currentTimeStamp}})

        if(!gameWeek){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_UPDATE_WEEK_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let weekNumber = gameWeek.weekNumber;

        let _boosterId, boosterCount, invincibles, isUserBooster = 0;
        
        if(reqdata._boosterId){
            _boosterId = reqdata._boosterId;

            var globalBoosterSettings = await GlobalBoosterSettings.findOne({_id : _boosterId});
            if(!globalBoosterSettings){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_SETTINGS_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let temporaryAppliedBoosters = await EnrollFootBallLeagueContest.aggregate([
                {
                    $match :
                        {
                            _leagueContestId : mongoose.Types.ObjectId(_leagueContestId),
                            _userId : mongoose.Types.ObjectId(_userId),
                            _leagueTeamId : mongoose.Types.ObjectId(_leagueTeamId),
                        }
                },
                {
                    $unwind : "$temporaryBoosters"
                },
                {
                    $lookup :
                        {
                            from: "globalboostersettings",
                            localField: "temporaryBoosters._boosterId",
                            foreignField: "_id",
                            as: "_boosterId"
                        }
                },
                {
                    $unwind : "$_boosterId"
                },
                {
                    $match : {"_boosterId.boosterType" : {$in :[constants.BOOSTER_TYPE.OVERHAUL,constants.BOOSTER_TYPE.LOAN_TRANSFER]}}
                }, 
                {
                    $project : 
                        {
                            "_boosterId.boosterType" : 1
                        }
                }
                ])
 
            if(temporaryAppliedBoosters.length > 0){                
                
                for(let a=0;a<temporaryAppliedBoosters.length;a++){
                    let boosterType = temporaryAppliedBoosters[a]._boosterId.boosterType;
                    console.log(boosterType, 'boosterType');
                    if(boosterType !== globalBoosterSettings.boosterType){
                        return res.status(400).send({
                            status:constants.STATUS_CODE.FAIL,
                            message: Lang.responseIn("SOCCER.SPECIFIC_BOOSTER_APPLIED", req.headers.lang),
                            error:true,
                            data:{}
                        })
                    }
                }
            }

            let totalWeeks = await LeagueWeekMaster.countDocuments({_leagueId})
            
            let halfSeason = Math.round(totalWeeks/2);

            let currentWeekNumber = +await commonFunction.getCurrentGameWeek(_leagueId);

            let applyBoosterType = globalBoosterSettings.boosterType;
            let isAlreadyApplied = 0;
            let appliedBoosters;
            if(applyBoosterType == constants.BOOSTER_TYPE.OVERHAUL){
                    
                appliedBoosters = await EnrollFootBallLeagueContest.findOne({
                                _leagueContestId : mongoose.Types.ObjectId(_leagueContestId),
                                _userId : mongoose.Types.ObjectId(_userId),
                                _leagueTeamId : mongoose.Types.ObjectId(_leagueTeamId),
                                appliedBoosters : {$elemMatch: {_boosterId : mongoose.Types.ObjectId(_boosterId)}}
                            })

                if(appliedBoosters){
                    let alreadyAppliedBooster = appliedBoosters.appliedBoosters;

                    for(let i=0;i<alreadyAppliedBooster.length;i++){
                        if(currentWeekNumber < halfSeason){
                            if(_boosterId === (alreadyAppliedBooster[i]._boosterId).toString() && alreadyAppliedBooster[i].weekNumber < halfSeason){
                                isAlreadyApplied = 1;
                            } 
                        }else{
                            if(_boosterId === (alreadyAppliedBooster[i]._boosterId).toString() && alreadyAppliedBooster[i].weekNumber >= halfSeason){
                                isAlreadyApplied = 1;
                            }                                
                        }
                    }
                }
                    
            }else{
                appliedBoosters = await EnrollFootBallLeagueContest.findOne({
                    _leagueContestId : mongoose.Types.ObjectId(_leagueContestId),
                    _userId : mongoose.Types.ObjectId(_userId),
                    _leagueTeamId : mongoose.Types.ObjectId(_leagueTeamId),
                    appliedBoosters : {$elemMatch: {_boosterId : mongoose.Types.ObjectId(_boosterId)}}
                })

                if(appliedBoosters){
                    isAlreadyApplied = 1;
                }

            }

            console.log(isAlreadyApplied, 'isAlreadyApplied');

            if(isAlreadyApplied === 1){
                if(entryFee === 0 ){
                    let appliedBooster = enrolledTeam.temporaryBoosters
                        if(appliedBooster.length > 0) {

                            for(let j=0;j<appliedBooster.length;j++){

                                if(appliedBooster[j].boosterAssignedBy === constants.BOOSTER_ASSIGNED_BY.PRIVATE){
                                    if(_boosterId === (appliedBooster[j]._boosterId).toString()){
                                        isUserBooster = constants.BOOSTER_ASSIGNED_BY.PRIVATE;
                                        boosterCount = 1;
                                    }else{
                                        // let isUserBoosterAvailable = await commonFunction.checkUserBoosters(_userId, _boosterId);
                                        let isUserBoosterAvailable = await User.findOne({_id : _userId, boosters : { $elemMatch: { _boosterId, boosterQty: {$gt:0}}}})
                                        if(isUserBoosterAvailable === null){
                                            return res.status(400).send({
                                                status:constants.STATUS_CODE.FAIL,
                                                message: Lang.responseIn("SOCCER.BOOSTER_NOT_AVAILABLE", req.headers.lang),
                                                error:true,
                                                data:{}
                                            })
                                        }else{

                                            isUserBooster = constants.BOOSTER_ASSIGNED_BY.PRIVATE;
                                            boosterCount = 1;
                                        }
                                    }                                            
                                }else{
                                    // let isUserBoosterAvailable = await commonFunction.checkUserBoosters(_userId, _boosterId);
                                    let isUserBoosterAvailable = await User.findOne({_id : _userId, boosters : { $elemMatch: { _boosterId, boosterQty: {$gt:0}}}})
                                        if(isUserBoosterAvailable === null){
                                            return res.status(400).send({
                                                status:constants.STATUS_CODE.FAIL,
                                                message: Lang.responseIn("SOCCER.BOOSTER_NOT_AVAILABLE", req.headers.lang),
                                                error:true,
                                                data:{}
                                            })
                                        }else{

                                            isUserBooster = constants.BOOSTER_ASSIGNED_BY.PRIVATE;
                                            boosterCount = 1;

                                        }
                                }
                            }                                    
                        }else{
                            console.log('comes here in else in is already');
                            // let isUserBoosterAvailable = await commonFunction.checkUserBoosters(_userId, _boosterId);
                            let isUserBoosterAvailable = await User.findOne({_id : _userId, boosters : { $elemMatch: { _boosterId, boosterQty: {$gt:0}}}})
                            if(isUserBoosterAvailable === null){
                                return res.status(400).send({
                                    status:constants.STATUS_CODE.FAIL,
                                    message: Lang.responseIn("SOCCER.BOOSTER_NOT_AVAILABLE", req.headers.lang),
                                    error:true,
                                    data:{}
                                })
                            }else{

                                isUserBooster = constants.BOOSTER_ASSIGNED_BY.PRIVATE;
                                boosterCount = 1;

                            }
                        }   
                }else{
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.BOOSTER_NOT_AVAILABLE", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
            }else{
                let isBoosterAvailable = await FootBallLeagueContest.findOne({_id: _leagueContestId, _leagueId : mongoose.Types.ObjectId(_leagueId), boosters : { $elemMatch: { _boosterId , boosterCount: {$gt:0}}}});
                if(!isBoosterAvailable){
                    if(entryFee === 0 ){
                        let appliedBooster = enrolledTeam.temporaryBoosters
                            if(appliedBooster.length > 0) {
    
                                for(let j=0;j<appliedBooster.length;j++){
    
                                    if(appliedBooster[j].boosterAssignedBy === constants.BOOSTER_ASSIGNED_BY.PRIVATE){
                                        if(_boosterId === (appliedBooster[j]._boosterId).toString()){
                                            isUserBooster = constants.BOOSTER_ASSIGNED_BY.PRIVATE;
                                            boosterCount = 1;
                                        }else{
                                            // let isUserBoosterAvailable = await commonFunction.checkUserBoosters(_userId, _boosterId);
                                            let isUserBoosterAvailable = await User.findOne({_id : _userId, boosters : { $elemMatch: { _boosterId, boosterQty: {$gt:0}}}})
                                            if(isUserBoosterAvailable === null){
                                                return res.status(400).send({
                                                    status:constants.STATUS_CODE.FAIL,
                                                    message: Lang.responseIn("SOCCER.BOOSTER_NOT_AVAILABLE", req.headers.lang),
                                                    error:true,
                                                    data:{}
                                                })
                                            }else{
    
                                                isUserBooster = constants.BOOSTER_ASSIGNED_BY.PRIVATE;
                                                boosterCount = 1;
                                            }
                                        }                                            
                                    }else{
                                        // let isUserBoosterAvailable = await commonFunction.checkUserBoosters(_userId, _boosterId);
                                        let isUserBoosterAvailable = await User.findOne({_id : _userId, boosters : { $elemMatch: { _boosterId, boosterQty: {$gt:0}}}})
                                            if(isUserBoosterAvailable === null){
                                                return res.status(400).send({
                                                    status:constants.STATUS_CODE.FAIL,
                                                    message: Lang.responseIn("SOCCER.BOOSTER_NOT_AVAILABLE", req.headers.lang),
                                                    error:true,
                                                    data:{}
                                                })
                                            }else{
    
                                                isUserBooster = constants.BOOSTER_ASSIGNED_BY.PRIVATE;
                                                boosterCount = 1;
    
                                            }
                                    }
                                }                                    
                            }else{
                                // let isUserBoosterAvailable = await commonFunction.checkUserBoosters(_userId, _boosterId);
                                let isUserBoosterAvailable = await User.findOne({_id : _userId, boosters : { $elemMatch: { _boosterId, boosterQty: {$gt:0}}}})
                                if(isUserBoosterAvailable === null){
                                    return res.status(400).send({
                                        status:constants.STATUS_CODE.FAIL,
                                        message: Lang.responseIn("SOCCER.BOOSTER_NOT_AVAILABLE", req.headers.lang),
                                        error:true,
                                        data:{}
                                    })
                                }else{
                                    isUserBooster = constants.BOOSTER_ASSIGNED_BY.PRIVATE;
                                    boosterCount = 1;
                                }
                            }
                    }else{
                        return res.status(400).send({
                            status:constants.STATUS_CODE.FAIL,
                            message: Lang.responseIn("SOCCER.BOOSTER_NOT_AVAILABLE", req.headers.lang),
                            error:true,
                            data:{}
                        })
                    }
                }else{
                    boosterCount = 1;
                }
            }

            invincibles = reqdata.invincibles;

            if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.INVINCIBLES){
                if(!invincibles){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.BOOSTER_IDS_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                if(invincibles.length !== constants.BOOSTER_IDS_LENGTH.INVINCIBLES){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.BOOSTER_IDS_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                duplicateIds = await commonFunction.findDuplicates(invincibles)
                if(duplicateIds>0){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.DUPLICATE_IDS_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                for(let a=0;a<invincibles.length;a++){
                    let player = await commonFunction.getPlayer(invincibles[a], teamIdsArr);
                    if(player == null){
                        return res.status(400).send({
                            status:constants.STATUS_CODE.FAIL,
                            message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                            error:true,
                            data:{}
                        })
                    }
                }
            }
        }

        let isTeamExist = await UserLeagueFootBallTeam.findOne({_id : _leagueTeamId, _userId, _leagueContestId, _leagueId})

        if(!isTeamExist){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let goalKeeperCount = reqdata.goalKeeperCount;
        let defenderCount = reqdata.defenderCount;
        let midFielderCount = reqdata.midFielderCount;
        let attackerCount = reqdata.attackerCount;

        let noOfGoalKeeper = reqdata.goalKeeper;
        let noOfDefender = reqdata.defender;
        let noOfMidFielder = reqdata.midFielder;
        let noOfAttacker = reqdata.attacker;

        let totalPlayer = noOfGoalKeeper.length + noOfDefender.length + noOfMidFielder.length + noOfAttacker.length;

        if(totalPlayer != leagueData.playerLimit){
            
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_VALIDATION", req.headers.lang),
                error:true,
                data:{}
            })
        }else if(noOfGoalKeeper.length !== goalKeeperCount){
            
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                error:true,
                data:{}
            })

        }else if(noOfDefender.length !== defenderCount){
            
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                error:true,
                data:{}
            })

        }else if(noOfMidFielder.length !== midFielderCount){
            
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                error:true,
                data:{}
            })

        }else if(noOfAttacker.length !== attackerCount){
            
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                error:true,
                data:{}
            })

        }

        let captain, viceCaptain;
        let totalRatings = 0;
        let captainCount = 0;
        let viceCaptainCount = 0;
        
        let goalPlayingCount = 0;
        let defPlayingCount = 0;
        let midPlayingCount = 0;
        let attPlayingCount = 0;
        let playerArr = [];

        for(let i=0;i<noOfGoalKeeper.length;i++){
            let gkPlayerRating = await commonFunction.getPlayerRatings(noOfGoalKeeper[i].player, teamIdsArr, constants.PLAYER_POSITION.GOAL_KEEPER);
            if(gkPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfGoalKeeper[i].playerRole == constants.PLAYER_ROLE.PLAYING){
                goalPlayingCount++;
            }
            if((noOfGoalKeeper[i].isCaptain == constants.IS_CAPTAIN.YES || noOfGoalKeeper[i].isViceCaptain == constants.IS_VICE_CAPTAIN.YES) && noOfGoalKeeper[i].playerRole == constants.PLAYER_ROLE.SUBSTITUTION){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.SUBSTITUTION_PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfGoalKeeper[i].isCaptain == constants.IS_CAPTAIN.YES && noOfGoalKeeper[i].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfGoalKeeper[i].isCaptain == constants.IS_CAPTAIN.YES){
                captainCount = captainCount + 1;
                captain = noOfGoalKeeper[i].player;
            }
            if(noOfGoalKeeper[i].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                viceCaptainCount = viceCaptainCount + 1;
                viceCaptain = noOfGoalKeeper[i].player;
            }
            totalRatings = totalRatings + gkPlayerRating.playerRating;
            playerArr.push(mongoose.Types.ObjectId(noOfGoalKeeper[i].player));
        }

        if(goalPlayingCount != globalTeamSettings.minNoOfGoalKeeper || noOfGoalKeeper.length < 2){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.GOAL_PLAYING_VALIDATION", req.headers.lang),
                error:true,
                data:{}
            })
        }

        for(let j=0;j<noOfDefender.length;j++){
            let dPlayerRating = await commonFunction.getPlayerRatings(noOfDefender[j].player, teamIdsArr, constants.PLAYER_POSITION.DEFENDER);
            if(dPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(noOfDefender[j].playerRole == constants.PLAYER_ROLE.PLAYING){
                defPlayingCount++;
            }

            if((noOfDefender[j].isCaptain == constants.IS_CAPTAIN.YES || noOfDefender[j].isViceCaptain == constants.IS_VICE_CAPTAIN.YES) && noOfDefender[j].playerRole == constants.PLAYER_ROLE.SUBSTITUTION){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.SUBSTITUTION_PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfDefender[j].isCaptain == constants.IS_CAPTAIN.YES && noOfDefender[j].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfDefender[j].isCaptain == constants.IS_CAPTAIN.YES){
                captainCount = captainCount + 1;
                captain = noOfDefender[j].player;
            }
            if(noOfDefender[j].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                viceCaptainCount = viceCaptainCount + 1;
                viceCaptain = noOfDefender[j].player;
            }
            totalRatings = totalRatings + dPlayerRating.playerRating;
            playerArr.push(mongoose.Types.ObjectId(noOfDefender[j].player));
        }

        for(let k=0;k<noOfMidFielder.length;k++){
            let mfPlayerRating = await commonFunction.getPlayerRatings(noOfMidFielder[k].player, teamIdsArr, constants.PLAYER_POSITION.MID_FIELDER);
            if(mfPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(noOfMidFielder[k].playerRole == constants.PLAYER_ROLE.PLAYING){
                midPlayingCount++;
            }

            if((noOfMidFielder[k].isCaptain == constants.IS_CAPTAIN.YES || noOfMidFielder[k].isViceCaptain == constants.IS_VICE_CAPTAIN.YES) && noOfMidFielder[k].playerRole == constants.PLAYER_ROLE.SUBSTITUTION){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.SUBSTITUTION_PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfMidFielder[k].isCaptain == constants.IS_CAPTAIN.YES && noOfMidFielder[k].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfMidFielder[k].isCaptain == constants.IS_CAPTAIN.YES){
                captainCount = captainCount + 1;
                captain = noOfMidFielder[k].player;
            }
            if(noOfMidFielder[k].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                viceCaptainCount = viceCaptainCount + 1;
                viceCaptain = noOfMidFielder[k].player;
            }
            totalRatings = totalRatings + mfPlayerRating.playerRating;
            playerArr.push(mongoose.Types.ObjectId(noOfMidFielder[k].player));
        }

        for(let l=0;l<noOfAttacker.length;l++){
            let aPlayerRating = await commonFunction.getPlayerRatings(noOfAttacker[l].player, teamIdsArr, constants.PLAYER_POSITION.ATTACKER);
            if(aPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(noOfAttacker[l].playerRole == constants.PLAYER_ROLE.PLAYING){
                attPlayingCount++;
            }

            if((noOfAttacker[l].isCaptain == constants.IS_CAPTAIN.YES || noOfAttacker[l].isViceCaptain == constants.IS_VICE_CAPTAIN.YES) && noOfAttacker[l].playerRole == constants.PLAYER_ROLE.SUBSTITUTION){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.SUBSTITUTION_PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfAttacker[l].isCaptain == constants.IS_CAPTAIN.YES && noOfAttacker[l].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfAttacker[l].isCaptain == constants.IS_CAPTAIN.YES){
                captainCount = captainCount + 1;
                captain = noOfAttacker[l].player;
            }
            if(noOfAttacker[l].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                viceCaptainCount = viceCaptainCount + 1;
                viceCaptain = noOfAttacker[l].player;
            }
            totalRatings = totalRatings + aPlayerRating.playerRating;
            playerArr.push(mongoose.Types.ObjectId(noOfAttacker[l].player));
        }

        if(captainCount !== 1){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.PLAYER_CAPTAIN_LIMIT_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }

        if(viceCaptainCount !== 1){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.PLAYER_VICE_CAPTAIN_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }

        // let playerData = await FootBallPlayerName.find({_id :{$in :playerArr}})
        let playingCount = goalPlayingCount + defPlayingCount + midPlayingCount + attPlayingCount;
        let leagueTeamCount = await commonFunction.leagueTeamCount(playerArr);
        console.log(leagueTeamCount);
        let maxPlayer, minPlayer, credit, teamSelectionMessage;
        if(leagueData.teamFormat == constants.TEAM_FORMAT.ELEVEN){

            if(playingCount !== leagueData.teamFormat){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.ELEVEN_TEAM_PLAYING_SUCCESS", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(defPlayingCount < globalTeamSettings.minNoOfDefender || defPlayingCount > globalTeamSettings.maxNoOfDefender){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.DEFENDER_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(midPlayingCount < globalTeamSettings.minNoOfMidfielders || midPlayingCount > globalTeamSettings.maxNoOfMidfielders){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.MID_FIELDER_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(attPlayingCount < globalTeamSettings.minNoOfStrikers || attPlayingCount > globalTeamSettings.maxNoOfStrikers){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.ATTACKER_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            // minPlayer = globalTeamSettings.minPlayersFromSameTeamInEleven;
            maxPlayer = globalTeamSettings.maxPlayersFromSameTeamInEleven;
            credit = globalTeamSettings.creditToElevenTeamInLeague;
            teamSelectionMessage = Lang.responseIn("SOCCER.TEAM_SELECTION_ELEVEN_ERROR", req.headers.lang);
        }else if(leagueData.teamFormat == constants.TEAM_FORMAT.THREE){
            
            if(playingCount !== leagueData.teamFormat){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.THREE_TEAM_PLAYING_SUCCESS", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(defenderCount > 0 && defPlayingCount > 1 ){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.DEFENDER_THREE_FORMAT_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(midFielderCount > 0 && midPlayingCount > 1 ){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.MID_FIELDER_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(attackerCount > 0 && attPlayingCount > 1){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.ATTACKER_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            // minPlayer = globalTeamSettings.minPlayersFromSameTeamInThree;
            maxPlayer = globalTeamSettings.maxPlayersFromSameTeamInThree;
            credit = globalTeamSettings.creditToThreeTeamInLeague;
            teamSelectionMessage = Lang.responseIn("SOCCER.TEAM_SELECTION_THREE_ERROR", req.headers.lang);
        }else{
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_FORMAT", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        for(let x=0;x<leagueTeamCount.length;x++){
            if(leagueTeamCount[x].count > maxPlayer){
    
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: teamSelectionMessage,
                    error:true,
                    data:{}
                })
            }
        }
        if(totalRatings > credit ){

            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_RATINGS_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }
        

        //store latest team in loan transfer details
        let latestTeam = await SelectLeagueFootBallTeamPlayer.find({_leagueTeamId, gameWeek : weekNumber},{isCaptain : 1, isViceCaptain : 1, _playerId : 1, playerRole : 1});
        let loanTransferPlayerDetail = latestTeam;

        //delete previous team
        let deletedTeam = await SelectLeagueFootBallTeamPlayer.deleteMany({_leagueTeamId, gameWeek : weekNumber},{session});
        console.log(deletedTeam);

        let playerIds = []; 
        let substitutePlayerIds = [];

        let checkPlayerRole = (playerRole, _playerId) => {
            
            playerIds.push(_playerId)
            
            if(playerRole == constants.PLAYER_ROLE.SUBSTITUTION){
                substitutePlayerIds.push(_playerId)
            }
        }

        for(let i=0;i<noOfGoalKeeper.length;i++){

            let _playerId = noOfGoalKeeper[i].player;

            let goalKeeperData = await FootBallPlayerName.findOne({_id: _playerId, playerPosition : constants.PLAYER_POSITION.GOAL_KEEPER})
            if(!goalKeeperData){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let playerRole = noOfGoalKeeper[i].playerRole;

            await checkPlayerRole(playerRole, _playerId);

            let selectTeamPlayer = new SelectLeagueFootBallTeamPlayer({
                gameWeek : weekNumber,
                _leagueId,
                gameTeamId : goalKeeperData.teamId,
                _leagueTeamId : _leagueTeamId,
                _playerId,
                teamName : goalKeeperData.teamName,
                gamePlayerId : goalKeeperData.playerId,
                playerName : goalKeeperData.playerName,
                playerPosition : constants.PLAYER_POSITION.GOAL_KEEPER,
                playerRating : goalKeeperData.playerRating,
                playerRole,
                isCaptain : noOfGoalKeeper[i].isCaptain,
                isViceCaptain : noOfGoalKeeper[i].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }
        
        for(let j=0;j<noOfDefender.length;j++){

            let _playerId = noOfDefender[j].player;

            let defenderData = await FootBallPlayerName.findOne({_id: _playerId, playerPosition : constants.PLAYER_POSITION.DEFENDER})
            if(!defenderData){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let playerRole = noOfDefender[j].playerRole;

            await checkPlayerRole(playerRole, _playerId);

            let selectTeamPlayer = new SelectLeagueFootBallTeamPlayer({
                gameWeek : weekNumber,
                _leagueId,
                gameTeamId : defenderData.teamId,
                _leagueTeamId : _leagueTeamId,
                _playerId,
                teamName : defenderData.teamName,
                gamePlayerId : defenderData.playerId,
                playerName : defenderData.playerName,
                playerPosition : constants.PLAYER_POSITION.DEFENDER,
                playerRating : defenderData.playerRating,
                playerRole,
                isCaptain : noOfDefender[j].isCaptain,
                isViceCaptain : noOfDefender[j].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }
        
        for(let k=0;k<noOfMidFielder.length;k++){
            
            let _playerId = noOfMidFielder[k].player;

            let midfielderData = await FootBallPlayerName.findOne({_id: _playerId, playerPosition : constants.PLAYER_POSITION.MID_FIELDER})
            if(!midfielderData){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
                
            }

            let playerRole = noOfMidFielder[k].playerRole;

            await checkPlayerRole(playerRole, _playerId);

            let selectTeamPlayer = new SelectLeagueFootBallTeamPlayer({
                gameWeek : weekNumber,
                _leagueId,
                gameTeamId : midfielderData.teamId,
                _leagueTeamId : _leagueTeamId,
                _playerId,
                teamName : midfielderData.teamName,
                gamePlayerId : midfielderData.playerId,
                playerName : midfielderData.playerName,
                playerPosition : constants.PLAYER_POSITION.MID_FIELDER,
                playerRating : midfielderData.playerRating,
                playerRole,
                isCaptain : noOfMidFielder[k].isCaptain,
                isViceCaptain : noOfMidFielder[k].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }
        
        for(let l=0;l<noOfAttacker.length;l++){

            let _playerId = noOfAttacker[l].player;

            let attackerData = await FootBallPlayerName.findOne({_id: _playerId, playerPosition : constants.PLAYER_POSITION.ATTACKER})
            if(!attackerData){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let playerRole = noOfAttacker[l].playerRole;

            await checkPlayerRole(playerRole, _playerId);

            let selectTeamPlayer = new SelectLeagueFootBallTeamPlayer({
                gameWeek : weekNumber,
                _leagueId,
                gameTeamId : attackerData.teamId,
                _leagueTeamId : _leagueTeamId,
                _playerId,
                teamName : attackerData.teamName,
                gamePlayerId : attackerData.playerId,
                playerName : attackerData.playerName,
                playerPosition : constants.PLAYER_POSITION.ATTACKER,
                playerRating : attackerData.playerRating,
                playerRole,
                isCaptain : noOfAttacker[l].isCaptain,
                isViceCaptain : noOfAttacker[l].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }

        // let playerIds = await commonFunction.findLeagueTeamPlayersIds(_leagueTeamId, weekNumber);
        console.log(playerIds, 'playerIds');

        // let substitutePlayerIds = await commonFunction.findLeagueTeamSubstitutePlayersIds(_leagueTeamId, weekNumber);
        console.log(substitutePlayerIds, 'substitutePlayerIds');

        if(reqdata._boosterId){
            let appliedBooster = enrolledTeam.temporaryBoosters
            if(appliedBooster.length > 0) {

                for(let j=0;j<appliedBooster.length;j++){

                    if(appliedBooster[j].boosterAssignedBy === constants.BOOSTER_ASSIGNED_BY.PRIVATE){
                        // await commonFunction.giveBoosterBackToUser(_userId, appliedBooster[j]._boosterId)
                        let giveBoosterBackToUser = await User.findOneAndUpdate({_id : _userId, boosters : { $elemMatch: { _boosterId : appliedBooster[j]._boosterId }}},{
                            $inc : {"boosters.$.boosterQty" : 1}
                            },{session})
                    }

                    let boosterDetails = await GlobalBoosterSettings.findOne({_id : appliedBooster[j]._boosterId});
                    if(boosterDetails.boosterType === constants.BOOSTER_TYPE.LOAN_TRANSFER){
                        loanTransferPlayerDetail = appliedBooster[j].playerIds;
                    }
                }
                
            }
            enrolledTeam.temporaryBoosters = [];
            if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.OVERHAUL){
                enrolledTeam.temporaryBoosters = enrolledTeam.temporaryBoosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : _leagueTeamId, playerIds : playerIds, weekNumber});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.LOAN_TRANSFER){
                enrolledTeam.temporaryBoosters = enrolledTeam.temporaryBoosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : _leagueTeamId, playerIds : loanTransferPlayerDetail, weekNumber});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.BENCH_SUPPORT){
                enrolledTeam.temporaryBoosters = enrolledTeam.temporaryBoosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : _leagueTeamId, playerIds : substitutePlayerIds, weekNumber});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.INVINCIBLES){
                enrolledTeam.temporaryBoosters = enrolledTeam.temporaryBoosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : _leagueTeamId, playerIds : invincibles, weekNumber});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.CAPTAIN_BOOST){
                enrolledTeam.temporaryBoosters = enrolledTeam.temporaryBoosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : _leagueTeamId, playerIds : captain, weekNumber});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.VICE_CAPTAIN_BOOST){
                enrolledTeam.temporaryBoosters = enrolledTeam.temporaryBoosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : _leagueTeamId, playerIds : viceCaptain, weekNumber});
            }
            // await enrolledTeam.save();
            await enrolledTeam.save({session});
            
            if(isUserBooster === constants.BOOSTER_ASSIGNED_BY.PRIVATE){
                
                // await commonFunction.deductUserBoosters(_userId, reqdata._boosterId)
                let isUserBoosterAvailable = await User.findOneAndUpdate({_id : _userId, boosters : { $elemMatch: { _boosterId, boosterQty: {$gt:0}}}},{
                    $inc : {"boosters.$.boosterQty" : -1}
                    },{session})

                if(isUserBoosterAvailable == null){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.BOOSTER_NOT_AVAILABLE", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
            }
        }

        // enrolledTeam.transferCount += transferCount;
        // await enrolledTeam.save();
        // await enrolledTeam.save({session});
        
        await EnrollFootBallLeagueContest.findOneAndUpdate({_userId, _leagueContestId, _leagueTeamId},{
            $inc : {"transferCount" : transferCount}
        },{session})
// console.log(abc);
        await session.commitTransaction();
        session.endSession();

        let userTeam = {};

        let players = await SelectLeagueFootBallTeamPlayer.find({_leagueTeamId, gameWeek : weekNumber})
        
        userTeam._leagueContestId = _leagueContestId;
        userTeam._leagueId = _leagueId;
        userTeam._userId = _userId;
        userTeam.players = players

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.TEAM_UPDATE_SUCCESS", req.headers.lang),
            error: false,
            data: userTeam
        })
        logService.responseData(req, userTeam);
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

/**
 * Get live league, upcoming league, past league list for users
 * @function
 * @param {ObjectId} _userId - _userId of a logged in user.
 * @returns {Object} {liveLeagueData, upComingLeagueData, pastLeagueData} - Returns {liveLeagueData, upComingLeagueData, pastLeagueData}.
 * First it will check live contest in which user has enrolled and return it's league data with contest count.
 * Then it will check upcoming contest in which user has enrolled and return it's league data with contest count.
 * Then it will check past contest in which user has enrolled and return it's league data with contest count.
 */
exports.getLiveUpComingPastFootBallLeagueDetails =  async (req, res) => {
    try {
            let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            const _userId = req.user._id;
            let plusThreeHours = currentTimeStamp + (constants.UPCOMING_HOURS * constants.TIME_DIFF_MILISEC.GET_HOUR);
            var upComingDays = currentTimeStamp + (constants.UPCOMIG_DAYS * constants.TIME_DIFF_MILISEC.GET_DAY);
            let field, value; 
            // const search = req.query.q ? req.query.q : ''; // for searching
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
            
            let liveContests = await EnrollFootBallLeagueContest.aggregate([
                {
                    $lookup : {
                        from: 'footballleaguecontests',
                        localField: '_leagueContestId',
                        foreignField: '_id',
                        as: '_leagueContestId',
                    }
                },
               {$match :  {_userId, "_leagueContestId.status" : {$in :[constants.LEAGUE_STATUS.OPEN]}}},
               {
                   $project : {
                       "_leagueContestId._leagueId" : 1,
                       "_leagueContestId._id" : 1
                   }
               }
            ])
        
            let liveLeagueIds = [];
            let liveContestIds = [];
            for(let k=0;k<liveContests.length;k++){
                let liveCon =  liveContests[k]._leagueContestId
                for(let a=0; a<liveCon.length;a++){
                    liveLeagueIds.push(liveCon[a]._leagueId)
                    liveContestIds.push(liveCon[a]._id)
                }
            }

            var liveLeagueData = await FootBallLeagueSchedule.aggregate([
                {$match : {_id : {$in : liveLeagueIds}}}
            ])
            .sort({startTime : 1})
            .collation({ locale: "en" });

            for(let d=0;d<liveLeagueData.length;d++){
                liveLeagueData[d].contestCount = await FootBallLeagueContest.countDocuments({_leagueId : liveLeagueData[d]._id, _id : {$in : liveContestIds}})
            }
            
            let upComingContests = await EnrollFootBallLeagueContest.aggregate([
                {
                    $lookup : {
                        from: 'footballleaguecontests',
                        localField: '_leagueContestId',
                        foreignField: '_id',
                        as: '_leagueContestId',
                    }
                },
               {$match :  {_userId, "_leagueContestId.status" : {$in :[constants.LEAGUE_STATUS.ENROLL, constants.LEAGUE_STATUS.CONFIRMED]}}},
               {
                $project : {
                    "_leagueContestId._leagueId" : 1,
                    "_leagueContestId._id" : 1,
                }
               }
            ])

            let upComingLeagueIds = [];
            let upComingContestIds = [];
            for(let j=0;j<upComingContests.length;j++){
                let upComingCon =  upComingContests[j]._leagueContestId
                for(let b=0; b<upComingCon.length;b++){
                    upComingLeagueIds.push(upComingCon[b]._leagueId)
                    upComingContestIds.push(upComingCon[b]._id)
                }
            }
            
            var upComingLeagueData = await FootBallLeagueSchedule.aggregate([
                {$match : {_id : {$in : upComingLeagueIds}}}
            ])
            .sort({startTime : 1})
            .collation({ locale: "en" });

            for(let e=0;e<upComingLeagueData.length;e++){
                upComingLeagueData[e].contestCount = await FootBallLeagueContest.countDocuments({_leagueId : upComingLeagueData[e]._id, _id : {$in : upComingContestIds}})
            }
            
            let pastContests = await EnrollFootBallLeagueContest.aggregate([
                {
                    $lookup : {
                        from: 'footballleaguecontests',
                        localField: '_leagueContestId',
                        foreignField: '_id',
                        as: '_leagueContestId',
                    }
                },
               {$match :  {_userId, "_leagueContestId.status" : {$in :[constants.LEAGUE_STATUS.CLOSED, constants.LEAGUE_STATUS.CANCELLED]}}},
               {
                $project : {
                    "_leagueContestId._leagueId" : 1,
                    "_leagueContestId._id" : 1,
                }
               }
            ])
            
            let pastLeagueIds = [];
            let pastContestIds = [];
            for(let i=0;i<pastContests.length;i++){
                let pastCon = pastContests[i]._leagueContestId
                for(let c=0;c<pastCon.length;c++){
                    pastLeagueIds.push(pastCon[c]._leagueId)
                    pastContestIds.push(pastCon[c]._id)
                }
            }

            var pastLeagueData = await FootBallLeagueSchedule.aggregate([
                {$match : {$and :[{startTime :{$lte : currentTimeStamp}},{_id : {$in: pastLeagueIds}}]}}
            ])
            .sort({startTime : -1})
            .collation({ locale: "en" });

            for(let f=0;f<pastLeagueData.length;f++){
                pastLeagueData[f].contestCount = await FootBallLeagueContest.countDocuments({_leagueId : pastLeagueData[f]._id, _id : {$in : pastContestIds}})
            }
            
            res.status(200).send({
                status: constants.STATUS_CODE.SUCCESS,
                message: Lang.responseIn("SOCCER.LEAGUE_LIST", req.headers.lang),
                error: false,
                data: {liveLeagueData, upComingLeagueData, pastLeagueData}
                });
                // logService.responseData(req, {liveLeagueData, upComingLeagueData, pastLeagueData});
            
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

/**
 * Get live past league contest list for users
 * @function
 * @param {ObjectId} _leagueId - _leagueId for which league user wants to create a contest. 
 * @param {ObjectId} _userId - _userId of a logged in user.
 * @returns {Object} pastLeagueContestData - Returns pastLeagueContestData with pagination.
 * It will return an array of contests in which user has participated and which have been cancelled or closed.
 */
exports.getPastFootBallEnrolledLeagueContests =  async (req, res) => {
    try {
        let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());            
        let _leagueId = req.params._leagueId;
        const _userId = req.user._id

        const pageOptions = {
            page: parseInt(req.query.page) || constants.PAGE,
            limit: parseInt(req.query.limit) || constants.LIMIT
        }

        let pastLeagueContestDataTotal = await EnrollFootBallLeagueContest.aggregate([
            {
                $lookup : {
                    from: 'footballleaguecontests',
                    localField: '_leagueContestId',
                    foreignField: '_id',
                    as: '_leagueContestId',
                }
            },
            { $unwind: '$_leagueContestId' },
            {$match : { $and: [{_userId }, {"_leagueContestId._leagueId": mongoose.Types.ObjectId(_leagueId)}, {"_leagueContestId.status": {$in : [constants.LEAGUE_STATUS.CANCELLED, constants.LEAGUE_STATUS.CLOSED]}}]}},
        ])
        let total = pastLeagueContestDataTotal.length;

        var pastLeagueContestData = await EnrollFootBallLeagueContest.aggregate([
            {
                $lookup : {
                    from: 'footballleaguecontests',
                    localField: '_leagueContestId',
                    foreignField: '_id',
                    as: '_leagueContestId',
                }
            },
            { $unwind: '$_leagueContestId' },
            { $addFields: 
                { 
                    currentTimeStamp,
                    participatedIn: constants.USER.PARTICIPANT,
                    participantCount : constants.DEFAULT_NUMBER,
                    rank : constants.USER_LEAGUE_STATUS.NOT_ATTENDED,
                    totalPointsEarned : constants.USER_LEAGUE_STATUS.NOT_ATTENDED,
                    leaderBoardStatus: constants.USER_LEAGUE_STATUS.LEADERBOARD_NOT_GENERATED,
                    spotLeft: {$subtract: [ "$_leagueContestId.maxParticipants", "$_leagueContestId.currentParticipants" ]}
                }
            },
            {$match : { $and: [{_userId }, {"_leagueContestId._leagueId": mongoose.Types.ObjectId(_leagueId)}, {"_leagueContestId.status": {$in : [constants.LEAGUE_STATUS.CANCELLED, constants.LEAGUE_STATUS.CLOSED]}}]}},
        ])
        .sort({"_leagueContestId.startTime": -1})
        .skip((pageOptions.page - 1) * pageOptions.limit)
        .limit(pageOptions.limit)
        .collation({ locale: "en" });

        for(let a=0; a<pastLeagueContestData.length;a++){
            let count = await EnrollFootBallLeagueContest.countDocuments({_userId , _leagueContestId : pastLeagueContestData[a]._leagueContestId._id})
            pastLeagueContestData[a].participantCount = count;
            let leaderBoard = await LeagueWinnerListWithPrizeAmount.findOne({_leagueContestId : mongoose.Types.ObjectId(pastLeagueContestData[a]._leagueContestId._id), _leagueTeamId : pastLeagueContestData[a]._leagueTeamId, _userId })
            if(leaderBoard){
                pastLeagueContestData[a].leaderBoardStatus = constants.USER_LEAGUE_STATUS.LEADERBOARD_GENERATED;
                pastLeagueContestData[a].rank = leaderBoard.rank;
                pastLeagueContestData[a].totalPointsEarned = leaderBoard.totalPointsEarned;
            }
            let pastBoosterAvailable = pastLeagueContestData[a]._leagueContestId.boosters
            for(let b=0;b<pastBoosterAvailable.length;b++){
                let boosterDetails = await GlobalBoosterSettings.findOne({_id : pastBoosterAvailable[b]._boosterId});
                pastBoosterAvailable[b].boosterName = boosterDetails.boosterName;
                pastBoosterAvailable[b].boosterType = boosterDetails.boosterType;
            }
            let pastBooster = pastLeagueContestData[a].appliedBoosters
            for(let c=0;c<pastBooster.length;c++){
                let boosterDetails = await GlobalBoosterSettings.findOne({_id : pastBooster[c]._boosterId});
                pastBooster[c].boosterName = boosterDetails.boosterName;
                pastBooster[c].boosterType = boosterDetails.boosterType;
            }
        }
            var page = pageOptions.page ;
            var limit = pageOptions.limit;

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.CONTEST_LIST", req.headers.lang),
            error: false,
            data: {pastLeagueContestData, page, limit, total}
            });
            // logService.responseData(req, {pastLeagueContestData, page, limit, total});

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

/**
 * Get all enrolled football league details
 * @function
 * @param {ObjectId} _leagueId - _leagueId for which league user wants to create a contest. 
 * @param {ObjectId} _userId - _userId of a logged in user.
 * @returns {Object} leagueContestData - Returns leagueContestData with pagination.
 * It will return an array of contests in which user has participated and which are in enroll, confirm or open stats.
 */
exports.getEnrolledFootBallLeagueContestDetails =  async (req, res) => {
    try {
            let _leagueId = req.params._leagueId;
            const _userId = req.user._id;
            let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            let field, value; 
            // const search = req.query.q ? req.query.q : ''; // for searching
            if (req.query.sortBy) {
                const parts = req.query.sortBy.split(':');
                field = parts[0];
                parts[1] ==='desc' ? value=-1 : value= 1;
            }else{
                field = "_leagueContestId.startTime",
                value = 1;
            }
            const pageOptions = {
                page: parseInt(req.query.page) || constants.PAGE,
                limit: parseInt(req.query.limit) || constants.LIMIT
            }
            
            let totalLeagueContestData = await EnrollFootBallLeagueContest.aggregate([
                {
                    $lookup : {
                        from: 'footballleaguecontests',
                        localField: '_leagueContestId',
                        foreignField: '_id',
                        as: '_leagueContestId',
                    }
                },
                { $unwind: '$_leagueContestId' },
                {$match : {$and: [{_userId }, {"_leagueContestId._leagueId" : mongoose.Types.ObjectId(_leagueId)}, {"_leagueContestId.status": {$in: [constants.LEAGUE_STATUS.ENROLL, constants.LEAGUE_STATUS.OPEN, constants.LEAGUE_STATUS.CONFIRMED]}}]}},
            ])
            let total = totalLeagueContestData.length;

            var leagueContestData = await EnrollFootBallLeagueContest.aggregate([
                {
                    $lookup : {
                        from: 'footballleaguecontests',
                        localField: '_leagueContestId',
                        foreignField: '_id',
                        as: '_leagueContestId',
                    }
                },
                { $unwind: '$_leagueContestId' },
                { $addFields: 
                    { 
                        currentTimeStamp,
                        participatedIn: constants.USER.PARTICIPANT,
                        participantCount : constants.DEFAULT_NUMBER,
                        rank : constants.USER_LEAGUE_STATUS.NOT_ATTENDED,
                        totalPointsEarned : constants.USER_LEAGUE_STATUS.NOT_ATTENDED,
                        leaderBoardStatus: constants.USER_LEAGUE_STATUS.LEADERBOARD_NOT_GENERATED,
                        spotLeft: {$subtract: [ "$_leagueContestId.maxParticipants", "$_leagueContestId.currentParticipants" ]}
                    }
                },
                {$match : {$and: [{_userId }, {"_leagueContestId._leagueId" : mongoose.Types.ObjectId(_leagueId)}, {"_leagueContestId.status": {$in: [constants.LEAGUE_STATUS.ENROLL, constants.LEAGUE_STATUS.OPEN, constants.LEAGUE_STATUS.CONFIRMED]}}]}},
            ])
            .sort({[field]:value})
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

            var page = pageOptions.page ;
            var limit = pageOptions.limit;

            for(let a=0; a<leagueContestData.length;a++){
                let count = await EnrollFootBallLeagueContest.countDocuments({_userId , _leagueContestId : leagueContestData[a]._leagueContestId._id})
                leagueContestData[a].participantCount = count;
                let leaderBoard = await LeagueWinnerListWithPrizeAmount.findOne({_leagueContestId : mongoose.Types.ObjectId(leagueContestData[a]._leagueContestId._id), _userId })
                if(leaderBoard){
                    leagueContestData[a].leaderBoardStatus = constants.USER_LEAGUE_STATUS.LEADERBOARD_GENERATED;
                    leagueContestData[a].rank = leaderBoard.rank;
                    leagueContestData[a].totalPointsEarned = leaderBoard.totalPointsEarned;
                }
                let boosterAvailable = leagueContestData[a]._leagueContestId.boosters
                for(let j=0;j<boosterAvailable.length;j++){
                    let boosterDetails = await GlobalBoosterSettings.findOne({_id : boosterAvailable[j]._boosterId});
                    boosterAvailable[j].boosterName = boosterDetails.boosterName;
                    boosterAvailable[j].boosterType = boosterDetails.boosterType;
                }
                let booster = leagueContestData[a].temporaryBoosters
                for(let k=0;k<booster.length;k++){
                    let boosterDetails = await GlobalBoosterSettings.findOne({_id : booster[k]._boosterId});
                    booster[k].boosterName = boosterDetails.boosterName;
                    booster[k].boosterType = boosterDetails.boosterType;
                }
            }

            res.status(200).send({
                status: constants.STATUS_CODE.SUCCESS,
                message: Lang.responseIn("SOCCER.CONTEST_FOUND", req.headers.lang),
                error: false,
                data: {leagueContestData, total, page, limit}
            })
            // logService.responseData(req, {leagueContestData, total, page, limit});
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

/**
 * Create user League contest
 * @function
 * @param {ObjectId} _leagueId - _leagueId for which league user wants to create a contest. 
 * @param {ObjectId} _createdBy - .
 * @param {String} contestName - .
 * @param {String} startTime - It will be the match start time.
 * @param {String} enrollStartTime - Enroll start time when you want to start enrollment for that contest. In this case enrollment starttime will be the time of ceation of this contest.
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
 * @returns {Object} leagueContestData - Returns leagueContestData data.
 * Will check league with _leagueId first.
 * If league exist then we will check that it's must be 2 hr or more from time of league is going to start.
 * Then It will check all team validation which we have in this function.
 * Team format, Players according to the formations and from the league, Player limit, Boosters, Credit points, Players from same team.
 * After doing all the validation it will create a contest, user will get joined with his team and money will be deducted from his wallet.
 */
exports.createUserLeagueContest = async (req, res) => {
    var session = await mongoose.startSession({
        readPreference: { mode: 'primary' }
      });
      session.startTransaction();
    try {        
        const user = req.user;
        const _userId = req.user._id;

        let reqdata = req.body
        let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        let _leagueId = reqdata._leagueId;
        let boosters = reqdata.boosters;
        
        let globalTeamSettings = await GlobalTeamSettings.findOne();
        if(!globalTeamSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_TEAM_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

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

        let teamIdsArr = await commonFunction.leagueTeamArr(_leagueId);
        
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

        let _boosterId, boosterCount, invincibles;
        
        if(reqdata._boosterId){
            _boosterId = reqdata._boosterId;
            var globalBoosterSettings = await GlobalBoosterSettings.findOne({_id : _boosterId});
            if(!globalBoosterSettings){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_SETTINGS_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
    
            for(let i=0;i<boosters.length;i++){
                if(_boosterId === (boosters[i]._boosterId).toString() && boosters[i].boosterCount < 1){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.BOOSTER_NOT_AVAILABLE", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }else if(_boosterId === (boosters[i]._boosterId).toString()){
                    boosterCount = boosters[i].boosterCount;
                }
            }
            invincibles = reqdata.invincibles;

            if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.INVINCIBLES){
                if(!invincibles){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.BOOSTER_IDS_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                if(invincibles.length !== constants.BOOSTER_IDS_LENGTH.INVINCIBLES){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.BOOSTER_IDS_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                duplicateIds = await commonFunction.findDuplicates(invincibles)
                if(duplicateIds>0){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.DUPLICATE_IDS_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                for(let a=0;a<invincibles.length;a++){
                    let player = await commonFunction.getPlayer(invincibles[a], teamIdsArr);
                    if(player == null){
                        return res.status(400).send({
                            status:constants.STATUS_CODE.FAIL,
                            message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                            error:true,
                            data:{}
                        })
                    }
                }
            }
        }else{
            _boosterId = null;
            boosterCount = null;
        }
        
        let maxParticipants = reqdata.maxParticipants;
        let minParticipants = reqdata.minParticipants;

        let startTime = isLeagueExist.startTime;
        let dayInMilisec = globalGeneralSettings.dayInMilisec;
        let diffInDays =  (startTime - currentTimeStamp)/dayInMilisec;

        let hourInMilisec = globalGeneralSettings.hourInMilisec;
        var diffInHours =  (startTime - currentTimeStamp)/hourInMilisec;

        //Uncomment this when going live
        
        if(diffInDays>globalGeneralSettings.leagueMaxStartDay || diffInHours<globalGeneralSettings.privateContestMinCreateTime){
            return   res.status(400).send({
              status: constants.STATUS_CODE.VALIDATION,
              message: Lang.responseIn("SOCCER.PRIVATE_CONTEST_CREATE_TIME_ERROR", req.headers.lang),
              error: true,
              data: {},
            });
        }    

        let enrollStartTime = dateFormat.setCurrentTimestamp();
        if(startTime < enrollStartTime){
            return res.status(400).send({
                status: constants.STATUS_CODE.VALIDATION,
                message: Lang.responseIn("SOCCER.CONTEST_ENROLL_TIME_ERROR", req.headers.lang),
                error: true,
                data: {},
            });
        }
        

       let enrollEndTime = startTime - globalGeneralSettings.leagueEnrollEndTime;

    //    let enrollEndTime = currentTimeStamp + (constants.ONE_DAY_MILISEC * 50)

       let entryFee = reqdata.entryFee;

        let totalBalance = user.referralBalance + user.winningBalance + user.depositBalance;
        if(totalBalance < entryFee){
            return res.status(402).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.NOT_ENOUGH_BALANCE", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let goalKeeperCount = reqdata.goalKeeperCount;
        let defenderCount = reqdata.defenderCount;
        let midFielderCount = reqdata.midFielderCount;
        let attackerCount = reqdata.attackerCount;

        let noOfGoalKeeper = reqdata.goalKeeper;
        let noOfDefender = reqdata.defender;
        let noOfMidFielder = reqdata.midFielder;
        let noOfAttacker = reqdata.attacker;

        let totalPlayer = noOfGoalKeeper.length + noOfDefender.length + noOfMidFielder.length + noOfAttacker.length
        
        if(totalPlayer != reqdata.playerLimit){
            
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_VALIDATION", req.headers.lang),
                error:true,
                data:{}
            })
        }else if(noOfGoalKeeper.length !== goalKeeperCount){
            
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                error:true,
                data:{}
            })

        }else if(noOfDefender.length !== defenderCount){
            
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                error:true,
                data:{}
            })

        }else if(noOfMidFielder.length !== midFielderCount){
            
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                error:true,
                data:{}
            })

        }else if(noOfAttacker.length !== attackerCount){
            
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                error:true,
                data:{}
            })

        }

        let captain, viceCaptain;
        let totalRatings = 0;
        let captainCount = 0;
        let viceCaptainCount = 0;
        
        let goalPlayingCount = 0;
        let defPlayingCount = 0;
        let midPlayingCount = 0;
        let attPlayingCount = 0;
        let playerArr = [];

        for(let i=0;i<noOfGoalKeeper.length;i++){
            let gkPlayerRating = await commonFunction.getPlayerRatings(noOfGoalKeeper[i].player, teamIdsArr, constants.PLAYER_POSITION.GOAL_KEEPER);
            if(gkPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfGoalKeeper[i].playerRole == constants.PLAYER_ROLE.PLAYING){
                goalPlayingCount++;
            }
            if((noOfGoalKeeper[i].isCaptain == constants.IS_CAPTAIN.YES || noOfGoalKeeper[i].isViceCaptain == constants.IS_VICE_CAPTAIN.YES) && noOfGoalKeeper[i].playerRole == constants.PLAYER_ROLE.SUBSTITUTION){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.SUBSTITUTION_PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfGoalKeeper[i].isCaptain == constants.IS_CAPTAIN.YES && noOfGoalKeeper[i].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfGoalKeeper[i].isCaptain == constants.IS_CAPTAIN.YES){
                captainCount = captainCount + 1;
                captain = noOfGoalKeeper[i].player;
            }
            if(noOfGoalKeeper[i].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                viceCaptainCount = viceCaptainCount + 1;
                viceCaptain = noOfGoalKeeper[i].player;
            }
            totalRatings = totalRatings + gkPlayerRating.playerRating;
            playerArr.push(mongoose.Types.ObjectId(noOfGoalKeeper[i].player));
        }

        if(goalPlayingCount != globalTeamSettings.minNoOfGoalKeeper || noOfGoalKeeper.length < 2){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.GOAL_PLAYING_VALIDATION", req.headers.lang),
                error:true,
                data:{}
            })
        }

        for(let j=0;j<noOfDefender.length;j++){
            let dPlayerRating = await commonFunction.getPlayerRatings(noOfDefender[j].player, teamIdsArr, constants.PLAYER_POSITION.DEFENDER);
            if(dPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(noOfDefender[j].playerRole == constants.PLAYER_ROLE.PLAYING){
                defPlayingCount++;
            }

            if((noOfDefender[j].isCaptain == constants.IS_CAPTAIN.YES || noOfDefender[j].isViceCaptain == constants.IS_VICE_CAPTAIN.YES) && noOfDefender[j].playerRole == constants.PLAYER_ROLE.SUBSTITUTION){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.SUBSTITUTION_PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfDefender[j].isCaptain == constants.IS_CAPTAIN.YES && noOfDefender[j].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfDefender[j].isCaptain == constants.IS_CAPTAIN.YES){
                captainCount = captainCount + 1;
                captain = noOfDefender[j].player;
            }
            if(noOfDefender[j].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                viceCaptainCount = viceCaptainCount + 1;
                viceCaptain = noOfDefender[j].player;
            }
            totalRatings = totalRatings + dPlayerRating.playerRating;
            playerArr.push(mongoose.Types.ObjectId(noOfDefender[j].player));
        }

        for(let k=0;k<noOfMidFielder.length;k++){
            let mfPlayerRating = await commonFunction.getPlayerRatings(noOfMidFielder[k].player, teamIdsArr, constants.PLAYER_POSITION.MID_FIELDER);
            if(mfPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(noOfMidFielder[k].playerRole == constants.PLAYER_ROLE.PLAYING){
                midPlayingCount++;
            }

            if((noOfMidFielder[k].isCaptain == constants.IS_CAPTAIN.YES || noOfMidFielder[k].isViceCaptain == constants.IS_VICE_CAPTAIN.YES) && noOfMidFielder[k].playerRole == constants.PLAYER_ROLE.SUBSTITUTION){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.SUBSTITUTION_PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfMidFielder[k].isCaptain == constants.IS_CAPTAIN.YES && noOfMidFielder[k].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfMidFielder[k].isCaptain == constants.IS_CAPTAIN.YES){
                captainCount = captainCount + 1;
                captain = noOfMidFielder[k].player;
            }
            if(noOfMidFielder[k].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                viceCaptainCount = viceCaptainCount + 1;
                viceCaptain = noOfMidFielder[k].player;
            }
            totalRatings = totalRatings + mfPlayerRating.playerRating;
            playerArr.push(mongoose.Types.ObjectId(noOfMidFielder[k].player));
        }

        for(let l=0;l<noOfAttacker.length;l++){
            let aPlayerRating = await commonFunction.getPlayerRatings(noOfAttacker[l].player, teamIdsArr, constants.PLAYER_POSITION.ATTACKER);
            if(aPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(noOfAttacker[l].playerRole == constants.PLAYER_ROLE.PLAYING){
                attPlayingCount++;
            }

            if((noOfAttacker[l].isCaptain == constants.IS_CAPTAIN.YES || noOfAttacker[l].isViceCaptain == constants.IS_VICE_CAPTAIN.YES) && noOfAttacker[l].playerRole == constants.PLAYER_ROLE.SUBSTITUTION){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.SUBSTITUTION_PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfAttacker[l].isCaptain == constants.IS_CAPTAIN.YES && noOfAttacker[l].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_CAPTAIN_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            if(noOfAttacker[l].isCaptain == constants.IS_CAPTAIN.YES){
                captainCount = captainCount + 1;
                captain = noOfAttacker[l].player;
            }
            if(noOfAttacker[l].isViceCaptain == constants.IS_VICE_CAPTAIN.YES){
                viceCaptainCount = viceCaptainCount + 1;
                viceCaptain = noOfAttacker[l].player;
            }
            totalRatings = totalRatings + aPlayerRating.playerRating;
            playerArr.push(mongoose.Types.ObjectId(noOfAttacker[l].player));
        }

        if(captainCount !== 1){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.PLAYER_CAPTAIN_LIMIT_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }

        if(viceCaptainCount !== 1){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.PLAYER_VICE_CAPTAIN_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }

        // let playerData = await FootBallPlayerName.find({_id :{$in :playerArr}})
        let playingCount = goalPlayingCount + defPlayingCount + midPlayingCount + attPlayingCount;
        let leagueTeamCount = await commonFunction.leagueTeamCount(playerArr);
        
        let maxPlayer, minPlayer, credit, teamSelectionMessage;
        if(reqdata.teamFormat == constants.TEAM_FORMAT.ELEVEN){

            if(playingCount !== reqdata.teamFormat){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.ELEVEN_TEAM_PLAYING_SUCCESS", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(defPlayingCount < globalTeamSettings.minNoOfDefender || defPlayingCount > globalTeamSettings.maxNoOfDefender){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.DEFENDER_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(midPlayingCount < globalTeamSettings.minNoOfMidfielders || midPlayingCount > globalTeamSettings.maxNoOfMidfielders){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.MID_FIELDER_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(attPlayingCount < globalTeamSettings.minNoOfStrikers || attPlayingCount > globalTeamSettings.maxNoOfStrikers){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.ATTACKER_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            // minPlayer = globalTeamSettings.minPlayersFromSameTeamInEleven;
            maxPlayer = globalTeamSettings.maxPlayersFromSameTeamInEleven;
            credit = globalTeamSettings.creditToElevenTeamInLeague;
            teamSelectionMessage = Lang.responseIn("SOCCER.TEAM_SELECTION_ELEVEN_ERROR", req.headers.lang);
        }else if(reqdata.teamFormat == constants.TEAM_FORMAT.THREE){
            
            if(playingCount !== reqdata.teamFormat){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.THREE_TEAM_PLAYING_SUCCESS", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(defenderCount > 0 && defPlayingCount > 1 ){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.DEFENDER_THREE_FORMAT_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(midFielderCount > 0 && midPlayingCount > 1 ){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.MID_FIELDER_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            if(attackerCount > 0 && attPlayingCount > 1){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.ATTACKER_PLAYING_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            // minPlayer = globalTeamSettings.minPlayersFromSameTeamInThree;
            maxPlayer = globalTeamSettings.maxPlayersFromSameTeamInThree;
            credit = globalTeamSettings.creditToThreeTeamInLeague;
            teamSelectionMessage = Lang.responseIn("SOCCER.TEAM_SELECTION_THREE_ERROR", req.headers.lang);
        }else{
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_FORMAT", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        for(let x=0;x<leagueTeamCount.length;x++){
            if(leagueTeamCount[x].count > maxPlayer){
    
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: teamSelectionMessage,
                    error:true,
                    data:{}
                })
            }
        }
        if(totalRatings > credit ){

            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_RATINGS_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let referralCode = commonFunction.generateRandomReferralCode();
        const newFootBallLeagueContest = new FootBallLeagueContest({
            _createdBy : _userId,
            userName : user.userName,
            _leagueId : _leagueId,
            contestName: reqdata.contestName,
            startTime : startTime,
            enrollStartTime : enrollStartTime,
            // enrollStartTime : startTime,                            // keep enrollStartTime when going live
            enrollEndTime : enrollEndTime,
            entryFee: entryFee,
            maxParticipants: maxParticipants,
            minParticipants: minParticipants,
            totalPrize: reqdata.totalPrize,
            contestVisibility: constants.CONTEST_VISIBILITY.PRIVATE,
            contestType: reqdata.contestType,
            optionType: reqdata.optionType,
            teamFormat: reqdata.teamFormat,
            playerLimit : reqdata.playerLimit,
            referralCode : referralCode,
            createdAt: dateFormat.setCurrentTimestamp(),
            updatedAt: dateFormat.setCurrentTimestamp()
          });
      
        for(let i=0;i<boosters.length;i++){
            newFootBallLeagueContest.boosters = newFootBallLeagueContest.boosters.concat({_boosterId : boosters[i]._boosterId, boosterCount : boosters[i].boosterCount});
        }
        // let footBallLeagueContestData = await newFootBallLeagueContest.save();
        let footBallLeagueContestData = await newFootBallLeagueContest.save({session});
    
        let footBallPrizeBreakDowns = req.body.footBallPrizeBreakDowns;
        for(let k=0;k<footBallPrizeBreakDowns.length;k++){
          let newFootBallLeaguePrizeBreakDown = new FootBallLeaguePrizeBreakDowns({
            _leagueContestId: footBallLeagueContestData._id,
            from: footBallPrizeBreakDowns[k].from,
            to: footBallPrizeBreakDowns[k].to,
            amount: footBallPrizeBreakDowns[k].amount,
            createdAt: dateFormat.setCurrentTimestamp(),
            updatedAt: dateFormat.setCurrentTimestamp()
          })
        //   var footBallPrizeBreakDownsData = await newFootBallLeaguePrizeBreakDown.save();
          var footBallPrizeBreakDownsData = await newFootBallLeaguePrizeBreakDown.save({session});
        }

        let newUserTeam = new UserLeagueFootBallTeam({
            _userId ,
            _leagueContestId : footBallLeagueContestData._id,
            _leagueId,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp()
        })
        // let userTeamData = await newUserTeam.save();
        let userTeamData = await newUserTeam.save({session});

        // let isTeamExist = await UserLeagueFootBallTeam.findOne({_id : userTeamData._id, _userId, _leagueContestId : footBallLeagueContestData._id, _leagueId})

        // if(!isTeamExist){
        //     return res.status(400).send({
        //         status:constants.STATUS_CODE.FAIL,
        //         message: Lang.responseIn("SOCCER.CONTEST_ENROLL_TEAM_ERROR", req.headers.lang),
        //         error:true,
        //         data:{}
        //     })
        // }


        let weekNumber = 1;                              //Uncomment this when going live
        // let weekNumber = await commonFunction.getCurrentGameWeek(_leagueId);

        let playerIds = []; 
        let substitutePlayerIds = [];

        let checkPlayerRole = (playerRole, _playerId) => {
            
            playerIds.push(_playerId)
            
            if(playerRole == constants.PLAYER_ROLE.SUBSTITUTION){
                substitutePlayerIds.push(_playerId)
            }
        }

        for(let i=0;i<noOfGoalKeeper.length;i++){

            let _playerId = noOfGoalKeeper[i].player;
            
            let goalKeeperData = await FootBallPlayerName.findOne({_id: _playerId, playerPosition : constants.PLAYER_POSITION.GOAL_KEEPER})
            if(!goalKeeperData){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let playerRole = noOfGoalKeeper[i].playerRole;

            await checkPlayerRole(playerRole, _playerId);

            let selectTeamPlayer = new SelectLeagueFootBallTeamPlayer({
                gameWeek : weekNumber,
                _leagueId,
                gameTeamId : goalKeeperData.teamId,
                _leagueTeamId : userTeamData._id,
                _playerId,
                teamName : goalKeeperData.teamName,
                gamePlayerId : goalKeeperData.playerId,
                playerName : goalKeeperData.playerName,
                playerPosition : constants.PLAYER_POSITION.GOAL_KEEPER,
                playerRating : goalKeeperData.playerRating,
                playerRole,
                isCaptain : noOfGoalKeeper[i].isCaptain,
                isViceCaptain : noOfGoalKeeper[i].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }
        
        for(let j=0;j<noOfDefender.length;j++){

            let _playerId = noOfDefender[j].player;

            let defenderData = await FootBallPlayerName.findOne({_id: _playerId, playerPosition : constants.PLAYER_POSITION.DEFENDER})
            if(!defenderData){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let playerRole = noOfDefender[j].playerRole;

            await checkPlayerRole(playerRole, _playerId);

            let selectTeamPlayer = new SelectLeagueFootBallTeamPlayer({
                gameWeek : weekNumber,
                _leagueId,
                gameTeamId : defenderData.teamId,
                _leagueTeamId : userTeamData._id,
                _playerId,
                teamName : defenderData.teamName,
                gamePlayerId : defenderData.playerId,
                playerName : defenderData.playerName,
                playerPosition : constants.PLAYER_POSITION.DEFENDER,
                playerRating : defenderData.playerRating,
                playerRole,
                isCaptain : noOfDefender[j].isCaptain,
                isViceCaptain : noOfDefender[j].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }
        
        for(let k=0;k<noOfMidFielder.length;k++){

            let _playerId = noOfMidFielder[k].player;

            let midfielderData = await FootBallPlayerName.findOne({_id: _playerId, playerPosition : constants.PLAYER_POSITION.MID_FIELDER})
            if(!midfielderData){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
                
            }

            let playerRole = noOfMidFielder[k].playerRole;

            await checkPlayerRole(playerRole, _playerId);

            let selectTeamPlayer = new SelectLeagueFootBallTeamPlayer({
                gameWeek : weekNumber,
                _leagueId,
                gameTeamId : midfielderData.teamId,
                _leagueTeamId : userTeamData._id,
                _playerId,
                teamName : midfielderData.teamName,
                gamePlayerId : midfielderData.playerId,
                playerName : midfielderData.playerName,
                playerPosition : constants.PLAYER_POSITION.MID_FIELDER,
                playerRating : midfielderData.playerRating,
                playerRole,
                isCaptain : noOfMidFielder[k].isCaptain,
                isViceCaptain : noOfMidFielder[k].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }
        
        for(let l=0;l<noOfAttacker.length;l++){
            
            let _playerId = noOfAttacker[l].player;

            let attackerData = await FootBallPlayerName.findOne({_id: _playerId, playerPosition : constants.PLAYER_POSITION.ATTACKER})
            if(!attackerData){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let playerRole = noOfAttacker[l].playerRole;

            await checkPlayerRole(playerRole, _playerId);

            let selectTeamPlayer = new SelectLeagueFootBallTeamPlayer({
                gameWeek : weekNumber,
                _leagueId,
                gameTeamId : attackerData.teamId,
                _leagueTeamId : userTeamData._id,
                _playerId,
                teamName : attackerData.teamName,
                gamePlayerId : attackerData.playerId,
                playerName : attackerData.playerName,
                playerPosition : constants.PLAYER_POSITION.ATTACKER,
                playerRating : attackerData.playerRating,
                playerRole,
                isCaptain : noOfAttacker[l].isCaptain,
                isViceCaptain : noOfAttacker[l].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }    
       
        var walletHistoryObj = {
            _userId,
            _teamId: userTeamData._id,
            _leagueContestId : footBallLeagueContestData._id,
            leagueContestName : reqdata.contestName,
            amount : entryFee,
            competitionType : constants.COMPETITION_TYPE.LEAGUE,
            transactionType : constants.TRANSACTION_TYPE.MINUS,
            transactionFor : constants.TRANSACTION_FOR.PARTICIPATE,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp()
        }
        
        let enrollFootBallLeagueContest = new EnrollFootBallLeagueContest({
            _userId,
            userName: user.userName,
            _leagueId,
            _leagueContestId : footBallLeagueContestData._id,
            _leagueTeamId : userTeamData._id,
            createdAt: dateFormat.setCurrentTimestamp(),
            updatedAt: dateFormat.setCurrentTimestamp()
        })

        // let playerIds = await commonFunction.findLeagueTeamPlayersIds(userTeamData._id, weekNumber);
        console.log(playerIds, 'playerIds');

        // let substitutePlayerIds = await commonFunction.findLeagueTeamSubstitutePlayersIds(userTeamData._id, weekNumber);
        console.log(substitutePlayerIds, 'substitutePlayerIds');

        if(reqdata._boosterId){
            if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.OVERHAUL){
                enrollFootBallLeagueContest.temporaryBoosters = enrollFootBallLeagueContest.temporaryBoosters.concat({_boosterId, boosterCount, teamIds : userTeamData._id, playerIds : playerIds, weekNumber});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.LOAN_TRANSFER){
                enrollFootBallLeagueContest.temporaryBoosters = enrollFootBallLeagueContest.temporaryBoosters.concat({_boosterId, boosterCount, teamIds : userTeamData._id, playerIds : playerIds, weekNumber});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.BENCH_SUPPORT){
                enrollFootBallLeagueContest.temporaryBoosters = enrollFootBallLeagueContest.temporaryBoosters.concat({_boosterId, boosterCount, teamIds : userTeamData._id, playerIds : substitutePlayerIds, weekNumber});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.INVINCIBLES){
                enrollFootBallLeagueContest.temporaryBoosters = enrollFootBallLeagueContest.temporaryBoosters.concat({_boosterId, boosterCount, teamIds : userTeamData._id, playerIds : invincibles, weekNumber});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.CAPTAIN_BOOST){
                enrollFootBallLeagueContest.temporaryBoosters = enrollFootBallLeagueContest.temporaryBoosters.concat({_boosterId, boosterCount, teamIds : userTeamData._id, playerIds : captain, weekNumber});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.VICE_CAPTAIN_BOOST){
                enrollFootBallLeagueContest.temporaryBoosters = enrollFootBallLeagueContest.temporaryBoosters.concat({_boosterId, boosterCount, teamIds : userTeamData._id, playerIds : viceCaptain, weekNumber});
            }
        }
        // let enrollFootBallLeagueContestData = await enrollFootBallLeagueContest.save();
        let enrollFootBallLeagueContestData = await enrollFootBallLeagueContest.save({session});
        let updatedLeagueData, badgeUpdated = 0;
        if(enrollFootBallLeagueContestData){

            updatedLeagueData = await FootBallLeagueContest.updateOne({_id: footBallLeagueContestData._id, _leagueId : mongoose.Types.ObjectId(_leagueId)},
            {
                $inc : {currentParticipants : 1}
            },{session});
            
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

        await session.commitTransaction();
        session.endSession();
        
        if(badgeUpdated == 1){
            commonFunction.sendNotificationToFollower(user, constants.NOTIFICATION_STATUS.LEVEL_UP)
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
            
            let userWallets = await commonFunction.getUserLatestBalance(_userId)
            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.CONTEST_CREATE_SUCCESS", req.headers.lang),
            error: false,
            data: {leagueContestData, userWallets}
            });
            logService.responseData(req, {leagueContestData, userWallets});
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

/**
 * Get working LeaderBoard
 * @function
 * @param {ObjectId} _leagueContestId - _leagueContestId of league contest id.
 * @param {ObjectId} _leagueTeamId - _leagueTeamId of user participated in contest with particular team id.
 * @returns {Object} {myRank, participatedUsers, page, limit, total} - Returns myRank and other winner list with pagination in particular week.
 * It will show latest completed week running leaderboard
 */
exports.getWorkingLeaderBoard = async (req, res) => {

    try {
        var _leagueContestId = req.params._leagueContestId;
        var _leagueTeamId = req.params._leagueTeamId;

            var field, value; 
            if (req.query.sortBy) {
                const parts = req.query.sortBy.split(':');
                field = parts[0];
                parts[1] ==='desc' ? value=-1 : value= 1;
            }else{
                field = "rank",
                value = 1;
            }
            const pageOptions = {
                page: parseInt(req.query.page) || constants.PAGE,
                limit: parseInt(req.query.limit) || constants.LIMIT
            }

            let myRank =  await EnrollFootBallLeagueContest.findOne({_leagueContestId, _leagueTeamId}, {totalPointsEarned : 1, pointsEarnedInLastWeek :1, rank : 1, _leagueContestId : 1, _leagueTeamId : 1, _userId :1, userName: 1}) 

            let total = await EnrollFootBallLeagueContest.countDocuments({_leagueContestId})
            let participatedUsers = await EnrollFootBallLeagueContest.aggregate([
                {$match : {_leagueContestId : mongoose.Types.ObjectId(_leagueContestId)}},
                {$project : {
                    totalPointsEarned : 1,
                    pointsEarnedInLastWeek : 1,
                    rank : 1,
                    _leagueContestId : 1, 
                    _leagueTeamId : 1, 
                    _userId :1,
                    userName : 1,
                }}

            ])
            .sort({[field]:value, userName : value})
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

            let page = pageOptions.page ;
            let limit = pageOptions.limit;

            res.status(200).send({
                status: constants.STATUS_CODE.SUCCESS,
                message: Lang.responseIn("SOCCER.WEEKLY_LEARDER", req.headers.lang),
                error: false,
                data: {myRank, participatedUsers, page, limit, total}
                });
            // logService.responseData(req, {myRank, participatedUsers, page, limit, total});

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
 * Get a league contest participated user list
 * @function
 * @param {ObjectId} _leagueContestId - _leagueContestId of league contest id.
 * @returns {Object} participatedUsers - Returns participatedUsers in a particular league contest.
 */
exports.getLeagueContestParticipatedUserList = async (req, res) => {
    try {            

            var _leagueContestId = req.params._leagueContestId

            var field, value; 
            if (req.query.sortBy) {
                const parts = req.query.sortBy.split(':');
                field = parts[0];
                parts[1] ==='desc' ? value=-1 : value= 1;
            }else{
                field = "userName",
                value = 1;
            }
            const pageOptions = {
                page: parseInt(req.query.page) || constants.PAGE,
                limit: parseInt(req.query.limit) || constants.LIMIT
            }

            let total = await EnrollFootBallLeagueContest.countDocuments({_leagueContestId})
            let participatedUsers = await EnrollFootBallLeagueContest.aggregate([
                {$match : {_leagueContestId : mongoose.Types.ObjectId(_leagueContestId)}},

            ])
            .sort({[field]:value})
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });
    
            for(let i=0;i<participatedUsers.length;i++){
                let appliedBoosters = participatedUsers[i].appliedBoosters
                for(let j=0;j<appliedBoosters.length;j++){
                    let boosterDetails = await GlobalBoosterSettings.findOne({_id : appliedBoosters[j]._boosterId});
                    appliedBoosters[j].boosterName = boosterDetails.boosterName;
                    appliedBoosters[j].boosterType = boosterDetails.boosterType;
                }
                let temporaryBoosters = participatedUsers[i].temporaryBoosters
                for(let k=0;k<temporaryBoosters.length;k++){
                    let boosterDetails = await GlobalBoosterSettings.findOne({_id : temporaryBoosters[k]._boosterId});
                    temporaryBoosters[k].boosterName = boosterDetails.boosterName;
                    temporaryBoosters[k].boosterType = boosterDetails.boosterType;
                }
            }

            var page = pageOptions.page ;
            var limit = pageOptions.limit;

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.PLAYER_LIST", req.headers.lang),
            error: false,
            data: {participatedUsers, page, limit, total}
            });
            // logService.responseData(req, {participatedUsers, page, limit, total});
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
 * Get a league contest participated user's player list
 * @function
 * @param {ObjectId} _leagueContestId - _leagueContestId of league contest id.
 * @param {ObjectId} _leagueTeamId - _leagueTeamId of participated user's team id.
 * @param {Number} weekNumber - weekNumber for particular week team.
 * @returns {Object} players - Returns players of a particular user's team of a particular week.
 */
exports.getLeagueContestParticipatedUserPlayerList = async (req, res) => {
    try {            

            let _leagueContestId = req.params._leagueContestId;
            let _leagueTeamId = req.params._leagueTeamId;
            let gameWeek = req.params.weekNumber;
            let currentTimeStamp = parseInt(await dateFormat.setCurrentTimestamp());
            let isContestExist = await FootBallLeagueContest.findOne({_id: _leagueContestId})
            if(!isContestExist){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let enrolledUser = await EnrollFootBallLeagueContest.findOne({_leagueContestId, _userId : req.user._id})
            if(!enrolledUser){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.NOT_PARTICIPANT", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let participatedUsers = await EnrollFootBallLeagueContest.findOne({_leagueContestId, _leagueTeamId})
            if(!participatedUsers){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            
            // if(isContestExist.enrollEndTime > currentTimeStamp && (participatedUsers._userId).toString() !== (req.user._id).toString()){
            //     return res.status(400).send({
            //         status:constants.STATUS_CODE.FAIL,
            //         message: Lang.responseIn("SOCCER.TEAM_VIEW_ERROR", req.headers.lang),
            //         error:true,
            //         data:{}
            //     })
            // }

            let players = await SelectLeagueFootBallTeamPlayer.find({_leagueTeamId, gameWeek});
            
            // let userTeam = await UserLeagueFootBallTeam.aggregate([
            //     {
            //         $match : {
            //         _id : mongoose.Types.ObjectId(_leagueTeamId),
            //         }
            //     },
            //     {
            //         $lookup : {
            //             from: "selectleaguefootballteamplayers",
            //             localField: "_id",
            //             foreignField: "_leagueTeamId",
            //             as: "players"
            //         }
            //     },
            // ])

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.PLAYER_LIST", req.headers.lang),
            error: false,
            data: players
            });
            // logService.responseData(req, players);
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
 * Get a AI league player list
 * @function
 * @param {ObjectId} _leagueId - _leagueId of league.
 * @param {Number} teamFormat - teamFormat of league contest.
 * @param {Number} goalKeeperCount - goalKeeperCount which is fixed to 2 in '11' and '3' team format.
 * @param {Number} defenderCount - defenderCount which is fixed to 5 in '11' team format and in '3' team format user can maximum have 2.
 * @param {Number} midFielderCount - midFielderCount which is fixed to 5 in '11' team format and in '3' team format user can maximum have 2.
 * @param {Number} attackerCount - attackerCount which is fixed to 3 in '11' team format and in '3' team format user can maximum have 2.
 * @returns {Object} data - Returns data with random players according to their position, formation and team format.
 * It will start checking with team format then players according to positions and total player limits. 
 * Will giva a credit according to the team format in order to pick players .
 * It will run getLeagueAITeam function and will return players with their postions array.
 */
exports.getAITeamPlayerList = async (req, res) => {
    try {            
            var reqdata = req.body;
            var _leagueId = reqdata._leagueId;
            var teamFormat = reqdata.teamFormat;
            if(teamFormat === constants.TEAM_FORMAT.ELEVEN || teamFormat === constants.TEAM_FORMAT.THREE){
                
            }else{
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_FORMAT", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            let currentTimeStamp = parseInt(await dateFormat.setCurrentTimestamp());
            const isLeagueExist = await FootBallLeagueSchedule.findOne({_id: _leagueId});
            if(!isLeagueExist){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.LEAGUE_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            var globalTeamSettings = await GlobalTeamSettings.findOne();
            if(!globalTeamSettings){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_TEAM_SETTINGS_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let goalKeeperCount, defenderCount, midFielderCount, attackerCount, givenGoalRatings, givenDefRatings, givenMidRatings, givenAttackRatings, teamMaxPlayer, credit, playerLimit;

            if(teamFormat === constants.TEAM_FORMAT.ELEVEN){
                credit = globalTeamSettings.creditToElevenTeamInLeague;   // open this when points flow completed
                teamMaxPlayer = globalTeamSettings.maxPlayersFromSameTeamInEleven;
                playerLimit = constants.TEAM_FORMAT.ELEVEN + constants.TEAM_FORMAT.EXTRA_ON_ELEVEN
            }else if(teamFormat === constants.TEAM_FORMAT.THREE){
                credit = globalTeamSettings.creditToThreeTeamInLeague;   // open this when points flow completed
                teamMaxPlayer = globalTeamSettings.maxPlayersFromSameTeamInThree;
                playerLimit = constants.TEAM_FORMAT.THREE + constants.TEAM_FORMAT.EXTRA_ON_THREE
            }

            // givenGoalRatings = ((credit * 10) /100)
            
            if(reqdata.goalKeeperCount || reqdata.goalKeeperCount === 0 ){
                goalKeeperCount = reqdata.goalKeeperCount;
                if(goalKeeperCount !== 2){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                if(teamFormat === constants.TEAM_FORMAT.ELEVEN){
                    givenGoalRatings = ((credit * 12) /100)
                }else{
                    givenGoalRatings = ((credit * 12) / 30)    
                }
            }else if(teamFormat === constants.TEAM_FORMAT.THREE){
                goalKeeperCount = 1;
                givenGoalRatings = ((credit * 12) / 30)
            }else{
                goalKeeperCount = 1;
                givenGoalRatings = ((credit * 12) /100)
            }

            if(reqdata.defenderCount || reqdata.defenderCount === 0){
                defenderCount = reqdata.defenderCount;
                if(teamFormat === constants.TEAM_FORMAT.THREE && defenderCount > 2){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                if(teamFormat === constants.TEAM_FORMAT.ELEVEN){
                    givenDefRatings = ((credit * (defenderCount * 6.52)) /100);
                }else{
                    givenDefRatings = ((credit * (defenderCount * 5.75)) / 30);
                }
            }else if(teamFormat === constants.TEAM_FORMAT.THREE){
                defenderCount = 1;
                givenDefRatings = ((credit * (defenderCount * 5.75)) /30)
            }else{
                defenderCount = 5;
                givenDefRatings = ((credit * (defenderCount * 6.52)) /100)
            }

            if(reqdata.midFielderCount || reqdata.midFielderCount === 0){
                midFielderCount = reqdata.midFielderCount;
                if(teamFormat === constants.TEAM_FORMAT.THREE && midFielderCount > 2){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                if(teamFormat === constants.TEAM_FORMAT.ELEVEN){
                    givenMidRatings = ((credit * (midFielderCount * 8)) /100);
                }else{
                    givenMidRatings = ((credit * (midFielderCount * 7)) / 30);
                }
                // givenMidRatings = ((credit / teamFormat) * midFielderCount)
            }else if(teamFormat === constants.TEAM_FORMAT.THREE){
                midFielderCount = 1;
                givenMidRatings = ((credit * (midFielderCount * 7)) /30)
            }else{
                midFielderCount = 5;
                givenMidRatings = ((credit * (midFielderCount * 8)) /100)
            }

            if(reqdata.attackerCount || reqdata.attackerCount === 0){
                attackerCount = reqdata.attackerCount;
                if(teamFormat === constants.TEAM_FORMAT.THREE && attackerCount > 2){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                if(teamFormat === constants.TEAM_FORMAT.ELEVEN){
                    givenAttackRatings = ((credit * (attackerCount * 8)) /100);
                }else{
                    givenAttackRatings = ((credit * (attackerCount * 7)) / 30);
                }
                // givenAttackRatings = ((credit / teamFormat) * attackerCount)
            }else if(teamFormat === constants.TEAM_FORMAT.THREE){
                attackerCount = 1;
                givenAttackRatings = ((credit * (attackerCount * 7)) / 30);
            }else{
                attackerCount = 3;
                givenAttackRatings = ((credit * (attackerCount * 8)) /100)
            }

            let totalPlayerCount = goalKeeperCount + defenderCount + midFielderCount + attackerCount;
            if(teamFormat === constants.TEAM_FORMAT.ELEVEN) {
                if (defenderCount != 5 || midFielderCount != 5 || attackerCount != 3 ){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                } else if(totalPlayerCount !== playerLimit){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
            }

            if(teamFormat === constants.TEAM_FORMAT.THREE && totalPlayerCount !== playerLimit){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let totalGoalRating = givenGoalRatings / goalKeeperCount;
            let totalDefeRating = givenDefRatings / defenderCount;
            let totalMidRating = givenMidRatings / midFielderCount;
            let totalAttaRating = givenAttackRatings / attackerCount;

            let teamIdsArr = await commonFunction.leagueTeamArr(_leagueId);

            let data = await requestHelper.getLeagueAITeam(teamIdsArr, totalGoalRating, goalKeeperCount, totalDefeRating, defenderCount, totalMidRating, midFielderCount, totalAttaRating, attackerCount, teamMaxPlayer, playerLimit);

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.PLAYER_LIST", req.headers.lang),
            error: false,
            data: data
            });
            // logService.responseData(req, data);
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
 * Get league winner list
 * @function
 * @param {ObjectId} _leagueContestId - _leagueContestId of league contest.
 * @param {ObjectId} _leagueTeamId - _leagueTeamId of user team.
 * @returns {Object} {myRank, leagueWinnerListWithPrizeAmount, page, limit, total} - Returns myRank and other winner list with pagination.
 * It will find a login user rank and shows that as myRank if user has not participated then it will give a null value.
 * leagueWinnerListWithPrizeAmount will have all the users data who have participated in it with their points and rank.
 */
exports.getLeagueWinnerList =  async (req, res) => {
    try {
            let _leagueContestId = req.params._leagueContestId;
            let _leagueTeamId = req.params._leagueTeamId;

            let leagueData = await EnrollFootBallLeagueContest.findOne({_leagueContestId, _leagueTeamId})
            if(!leagueData){
                return res.status(400).send({
                            status:constants.STATUS_CODE.FAIL,
                            message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
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
                _leagueContestId: leagueData._leagueContestId,
            }
            if (search) {
                query.$or = [
                    { 'userName': new RegExp(search, 'i') }
                ]
            }

        let myRank = await LeagueWinnerListWithPrizeAmount.findOne({_leagueContestId,  _leagueTeamId, _userId : req.user._id})

        let total = await LeagueWinnerListWithPrizeAmount.countDocuments(query);
        
        let leagueWinnerListWithPrizeAmount = await LeagueWinnerListWithPrizeAmount.aggregate([
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
            data: {myRank, leagueWinnerListWithPrizeAmount, page, limit, total}
        })
        // logService.responseData(req, {myRank, leagueWinnerListWithPrizeAmount, page, limit, total});
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
 * Get previous, current and next week
 * @function
 * @param {ObjectId} _leagueId - _leagueId of a particular league.
 * @returns {Object} weeks - Returns previous, current and next week number of that particular league.
 */
exports.getPreviousCurrentNextWeek = async (req, res) => {
    try {
        let _leagueId = req.params._leagueId;
        
        weeks = {}

        weeks.previousWeekNumber = await commonFunction.getPreviousGameWeek(_leagueId)
        weeks.currentWeekNumber = await commonFunction.getCurrentGameWeek(_leagueId)
        weeks.nextWeekNumber = await commonFunction.getNextGameWeek(_leagueId)
        
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.WEEK_LIST", req.headers.lang),
            error: false,
            data: weeks
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
 * Get single player league week stats
 * @function
 * @param {ObjectId} _leagueTeamId - _dfsTeamId of user team.
 * @param {ObjectId} _playerId - _playerId of user team player.
 * @param {String} weekNumber - weekNumber of team player.
 * @returns {Object} playerStats - Returns playerStats for that particular player.
 * It will find team for DFS contest from _dfsTeamId.
 * Then will aggregate it with selected player for that team.
 * Then will find player stats for particular player from _playerId.
 */
exports.getPlayerStatsForLeagueWeek = async (req, res) => {
    try {
        let _leagueTeamId = req.params._leagueTeamId;
        let _playerId = req.params._playerId;
        let weekNumber = req.params.weekNumber;

        let isTeamExist = await EnrollFootBallLeagueContest.findOne({_leagueTeamId});

        if(!isTeamExist){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        let playerWeekMatches = await SelectLeagueFootBallTeamPlayer.aggregate([
                    {$match : {"_leagueTeamId" : mongoose.Types.ObjectId(_leagueTeamId), "_playerId" : mongoose.Types.ObjectId(_playerId), "gameWeek" : weekNumber}},
                    {
                        $lookup : {
                                        from: "userleaguefootballteams",
                                        localField: "_leagueTeamId",
                                        foreignField: "_id",
                                        as: "_leagueTeamId"
                                    }
                    },
                    {$unwind : "$_leagueTeamId"},
                    {
                        $lookup : {
                                        from: "footballleagueweeks",
                                        localField: "_leagueTeamId._leagueId",
                                        foreignField: "_leagueId",
                                        as: "_leagueTeamId._leagueId"
                                    }
                    },
                    {$unwind : "$_leagueTeamId._leagueId"},
                    {$match : {"_leagueTeamId._leagueId.weekNumber" : weekNumber}},
                    {
                        $group : {
                                _id : "$_leagueTeamId._leagueId._id"
                            }
                    }
            ]);
        
        let matchIds = [];
        
        for(let i=0;i<playerWeekMatches.length;i++){
            matchIds.push(mongoose.Types.ObjectId(playerWeekMatches[i]._id))
        }
        
        let playerStats = {};
        playerStats = await LivePlayerStat.findOne({_playerId, _matchId : { $in : matchIds }});

        let pointSystemDate = await EnrollFootBallLeagueContest.aggregate([
            {
                $match : { "_leagueTeamId" : mongoose.Types.ObjectId(_leagueTeamId)}
            },
            {
                $lookup : {
                    from: "footballleaguecontests",
                    localField: "_leagueContestId",
                    foreignField: "_id",
                    as: "_leagueContestId"
                }
            },
            {
                $unwind : "$_leagueContestId"
            },
            {
                $project : {
                    "appliedBoosters" : 1,
                    "_leagueContestId.createdAt" : 1
                }
            },
        ])
        
        let appliedBoosters = pointSystemDate[0].appliedBoosters
        for(let k=0;k<appliedBoosters.length;k++){
            if(appliedBoosters[k].weekNumber === weekNumber){
                
                let boosterDetails = await GlobalBoosterSettings.findOne({_id : appliedBoosters[k]._boosterId});
                appliedBoosters[k].boosterName = boosterDetails.boosterName;
                appliedBoosters[k].boosterType = boosterDetails.boosterType;
            }else{
                appliedBoosters = [];
            }
        }

        let contestCreateDate = pointSystemDate[0]._leagueContestId.createdAt;

        let pointSystem = await GlobalPointSettings.aggregate(
            [
                {$match : {createdAt : {$lt : contestCreateDate}}},
                { $sort: { createdAt: -1 , _id : 1} },
                {
                $group:
                    {
                    _id: "$actionName",
                    actionName: { $first: "$actionName" },
                    actionPoint: { $first: "$actionPoint" },
                    actionCount: { $first: "$actionCount" }
                    }
                }
            ]
            );
        
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.PLAYER_STATS", req.headers.lang),
            error: false,
            // data: {playerStats, pointSystem}
            data: {playerStats, appliedBoosters, pointSystem}
        })
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