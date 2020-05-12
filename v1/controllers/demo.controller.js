const keys = require('../../keys/keys');
const constants = require('../../config/constants');
const soccer = require('../../config/soccer');
const commonFunction = require('../../helper/commonFunction.helper');
const sendSMS = require('../../services/sendSMS.service');
const Lang = require('../../helper/response.helper');
const logService = require('../../services/log.service');
const moment = require('moment');
const request = require('request');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const convert = require('xml-js');
const querystring = require('querystring');
// const smsMesaage = require('../../lang/sms');

const User = require('../../models/user.model');
const FootBallDFSContest = require('../../models/footBallDFSContest.model');
const EnrollFootBallDFSContest = require('../../models/enrollFootBallDFSContest.model');
const FootBallLeagueSchedule = require('../../models/footBallLeagueSchedules.model');
const FootBallLeagueWeek = require('../../models/footBallLeagueWeeks.model');
const WalletHistory = require('../../models/walletHistory.model');
const GlobalGeneralSettings = require('../../models/globalGeneralSettings.model');
const LivePlayerStates = require('../../models/livePlayerStats.model');
const FootBallPlayerNames = require('../../models/footBallPlayerNames.model');
const UserFootBallTeam = require('../../models/userFootBallTeam.model');
const SelectFootBallTeamPlayer = require('../../models/selectFootBallTeamPlayer.model');
const GlobalPointSettings = require('../../models/globalPointSettings.model');
const GlobalTeamSettings = require('../../models/globalTeamSettings.model');
const TransactionHistory = require('../../models/transactionHistory.model');
const GlobalBoosterSettings = require('../../models/globalBoosterSettings.model');

const Trivia = require('../../models/trivia.model');
const EnrollTrivia = require('../../models/enrollTrivia.model');
const TriviaWinnerListWithPrizeAmount = require('../../models/triviaWinnerListwithPrizeAmounts.model');
const PrizeBreakDown = require('../../models/prizeBreakDown.model');
let appData = require("../../app");

const botController = require('./bot.controller');

const dateFormat = require('../../helper/dateFormate.helper');
const requestHelper = require('../../helper/requestHelper.helper');
const notificationService = require('../../services/notification');

exports.sendTextMessage = async (req, res) => {
    try{
        data = {
            name : "viral raval",
            amount : 100000
        }

        textContent = await commonFunction.replaceStringWithObjectData(smsMesaage.WELCOME_MESSAGE,data)

        data = await sendSMS('+918347587797',textContent);

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SMS.TWILIO_SMS_SEND_SUCCESS", req.headers.lang),
            error: false,
            data : data
        });
        // logService.responseData(req, data);
    }catch(error){
        console.log(error)
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        // logService.responseData(req, error);
    }
}

exports.getFeedData = async (req, res) => {
    try{
        date = '09.03.2020';
        getFeedData = await requestHelper.getFeedData(date);
    }catch(error){
        console.log(error);
    }
    res.send('Process Done');
};

exports.updatePoints = async (req, res) => {
    let matchSystemId = '5e4a82353af5110b4eb809a6';
    // updatePoints = await requestHelper.updateParticipantPointsForMatch(matchSystemId);
    updatePoints = await requestHelper.updateParticipantPointsForLeagueMatch(matchSystemId);
    return res.send('Done');
}

exports.addBots = async (req, res, next) => {
    try {

        BotUserToInsert = 10;
    
        botUser = await botController.addBotUserToPlatform(BotUserToInsert);

        if(botUser){
            console.log("Bot user created successfully");
        }
  
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("BOT.NEW_BOT_CREATED", req.headers.lang),
            error: false,
            data: {}
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: false,
            data: {}
        });
    }
};

exports.assignTeamToBot = async (req, res) => {
    try {
        //assign team to bot user of DFS contest
        // let assignTeamValue = 7;
        // let contestId = '5e020dc254b0e7319c9b48ff';
        // let matchId = '5e01ab14d8b24d029e8d73fd';
        // let data = await requestHelper.assignTeamToBot(contestId, contestName, entryFee, matchId, assignTeamValue);

        //assign team to bot user of League contest
        let assignTeamValue = 7;
        let contestId = '5e29a28183dc645697d93d9e';
        let contestName = 'contest name';
        let entryFee = 10;
        let data = await requestHelper.assignTeamToBotUserForLeague(contestId, contestName, entryFee, assignTeamValue);
        console.log(data);
    }catch(error){
        console.log(error)
    }
    res.send('Process Done');
}

exports.getUEFAFixture = async (req, res) => {
    try {
        let apiRequestParamsObj = _.cloneDeep(requestHelper.apiRequestParams);
        apiRequestParamsObj['LEAGUE_ID'] = soccer.LEAGUE.UEFA.LEAGUE_ID;
        apiRequestParamsObj['LEAGUE_NAME'] = await requestHelper.getKeyByValue(soccer.LEAGUES_NAME_CONVENTION, 'UEFA Champions League');
        apiRequestParamsObj['API_ROUTE'] = soccer.API_ROUTE.GET_LEAGUE_SCHEDULE;
        
        //generate url for retrive sport api
        let url = await requestHelper.generateUrlForSportAPI(apiRequestParamsObj);
        
        //call third party API and get result
        let result = await requestHelper.callApi(url);
        if(result){

            let tournament = result.results["tournament"];
            let tournamentSeason = result.results["tournament"]["@season"];
            let leagueName = result.results["tournament"]["@league"];
            let countryName = result.results["@country"];
            let leagueGameId = result.results["tournament"]["@id"];
    
            let leagueScheduleExist = await FootBallLeagueSchedule.findOne({"leagueId": soccer.LEAGUE.UEFA.LEAGUE_ID, "season" : tournamentSeason});
    
            if(!leagueScheduleExist){
                var uefaLeagueSchedule = new FootBallLeagueSchedule({
                    countryName : countryName,
                    leagueName : leagueName,
                    season : tournamentSeason,
                    leagueId : leagueGameId,
                    stageId : null,
                    createdAt : dateFormat.setCurrentTimestamp(),
                    updatedAt : dateFormat.setCurrentTimestamp(),
                })
                leagueScheduleExist = await uefaLeagueSchedule.save();
            }
    
            let stages = result.results["tournament"]["stage"]
            
            if(stages.length <= 0){
                console.log("Tournament stage is empty");
            }
    
            let qualifyingArr = [];
            let semiFinalArr = [];
            let groupStageArr = [];
    
            for(let i=0; i < stages.length; i++){
                if((stages[i]["@name"]=="Group Stage" && stages[i]["@round"]=="Group Stage")){
                    groupStageArr = _.concat(groupStageArr, stages[i]);
                }
    
                if((stages[i]["@name"]=="Preliminary Round - Final" && stages[i]["@round"]=="Knock Out")){
                    semiFinalArr = _.concat(semiFinalArr, stages[i]);
                }
    
                if((stages[i]["@name"]=="Preliminary Round - Semi-finals" && stages[i]["@round"]=="Knock Out")){
                    semiFinalArr = _.concat(semiFinalArr, stages[i]);
                }
    
                if((stages[i]["@name"]=="8th Finals" && stages[i]["@round"]=="Knock Out")){
                    qualifyingArr = _.concat(qualifyingArr, stages[i]);
                }
                    
                if((stages[i]["@name"]=="Play-offs" && stages[i]["@round"]=="Qualifying")){
                    qualifyingArr = _.concat(qualifyingArr, stages[i]);
                }
    
                if((stages[i]["@name"]=="3rd Qualifying Round" && stages[i]["@round"]=="Qualifying")){
                    qualifyingArr = _.concat(qualifyingArr, stages[i]);
                }
    
                if((stages[i]["@name"]=="2nd Qualifying Round" && stages[i]["@round"]=="Qualifying")){
                    qualifyingArr = _.concat(qualifyingArr, stages[i]);
                }
    
                if((stages[i]["@name"]=="1st Qualifying Round" && stages[i]["@round"]=="Qualifying")){
                    qualifyingArr = _.concat(qualifyingArr, stages[i]);
                }
            }
    
            //add all qualifying round matches into database
            if(qualifyingArr.length > 0){
                for(let n=0; n < qualifyingArr.length; n++){
                    let aggt = qualifyingArr[n]["aggregate"];
                    let stageName = qualifyingArr[n]["@name"];
                    let roundName = qualifyingArr[n]["@round"];
    
                    if(aggt != undefined){
                        //if aggregate has data then loop data
                        if(aggt.length > 0){
                            for(let l=0; l < aggt.length; l++){
                                let aggtMatch = aggt[l]["match"];
                
                                //checking for length of match array
                                if(aggtMatch.length > 0){
                                    for(let m=0; m < aggtMatch.length; m++){
                                        let isMatchExist = await FootBallLeagueWeek.findOne({matchStaticId : aggtMatch[m]["@static_id"]});
                
                                        let matchObj = {
                                            startMatchDate : aggtMatch[m]["@date"],
                                            startMatchTime : aggtMatch[m]["@time"],
                                            _leagueId : leagueScheduleExist._id,
                                            leagueName : leagueName,
                                            leagueSeason : tournamentSeason,
                                            gameId : leagueGameId,
                                            weekNumber : null,
                                            round : roundName,
                                            stage : stageName,
                                            startTime : dateFormat.setMatchDate(aggtMatch[m]["@date"] + ' ' + aggtMatch[m]["@time"]),
                                            matchStatus : aggtMatch[m]["@status"],
                                            matchVenue : aggtMatch[m]["@venue"],
                                            matchVenueId : aggtMatch[m]["@venue_id"],
                                            matchVenueCity : aggtMatch[m]["@venue_city"],
                                            matchStaticId : aggtMatch[m]["@static_id"],
                                            matchId : aggtMatch[m]["@id"],
                                            localTeam : aggtMatch[m]["localteam"]["@name"],
                                            localTeamId : aggtMatch[m]["localteam"]["@id"],
                                            visitorTeam : aggtMatch[m]["visitorteam"]["@name"],
                                            visitorTeamId : aggtMatch[m]["visitorteam"]["@id"],
                                            createdAt : dateFormat.setCurrentTimestamp(),
                                            updatedAt : dateFormat.setCurrentTimestamp()
                                        };
                
                                        if(!isMatchExist){
                                            let leagueWeek = new FootBallLeagueWeek(matchObj)
                                            let leagueWeekData = await leagueWeek.save();
                                        }else if(isMatchExist && isMatchExist.matchId != aggtMatch[m]["@id"]){
                                            let leagueWeek = new FootBallLeagueWeek(matchObj)
                                            let leagueWeekData = await leagueWeek.save();
                                            isMatchExist.status = constants.MATCH_STATUS.DELAY;
                                            await isMatchExist.save();
                                        }else if(isMatchExist && isMatchExist.gameId == null){
                                            isMatchExist.gameId = leagueGameId;
                                            await isMatchExist.save();
                                        }else if(isMatchExist && isMatchExist.startMatchDate !== aggtMatch[m]["@date"]){
                                            isMatchExist.startTime = dateFormat.setMatchDate(aggtMatch[m]["@date"] + ' ' + aggtMatch[m]["@time"]),
                                            isMatchExist.startMatchDate = aggtMatch[m]["@date"],
                                            isMatchExist.startMatchTime = aggtMatch[m]["@time"];
                                            isMatchExist.matchStatus = aggtMatch[m]["@status"];
                                            await isMatchExist.save();
                                        }else if(isMatchExist && isMatchExist.startMatchTime === "TBA"){
                                            isMatchExist.startTime = dateFormat.setMatchDate(aggtMatch[m]["@date"] + ' ' + aggtMatch[m]["@time"]),
                                            isMatchExist.startMatchDate = aggtMatch[m]["@date"],
                                            isMatchExist.startMatchTime = aggtMatch[m]["@time"];
                                            isMatchExist.matchStatus = aggtMatch[m]["@status"];
                                            await isMatchExist.save();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
    
            //add semifinal and final round matches into database
            if(semiFinalArr.length > 0){
                for(let m=0; m < semiFinalArr.length; m++){                
                    let matchDataObj = semiFinalArr[m]["match"];
                    let stageName = semiFinalArr[m]["@name"];
                    let roundName = semiFinalArr[m]["@round"];
                    let matchData = [];
    
                    if(matchDataObj.constructor === Object){
                        matchData[0] = matchDataObj;
                    }else{
                        matchData = matchDataObj;
                    }
    
                    if(matchData.length > 0){
                        for(let n=0; n < matchData.length; n++){
                            let isMatchExist = await FootBallLeagueWeek.findOne({matchStaticId : matchData[n]["@static_id"]});
        
                            let matchObj = {
                                startMatchDate : matchData[n]["@date"],
                                startMatchTime : matchData[n]["@time"],
                                _leagueId : leagueScheduleExist._id,
                                leagueName : leagueName,
                                leagueSeason : tournamentSeason,
                                gameId : leagueGameId,
                                weekNumber : null,
                                round : roundName,
                                stage : stageName,
                                startTime : dateFormat.setMatchDate(matchData[n]["@date"] + ' ' + matchData[n]["@time"]),
                                matchStatus : matchData[n]["@status"],
                                matchVenue : matchData[n]["@venue"],
                                matchVenueId : matchData[n]["@venue_id"],
                                matchVenueCity : matchData[n]["@venue_city"],
                                matchStaticId : matchData[n]["@static_id"],
                                matchId : matchData[n]["@id"],
                                localTeam : matchData[n]["localteam"]["@name"],
                                localTeamId : matchData[n]["localteam"]["@id"],
                                visitorTeam : matchData[n]["visitorteam"]["@name"],
                                visitorTeamId : matchData[n]["visitorteam"]["@id"],
                                createdAt : dateFormat.setCurrentTimestamp(),
                                updatedAt : dateFormat.setCurrentTimestamp()
                            };
                
                            if(!isMatchExist){
                                let leagueWeek = new FootBallLeagueWeek(matchObj)
                                let leagueWeekData = await leagueWeek.save();
                            }else if(isMatchExist && isMatchExist.matchId != matchData[n]["@id"]){
                                let leagueWeek = new FootBallLeagueWeek(matchObj)
                                let leagueWeekData = await leagueWeek.save();
                                isMatchExist.status = constants.MATCH_STATUS.DELAY;
                                await isMatchExist.save();
                            }else if(isMatchExist && isMatchExist.gameId == null){
                                isMatchExist.gameId = leagueGameId;
                                await isMatchExist.save();
                            }else if(isMatchExist && isMatchExist.startMatchDate !== matchData[n]["@date"]){
                                isMatchExist.startTime = dateFormat.setMatchDate(matchData[n]["@date"] + ' ' + matchData[n]["@time"]),
                                isMatchExist.startMatchDate = matchData[n]["@date"],
                                isMatchExist.startMatchTime = matchData[n]["@time"];
                                isMatchExist.matchStatus = matchData[n]["@status"];
                                await isMatchExist.save();
                            }else if(isMatchExist && isMatchExist.startMatchTime === "TBA"){
                                isMatchExist.startTime = dateFormat.setMatchDate(matchData[n]["@date"] + ' ' + matchData[n]["@time"]),
                                isMatchExist.startMatchDate = matchData[n]["@date"],
                                isMatchExist.startMatchTime = matchData[n]["@time"];
                                isMatchExist.matchStatus = matchData[n]["@status"];
                                await isMatchExist.save();
                            }
                        }
                    }
                }
            }
    
            //add group stage matches into database
            if(groupStageArr.length > 0){
                for(let q=0; q < groupStageArr.length; q++){
                    let week = groupStageArr[q]["week"];
                    let stageName = groupStageArr[q]["@name"];
                    let roundName = groupStageArr[q]["@round"];
    
                    if(week != undefined){
                        //if week has data then loop data
                        if(week.length > 0){
                            for(let j=0; j < week.length; j++){
                                let weekMatch = week[j]["match"];
                                let weekNumber = week[j]["@number"];
                
                                //checking for length of match array
                                if(weekMatch.length > 0){
                                    for(let k=0; k < weekMatch.length; k++){
                
                                        let isMatchExist = await FootBallLeagueWeek.findOne({matchStaticId : weekMatch[k]["@static_id"]});
                
                                        let matchObj = {
                                            startMatchDate : weekMatch[k]["@date"],
                                            startMatchTime : weekMatch[k]["@time"],
                                            _leagueId : leagueScheduleExist._id,
                                            leagueName : leagueName,
                                            leagueSeason : tournamentSeason,
                                            gameId : leagueGameId,
                                            weekNumber : weekNumber,
                                            round : roundName,
                                            stage : stageName,
                                            startTime : dateFormat.setMatchDate(weekMatch[k]["@date"] + ' ' + weekMatch[k]["@time"]),
                                            matchStatus : weekMatch[k]["@status"],
                                            matchVenue : weekMatch[k]["@venue"],
                                            matchVenueId : weekMatch[k]["@venue_id"],
                                            matchVenueCity : weekMatch[k]["@venue_city"],
                                            matchStaticId : weekMatch[k]["@static_id"],
                                            matchId : weekMatch[k]["@id"],
                                            localTeam : weekMatch[k]["localteam"]["@name"],
                                            localTeamId : weekMatch[k]["localteam"]["@id"],
                                            visitorTeam : weekMatch[k]["visitorteam"]["@name"],
                                            visitorTeamId : weekMatch[k]["visitorteam"]["@id"],
                                            createdAt : dateFormat.setCurrentTimestamp(),
                                            updatedAt : dateFormat.setCurrentTimestamp()
                                        };
                
                                        if(!isMatchExist){
                                            let leagueWeek = new FootBallLeagueWeek(matchObj)
                                            let leagueWeekData = await leagueWeek.save();
                                        }else if(isMatchExist && isMatchExist.matchId != weekMatch[k]["@id"]){
                                            let leagueWeek = new FootBallLeagueWeek(matchObj)
                                            let leagueWeekData = await leagueWeek.save();
                                            isMatchExist.status = constants.MATCH_STATUS.DELAY;
                                            await isMatchExist.save();
                                        }else if(isMatchExist && isMatchExist.gameId == null){
                                            isMatchExist.gameId = leagueGameId;
                                            await isMatchExist.save();
                                        }else if(isMatchExist && isMatchExist.startMatchDate !== weekMatch[k]["@date"]){
                                            isMatchExist.startTime = dateFormat.setMatchDate(weekMatch[k]["@date"] + ' ' + weekMatch[k]["@time"]);
                                            isMatchExist.startMatchDate = weekMatch[k]["@date"];
                                            isMatchExist.startMatchTime = weekMatch[k]["@time"];
                                            isMatchExist.matchStatus = weekMatch[k]["@status"];
                                            await isMatchExist.save();
                                        }else if(isMatchExist && isMatchExist.startMatchTime === "TBA"){
                                            isMatchExist.startTime = dateFormat.setMatchDate(weekMatch[k]["@date"] + ' ' + weekMatch[k]["@time"]);
                                            isMatchExist.startMatchDate = weekMatch[k]["@date"];
                                            isMatchExist.startMatchTime = weekMatch[k]["@time"];
                                            isMatchExist.matchStatus = weekMatch[k]["@status"];
                                            await isMatchExist.save();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }



    } catch (error) {
        console.log(error);
    }
    res.send("Process is done");
}

exports.checkUEFAMatchFixture = async (req, res) => {

    // date = '27.11.2019';

    // let matches = await FootBallLeagueWeek.countDocuments({startMatchDate: date});

    // if(matches > 0){
    //     let url = `https://www.goalserve.com/getfeed/${keys.GOAL_SERVE_API_KEY}/soccerfixtures/eurocups/champleague?json=1`
    //     let result = await requestHelper.callApi(url);

    //     matchDataObj = result.commentaries.tournament.match;

    //     let matchData = [];

    //     //if match data is in object format then convert it to Array
    //     if(matchDataObj.constructor === Object){
    //         matchData[0] = result.commentaries.tournament.match;
    //     }else{
    //         matchData = result.commentaries.tournament.match;
    //     }
        
    //     //if data not found then return
    //     if(matchData.length === 0){
    //         console.log('No any matches are running');
    //     }else{
    //         for(let j=0; j < matchData.length; j++){
    //             matchId = matchData[j]['@id'];
    //             matchDate = matchData[j]['@date'];
    //             matchTime = matchData[j]['@time'];

    //             let matchDetails = await FootBallLeagueWeek.findOne({matchId: matchId});

    //             if(matchDetails){
    //                 let matchStatus = matchDetails.matchStatus;
    //                 if((matchStatus == soccer.MATCH_STATUS.FT || matchStatus == soccer.MATCH_STATUS.PEN || matchStatus == soccer.MATCH_STATUS.AET)){
    //                     matchData.status = constants.MATCH_STATUS.MATCH_FINISHED;
    //                     let updatedData = await matchData.save();
                        
    //                 }
    //             }
    //             console.log(match);
    //             process.exit(1);
    //         }

    //     }
    // }    

    //console.log(matches);
    res.send('checkUEFAMatchFixture')
}

exports.updateMatchPointsForCancelledMatch = async (req, res) => {

    //for update participants points on real match cancelled
    // let matchSystemId = '5e01ab8152d30602b207b5e4';
    // result = await requestHelper.updateParticipantPointsForLeagueMatch(matchSystemId);

    //for update game week points on game week finished
    // let contestId = "5e31b19cbfd539128a62f847";
    // let contestType = 2;
    // let teamId = "5e31b574c22e4f12ee7c28e7";
    // let weekNumber = "13";
    // let result = await requestHelper.updateGameWeekPointsForParticipantsOnGameWeekFinish(contestId, contestType, teamId, weekNumber);

    //for get status of game week that is closed or conflicted
    // let leagueId = "5e01ab8052d30602b207b5a7";
    // let weekNumber = "13";
    //let result = await requestHelper.getStatusOfPerticularGameWeek(leagueId, weekNumber);

    //for get status of league that is closed or conflicted
    // let leagueId = "5e01ab8052d30602b207b5a7";
    // let result = await requestHelper.getStatusOfLeague(leagueId);

    //do actions on match finished
    // let leagueId = "5e01ab8052d30602b207b5a7";
    // let weekNumber = "13";
    // let matchId = "5e01ab8152d30602b207b5e4";
    // let result = await requestHelper.performGameWeekActionsOnMatchFinish(leagueId, weekNumber, matchId);

    //for get status of league that is closed or conflicted
    // let leagueContestId = "5e31b19cbfd539128a62f847";
    // let weekNumber = "13";
    // let result = await requestHelper.assignH2HParticipantsForContestGameWeek(leagueContestId, weekNumber);

   //update points for H2H on gameweek finished
    // let leagueId = "5e01ab8052d30602b207b5a7";
    // let weekNumber = "13";
    // let result = await requestHelper.assignPointsForH2HOnGameWeekFinish(leagueId, weekNumber); 

    //Update match status
    // let date = "11.12.2019";
    // let result = await requestHelper.updateMatchStatus(date);

    //Checking for 
    let _triviaId = "5ea9130b8f515240138501c7";
    let triviaData = await EnrollTrivia.find({_triviaId, "totalCorrectAnswer" : {$ne: null}})
                .sort({ "totalCorrectAnswer": -1, "totalTimeSpentInMilliSec": 1 })

    console.log("triviaData");
    // let triviaResponse = JSON.parse(JSON.stringify(triviaData));
    
    let shuffleTrivia = await commonFunction.shuffleAnArray(triviaData)
    console.log(JSON.stringify(triviaData));
    console.log("shuffleTrivia");
    console.log(shuffleTrivia);


    //console.log(triviaResponse);


    process.exit(1);

    // let date = "11.12.2019";
    // let result = await requestHelper.updateMatchStatus(date);

    //Update Fixture for UCL
    let date = "11.12.2019";
    let leagueName = "UEFA Champions League";
    let leagueId = "1005";
    let result = await requestHelper.updateFixtureForUCL(leagueId, leagueName, date);
    console.log(result);
    return res.send('Done');
}

