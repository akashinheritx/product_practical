const FootBallLeagueSchedule = require('../../models/footBallLeagueSchedules.model');
const FootBallLeagueWeek = require('../../models/footBallLeagueWeeks.model');
const FootBallTeamName = require('../../models/footBallTeamNames.model');
const FootBallPlayerName = require('../../models/footBallPlayerNames.model');
const FootBallPrizeBreakDowns = require('../../models/footBallPrizeBreakDown.model');
const FootBallDFSContest = require('../../models/footBallDFSContest.model');
const FootBallFormation = require('../../models/footBallFormation.model');
const UserFootBallTeam = require('../../models/userFootBallTeam.model');
const SelectFootBallTeamPlayer = require('../../models/selectFootBallTeamPlayer.model');
const EnrollFootBallDFSContest = require('../../models/enrollFootBallDFSContest.model');
const DFSWinnerListWithPrizeAmount = require('../../models/dfsWinnerListwithPrizeAmounts.model');
const WalletHistory = require('../../models/walletHistory.model');
const GlobalPointSettings = require('../../models/globalPointSettings.model');
const GlobalGeneralSettings = require('../../models/globalGeneralSettings.model');
const GlobalTeamSettings = require('../../models/globalTeamSettings.model');
const GlobalBoosterSettings = require('../../models/globalBoosterSettings.model');
const Badge = require('../../models/badge.model');
const User = require('../../models/user.model');

const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const requestHelper = require('../../helper/requestHelper.helper');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');
const _ = require('lodash');

//Get a list of upcoming matches
exports.getUpComingMatchList = async (req, res) => {
    try {            
            const currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            const upComingDays = currentTimeStamp + (constants.UPCOMIG_DAYS * constants.TIME_DIFF_MILISEC.GET_DAY);
            let endTimeStamp = parseInt(dateFormat.setTodayEndTimeStamp());

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
            const query = {
                deletedAt: null,
                startTime :{$gte: endTimeStamp, $lte: upComingDays},
                status:constants.MATCH_STATUS.OPEN
            }
            if (search) {
                query.$or = [
                    { 'leagueName': new RegExp(search, 'i') },
                    { 'localTeam': new RegExp(search, 'i') },
                    { 'visitorTeam': new RegExp(search, 'i') },
                ]
            }

            const todaysFootBallMatches = await FootBallLeagueWeek.aggregate([
                {$match: 
                    {
                        deletedAt: null,
                        startTime :{$gte: currentTimeStamp, $lte: endTimeStamp},
                        status:constants.MATCH_STATUS.OPEN
                    }
                },
                { $addFields: 
                    { 
                        currentTimeStamp,
                        contestCount : constants.DEFAULT_NUMBER,
                    }
                },
            ])
            .sort({[field] : value})
            
            let dfsIDS = [];
            const participateDfsIds = await EnrollFootBallDFSContest.find({_userId : req.user._id}, {_dfsContestId : 1 ,_id:0})
            for(let a=0;a<participateDfsIds.length;a++){
                dfsIDS.push(participateDfsIds[a]._dfsContestId)
            }

            for(let i=0;i<todaysFootBallMatches.length;i++){
                let count = await FootBallDFSContest.countDocuments({_matchId : todaysFootBallMatches[i]._id, status : constants.DFS_STATUS.ENROLL, $or:[{_id : {$in : dfsIDS}},{$and:[{contestVisibility : constants.CONTEST_VISIBILITY.PUBLIC/*, status : constants.DFS_STATUS.ENROLL*/}, {enrollStartTime :{$lte: currentTimeStamp}}]}]})
                todaysFootBallMatches[i].contestCount = count
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
            .sort({[field] : value, _id : value })
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });
    
            var page = pageOptions.page ;
            var limit = pageOptions.limit;

            for(let j=0;j<footballMatches.length;j++){
                let count = await FootBallDFSContest.countDocuments({_matchId : footballMatches[j]._id, status : constants.DFS_STATUS.ENROLL, $or:[{_id : {$in : dfsIDS}},{$and:[{contestVisibility : constants.CONTEST_VISIBILITY.PUBLIC/*, status : constants.DFS_STATUS.ENROLL*/}, {enrollStartTime :{$lte: currentTimeStamp}}]}]})
                footballMatches[j].contestCount = count
            }

            if(page != 1){
                res.status(200).send({
                    status: constants.STATUS_CODE.SUCCESS,
                    message: Lang.responseIn("SOCCER.MATCH_LIST", req.headers.lang),
                    error: false,
                    // data: {footballMatches, page, limit, total},
                    data: {upcomingMatches : {footballMatches, page, limit, total}}
                    });
                    // logService.responseData(req, footballMatches); 
            }else{
                res.status(200).send({
                    status: constants.STATUS_CODE.SUCCESS,
                    message: Lang.responseIn("SOCCER.MATCH_LIST", req.headers.lang),
                    error: false,
                    // data: {footballMatches, page, limit, total},
                    data: {todaysFootBallMatches, upcomingMatches : {footballMatches, page, limit, total}}
                    });
                    // logService.responseData(req, footballMatches);
            }            
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

//Get a single match details
exports.getSingleMatchDetails = async (req, res) => {
    try {            
            var _matchId = req.params._matchId;

            const FootBallMatchDetails = await FootBallLeagueWeek.findOne({_id : _matchId});
            
            res.status(200).send({
                status: constants.STATUS_CODE.SUCCESS,
                message: Lang.responseIn("SOCCER.MATCH_DETAILS_RETRIEVED", req.headers.lang),
                error: false,
                // data: {footballMatches, page, limit, total},
                data: FootBallMatchDetails
                });
                // logService.responseData(req, FootBallMatchDetails);

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

//Get a list of upcoming match player list
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
                    { 'playerPosition': new RegExp(search, 'i') },
                ]
            }
            var total = await FootBallPlayerName.countDocuments({$and:[{$or:[{teamId: isMatchExist.localTeamId},{teamId: isMatchExist.visitorTeamId}]}, {playerPosition : {$in : positionArr}}]});
            const footballMatchPlayers = await FootBallPlayerName.find({$and:[{$or:[{teamId: isMatchExist.localTeamId},{teamId: isMatchExist.visitorTeamId}]}, {playerPosition : {$in : positionArr}}]},{playerImage : 0})
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

//Get a list of upcoming dfs contest
exports.getUpComingDFSContestList = async (req, res) => {
    try {            
            const currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            const _matchId = req.params._matchId;
            const _userId = req.user._id;
            let field, value, contestType, teamFormat;
            const search = req.query.q ? req.query.q : ''; // for searching
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
            const query = {
                deletedAt: null,
                enrollEndTime :{$gt: currentTimeStamp},
                enrollStartTime : {$lt : currentTimeStamp},
                status:constants.DFS_STATUS.ENROLL,
                _matchId : mongoose.Types.ObjectId(_matchId),
                // contestVisibility: constants.CONTEST_VISIBILITY.PUBLIC,
                contestType,
                teamFormat,
            }
            
            // if (search) {
            //     query.$or = [
            //         { 'contestName': new RegExp(search, 'i') },
            //     ]
            // }
            let dfsIDS = [];
            const participateDfsIds = await EnrollFootBallDFSContest.find({_userId }, {_dfsContestId : 1 ,_id:0})
            for(let a=0;a<participateDfsIds.length;a++){
                dfsIDS.push(participateDfsIds[a]._dfsContestId)
            }
            
            // const total = await FootBallDFSContest.countDocuments({$and:[{_matchId : mongoose.Types.ObjectId(_matchId)}, {$or:[query, {'_createdBy' : _userId, enrollEndTime :{$gt: currentTimeStamp}, enrollStartTime : {$lt : currentTimeStamp}}, {_id : {$in : dfsIDS}, enrollEndTime :{$gt: currentTimeStamp}, enrollStartTime : {$lt : currentTimeStamp}}]}, {contestType}, {teamFormat}, { 'contestName': new RegExp(search, 'i')}]});
            const total = await FootBallDFSContest.countDocuments({$and:[query, {$or:[{contestVisibility: constants.CONTEST_VISIBILITY.PUBLIC},{_createdBy : _userId}, {_id : {$in : dfsIDS}}]}, { contestName : new RegExp(search, 'i')}]});
            const footballDFSContest = await FootBallDFSContest.aggregate([
                // {$match: {$and:[{_matchId : mongoose.Types.ObjectId(_matchId)}, {$or:[query, {'_createdBy' : _userId, enrollEndTime :{$gt: currentTimeStamp}, enrollStartTime : {$lt : currentTimeStamp}}, {_id : {$in : dfsIDS}, enrollEndTime :{$gt: currentTimeStamp}, enrollStartTime : {$lt : currentTimeStamp}}]}, {contestType}, {teamFormat}, { 'contestName': new RegExp(search, 'i')}]}},
                {$match: {$and:[query, {$or:[{contestVisibility: constants.CONTEST_VISIBILITY.PUBLIC},{_createdBy : _userId}, {_id : {$in : dfsIDS}}]}, { contestName : new RegExp(search, 'i')}]}},
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

            let allDfsContests = await FootBallDFSContest.find({_matchId : mongoose.Types.ObjectId(_matchId), status : constants.DFS_STATUS.ENROLL},{_id : 1})

            let allDsfContestsIds = []
            for(let x=0;x<allDfsContests.length;x++){
                allDsfContestsIds.push(allDfsContests[x]._id)
            }
            let totalCount = await EnrollFootBallDFSContest.countDocuments({_userId , _dfsContestId : {$in:allDsfContestsIds}})
            let totalParticipantCount = totalCount;

            for(let a=0; a<footballDFSContest.length;a++){
                let count = await EnrollFootBallDFSContest.countDocuments({_userId , _dfsContestId : footballDFSContest[a]._id})
                footballDFSContest[a].participantCount = count;
                // totalParticipantCount += count;
                const dfsContestData = await EnrollFootBallDFSContest.findOne({_userId , _dfsContestId : footballDFSContest[a]._id})
                if(dfsContestData){
                    footballDFSContest[a].participatedIn = constants.USER.PARTICIPANT
                }
                let booster = footballDFSContest[a].boosters
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
            data: {footballDFSContest,totalParticipantCount, page, limit, total}
            });
            // logService.responseData(req, {footballDFSContest,totalParticipantCount, page, limit, total});
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

//Get a single dfs contest
exports.getSingleDFSContest = async (req, res) => {
    try {            
            const currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            const _dfsContestId = req.params._dfsContestId;
            const _userId = req.user._id;
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
                {
                    $lookup : {
                        from: "footballleagueweeks",
                        localField: "_matchId",
                        foreignField: "_id",
                        as: "_matchId"
                    }
                },
                {
                    $unwind : "$_matchId"
                },
                { $addFields: 
                            { 
                                currentTimeStamp,
                                participantCount : constants.DEFAULT_NUMBER,
                                participatedIn: constants.USER.NOT_PARTICIPANT,
                                matchStatus : constants.USER_DFS_STATUS.NOT_ATTENDED,
                                rank : constants.USER_DFS_STATUS.NOT_ATTENDED,
                                totalPointsEarned : constants.USER_DFS_STATUS.NOT_ATTENDED,
                                leaderBoardStatus: constants.USER_DFS_STATUS.LEADERBOARD_NOT_GENERATED,
                                spotLeft: {$subtract: [ "$maxParticipants", "$currentParticipants" ]}
                            }
                        },
            ])

            if(footballDFSContest.length < 1){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let count = await EnrollFootBallDFSContest.countDocuments({_userId , _dfsContestId : footballDFSContest[0]._id});
            footballDFSContest[0].participantCount = count;
            const dfsContestData = await EnrollFootBallDFSContest.findOne({_userId , _dfsContestId : footballDFSContest[0]._id});
                if(dfsContestData){
                    footballDFSContest[0].participatedIn = constants.USER.PARTICIPANT;
                    // footballDFSContest[0]._dfsTeamId = dfsContestData._dfsTeamId;
                }
                let leaderBoardGenerated = await DFSWinnerListWithPrizeAmount.findOne({_dfsContestId : mongoose.Types.ObjectId(footballDFSContest[0]._id)})
                if(leaderBoardGenerated){
                    footballDFSContest[0].leaderBoardStatus = constants.USER_DFS_STATUS.LEADERBOARD_GENERATED;
                }
                let leaderBoard = await DFSWinnerListWithPrizeAmount.findOne({_dfsContestId : mongoose.Types.ObjectId(footballDFSContest[0]._id), _userId })
                if(leaderBoard){
                    footballDFSContest[0].rank = leaderBoard.rank;
                    footballDFSContest[0].totalPointsEarned = leaderBoard.totalPointsEarned;
                }
                let booster = footballDFSContest[0].boosters
                for(let k=0;k<booster.length;k++){
                    let boosterDetails = await GlobalBoosterSettings.findOne({_id : booster[k]._boosterId});
                    booster[k].boosterName = boosterDetails.boosterName;
                    booster[k].boosterType = boosterDetails.boosterType;
                    
                }

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.CONTEST_FOUND", req.headers.lang),
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

//Get a single dfs contest
exports.getSingleDFSContestByReferralCode = async (req, res) => {
    try {            
            const currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            const referralCode = req.params.referralCode;
            const _userId = req.user._id;
            const footballDFSContest = await FootBallDFSContest.aggregate([
                {$match: {referralCode}},
                {
                    $lookup : {
                        from: "footballprizebreakdowns",
                        localField: "_id",
                        foreignField: "_dfsContestId",
                        as: "footBallPrizeBreakDowns"
                    }
                },
                {
                    $lookup : {
                        from: "footballleagueweeks",
                        localField: "_matchId",
                        foreignField: "_id",
                        as: "_matchId"
                    }
                },
                {
                    $unwind : "$_matchId"
                },
                { $addFields: 
                            { 
                                currentTimeStamp,
                                participantCount : constants.DEFAULT_NUMBER,
                                participatedIn: constants.USER.NOT_PARTICIPANT,
                                matchStatus : constants.USER_DFS_STATUS.NOT_ATTENDED,
                                rank : constants.USER_DFS_STATUS.NOT_ATTENDED,
                                totalPointsEarned : constants.USER_DFS_STATUS.NOT_ATTENDED,
                                leaderBoardStatus: constants.USER_DFS_STATUS.LEADERBOARD_NOT_GENERATED,
                                spotLeft: {$subtract: [ "$maxParticipants", "$currentParticipants" ]}
                            }
                        },
            ])

            if(footballDFSContest.length < 1){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let count = await EnrollFootBallDFSContest.countDocuments({_userId , _dfsContestId : footballDFSContest[0]._id});
            footballDFSContest[0].participantCount = count;
            const dfsContestData = await EnrollFootBallDFSContest.findOne({_userId , _dfsContestId : footballDFSContest[0]._id});
                if(dfsContestData){
                    footballDFSContest[0].participatedIn = constants.USER.PARTICIPANT;
                }
                let booster = footballDFSContest[0].boosters
                for(let k=0;k<booster.length;k++){
                    let boosterDetails = await GlobalBoosterSettings.findOne({_id : booster[k]._boosterId});
                    booster[k].boosterName = boosterDetails.boosterName;
                    booster[k].boosterType = boosterDetails.boosterType;
                    
                }

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.CONTEST_FOUND", req.headers.lang),
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

//Get a contest team player list
exports.getContestTeamPlayerList = async (req, res) => {
    try {            

            let _teamId = req.params._teamId;
            const _userId = req.user._id;

            let userTeam = await UserFootBallTeam.findOne({_id : _teamId, _userId});

            if(!userTeam){

                return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_NOT_FOUND", req.headers.lang),
                    error: true,
                    data: {}
                });

            }

            let players = await SelectFootBallTeamPlayer.find({_teamId})
            
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

//Get all football formation
exports.getAllFootBallFormations = async (req, res) => {
    try {            
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
                deletedAt: null
            }
            if (search) {
                query.$or = [
                    { 'formationType': new RegExp(search, 'i') },
                ]
            }
            var total = await FootBallFormation.countDocuments(query);
            const footballFormations = await FootBallFormation.find(query)
            .sort({[field]:value})
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

            var page = pageOptions.page ;
            var limit = pageOptions.limit;

            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.FORMATION_LIST", req.headers.lang),
            error: false,
            data: {footballFormations, page, limit, total}
            });
            // logService.responseData(req, footballFormations);
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

//Enroll in football DFS contest
exports.enrollInDFSContest = async (req, res, done) => {
    var session = await mongoose.startSession({
        readPreference: { mode: 'primary' }
      });
      session.startTransaction();
    try {
        const user = req.user;
        const _userId = user._id;
        const reqdata = req.body;
        const _matchId = reqdata._matchId;
        
        // const boosterCount = reqdata.boosterCount;
        const _dfsContestId = reqdata._dfsContestId;
        var globalTeamSettings = await GlobalTeamSettings.findOne();
        if(!globalTeamSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_TEAM_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        const isMatchExist = await FootBallLeagueWeek.findOne({_id: mongoose.Types.ObjectId(_matchId)});
        if(!isMatchExist){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.MATCH_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let matchTeamIds = []
        matchTeamIds.push(isMatchExist.localTeamId, isMatchExist.visitorTeamId)

        let currentTimeStamp = dateFormat.setCurrentTimestamp();      
        if(currentTimeStamp >= isMatchExist.startTime){
            return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.MATCH_CLOSE", req.headers.lang),
                    error: true,
                    data: {}
                });
        }

        let dfsData = await FootBallDFSContest.findOne({_id: _dfsContestId, _matchId : mongoose.Types.ObjectId(_matchId)});
                
        if(!dfsData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        if(dfsData.status != constants.DFS_STATUS.ENROLL){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.CONTEST_CLOSE", req.headers.lang),
                error:true,
                data:{}
            })
        }
      
        if(currentTimeStamp >= dfsData.enrollEndTime){
            return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.CONTEST_CLOSE", req.headers.lang),
                    error: true,
                    data: {}
                });
        }
        if(dfsData.contestType !== constants.CONTEST_TYPE.H2H){
            if(dfsData.currentParticipants >= dfsData.maxParticipants){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.CONTEST_PARTICIPATE_FULL", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }

        let entryFee = dfsData.entryFee;

        let enrolledCount = await EnrollFootBallDFSContest.countDocuments({_userId, _dfsContestId:dfsData._id})
        if(dfsData.contestType === constants.CONTEST_TYPE.H2H){
            if(enrolledCount >= constants.H2H_PARTICIPANT_LIMIT){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("GENERAL.PARTICIPANT_LIMIT", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }else if(dfsData.contestType === constants.CONTEST_TYPE.REGULAR){
            if(enrolledCount >= constants.PARTICIPANT_LIMIT){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("GENERAL.PARTICIPANT_LIMIT", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
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
    
            var isBoosterAvailable = await FootBallDFSContest.findOne({_id: _dfsContestId, _matchId : mongoose.Types.ObjectId(_matchId), boosters : { $elemMatch: { _boosterId , boosterCount: {$gt:0}}}});
            if(!isBoosterAvailable){
                if(entryFee === 0 ){
                    // let isUserBoosterAvailable = await commonFunction.checkUserBoosters(_userId, _boosterId);
                    let isUserBoosterAvailable = await User.findOne({_id : _userId, boosters : { $elemMatch: { _boosterId, boosterQty: {$gt:0}}}});
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

            if(reqdata.invincibles){
                invincibles = reqdata.invincibles;
            }

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
                    let player = await commonFunction.getPlayer(invincibles[a], matchTeamIds);
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
        
        let teamFormat = dfsData.teamFormat;

        if(teamFormat === constants.TEAM_FORMAT.ELEVEN){
            if(noOfGoalKeeper.length !== goalKeeperCount || noOfGoalKeeper.length != globalTeamSettings.minNoOfGoalKeeper){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfDefender.length !== defenderCount || noOfDefender.length < globalTeamSettings.minNoOfDefender || noOfDefender.length > globalTeamSettings.maxNoOfDefender){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfMidFielder.length !== midFielderCount || noOfMidFielder.length < globalTeamSettings.minNoOfMidfielders || noOfMidFielder.length > globalTeamSettings.maxNoOfMidfielders){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfAttacker.length !== attackerCount || noOfAttacker.length < globalTeamSettings.minNoOfStrikers || noOfAttacker.length > globalTeamSettings.maxNoOfStrikers){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(totalPlayer != teamFormat){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }     
        }else if(teamFormat === constants.TEAM_FORMAT.THREE){
            if(noOfGoalKeeper.length !== goalKeeperCount || noOfGoalKeeper.length != globalTeamSettings.minNoOfGoalKeeper){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfDefender.length !== defenderCount || noOfDefender.length < constants.TEAM_FORMAT.MIN_DEFENDER_IN_THREE_IN_DFS || noOfDefender.length > constants.TEAM_FORMAT.MAX_DEFENDER_IN_THREE_IN_DFS){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfMidFielder.length !== midFielderCount || noOfMidFielder.length < constants.TEAM_FORMAT.MIN_MID_FIELDER_IN_THREE_IN_DFS || noOfMidFielder.length > constants.TEAM_FORMAT.MAX_MID_FIELDER_IN_THREE_IN_DFS){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfAttacker.length !== attackerCount || noOfAttacker.length < constants.TEAM_FORMAT.MIN_ATTACKER_IN_THREE_IN_DFS || noOfAttacker.length > constants.TEAM_FORMAT.MAX_ATTACKER_IN_THREE_IN_DFS){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(totalPlayer != teamFormat){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }else{
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_VALIDATION", req.headers.lang),
                error:true,
                data:{}
            })
        }
        

        let captain, viceCaptain;
        let totalRatings = 0;
        let captainCount = 0;
        let viceCaptainCount = 0;
        let playerArr = [];
        let playerIDS = [];

        for(let i=0;i<noOfGoalKeeper.length;i++){
            let gkPlayerRating = await commonFunction.getPlayerRatings(noOfGoalKeeper[i].player, matchTeamIds, constants.PLAYER_POSITION.GOAL_KEEPER);
            if(gkPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
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
            playerIDS.push(noOfGoalKeeper[i].player);
        }
        for(let j=0;j<noOfDefender.length;j++){
            let dPlayerRating = await commonFunction.getPlayerRatings(noOfDefender[j].player, matchTeamIds, constants.PLAYER_POSITION.DEFENDER);
            if(dPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
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
            playerIDS.push(noOfDefender[j].player);
        }
        for(let k=0;k<noOfMidFielder.length;k++){
            let mfPlayerRating = await commonFunction.getPlayerRatings(noOfMidFielder[k].player, matchTeamIds, constants.PLAYER_POSITION.MID_FIELDER);
            if(mfPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
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
            playerIDS.push(noOfMidFielder[k].player);
        }
        for(let l=0;l<noOfAttacker.length;l++){
            let aPlayerRating = await commonFunction.getPlayerRatings(noOfAttacker[l].player, matchTeamIds, constants.PLAYER_POSITION.ATTACKER);
            if(aPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
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
            playerIDS.push(noOfAttacker[l].player);
        }

        let sameIds = await commonFunction.findDuplicates(playerIDS);
        if(sameIds>0){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.SAME_PLAYER_IDS_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }

        if(reqdata._boosterId){

            if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.INVINCIBLES){
                let isIdExist = commonFunction.checkOneArrayValuesInOtherArray(playerIDS, invincibles)
    
                if(!isIdExist){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.INVINCIBLE_IDS_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
            }

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
        let teamCount = await commonFunction.teamCount(playerArr);
        let maxPlayer, minPlayer, credit, teamSelectionMessage;
        if(dfsData.teamFormat == constants.TEAM_FORMAT.ELEVEN){
            minPlayer = globalTeamSettings.minPlayersFromSameTeamInEleven;
            maxPlayer = globalTeamSettings.maxPlayersFromSameTeamInEleven;
            credit = globalTeamSettings.creditToElevenTeam;
            teamSelectionMessage = Lang.responseIn("SOCCER.TEAM_SELECTION_ELEVEN_ERROR", req.headers.lang);
        }else if(dfsData.teamFormat == constants.TEAM_FORMAT.THREE){
            minPlayer = globalTeamSettings.minPlayersFromSameTeamInThree;
            maxPlayer = globalTeamSettings.maxPlayersFromSameTeamInThree;
            credit = globalTeamSettings.creditToThreeTeam;
            teamSelectionMessage = Lang.responseIn("SOCCER.TEAM_SELECTION_THREE_ERROR", req.headers.lang);
        }else{
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_FORMAT", req.headers.lang),
                error:true,
                data:{}
            })
        }
        if(teamCount < minPlayer || teamCount > maxPlayer){

            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: teamSelectionMessage,
                error:true,
                data:{}
            })
        }
        if(totalRatings > credit ){

            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_RATINGS_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        let newUserTeam = new UserFootBallTeam({
            _userId,
            _dfsContestId,
            _matchId,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp()
        })
        // let userTeamData = await newUserTeam.save();
        let userTeamData = await newUserTeam.save({session});
        // let isTeamExist = await UserFootBallTeam.findOne({_id : userTeamData._id, _userId: _userId, _dfsContestId : dfsData._id, _matchId: dfsData._matchId})

        // if(!isTeamExist){
        //     return res.status(400).send({
        //         status:constants.STATUS_CODE.FAIL,
        //         message: Lang.responseIn("SOCCER.CONTEST_ENROLL_TEAM_ERROR", req.headers.lang),
        //         error:true,
        //         data:{}
        //     })
        // }
        for(let i=0;i<noOfGoalKeeper.length;i++){
            let goalKeeperData = await FootBallPlayerName.findOne({_id: noOfGoalKeeper[i].player, playerPosition : constants.PLAYER_POSITION.GOAL_KEEPER})
            if(!goalKeeperData){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            let selectTeamPlayer = new SelectFootBallTeamPlayer({
                gameWeek : isMatchExist.weekNumber,
                gameTeamId : goalKeeperData.teamId,
                _teamId : userTeamData._id,
                _playerId : noOfGoalKeeper[i].player,
                teamName : goalKeeperData.teamName,
                gamePlayerId : goalKeeperData.playerId,
                playerName : goalKeeperData.playerName,
                playerPosition : constants.PLAYER_POSITION.GOAL_KEEPER,
                playerRating : goalKeeperData.playerRating,
                playerRole : noOfGoalKeeper[i].playerRole,
                isCaptain : noOfGoalKeeper[i].isCaptain,
                isViceCaptain : noOfGoalKeeper[i].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }

        for(let j=0;j<noOfDefender.length;j++){
            let defenderData = await FootBallPlayerName.findOne({_id: noOfDefender[j].player, playerPosition : constants.PLAYER_POSITION.DEFENDER})
            if(!defenderData){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            let selectTeamPlayer = new SelectFootBallTeamPlayer({
                gameWeek : isMatchExist.weekNumber,
                gameTeamId : defenderData.teamId,
                _teamId : userTeamData._id,
                _playerId : noOfDefender[j].player,
                teamName : defenderData.teamName,
                gamePlayerId : defenderData.playerId,
                playerName : defenderData.playerName,
                playerPosition : constants.PLAYER_POSITION.DEFENDER,
                playerRating : defenderData.playerRating,
                playerRole : noOfDefender[j].playerRole,
                isCaptain : noOfDefender[j].isCaptain,
                isViceCaptain : noOfDefender[j].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }
        
        for(let k=0;k<noOfMidFielder.length;k++){
            let midfielderData = await FootBallPlayerName.findOne({_id: noOfMidFielder[k].player, playerPosition : constants.PLAYER_POSITION.MID_FIELDER})
            if(!midfielderData){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
                
            }
            let selectTeamPlayer = new SelectFootBallTeamPlayer({
                gameWeek : isMatchExist.weekNumber,
                gameTeamId : midfielderData.teamId,
                _teamId : userTeamData._id,
                _playerId : noOfMidFielder[k].player,
                teamName : midfielderData.teamName,
                gamePlayerId : midfielderData.playerId,
                playerName : midfielderData.playerName,
                playerPosition : constants.PLAYER_POSITION.MID_FIELDER,
                playerRating : midfielderData.playerRating,
                playerRole : noOfMidFielder[k].playerRole,
                isCaptain : noOfMidFielder[k].isCaptain,
                isViceCaptain : noOfMidFielder[k].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }
        
        for(let l=0;l<noOfAttacker.length;l++){
            let attackerData = await FootBallPlayerName.findOne({_id: noOfAttacker[l].player, playerPosition : constants.PLAYER_POSITION.ATTACKER})
            if(!attackerData){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            let selectTeamPlayer = new SelectFootBallTeamPlayer({
                gameWeek : isMatchExist.weekNumber,
                gameTeamId : attackerData.teamId,
                _teamId : userTeamData._id,
                _playerId : noOfAttacker[l].player,
                teamName : attackerData.teamName,
                gamePlayerId : attackerData.playerId,
                playerName : attackerData.playerName,
                playerPosition : constants.PLAYER_POSITION.ATTACKER,
                playerRating : attackerData.playerRating,
                playerRole : noOfAttacker[l].playerRole,
                isCaptain : noOfAttacker[l].isCaptain,
                isViceCaptain : noOfAttacker[l].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        } 
       
        var walletHistoryObj = {
            _userId : _userId,
            _teamId : userTeamData._id,
            _dfsContestId : dfsData._id,
            dfsContestName : dfsData.contestName,
            amount : entryFee,
            competitionType : constants.COMPETITION_TYPE.DFS,
            transactionType : constants.TRANSACTION_TYPE.MINUS,
            transactionFor : constants.TRANSACTION_FOR.PARTICIPATE,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp()
        }
        
        let enrollFootBallDFSContest = new EnrollFootBallDFSContest({
            _userId: _userId,
            userName: user.userName,
            _dfsContestId: dfsData._id,
            _dfsTeamId : userTeamData._id,
            createdAt: dateFormat.setCurrentTimestamp(),
            updatedAt: dateFormat.setCurrentTimestamp()
        })

        if(reqdata._boosterId){
            if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.INVINCIBLES){
                enrollFootBallDFSContest.boosters = enrollFootBallDFSContest.boosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : userTeamData._id, playerIds : invincibles});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.CAPTAIN_BOOST){
                enrollFootBallDFSContest.boosters = enrollFootBallDFSContest.boosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : userTeamData._id, playerIds : captain});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.VICE_CAPTAIN_BOOST){
                enrollFootBallDFSContest.boosters = enrollFootBallDFSContest.boosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : userTeamData._id, playerIds : viceCaptain});
            }
        }
        // let enrollFootBallDFSContestData = await enrollFootBallDFSContest.save();
        let enrollFootBallDFSContestData = await enrollFootBallDFSContest.save({session});

        if(isUserBooster === constants.BOOSTER_ASSIGNED_BY.PRIVATE){
            
            // let boosteravail = await commonFunction.deductUserBoosters(_userId, reqdata._boosterId);
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

        let updatedDFSData, badgeUpdated = 0;
        if(enrollFootBallDFSContestData){
            
            // updatedDFSData = await FootBallDFSContest.updateOne({_id: _dfsContestId, _matchId : mongoose.Types.ObjectId(_matchId)},
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
                
                // await userWallets.save()
                await userWallets.save({session})

            }
        }
        
        let againEnrolledCount = await EnrollFootBallDFSContest.countDocuments({_userId, _dfsContestId:dfsData._id});
            console.log(againEnrolledCount, 'againEnrolledCount');
        if(dfsData.contestType === constants.CONTEST_TYPE.H2H){
            if(againEnrolledCount >= constants.H2H_PARTICIPANT_LIMIT){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("GENERAL.PARTICIPANT_LIMIT", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }else if(dfsData.contestType === constants.CONTEST_TYPE.REGULAR){
            if(againEnrolledCount >= constants.PARTICIPANT_LIMIT){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("GENERAL.PARTICIPANT_LIMIT", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }
        
        let participantCountBefore = await EnrollFootBallDFSContest.countDocuments({_dfsContestId: dfsData._id});
        console.log(participantCountBefore, 'participantCountBefore');
        if(dfsData.contestType !== constants.CONTEST_TYPE.H2H){
            if(participantCountBefore >= dfsData.maxParticipants){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.CONTEST_PARTICIPATE_FULL", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }

        if(dfsData.contestType === constants.CONTEST_TYPE.H2H){
            updatedDFSData = await FootBallDFSContest.updateOne({_id: _dfsContestId, _matchId : mongoose.Types.ObjectId(_matchId)},
            {
                $inc : {currentParticipants : 1}
            });

            if(updatedDFSData.nModified === 0){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.CONTEST_PARTICIPATE_FULL", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }else if(dfsData.contestType === constants.CONTEST_TYPE.REGULAR){
            updatedDFSData = await FootBallDFSContest.updateOne({_id: _dfsContestId, _matchId : mongoose.Types.ObjectId(_matchId), $expr: { $lt: [ "$currentParticipants" , "$maxParticipants" ] }},
            {
                $inc : {currentParticipants : 1}
            });

            if(updatedDFSData.nModified === 0){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.CONTEST_PARTICIPATE_FULL", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            
        }

        console.log('it comes till here');
        await session.commitTransaction();
        session.endSession();

        if(badgeUpdated == 1){
            await commonFunction.sendNotificationToFollower(user, constants.NOTIFICATION_STATUS.LEVEL_UP)
        }
        
        let againEnrolledCountAfter = await EnrollFootBallDFSContest.countDocuments({_userId, _dfsContestId:dfsData._id});
        console.log(againEnrolledCountAfter, 'againEnrolledCountAfter');
        let participantCountAfter = await EnrollFootBallDFSContest.countDocuments({_dfsContestId: dfsData._id});
        console.log(participantCountAfter, 'participantCountAfter');
        
        let userWallets = await commonFunction.getUserLatestBalance(_userId);
        
        res.status(201).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.USER_CONTEST_JOINED_SUCCESS", req.headers.lang),
            error: false,
            data: {enrollFootBallDFSContestData, userWallets}
        })
        logService.responseData(req, {enrollFootBallDFSContestData, userWallets, updatedDFSData});
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

//Update enrolled team in football DFS contest
exports.updateTeamInDFSContest = async (req, res, done) => {
    var session = await mongoose.startSession({
        readPreference: { mode: 'primary' }
      });
      session.startTransaction();
    try {
        const user = req.user;
        const _userId = user._id;
        const reqdata = req.body;

        const _dfsContestId = reqdata._dfsContestId;
        const _matchId = reqdata._matchId;
        const _dfsTeamId = reqdata._dfsTeamId;

        var currentTimeStamp = dateFormat.setCurrentTimestamp();      
        
        var globalTeamSettings = await GlobalTeamSettings.findOne();
        if(!globalTeamSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_TEAM_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        const isMatchExist = await FootBallLeagueWeek.findOne({_id: mongoose.Types.ObjectId(_matchId)});
            if(!isMatchExist){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.MATCH_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let matchTeamIds = []
            matchTeamIds.push(isMatchExist.localTeamId, isMatchExist.visitorTeamId)
        
        let dfsData = await FootBallDFSContest.findOne({_id: _dfsContestId, _matchId : mongoose.Types.ObjectId(_matchId)});
        
        if(!dfsData){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        if(dfsData.status != constants.DFS_STATUS.ENROLL){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_UPDATE_CONTEST_CLOSE", req.headers.lang),
                error:true,
                data:{}
            })
        }
      
        if(currentTimeStamp >= dfsData.enrollEndTime){
            return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_UPDATE_CONTEST_CLOSE", req.headers.lang),
                    error: true,
                    data: {}
                });
        }

        let enrolledTeam = await EnrollFootBallDFSContest.findOne({_dfsContestId, _dfsTeamId, _userId});

        if(!enrolledTeam){
            return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_NOT_FOUND", req.headers.lang),
                    error: true,
                    data: {}
                });
        }

        let entryFee = dfsData.entryFee;

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

            var isBoosterAvailable = await FootBallDFSContest.findOne({_id: _dfsContestId, _matchId : mongoose.Types.ObjectId(_matchId), boosters : { $elemMatch: { _boosterId , boosterCount: {$gt:0}}}});
            if(!isBoosterAvailable){
                if(entryFee === 0 ){

                    let appliedBooster = enrolledTeam.boosters

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

            if(reqdata.invincibles){
                invincibles = reqdata.invincibles;
            }

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
                    let player = await commonFunction.getPlayer(invincibles[a], matchTeamIds);
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

        let isTeamExist = await UserFootBallTeam.findOne({_id : _dfsTeamId, _userId, _dfsContestId, _matchId})

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

        let totalPlayer = noOfGoalKeeper.length + noOfDefender.length + noOfMidFielder.length + noOfAttacker.length
        let teamFormat = dfsData.teamFormat;

        if(teamFormat === constants.TEAM_FORMAT.ELEVEN){
            if(noOfGoalKeeper.length !== goalKeeperCount || noOfGoalKeeper.length != globalTeamSettings.minNoOfGoalKeeper){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfDefender.length !== defenderCount || noOfDefender.length < globalTeamSettings.minNoOfDefender || noOfDefender.length > globalTeamSettings.maxNoOfDefender){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfMidFielder.length !== midFielderCount || noOfMidFielder.length < globalTeamSettings.minNoOfMidfielders || noOfMidFielder.length > globalTeamSettings.maxNoOfMidfielders){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfAttacker.length !== attackerCount || noOfAttacker.length < globalTeamSettings.minNoOfStrikers || noOfAttacker.length > globalTeamSettings.maxNoOfStrikers){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(totalPlayer != teamFormat){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }     
        }else if(teamFormat === constants.TEAM_FORMAT.THREE){
            if(noOfGoalKeeper.length !== goalKeeperCount || noOfGoalKeeper.length != globalTeamSettings.minNoOfGoalKeeper){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfDefender.length !== defenderCount || noOfDefender.length < constants.TEAM_FORMAT.MIN_DEFENDER_IN_THREE_IN_DFS || noOfDefender.length > constants.TEAM_FORMAT.MAX_DEFENDER_IN_THREE_IN_DFS){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfMidFielder.length !== midFielderCount || noOfMidFielder.length < constants.TEAM_FORMAT.MIN_MID_FIELDER_IN_THREE_IN_DFS || noOfMidFielder.length > constants.TEAM_FORMAT.MAX_MID_FIELDER_IN_THREE_IN_DFS){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfAttacker.length !== attackerCount || noOfAttacker.length < constants.TEAM_FORMAT.MIN_ATTACKER_IN_THREE_IN_DFS || noOfAttacker.length > constants.TEAM_FORMAT.MAX_ATTACKER_IN_THREE_IN_DFS){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(totalPlayer != teamFormat){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }else{
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_VALIDATION", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        let captain, viceCaptain;
        let captainCount = 0;
        let viceCaptainCount = 0;
        let totalRatings = 0;
        let playerArr = [];
        let playerIDS = [];

        for(let i=0;i<noOfGoalKeeper.length;i++){

            let gkPlayerRating = await commonFunction.getPlayerRatings(noOfGoalKeeper[i].player, matchTeamIds, constants.PLAYER_POSITION.GOAL_KEEPER);
            if(gkPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
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
            playerIDS.push(noOfGoalKeeper[i].player);
        }
        for(let j=0;j<noOfDefender.length;j++){
            let dPlayerRating = await commonFunction.getPlayerRatings(noOfDefender[j].player, matchTeamIds, constants.PLAYER_POSITION.DEFENDER);
            if(dPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
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
            playerIDS.push(noOfDefender[j].player);
        }
        for(let k=0;k<noOfMidFielder.length;k++){
            let mfPlayerRating = await commonFunction.getPlayerRatings(noOfMidFielder[k].player, matchTeamIds, constants.PLAYER_POSITION.MID_FIELDER);
            if(mfPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
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
            playerIDS.push(noOfMidFielder[k].player);
        }
        for(let l=0;l<noOfAttacker.length;l++){
            let aPlayerRating = await commonFunction.getPlayerRatings(noOfAttacker[l].player, matchTeamIds, constants.PLAYER_POSITION.ATTACKER);
            if(aPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
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
            playerIDS.push(noOfAttacker[l].player);
        }

        let sameIds = await commonFunction.findDuplicates(playerIDS);
        if(sameIds>0){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.SAME_PLAYER_IDS_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }

        if(reqdata._boosterId){

            if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.INVINCIBLES){
                let isIdExist = commonFunction.checkOneArrayValuesInOtherArray(playerIDS, invincibles)
    
                if(!isIdExist){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.INVINCIBLE_IDS_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
            }

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
        let teamCount = await commonFunction.teamCount(playerArr);
        let maxPlayer, minPlayer, credit, teamSelectionMessage;
        if(dfsData.teamFormat == constants.TEAM_FORMAT.ELEVEN){
            minPlayer = globalTeamSettings.minPlayersFromSameTeamInEleven;
            maxPlayer = globalTeamSettings.maxPlayersFromSameTeamInEleven;
            credit = globalTeamSettings.creditToElevenTeam;
            teamSelectionMessage = Lang.responseIn("SOCCER.TEAM_SELECTION_ELEVEN_ERROR", req.headers.lang);
        }else if(dfsData.teamFormat == constants.TEAM_FORMAT.THREE){
            minPlayer = globalTeamSettings.minPlayersFromSameTeamInThree;
            maxPlayer = globalTeamSettings.maxPlayersFromSameTeamInThree;
            credit = globalTeamSettings.creditToThreeTeam;
            teamSelectionMessage = Lang.responseIn("SOCCER.TEAM_SELECTION_THREE_ERROR", req.headers.lang);
        }else{
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_FORMAT", req.headers.lang),
                error:true,
                data:{}
            })
        }
        if(teamCount < minPlayer || teamCount > maxPlayer){

            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: teamSelectionMessage,
                error:true,
                data:{}
            })
        }
        if(totalRatings > credit ){

            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_SELECTION_RATINGS_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }

        //delete previous team
        let deletedTeam = await SelectFootBallTeamPlayer.deleteMany({_teamId : _dfsTeamId},{session});
        console.log(deletedTeam);
        
        for(let i=0;i<noOfGoalKeeper.length;i++){
            let goalKeeperData = await FootBallPlayerName.findOne({_id: noOfGoalKeeper[i].player, playerPosition : constants.PLAYER_POSITION.GOAL_KEEPER})
            if(!goalKeeperData){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            let selectTeamPlayer = new SelectFootBallTeamPlayer({
                gameWeek : isMatchExist.weekNumber,
                gameTeamId : goalKeeperData.teamId,
                _teamId : _dfsTeamId,
                _playerId : noOfGoalKeeper[i].player,
                teamName : goalKeeperData.teamName,
                gamePlayerId : goalKeeperData.playerId,
                playerName : goalKeeperData.playerName,
                playerPosition : constants.PLAYER_POSITION.GOAL_KEEPER,
                playerRating : goalKeeperData.playerRating,
                playerRole : noOfGoalKeeper[i].playerRole,
                isCaptain : noOfGoalKeeper[i].isCaptain,
                isViceCaptain : noOfGoalKeeper[i].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }
        
        for(let j=0;j<noOfDefender.length;j++){
            let defenderData = await FootBallPlayerName.findOne({_id: noOfDefender[j].player, playerPosition : constants.PLAYER_POSITION.DEFENDER})
            if(!defenderData){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            let selectTeamPlayer = new SelectFootBallTeamPlayer({
                gameWeek : isMatchExist.weekNumber,
                gameTeamId : defenderData.teamId,
                _teamId : _dfsTeamId,
                _playerId : noOfDefender[j].player,
                teamName : defenderData.teamName,
                gamePlayerId : defenderData.playerId,
                playerName : defenderData.playerName,
                playerPosition : constants.PLAYER_POSITION.DEFENDER,
                playerRating : defenderData.playerRating,
                playerRole : noOfDefender[j].playerRole,
                isCaptain : noOfDefender[j].isCaptain,
                isViceCaptain : noOfDefender[j].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }
        
        for(let k=0;k<noOfMidFielder.length;k++){
            let midfielderData = await FootBallPlayerName.findOne({_id: noOfMidFielder[k].player, playerPosition : constants.PLAYER_POSITION.MID_FIELDER})
            if(!midfielderData){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
                
            }
            let selectTeamPlayer = new SelectFootBallTeamPlayer({
                gameWeek : isMatchExist.weekNumber,
                gameTeamId : midfielderData.teamId,
                _teamId : _dfsTeamId,
                _playerId : noOfMidFielder[k].player,
                teamName : midfielderData.teamName,
                gamePlayerId : midfielderData.playerId,
                playerName : midfielderData.playerName,
                playerPosition : constants.PLAYER_POSITION.MID_FIELDER,
                playerRating : midfielderData.playerRating,
                playerRole : noOfMidFielder[k].playerRole,
                isCaptain : noOfMidFielder[k].isCaptain,
                isViceCaptain : noOfMidFielder[k].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }
        
        for(let l=0;l<noOfAttacker.length;l++){
            let attackerData = await FootBallPlayerName.findOne({_id: noOfAttacker[l].player, playerPosition : constants.PLAYER_POSITION.ATTACKER})
            if(!attackerData){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            let selectTeamPlayer = new SelectFootBallTeamPlayer({
                gameWeek : isMatchExist.weekNumber,
                gameTeamId : attackerData.teamId,
                _teamId : _dfsTeamId,
                _playerId : noOfAttacker[l].player,
                teamName : attackerData.teamName,
                gamePlayerId : attackerData.playerId,
                playerName : attackerData.playerName,
                playerPosition : constants.PLAYER_POSITION.ATTACKER,
                playerRating : attackerData.playerRating,
                playerRole : noOfAttacker[l].playerRole,
                isCaptain : noOfAttacker[l].isCaptain,
                isViceCaptain : noOfAttacker[l].isViceCaptain,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            // let selectTeamPlayerData = await selectTeamPlayer.save();
            let selectTeamPlayerData = await selectTeamPlayer.save({session});
        }

        if(reqdata._boosterId){
            let appliedBooster = enrolledTeam.boosters
            if(appliedBooster.length > 0) {
                for(let j=0;j<appliedBooster.length;j++){

                    if(appliedBooster[j].boosterAssignedBy === constants.BOOSTER_ASSIGNED_BY.PRIVATE){
                        
                        // await commonFunction.giveBoosterBackToUser(_userId, appliedBooster[j]._boosterId)
                        let giveBoosterBackToUser = await User.findOneAndUpdate({_id : _userId, boosters : { $elemMatch: { _boosterId : appliedBooster[j]._boosterId }}},{
                            $inc : {"boosters.$.boosterQty" : 1}
                            },{session})

                    }
                }               
            }

            enrolledTeam.boosters = [];
            if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.INVINCIBLES){
                enrolledTeam.boosters = enrolledTeam.boosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : _dfsTeamId, playerIds : invincibles});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.CAPTAIN_BOOST){
                enrolledTeam.boosters = enrolledTeam.boosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : _dfsTeamId, playerIds : captain});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.VICE_CAPTAIN_BOOST){
                enrolledTeam.boosters = enrolledTeam.boosters.concat({_boosterId, boosterCount, boosterAssignedBy : isUserBooster, teamIds : _dfsTeamId, playerIds : viceCaptain});
            }

        //    await enrolledTeam.save();
           await enrolledTeam.save({session});
           
           if(isUserBooster === constants.BOOSTER_ASSIGNED_BY.PRIVATE){

               // let boosteravail = await commonFunction.deductUserBoosters(_userId, reqdata._boosterId);
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

        await session.commitTransaction();
        session.endSession();

        let userTeam = await UserFootBallTeam.aggregate([
            {
                $match : {
                _id : mongoose.Types.ObjectId(_dfsTeamId),
                _userId
                }
            },
            {
                $lookup : {
                    from: "selectfootballteamplayers",
                    localField: "_id",
                    foreignField: "_teamId",
                    as: "players"
                }
            },
        ])

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

//Get live match, upcoming match, past match list for users
exports.getLiveUpComingPastFootBallDFSMatchDetails =  async (req, res) => {
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
            
            let liveContests = await EnrollFootBallDFSContest.aggregate([
                {
                    $lookup : {
                        from: 'footballdfscontests',
                        localField: '_dfsContestId',
                        foreignField: '_id',
                        as: '_dfsContestId',
                    }
                },
               {$match :  {_userId, "_dfsContestId.status" : {$in :[constants.DFS_STATUS.OPEN]}}},
               {
                   $project : {
                       "_dfsContestId._matchId" : 1,
                       "_dfsContestId._id" : 1
                   }
               }
            ])
        
            let liveMatchIds = [];
            let liveContestIds = [];
            for(let k=0;k<liveContests.length;k++){
                let liveCon =  liveContests[k]._dfsContestId
                for(let a=0; a<liveCon.length;a++){
                    liveMatchIds.push(liveCon[a]._matchId)
                    liveContestIds.push(liveCon[a]._id)
                }
            }

            var liveMatchData = await FootBallLeagueWeek.aggregate([
                {$match : {_id : {$in : liveMatchIds}}}
            ])
            .sort({startTime : 1})
            .collation({ locale: "en" });

            for(let f=0;f<liveMatchData.length;f++){
                liveMatchData[f].contestCount = await FootBallDFSContest.countDocuments({_matchId : liveMatchData[f]._id, _id : {$in : liveContestIds}})
            }
            
            let upComingContests = await EnrollFootBallDFSContest.aggregate([
                {
                    $lookup : {
                        from: 'footballdfscontests',
                        localField: '_dfsContestId',
                        foreignField: '_id',
                        as: '_dfsContestId',
                    }
                },
               {$match :  {_userId, "_dfsContestId.status" : {$in :[constants.DFS_STATUS.ENROLL, constants.DFS_STATUS.CONFIRMED]}}},
               {
                $project : {
                    "_dfsContestId._matchId" : 1,
                    "_dfsContestId._id" : 1
                }
               }
            ])

            let upComingMatchIds = [];
            let upComingContestIds = [];
            for(let j=0;j<upComingContests.length;j++){
                let upComingCon =  upComingContests[j]._dfsContestId
                for(let b=0; b<upComingCon.length;b++){
                    upComingMatchIds.push(upComingCon[b]._matchId)
                    upComingContestIds.push(upComingCon[b]._id)
                }
            }
            
            var upComingMatchData = await FootBallLeagueWeek.aggregate([
                {$match : {_id : {$in : upComingMatchIds}}}
            ])
            .sort({startTime : 1})
            .collation({ locale: "en" });

            for(let e=0;e<upComingMatchData.length;e++){
                upComingMatchData[e].contestCount = await FootBallDFSContest.countDocuments({_matchId : upComingMatchData[e]._id, _id : {$in : upComingContestIds}})
            }
            
            let pastContests = await EnrollFootBallDFSContest.aggregate([
                {
                    $lookup : {
                        from: 'footballdfscontests',
                        localField: '_dfsContestId',
                        foreignField: '_id',
                        as: '_dfsContestId',
                    }
                },
               {$match :  {_userId, "_dfsContestId.status" : {$in :[constants.DFS_STATUS.CLOSED, constants.DFS_STATUS.CANCELLED]}}},
               {
                $project : {
                    "_dfsContestId._matchId" : 1,
                    "_dfsContestId._id" : 1
                }
               }
            ])
            
            let pastMatchIds = [];
            let pastContestIds = [];
            for(let i=0;i<pastContests.length;i++){
                let pastCon = pastContests[i]._dfsContestId
                for(let c=0;c<pastCon.length;c++){
                    pastMatchIds.push(pastCon[c]._matchId)
                    pastContestIds.push(pastCon[c]._id)
                }
            }

            var total = await FootBallLeagueWeek.countDocuments({$and :[{startTime :{$lte : currentTimeStamp}},{_id : {$in: pastMatchIds}}]})
            var pastMatchData = await FootBallLeagueWeek.aggregate([
                {$match : {$and :[{startTime :{$lte : currentTimeStamp}},{_id : {$in: pastMatchIds}}]}},       
            ])
            .sort({startTime : -1})
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

            for(let d=0;d<pastMatchData.length;d++){
                pastMatchData[d].contestCount = await FootBallDFSContest.countDocuments({_matchId : pastMatchData[d]._id, _id : {$in : pastContestIds}})
            }
            
            var page = pageOptions.page ;
            var limit = pageOptions.limit;

            logService.responseData(req, {liveMatchData, upComingMatchData, pastMatchData});
            if(page != 1){
                res.status(200).send({
                    status: constants.STATUS_CODE.SUCCESS,
                    message: Lang.responseIn("SOCCER.MATCH_LIST", req.headers.lang),
                    error: false,
                    // data: {footballMatches, page, limit, total},
                    data: {pastMatchData : {pastMatchData, page, limit, total}}
                    });
                    // logService.responseData(req, pastMatchData);    
            }else{
                res.status(200).send({
                    status: constants.STATUS_CODE.SUCCESS,
                    message: Lang.responseIn("SOCCER.MATCH_LIST", req.headers.lang),
                    error: false,
                    // data: {footballMatches, page, limit, total},
                    data: {liveMatchData, upComingMatchData, pastMatchData : {pastMatchData, page, limit, total}}
                    });
                    // logService.responseData(req, {liveMatchData, upComingMatchData, pastMatchData : {pastMatchData, page, limit, total}});
            }
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

//Get live past dfs contest list for users
exports.getPastFootBallDFSEnrolledContests =  async (req, res) => {
    try {
        let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());            
        let _matchId = req.params._matchId;
        const _userId = req.user._id;

        const pageOptions = {
            page: parseInt(req.query.page) || constants.PAGE,
            limit: parseInt(req.query.limit) || constants.LIMIT
        }

        let pastDFSContestDataTotal = await EnrollFootBallDFSContest.aggregate([
            {
                $lookup : {
                    from: 'footballdfscontests',
                    localField: '_dfsContestId',
                    foreignField: '_id',
                    as: '_dfsContestId',
                }
            },
            { $unwind: '$_dfsContestId' },
            {$match : { $and: [{_userId }, {"_dfsContestId._matchId": mongoose.Types.ObjectId(_matchId)}, {"_dfsContestId.status": {$in : [constants.DFS_STATUS.CANCELLED, constants.DFS_STATUS.CLOSED]}}]}},
        ])
        let total = pastDFSContestDataTotal.length;

        var pastDFSContestData = await EnrollFootBallDFSContest.aggregate([
            {
                $lookup : {
                    from: 'footballdfscontests',
                    localField: '_dfsContestId',
                    foreignField: '_id',
                    as: '_dfsContestId',
                }
            },
            { $unwind: '$_dfsContestId' },
            { $addFields: 
                { 
                    currentTimeStamp,
                    participatedIn: constants.USER.PARTICIPANT,
                    participantCount : constants.DEFAULT_NUMBER,
                    rank : constants.USER_DFS_STATUS.NOT_ATTENDED,
                    totalPointsEarned : constants.USER_DFS_STATUS.NOT_ATTENDED,
                    leaderBoardStatus: constants.USER_DFS_STATUS.LEADERBOARD_NOT_GENERATED,
                    spotLeft: {$subtract: [ "$_dfsContestId.maxParticipants", "$_dfsContestId.currentParticipants" ]}
                }
            },
            {$match : { $and: [{_userId }, {"_dfsContestId._matchId": mongoose.Types.ObjectId(_matchId)}, {"_dfsContestId.status": {$in : [constants.DFS_STATUS.CANCELLED, constants.DFS_STATUS.CLOSED]}}]}},
        ])
        .sort({"_dfsContestId.startTime": -1})
        .skip((pageOptions.page - 1) * pageOptions.limit)
        .limit(pageOptions.limit)
        .collation({ locale: "en" });

        for(let a=0; a<pastDFSContestData.length;a++){
            let count = await EnrollFootBallDFSContest.countDocuments({_userId , _dfsContestId : pastDFSContestData[a]._dfsContestId._id})
            pastDFSContestData[a].participantCount = count;
            let leaderBoard = await DFSWinnerListWithPrizeAmount.findOne({_dfsContestId : mongoose.Types.ObjectId(pastDFSContestData[a]._dfsContestId._id), _dfsTeamId : pastDFSContestData[a]._dfsTeamId, _userId })
            if(leaderBoard){
                pastDFSContestData[a].leaderBoardStatus = constants.USER_DFS_STATUS.LEADERBOARD_GENERATED;
                pastDFSContestData[a].rank = leaderBoard.rank;
                pastDFSContestData[a].totalPointsEarned = leaderBoard.totalPointsEarned;
            }
            let pastBoosterAvailable = pastDFSContestData[a]._dfsContestId.boosters
            for(let b=0;b<pastBoosterAvailable.length;b++){
                let boosterDetails = await GlobalBoosterSettings.findOne({_id : pastBoosterAvailable[b]._boosterId});
                pastBoosterAvailable[b].boosterName = boosterDetails.boosterName;
                pastBoosterAvailable[b].boosterType = boosterDetails.boosterType;
            }
            let pastBooster = pastDFSContestData[a].boosters
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
            data: {pastDFSContestData, page, limit, total}
            });
            // logService.responseData(req, {pastDFSContestData, page, limit, total});

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

//Find all enrolled football dfs details
exports.getEnrolledFootBallDFSContestDetails =  async (req, res) => {
    try {
            let _matchId = req.params._matchId;
            const _userId = req.user._id;
            let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            let field, value; 
            // const search = req.query.q ? req.query.q : ''; // for searching
            if (req.query.sortBy) {
                const parts = req.query.sortBy.split(':');
                field = parts[0];
                parts[1] ==='desc' ? value=-1 : value= 1;
            }else{
                field = "_dfsContestId.startTime",
                value = 1;
            }
            const pageOptions = {
                page: parseInt(req.query.page) || constants.PAGE,
                limit: parseInt(req.query.limit) || constants.LIMIT
            }
            // var query = {
            //     _userId 
            // }

            // if (search) {
            //     query.$or = [
            //         { '_dfsContestId.contestName': new RegExp(search, 'i') },
            //     ]
            // }
            
            let totalDFSContestData = await EnrollFootBallDFSContest.aggregate([
                {
                    $lookup : {
                        from: 'footballdfscontests',
                        localField: '_dfsContestId',
                        foreignField: '_id',
                        as: '_dfsContestId',
                    }
                },
                { $unwind: '$_dfsContestId' },
                {$match : {$and: [{_userId }, {"_dfsContestId._matchId" : mongoose.Types.ObjectId(_matchId)}, {"_dfsContestId.status": {$in: [constants.DFS_STATUS.ENROLL, constants.DFS_STATUS.OPEN, constants.DFS_STATUS.CONFIRMED]}}]}},
            ])
            let total = totalDFSContestData.length;

            var dfsContestData = await EnrollFootBallDFSContest.aggregate([
                {
                    $lookup : {
                        from: 'footballdfscontests',
                        localField: '_dfsContestId',
                        foreignField: '_id',
                        as: '_dfsContestId',
                    }
                },
                { $unwind: '$_dfsContestId' },
                { $addFields: 
                    { 
                        currentTimeStamp,
                        participatedIn: constants.USER.PARTICIPANT,
                        participantCount : constants.DEFAULT_NUMBER,
                        rank : constants.USER_DFS_STATUS.NOT_ATTENDED,
                        totalPointsEarned : constants.USER_DFS_STATUS.NOT_ATTENDED,
                        leaderBoardStatus: constants.USER_DFS_STATUS.LEADERBOARD_NOT_GENERATED,
                        spotLeft: {$subtract: [ "$_dfsContestId.maxParticipants", "$_dfsContestId.currentParticipants" ]}
                    }
                },
                {$match : {$and: [{_userId }, {"_dfsContestId._matchId" : mongoose.Types.ObjectId(_matchId)}, {"_dfsContestId.status": {$in: [constants.DFS_STATUS.ENROLL, constants.DFS_STATUS.OPEN, constants.DFS_STATUS.CONFIRMED]}}]}},
            ])
            .sort({[field]:value})
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

            var page = pageOptions.page ;
            var limit = pageOptions.limit;

            for(let a=0; a<dfsContestData.length;a++){
                let count = await EnrollFootBallDFSContest.countDocuments({_userId , _dfsContestId : dfsContestData[a]._dfsContestId._id})
                dfsContestData[a].participantCount = count;
                let leaderBoard = await DFSWinnerListWithPrizeAmount.findOne({_dfsContestId : mongoose.Types.ObjectId(dfsContestData[a]._dfsContestId._id), _userId })
                if(leaderBoard){
                    dfsContestData[a].leaderBoardStatus = constants.USER_DFS_STATUS.LEADERBOARD_GENERATED;
                    dfsContestData[a].rank = leaderBoard.rank;
                    dfsContestData[a].totalPointsEarned = leaderBoard.totalPointsEarned;
                }
                let boosterAvailable = dfsContestData[a]._dfsContestId.boosters
                for(let j=0;j<boosterAvailable.length;j++){
                    let boosterDetails = await GlobalBoosterSettings.findOne({_id : boosterAvailable[j]._boosterId});
                    boosterAvailable[j].boosterName = boosterDetails.boosterName;
                    boosterAvailable[j].boosterType = boosterDetails.boosterType;
                }
                let booster = dfsContestData[a].boosters
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
                data: {dfsContestData, total, page, limit}
            })
            // logService.responseData(req, {dfsContestData, total, page, limit});
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

//Find past enrolled football dfs details
exports.getPastEnrolledFootBallDFSContestDetails =  async (req, res) => {
    try {
            let currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            const _userId = req.user._id;
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
            // var query = {
            //     _userId 
            // }

            // if (search) {
            //     query.$or = [
            //         { '_dfsContestId.contestName': new RegExp(search, 'i') },
            //     ]
            // }

            var upcomingDFSContestData = await EnrollFootBallDFSContest.aggregate([
                {
                    $lookup : {
                        from: 'footballdfscontests',
                        localField: '_dfsContestId',
                        foreignField: '_id',
                        as: '_dfsContestId',
                    }
                },
                { $unwind: '$_dfsContestId' },
                { $addFields: 
                    { 
                        currentTimeStamp,
                        participatedIn: constants.USER.PARTICIPANT,
                        participantCount : constants.DEFAULT_NUMBER,
                        rank : constants.USER_DFS_STATUS.NOT_ATTENDED,
                        totalPointsEarned : constants.USER_DFS_STATUS.NOT_ATTENDED,
                        leaderBoardStatus: constants.USER_DFS_STATUS.LEADERBOARD_NOT_GENERATED,
                        spotLeft: {$subtract: [ "$_dfsContestId.maxParticipants", "$_dfsContestId.currentParticipants" ]}
                    }
                },
                {$match : {$and: [{_userId }, {"_dfsContestId.status": {$in: [constants.DFS_STATUS.ENROLL, constants.DFS_STATUS.OPEN, constants.DFS_STATUS.CONFIRMED]}}]}},
            ])
            .sort({"_dfsContestId.startTime" : 1})
            .collation({ locale: "en" });

            for(let i=0; i<upcomingDFSContestData.length;i++){
                let count = await EnrollFootBallDFSContest.countDocuments({_userId , _dfsContestId : upcomingDFSContestData[i]._dfsContestId._id})
                upcomingDFSContestData[i].participantCount = count;
                let leaderBoard = await DFSWinnerListWithPrizeAmount.findOne({_dfsContestId : mongoose.Types.ObjectId(upcomingDFSContestData[i]._dfsContestId._id), _userId })
                if(leaderBoard){
                    upcomingDFSContestData[a].leaderBoardStatus = constants.USER_DFS_STATUS.LEADERBOARD_GENERATED;
                    upcomingDFSContestData[a].rank = leaderBoard.rank;
                    upcomingDFSContestData[a].totalPointsEarned = leaderBoard.totalPointsEarned;
                }
                let boosterAvailable = upcomingDFSContestData[i]._dfsContestId.boosters
                for(let j=0;j<boosterAvailable.length;j++){
                    let boosterDetails = await GlobalBoosterSettings.findOne({_id : boosterAvailable[j]._boosterId});
                    boosterAvailable[j].boosterName = boosterDetails.boosterName;
                    boosterAvailable[j].boosterType = boosterDetails.boosterType;
                }
                let booster = upcomingDFSContestData[i].boosters
                for(let k=0;k<booster.length;k++){
                    let boosterDetails = await GlobalBoosterSettings.findOne({_id : booster[k]._boosterId});
                    booster[k].boosterName = boosterDetails.boosterName;
                    booster[k].boosterType = boosterDetails.boosterType;
                }
            }

            let pastDFSContestDataTotal = await EnrollFootBallDFSContest.aggregate([
                {
                    $lookup : {
                        from: 'footballdfscontests',
                        localField: '_dfsContestId',
                        foreignField: '_id',
                        as: '_dfsContestId',
                    }
                },
                { $unwind: '$_dfsContestId' },
                {$match : { $and: [{_userId }, {$or:[{"_dfsContestId.status": constants.DFS_STATUS.CANCELLED}, {"_dfsContestId.status": constants.DFS_STATUS.CLOSED}]}]}},
            ])
            let total = pastDFSContestDataTotal.length;

            var pastDFSContestData = await EnrollFootBallDFSContest.aggregate([
                {
                    $lookup : {
                        from: 'footballdfscontests',
                        localField: '_dfsContestId',
                        foreignField: '_id',
                        as: '_dfsContestId',
                    }
                },
                { $unwind: '$_dfsContestId' },
                { $addFields: 
                    { 
                        currentTimeStamp,
                        participatedIn: constants.USER.PARTICIPANT,
                        participantCount : constants.DEFAULT_NUMBER,
                        rank : constants.USER_DFS_STATUS.NOT_ATTENDED,
                        totalPointsEarned : constants.USER_DFS_STATUS.NOT_ATTENDED,
                        leaderBoardStatus: constants.USER_DFS_STATUS.LEADERBOARD_NOT_GENERATED,
                        spotLeft: {$subtract: [ "$_dfsContestId.maxParticipants", "$_dfsContestId.currentParticipants" ]}
                    }
                },
                {$match : { $and: [{_userId }, {$or:[{"_dfsContestId.status": constants.DFS_STATUS.CANCELLED}, {"_dfsContestId.status": constants.DFS_STATUS.CLOSED}]}]}},
            ])
            .sort({[field]:value})
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

            for(let a=0; a<pastDFSContestData.length;a++){
                let count = await EnrollFootBallDFSContest.countDocuments({_userId , _dfsContestId : pastDFSContestData[a]._dfsContestId._id})
                pastDFSContestData[a].participantCount = count;
                let leaderBoard = await DFSWinnerListWithPrizeAmount.findOne({_dfsContestId : mongoose.Types.ObjectId(pastDFSContestData[a]._dfsContestId._id), _userId })
                if(leaderBoard){
                    pastDFSContestData[a].leaderBoardStatus = constants.USER_DFS_STATUS.LEADERBOARD_GENERATED;
                    pastDFSContestData[a].rank = leaderBoard.rank;
                    pastDFSContestData[a].totalPointsEarned = leaderBoard.totalPointsEarned;
                }
                let pastBoosterAvailable = pastDFSContestData[a]._dfsContestId.boosters
                for(let b=0;b<pastBoosterAvailable.length;b++){
                    let boosterDetails = await GlobalBoosterSettings.findOne({_id : pastBoosterAvailable[b]._boosterId});
                    pastBoosterAvailable[b].boosterName = boosterDetails.boosterName;
                    pastBoosterAvailable[b].boosterType = boosterDetails.boosterType;
                }
                let pastBooster = pastDFSContestData[a].boosters
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
                message: Lang.responseIn("SOCCER.CONTEST_FOUND", req.headers.lang),
                error: false,
                data: {upcomingDFSContestData, pastDFSContestData, total, page, limit}
            })
            // logService.responseData(req, {upcomingDFSContestData, pastDFSContestData, total, page, limit});
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

//Create user DFS contest
exports.createUserDFSContest = async (req, res) => {
    var session = await mongoose.startSession({
        readPreference: { mode: 'primary' }
      });
      session.startTransaction();
    try {        
        let user = req.user;
        const _userId = req.user._id

        var reqdata = req.body
        var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        var _matchId = reqdata._matchId;
        let boosters = reqdata.boosters;
        
        var globalTeamSettings = await GlobalTeamSettings.findOne();
        if(!globalTeamSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_TEAM_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

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

        let matchTeamIds = []
        matchTeamIds.push(isMatchExist.localTeamId, isMatchExist.visitorTeamId)

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
        let boosterIds = [];
        for(let a=0; a<boosters.length;a++){
            boosterIds.push(boosters[a]._boosterId)
            var globalBoosterSettings = await GlobalBoosterSettings.findOne({_id : boosters[a]._boosterId, boosterType : {$in : [constants.BOOSTER_TYPE.CAPTAIN_BOOST, constants.BOOSTER_TYPE.VICE_CAPTAIN_BOOST, constants.BOOSTER_TYPE.INVINCIBLES]}});
            if(!globalBoosterSettings){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message:Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_SETTINGS_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

        }

        let sameBoosterIds = await commonFunction.findDuplicates(boosterIds);
        if(sameBoosterIds>0){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.SAME_BOOSTER_IDS_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
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
            
            if(reqdata.invincibles){
                invincibles = reqdata.invincibles;
            }

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
                    console.log('comes here');
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
                    let player = await commonFunction.getPlayer(invincibles[a], matchTeamIds);
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

        let entryFee = reqdata.entryFee;
        let totalPrize = reqdata.totalPrize;
        let adminProfitPercentage = globalGeneralSettings.adminProfitPercentage;

        // let value = (+totalPrize + (+totalPrize * (+adminProfitPercentage / 100))) / 2;
        
        //   entryFee: ((value * 100) / 100).toFixed(2)

        let maxParticipants, minParticipants;
        if(reqdata.contestType === constants.CONTEST_TYPE.H2H){
            
            value = ((+totalPrize + (+totalPrize * (+adminProfitPercentage / 100))) / 2).toFixed(2);
            // console.log((value * 100)/100);
            // console.log(value.toFixed(2));
            maxParticipants = constants.DEFAULT_VALUE;
            minParticipants = constants.DEFAULT_VALUE;
        }else{
            if(!reqdata.maxParticipants || !reqdata.minParticipants){
                return res.status(400).send({
                    status: constants.STATUS_CODE.VALIDATION,
                    message: Lang.responseIn("SOCCER.CONTEST_PARTICIPANT_LIMIT", req.headers.lang),
                    error: true,
                    data: {},
                  });
            }else{
                maxParticipants = reqdata.maxParticipants;
                minParticipants = reqdata.minParticipants;
                value = ((+totalPrize + (+totalPrize * (+adminProfitPercentage / 100))) / +maxParticipants).toFixed(2);
                console.log(value);
                // console.log(value.toFixed(2));
            }
        }

        if(parseFloat(value) != parseFloat(entryFee)){
            return res.status(400).send({
                status: constants.STATUS_CODE.VALIDATION,
                message: Lang.responseIn("SOCCER.ENTRY_FEE_ON_TOTAL_PRIZE_ERROR", req.headers.lang),
                error: true,
                data: {},
              });
        }

        let startTime = isMatchExist.startTime;
        let dayInMilisec = globalGeneralSettings.dayInMilisec;
        let diffInDays =  (startTime - currentTimeStamp)/dayInMilisec;

        let hourInMilisec = globalGeneralSettings.hourInMilisec;
        let diffInHours =  (startTime - currentTimeStamp)/hourInMilisec;

        if(diffInDays>globalGeneralSettings.dfsMaxStartDay || diffInHours<globalGeneralSettings.privateContestMinCreateTime){
            return   res.status(400).send({
              status: constants.STATUS_CODE.VALIDATION,
              message: Lang.responseIn("SOCCER.PRIVATE_CONTEST_CREATE_TIME_ERROR", req.headers.lang),
              error: true,
              data: {},
            });
        }
    
        let enrollStartTime = dateFormat.setCurrentTimestamp();
        if(startTime < enrollStartTime){
            return   res.status(400).send({
                status: constants.STATUS_CODE.VALIDATION,
                message: Lang.responseIn("SOCCER.CONTEST_ENROLL_TIME_ERROR", req.headers.lang),
                error: true,
                data: {},
            });
        }              
   
        let enrollEndTime = startTime - globalGeneralSettings.dfsEnrollEndTime;
        let totalBalance = user.referralBalance + user.winningBalance + user.depositBalance;
        

        if(entryFee <= 0){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.ENTRY_FEE_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }

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
        let teamFormat = reqdata.teamFormat;

        if(teamFormat === constants.TEAM_FORMAT.ELEVEN){
            if(noOfGoalKeeper.length !== goalKeeperCount || noOfGoalKeeper.length != globalTeamSettings.minNoOfGoalKeeper){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfDefender.length !== defenderCount || noOfDefender.length < globalTeamSettings.minNoOfDefender || noOfDefender.length > globalTeamSettings.maxNoOfDefender){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfMidFielder.length !== midFielderCount || noOfMidFielder.length < globalTeamSettings.minNoOfMidfielders || noOfMidFielder.length > globalTeamSettings.maxNoOfMidfielders){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfAttacker.length !== attackerCount || noOfAttacker.length < globalTeamSettings.minNoOfStrikers || noOfAttacker.length > globalTeamSettings.maxNoOfStrikers){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(totalPlayer != teamFormat){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }     
        }else if(teamFormat === constants.TEAM_FORMAT.THREE){
            if(noOfGoalKeeper.length !== goalKeeperCount || noOfGoalKeeper.length != globalTeamSettings.minNoOfGoalKeeper){
            
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfDefender.length !== defenderCount || noOfDefender.length < constants.TEAM_FORMAT.MIN_DEFENDER_IN_THREE_IN_DFS || noOfDefender.length > constants.TEAM_FORMAT.MAX_DEFENDER_IN_THREE_IN_DFS){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfMidFielder.length !== midFielderCount || noOfMidFielder.length < constants.TEAM_FORMAT.MIN_MID_FIELDER_IN_THREE_IN_DFS || noOfMidFielder.length > constants.TEAM_FORMAT.MAX_MID_FIELDER_IN_THREE_IN_DFS){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(noOfAttacker.length !== attackerCount || noOfAttacker.length < constants.TEAM_FORMAT.MIN_ATTACKER_IN_THREE_IN_DFS || noOfAttacker.length > constants.TEAM_FORMAT.MAX_ATTACKER_IN_THREE_IN_DFS){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_SELECTION_FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
    
            }else if(totalPlayer != teamFormat){
                
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_VALIDATION", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
        }else{
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_VALIDATION", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let captain, viceCaptain;
        let captainCount = 0;
        let viceCaptainCount = 0;
        let totalRatings = 0;
        let playerArr = [];
        let playerIDS = [];

        for(let i=0;i<noOfGoalKeeper.length;i++){

            let gkPlayerRating = await commonFunction.getPlayerRatings(noOfGoalKeeper[i].player, matchTeamIds, constants.PLAYER_POSITION.GOAL_KEEPER);
            if(gkPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
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
            playerIDS.push(noOfGoalKeeper[i].player);
        }
        for(let j=0;j<noOfDefender.length;j++){
            let dPlayerRating = await commonFunction.getPlayerRatings(noOfDefender[j].player, matchTeamIds, constants.PLAYER_POSITION.DEFENDER);
            if(dPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
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
            playerIDS.push(noOfDefender[j].player);
        }
        for(let k=0;k<noOfMidFielder.length;k++){
            let mfPlayerRating = await commonFunction.getPlayerRatings(noOfMidFielder[k].player, matchTeamIds, constants.PLAYER_POSITION.MID_FIELDER);
            if(mfPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
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
            playerIDS.push(noOfMidFielder[k].player);
        }
        for(let l=0;l<noOfAttacker.length;l++){
            let aPlayerRating = await commonFunction.getPlayerRatings(noOfAttacker[l].player, matchTeamIds, constants.PLAYER_POSITION.ATTACKER);
            if(aPlayerRating == null){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
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
                viceCaptain = noOfAttacker[l].player
            }
            totalRatings = totalRatings + aPlayerRating.playerRating;
            playerArr.push(mongoose.Types.ObjectId(noOfAttacker[l].player));
            playerIDS.push(noOfAttacker[l].player);
        }

        let sameIds = await commonFunction.findDuplicates(playerIDS);
        if(sameIds>0){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.SAME_PLAYER_IDS_ERROR", req.headers.lang),
                error:true,
                data:{}
            })
        }

        if(reqdata._boosterId){

            if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.INVINCIBLES){
                let isIdExist = commonFunction.checkOneArrayValuesInOtherArray(playerIDS, invincibles)
    
                if(!isIdExist){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.INVINCIBLE_IDS_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
            }

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
        let teamCount = await commonFunction.teamCount(playerArr);
        let maxPlayer, minPlayer, credit, teamSelectionMessage;
        if(teamFormat == constants.TEAM_FORMAT.ELEVEN){
            minPlayer = globalTeamSettings.minPlayersFromSameTeamInEleven;
            maxPlayer = globalTeamSettings.maxPlayersFromSameTeamInEleven;
            credit = globalTeamSettings.creditToElevenTeam;
            teamSelectionMessage = Lang.responseIn("SOCCER.TEAM_SELECTION_ELEVEN_ERROR", req.headers.lang);
        }else if(teamFormat == constants.TEAM_FORMAT.THREE){
            minPlayer = globalTeamSettings.minPlayersFromSameTeamInThree;
            maxPlayer = globalTeamSettings.maxPlayersFromSameTeamInThree;
            credit = globalTeamSettings.creditToThreeTeam;
            teamSelectionMessage = Lang.responseIn("SOCCER.TEAM_SELECTION_THREE_ERROR", req.headers.lang);
        }else{
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_FORMAT", req.headers.lang),
                error:true,
                data:{}
            })
        }
        if(teamCount < minPlayer || teamCount > maxPlayer){

            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: teamSelectionMessage,
                error:true,
                data:{}
            })
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
        const newFootBallDFSContest = new FootBallDFSContest({
            _createdBy : _userId,
            userName : user.userName,
            _matchId : _matchId,
            contestName: reqdata.contestName,
            startTime : startTime,
            enrollStartTime : enrollStartTime,
            enrollEndTime : enrollEndTime,
            entryFee: entryFee,
            maxParticipants: maxParticipants,
            minParticipants: maxParticipants,
            totalPrize,
            contestVisibility: constants.CONTEST_VISIBILITY.PRIVATE,
            contestType: reqdata.contestType,
            optionType: reqdata.optionType,
            teamFormat,
            playerLimit : reqdata.playerLimit,
            referralCode : referralCode,
            createdAt: dateFormat.setCurrentTimestamp(),
            updatedAt: dateFormat.setCurrentTimestamp()
          });
      
          // newTrivia.enrollEndTime = dateFormat.subtractHourAndSetDateToTimestamp(reqdata.startTime, globalGeneralSettings.triviaEnrollEndTime);
  
          for(let i=0;i<boosters.length;i++){
              newFootBallDFSContest.boosters = newFootBallDFSContest.boosters.concat({_boosterId : boosters[i]._boosterId, boosterCount : boosters[i].boosterCount});
          }
        //   var footBallDFSContestData = await newFootBallDFSContest.save();
          var footBallDFSContestData = await newFootBallDFSContest.save({session});
    
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
            // var footBallPrizeBreakDownsData = await newFootBallPrizeBreakDown.save();
            var footBallPrizeBreakDownsData = await newFootBallPrizeBreakDown.save({session});
            }
            let newUserTeam = new UserFootBallTeam({
                _userId,
                _dfsContestId : footBallDFSContestData._id,
                _matchId : footBallDFSContestData._matchId,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })
            // let userTeamData = await newUserTeam.save();
            let userTeamData = await newUserTeam.save({session});

            // let isTeamExist = await UserFootBallTeam.findOne({_id : userTeamData._id, _userId: _userId, _dfsContestId : footBallDFSContestData._id, _matchId: footBallDFSContestData._matchId})
    
            // if(!isTeamExist){
            //     return res.status(400).send({
            //         status:constants.STATUS_CODE.FAIL,
            //         message: Lang.responseIn("SOCCER.CONTEST_ENROLL_TEAM_ERROR", req.headers.lang),
            //         error:true,
            //         data:{}
            //     })
            // }

            for(let i=0;i<noOfGoalKeeper.length;i++){
                let goalKeeperData = await FootBallPlayerName.findOne({_id: noOfGoalKeeper[i].player, playerPosition : constants.PLAYER_POSITION.GOAL_KEEPER})
                if(!goalKeeperData){
                
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                let selectTeamPlayer = new SelectFootBallTeamPlayer({
                    gameWeek : isMatchExist.weekNumber,
                    gameTeamId : goalKeeperData.teamId,
                    _teamId : userTeamData._id,
                    _playerId : noOfGoalKeeper[i].player,
                    teamName : goalKeeperData.teamName,
                    gamePlayerId : goalKeeperData.playerId,
                    playerName : goalKeeperData.playerName,
                    playerPosition : constants.PLAYER_POSITION.GOAL_KEEPER,
                    playerRating : goalKeeperData.playerRating,
                    playerRole : noOfGoalKeeper[i].playerRole,
                    isCaptain : noOfGoalKeeper[i].isCaptain,
                    isViceCaptain : noOfGoalKeeper[i].isViceCaptain,
                    createdAt : dateFormat.setCurrentTimestamp(),
                    updatedAt : dateFormat.setCurrentTimestamp()
                })
    
                // let selectTeamPlayerData = await selectTeamPlayer.save();
                let selectTeamPlayerData = await selectTeamPlayer.save({session});
            }

            for(let j=0;j<noOfDefender.length;j++){
                let defenderData = await FootBallPlayerName.findOne({_id: noOfDefender[j].player, playerPosition : constants.PLAYER_POSITION.DEFENDER})
                if(!defenderData){
                
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                let selectTeamPlayer = new SelectFootBallTeamPlayer({
                    gameWeek : isMatchExist.weekNumber,
                    gameTeamId : defenderData.teamId,
                    _teamId : userTeamData._id,
                    _playerId : noOfDefender[j].player,
                    teamName : defenderData.teamName,
                    gamePlayerId : defenderData.playerId,
                    playerName : defenderData.playerName,
                    playerPosition : constants.PLAYER_POSITION.DEFENDER,
                    playerRating : defenderData.playerRating,
                    playerRole : noOfDefender[j].playerRole,
                    isCaptain : noOfDefender[j].isCaptain,
                    isViceCaptain : noOfDefender[j].isViceCaptain,
                    createdAt : dateFormat.setCurrentTimestamp(),
                    updatedAt : dateFormat.setCurrentTimestamp()
                })
    
                // let selectTeamPlayerData = await selectTeamPlayer.save();
                let selectTeamPlayerData = await selectTeamPlayer.save({session});
            }
            
            for(let k=0;k<noOfMidFielder.length;k++){
                let midfielderData = await FootBallPlayerName.findOne({_id: noOfMidFielder[k].player, playerPosition : constants.PLAYER_POSITION.MID_FIELDER})
                if(!midfielderData){
                    
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                        error:true,
                        data:{}
                    })
                    
                }
                let selectTeamPlayer = new SelectFootBallTeamPlayer({
                    gameWeek : isMatchExist.weekNumber,
                    gameTeamId : midfielderData.teamId,
                    _teamId : userTeamData._id,
                    _playerId : noOfMidFielder[k].player,
                    teamName : midfielderData.teamName,
                    gamePlayerId : midfielderData.playerId,
                    playerName : midfielderData.playerName,
                    playerPosition : constants.PLAYER_POSITION.MID_FIELDER,
                    playerRating : midfielderData.playerRating,
                    playerRole : noOfMidFielder[k].playerRole,
                    isCaptain : noOfMidFielder[k].isCaptain,
                    isViceCaptain : noOfMidFielder[k].isViceCaptain,
                    createdAt : dateFormat.setCurrentTimestamp(),
                    updatedAt : dateFormat.setCurrentTimestamp()
                })
    
                // let selectTeamPlayerData = await selectTeamPlayer.save();
                let selectTeamPlayerData = await selectTeamPlayer.save({session});
            }
            
            for(let l=0;l<noOfAttacker.length;l++){
                let attackerData = await FootBallPlayerName.findOne({_id: noOfAttacker[l].player, playerPosition : constants.PLAYER_POSITION.ATTACKER})
                if(!attackerData){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.PLAYER_NOT_FOUND", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                let selectTeamPlayer = new SelectFootBallTeamPlayer({
                    gameWeek : isMatchExist.weekNumber,
                    gameTeamId : attackerData.teamId,
                    _teamId : userTeamData._id,
                    _playerId : noOfAttacker[l].player,
                    teamName : attackerData.teamName,
                    gamePlayerId : attackerData.playerId,
                    playerName : attackerData.playerName,
                    playerPosition : constants.PLAYER_POSITION.ATTACKER,
                    playerRating : attackerData.playerRating,
                    playerRole : noOfAttacker[l].playerRole,
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
            _dfsContestId : footBallDFSContestData._id,
            dfsContestName : footBallDFSContestData.contestName,
            amount : entryFee,
            competitionType : constants.COMPETITION_TYPE.DFS,
            transactionType : constants.TRANSACTION_TYPE.MINUS,
            transactionFor : constants.TRANSACTION_FOR.PARTICIPATE,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp()
        }
        
        // await commonFunction.payEntryFees(user, totalBalance, footBallDFSContestData.entryFee, walletHistoryObj)

        let enrollFootBallDFSContest = new EnrollFootBallDFSContest({
            _userId,
            userName: user.userName,
            _dfsContestId:footBallDFSContestData._id,
            _dfsTeamId : userTeamData._id,
            createdAt: dateFormat.setCurrentTimestamp(),
            updatedAt: dateFormat.setCurrentTimestamp()
        })
        if(reqdata._boosterId){
            if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.INVINCIBLES){
                enrollFootBallDFSContest.boosters = enrollFootBallDFSContest.boosters.concat({_boosterId, boosterCount, teamIds : userTeamData._id, playerIds : invincibles});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.CAPTAIN_BOOST){
                enrollFootBallDFSContest.boosters = enrollFootBallDFSContest.boosters.concat({_boosterId, boosterCount, teamIds : userTeamData._id, playerIds : captain});
            }else if(globalBoosterSettings.boosterType === constants.BOOSTER_TYPE.VICE_CAPTAIN_BOOST){
                enrollFootBallDFSContest.boosters = enrollFootBallDFSContest.boosters.concat({_boosterId, boosterCount, teamIds : userTeamData._id, playerIds : viceCaptain});
            }
        }
        // let enrollFootBallDFSContestData = await enrollFootBallDFSContest.save();
        let enrollFootBallDFSContestData = await enrollFootBallDFSContest.save({session});
        let updatedDFSData, badgeUpdated = 0;
        if(enrollFootBallDFSContestData){
            
            updatedDFSData = await FootBallDFSContest.updateOne({_id: footBallDFSContestData._id, _matchId : mongoose.Types.ObjectId(_matchId)},
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
            await commonFunction.sendNotificationToFollower(user, constants.NOTIFICATION_STATUS.LEVEL_UP)
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
                }
            ])

            for(let j=0; j<dfsContestData.length;j++){
                let booster = dfsContestData[j].boosters
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
            data: {dfsContestData, userWallets}
            });
            logService.responseData(req, {dfsContestData, userWallets});
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

//Get a contest participated user list
exports.getContestParticipatedUserList = async (req, res) => {
    try {            

            var _dfsContestId = req.params._dfsContestId

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

            let total = await EnrollFootBallDFSContest.countDocuments({_dfsContestId})
            let participatedUsers = await EnrollFootBallDFSContest.find({_dfsContestId})
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

//Get a contest participated user list
exports.getContestParticipatedUserPlayerList = async (req, res) => {
    try {            

            var _dfsContestId = req.params._dfsContestId;
            var _dfsTeamId = req.params._dfsTeamId;
            let currentTimeStamp = parseInt(await dateFormat.setCurrentTimestamp());
            let isContestExist = await FootBallDFSContest.findOne({_id: _dfsContestId})
            if(!isContestExist){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            // let enrolledUser = await EnrollFootBallDFSContest.findOne({_dfsContestId, _userId : req.user._id})
            // if(!enrolledUser){
            //     return res.status(400).send({
            //         status:constants.STATUS_CODE.FAIL,
            //         message: Lang.responseIn("SOCCER.NOT_PARTICIPANT", req.headers.lang),
            //         error:true,
            //         data:{}
            //     })
            // }

            let participatedUsers = await EnrollFootBallDFSContest.findOne({_dfsContestId, _dfsTeamId})
            if(!participatedUsers){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            
            if(isContestExist.enrollEndTime > currentTimeStamp && (participatedUsers._userId).toString() !== (req.user._id).toString()){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.TEAM_VIEW_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }
            
            // let userTeam = await UserFootBallTeam.aggregate([
            //     {
            //         $match : {
            //         _id : mongoose.Types.ObjectId(_dfsTeamId),
            //         }
            //     },
            //     {
            //         $lookup : {
            //             from: "selectfootballteamplayers",
            //             localField: "_id",
            //             foreignField: "_teamId",
            //             as: "players"
            //         }
            //     },
            // ])

            let players = await SelectFootBallTeamPlayer.find({_teamId : _dfsTeamId});

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

//Get a AI match player list
exports.getAITeamPlayerList = async (req, res) => {
    try {            
            var reqdata = req.body;
            var _matchId = reqdata._matchId;
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
            const isMatchExist = await FootBallLeagueWeek.findOne({_id: _matchId});
            if(!isMatchExist){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.MATCH_NOT_FOUND", req.headers.lang),
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
            // if(isMatchExist.startTime < currentTimeStamp){
            //     return res.status(400).send({
                //         status:constants.STATUS_CODE.FAIL,
                //         message: Lang.responseIn("SOCCER.MATCH_CLOSE", req.headers.lang),
                //         error:true,
                //         data:{}
                //     })
            // }

            let goalKeeperCount, defenderCount, midFielderCount, attackerCount, givenGoalRatings, givenDefRatings, givenMidRatings, givenAttackRatings, team1MaxPlayer, team2MaxPlayer, credit, playerLimit;

            if(teamFormat === constants.TEAM_FORMAT.ELEVEN){
                credit = globalTeamSettings.creditToElevenTeam;   // open this when points flow completed
                // credit = 75;
                team1MaxPlayer = 6;
                team2MaxPlayer = 5;
                playerLimit = constants.TEAM_FORMAT.ELEVEN
            }else if(teamFormat === constants.TEAM_FORMAT.THREE){
                credit = globalTeamSettings.creditToThreeTeam;   // open this when points flow completed
                // credit = 25;
                team1MaxPlayer = 2;
                team2MaxPlayer = 1;
                playerLimit = constants.TEAM_FORMAT.THREE
            }

            // givenGoalRatings = ((credit * 10) /100)
            
            if(reqdata.goalKeeperCount || reqdata.goalKeeperCount === 0 ){
                goalKeeperCount = reqdata.goalKeeperCount;
                if(goalKeeperCount !== 1){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                if(teamFormat === constants.TEAM_FORMAT.ELEVEN){
                    givenGoalRatings = ((credit * 8) /100)
                }else{
                    givenGoalRatings = ((credit * 9) / 30)    
                }
            }else if(teamFormat === constants.TEAM_FORMAT.THREE){
                goalKeeperCount = 1;
                givenGoalRatings = ((credit * 9) / 30)
            }else{
                goalKeeperCount = 1;
                givenGoalRatings = ((credit * 8) /100)
            }

            if(reqdata.defenderCount || reqdata.defenderCount === 0){
                defenderCount = reqdata.defenderCount;
                if(teamFormat === constants.TEAM_FORMAT.THREE && defenderCount > 1){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                if(teamFormat === constants.TEAM_FORMAT.ELEVEN){
                    givenDefRatings = ((credit * ((defenderCount*35)/4)) /100);
                }else{
                    givenDefRatings = ((credit * ((defenderCount*37)/4)) / 30);
                }
            }else if(teamFormat === constants.TEAM_FORMAT.THREE){
                defenderCount = 1;
                givenDefRatings = ((credit * ((defenderCount*37)/4)) /30)
            }else{
                defenderCount = 4;
                givenDefRatings = ((credit * ((defenderCount*35)/4)) /100)
            }

            if(reqdata.midFielderCount || reqdata.midFielderCount === 0){
                midFielderCount = reqdata.midFielderCount;
                if(teamFormat === constants.TEAM_FORMAT.THREE && midFielderCount > 1){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                if(teamFormat === constants.TEAM_FORMAT.ELEVEN){
                    givenMidRatings = ((credit * ((midFielderCount*43)/4)) /100);
                }else{
                    givenMidRatings = ((credit * ((midFielderCount*49)/4)) / 30);
                }
                // givenMidRatings = ((credit / teamFormat) * midFielderCount)
            }else if(teamFormat === constants.TEAM_FORMAT.THREE){
                midFielderCount = 1;
                givenMidRatings = ((credit * ((midFielderCount*49)/4)) /30)
            }else{
                midFielderCount = 4;
                givenMidRatings = ((credit * ((midFielderCount*43)/4)) /100)
            }

            if(reqdata.attackerCount || reqdata.attackerCount === 0){
                attackerCount = reqdata.attackerCount;
                if(teamFormat === constants.TEAM_FORMAT.THREE && attackerCount > 1){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
                if(teamFormat === constants.TEAM_FORMAT.ELEVEN){
                    givenAttackRatings = ((credit * ((attackerCount*43)/4)) /100);
                }else{
                    givenAttackRatings = ((credit * ((attackerCount*49)/4)) / 30);
                }
                // givenAttackRatings = ((credit / teamFormat) * attackerCount)
            }else if(teamFormat === constants.TEAM_FORMAT.THREE){
                attackerCount = 0;
                givenAttackRatings = 0;
            }else{
                attackerCount = 2;
                givenAttackRatings = ((credit * ((attackerCount*43)/4)) /100)
            }

            let totalPlayerCount = goalKeeperCount + defenderCount + midFielderCount + attackerCount;

            if(teamFormat === constants.TEAM_FORMAT.ELEVEN) {
                if (defenderCount < 3 || defenderCount > 5){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                } else if (midFielderCount < 3 || midFielderCount > 5){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                } else if (attackerCount < 1 || attackerCount > 3) {
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                } else if(totalPlayerCount !== teamFormat){
                    return res.status(400).send({
                        status:constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                        error:true,
                        data:{}
                    })
                }
            }

            if(teamFormat === constants.TEAM_FORMAT.THREE && totalPlayerCount !== teamFormat){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SOCCER.FORMATION_ERROR", req.headers.lang),
                    error:true,
                    data:{}
                })
            }

            let localTeamId = isMatchExist.localTeamId;
            let visitorTeamId = isMatchExist.visitorTeamId;

            let totalGoalRating = givenGoalRatings / goalKeeperCount;
            let totalDefeRating = givenDefRatings / defenderCount;
            let totalMidRating = givenMidRatings / midFielderCount;
            let totalAttaRating = givenAttackRatings / attackerCount;

            let data = await requestHelper.getAITeam(localTeamId, visitorTeamId, totalGoalRating, goalKeeperCount, totalDefeRating, defenderCount, totalMidRating, midFielderCount, totalAttaRating, attackerCount, team1MaxPlayer, team2MaxPlayer, playerLimit);
           
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

//Get DFS winner list
exports.getDFSWinnerList =  async (req, res) => {
    try {
        let _dfsContestId = req.params._dfsContestId;
        let _dfsTeamId = req.params._dfsTeamId;

            let dfsData = await EnrollFootBallDFSContest.findOne({_dfsContestId, _dfsTeamId})
            if(!dfsData){
                return res.status(400).send({
                            status:constants.STATUS_CODE.FAIL,
                            message: Lang.responseIn("SOCCER.CONTEST_NOT_FOUND", req.headers.lang),
                            error:true,
                            data:{}
                        })
            }
            var field, value; 
            
            var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
            
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
                _dfsContestId: dfsData._dfsContestId,
            }
            if (search) {
                query.$or = [
                    { 'userName': new RegExp(search, 'i') }
                ]
            }
        var myRank = await DFSWinnerListWithPrizeAmount.findOne({_dfsContestId:_dfsContestId, _dfsTeamId, _userId : req.user._id})
        let total = await DFSWinnerListWithPrizeAmount.countDocuments(query);
        let dfsWinnerListWithPrizeAmountData = await DFSWinnerListWithPrizeAmount.aggregate([
            {$match : query},
            // {$lookup:   {
            //                 from: "enrollfootballdfscontests",
            //                 localField: "_dfsTeamId",
            //                 foreignField: "_dfsTeamId",
            //                 as: "boosterDetails"
            //             }
            // },
            // {
            //     $unwind:"$boosterDetails"
            // },
            // {$lookup:   {
            //                 from: "globalboostersettings",
            //                 localField: "boosterDetails.boosters._boosterId",
            //                 foreignField: "_id",
            //                 as: "boosterDetails.boosterType"
            //             }
            // },
            // {
            //     $unwind : "$boosterDetails.boosterType"
            // },
            { $addFields: 
                { 
                    hasValue : { $cond: [ { $eq: [ "$rank", null ] }, 2, 1 ] },
                }
            },
            // {
            //     $project:{
            //         "totalPointsEarned" : 1,
            //         "_userId" : 1,
            //         "userName" : 1,
            //         "_dfsTeamId" : 1,
            //         "_dfsContestId" : 1,
            //         "rank" : 1,
            //         "prizeAmountEarned" : 1,
            //         "boosterDetails.boosters" : 1,
            //         "boosterDetails.boosterType.boosterName" : 1,
            //         "boosterDetails.boosterType.boosterType" : 1,
            //     }
            // }
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
            // data: {myRank, triviaWinnerListWithPrizeAmountData, triviaNotRanker, total}
            data: {myRank, dfsWinnerListWithPrizeAmountData, page, limit, total}
        })
        // logService.responseData(req, {myRank, dfsWinnerListWithPrizeAmountData, page, limit, total});
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

//Get team image
exports.getTeamImage = async (req, res) => {
    try {
        let teamId = req.params.gameTeamId;

        let teamDetails = await FootBallTeamName.findOne({teamId},{teamImage : 1, _id : 0})

        let teamImage;

        if(teamDetails === null || teamDetails.teamImage === null){
            teamImage = constants.DEFAULT_TEAM_IMAGE;
        }else{
            teamImage = teamDetails.teamImage;
        }
        
        res.setHeader('content-type', 'text/plain')
        res.status(200).send(teamImage)
        // logService.responseData(req, teamImage);
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

//Get player image
exports.getplayerImage = async (req, res) => {
    try {
        let playerId = req.params.gamePlayerId;

        let playerDetails = await FootBallPlayerName.findOne({playerId},{playerImage : 1, _id : 0})

        let playerImage;

        if(playerDetails === null || playerDetails.playerImage === null){
            playerImage = constants.DEFAULT_PLAYER_IMAGE;
        }else{
            playerImage = playerDetails.playerImage;
        }
        
        res.setHeader('content-type', 'text/plain')
        res.status(200).send(playerImage)
        // logService.responseData(req, playerImage);
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
 * Get single player stats
 * @function
 * @param {ObjectId} _dfsTeamId - _dfsTeamId of user team.
 * @param {ObjectId} _playerId - _playerId of user team player.
 * @returns {Object} playerStats - Returns playerStats for that particular player.
 * It will find team for DFS contest from _dfsTeamId.
 * Then will aggregate it with selected player for that team.
 * Then will find player stats for particular player from _playerId.
 */
exports.getPlayerStats = async (req, res) => {
    try {
        let _dfsTeamId = req.params._dfsTeamId;
        let _playerId = req.params._playerId;

        let isTeamExist = await EnrollFootBallDFSContest.findOne({_dfsTeamId});

        if(!isTeamExist){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.TEAM_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        let playerStats = await EnrollFootBallDFSContest.aggregate([
            {
                $match : { "_dfsTeamId" : mongoose.Types.ObjectId(_dfsTeamId)}
            },
            {
                $lookup : {
                    from: "selectfootballteamplayers",
                    localField: "_dfsTeamId",
                    foreignField: "_teamId",
                    as: "_dfsTeamId"
                }
            },
            {
                $unwind : "$_dfsTeamId"
            },
            {
                $lookup : {
                    from: "footballdfscontests",
                    localField: "_dfsContestId",
                    foreignField: "_id",
                    as: "_dfsContestId"
                }
            },
            {
                $unwind : "$_dfsContestId"
            },
            {
                $match : { "_dfsTeamId._playerId" : mongoose.Types.ObjectId(_playerId)}
            },
            {
                $lookup : {
                    from: "liveplayerstats",
                    localField: "_dfsTeamId._playerId",
                    foreignField: "_playerId",
                    as: "_dfsTeamId.playerStats"
                }
            },
            {
                $unwind: {
                    path: '$_dfsTeamId.playerStats',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: 
                { 
                    _matchId1 : '$_dfsContestId._matchId',
                    _matchId2 : '$_dfsTeamId.playerStats._matchId',
                }
            },
            {
                $project : {
                    "_matchId1" : 1,
                    "_matchId2" : 1,
                    "totalPointsEarned" : 1,
                    "boosters" : 1,
                    "_dfsContestId._matchId" : 1,
                    "_dfsTeamId._teamId" : 1,
                    "_dfsTeamId.isCaptain" : 1,
                    "_dfsTeamId.isViceCaptain" : 1,
                    "_dfsTeamId.totalPoints" : 1,
                    "_dfsTeamId.playerStats" : 1,
                }
            }
        ])

        let matchSpecificPlayer = {};

        for(let a=0; a<playerStats.length;a++){
            let _matchId1 = (playerStats[a]._matchId1).toString();
            let _matchId2;

            if(playerStats[a]._matchId2){           
                _matchId2 = (playerStats[a]._matchId2).toString();
            }

            if(_matchId1 == _matchId2){
                matchSpecificPlayer = playerStats[a];
                let booster = playerStats[a].boosters
                for(let k=0;k<booster.length;k++){
                    let boosterDetails = await GlobalBoosterSettings.findOne({_id : booster[k]._boosterId});
                    booster[k].boosterName = boosterDetails.boosterName;
                    booster[k].boosterType = boosterDetails.boosterType;
                }
            }
        }

        let pointSystemDate = await EnrollFootBallDFSContest.aggregate([
            {
                $match : { "_dfsTeamId" : mongoose.Types.ObjectId(_dfsTeamId)}
            },
            {
                $lookup : {
                    from: "footballdfscontests",
                    localField: "_dfsContestId",
                    foreignField: "_id",
                    as: "_dfsContestId"
                }
            },
            {
                $unwind : "$_dfsContestId"
            },
            {
                $project : {
                    "_dfsContestId.createdAt" : 1
                }
            },
        ])
        
        let contestCreateDate = pointSystemDate[0]._dfsContestId.createdAt;

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
            data: {matchSpecificPlayer, pointSystem}
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