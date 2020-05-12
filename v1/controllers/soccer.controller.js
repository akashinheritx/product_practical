const request = require('request');
var convert = require('xml-js');
const keys = require('../../keys/keys');
const BankAccountDetails = require('../../models/bankAccountDetails.model');
const constants = require('../../config/constants');
const soccer = require('../../config/soccer');
const commonMessage = require('../../helper/commonMessage.helper');
const commonFunction = require('../../helper/commonFunction.helper');
const dateFormat = require('../../helper/dateFormate.helper');
const Message = commonMessage.MESSAGE;
const Lang = require('../../helper/response.helper');
const logService = require('../../services/log.service');

//Get league schedule
exports.getLeagueSchedule = async (req, res) => {
    var leagueName = req.query.leagueName;
    var scheduleBaseUrl = soccer.GOAL_SERVE_BASE_URL+soccer.GOAL_SERVE_API_KEY+soccer.API_ROUTE.GET_LEAGUE_SCHEDULE;
    if(leagueName == 'UEFA'){
        var url = scheduleBaseUrl + soccer.LEAGUE.UEFA.LEAGUE_SCHEDULE 
    }else if(leagueName == 'EPL'){
        var url = scheduleBaseUrl + soccer.LEAGUE.EPL.LEAGUE_SCHEDULE
    }else if(leagueName == 'BUNDESLIGA'){
        var url = scheduleBaseUrl + soccer.LEAGUE.BUNDESLIGA.LEAGUE_SCHEDULE
    }else if(leagueName == 'LA_LIGA'){
        var url = scheduleBaseUrl + soccer.LEAGUE.LA_LIGA.LEAGUE_SCHEDULE
    }else if(leagueName == 'ITALY_SERIE_A'){
        var url = scheduleBaseUrl + soccer.LEAGUE.ITALY_SERIE_A.LEAGUE_SCHEDULE
    }else if(leagueName == 'ISL'){
        var url = scheduleBaseUrl + soccer.LEAGUE.ISL.LEAGUE_SCHEDULE
    }else{
        var url = scheduleBaseUrl + soccer.LEAGUE.UEFA.LEAGUE_SCHEDULE
    }
    request({
        url,
        json: true,
    }, function(error, response, body){
        // var result = JSON.parse(convert.xml2json(body,{compact: true, spaces: 4}))
        // res.send(result);
        console.log(body);
        // logService.responseData(req, body);
      });
}

//Get league team list
exports.getLeagueTeamList = async (req, res) => {

    var data, url;
    var leagueName = req.query.leagueName;
    var scheduleBaseUrl = soccer.GOAL_SERVE_BASE_URL+soccer.GOAL_SERVE_API_KEY+soccer.API_ROUTE.GET_LEAGUE_TEAM_LIST;
    if(leagueName == 'UEFA'){
        data = {
            LEAGUE_ID : soccer.LEAGUE.UEFA.LEAGUE_ID
        }
        url = await commonFunction.replaceStringWithObjectData(scheduleBaseUrl,data);
    }else if(leagueName == 'EPL'){
        data = {
            LEAGUE_ID : soccer.LEAGUE.EPL.LEAGUE_ID
        }
        url = await commonFunction.replaceStringWithObjectData(scheduleBaseUrl,data);
    }else if(leagueName == 'BUNDESLIGA'){
        data = {
            LEAGUE_ID : soccer.LEAGUE.BUNDESLIGA.LEAGUE_ID
        }
        url = await commonFunction.replaceStringWithObjectData(scheduleBaseUrl,data);
    }else if(leagueName == 'LA_LIGA'){
        data = {
            LEAGUE_ID : soccer.LEAGUE.LA_LIGA.LEAGUE_ID
        }
        url = await commonFunction.replaceStringWithObjectData(scheduleBaseUrl,data);
    }else if(leagueName == 'ITALY_SERIE_A'){
        data = {
            LEAGUE_ID : soccer.LEAGUE.ITALY_SERIE_A.LEAGUE_ID
        }
        url = await commonFunction.replaceStringWithObjectData(scheduleBaseUrl,data);
    }else if(leagueName == 'ISL'){
        data = {
            LEAGUE_ID : soccer.LEAGUE.ISL.LEAGUE_ID
        }
        url = await commonFunction.replaceStringWithObjectData(scheduleBaseUrl,data);
    }else{
        data = {
            LEAGUE_ID : soccer.LEAGUE.UEFA.LEAGUE_ID
        }
        url = await commonFunction.replaceStringWithObjectData(scheduleBaseUrl,data);
    }
    request({
        url,
        json: true,
    }, function(error, response, body){  
          var result = JSON.parse(convert.xml2json(body,{compact: true, spaces: 4}))
        res.send(result);
        // logService.responseData(req, result);
      });
}

//Get league team list
exports.getTeamPlayerList = async (req, res) => {

    var data, url;
    var teamId = req.query.teamId;
    if(!teamId){
        return res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("SOCCER.NO_TEAM_ID", req.headers.lang),
            error: true,
            data : {}
        });
    }
    var teamPlayerListBaseUrl = soccer.GOAL_SERVE_BASE_URL+soccer.GOAL_SERVE_API_KEY+soccer.API_ROUTE.GET_TEAM_PLAYER_LIST;
        data = {
            TEAM_ID : teamId
        }
        url = await commonFunction.replaceStringWithObjectData(teamPlayerListBaseUrl,data);
    request({
        url,
        json: true,
    }, function(error, response, body){
        res.send(body);
        // logService.responseData(req, body);
      });
}

//Get single player data
exports.getSinglePlayerData = async (req, res) => {

    var data, url;
    var playerId = req.query.playerId;
    if(!playerId){
        return res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("SOCCER.NO_PLAYER_ID", req.headers.lang),
            error: true,
            data : {}
        });
    }
    var playerDataBaseUrl = soccer.GOAL_SERVE_BASE_URL+soccer.GOAL_SERVE_API_KEY+soccer.API_ROUTE.GET_SINGLE_PLAYER_DATA;
        data = {
            PLAYER_UID : playerId
        }
        url = await commonFunction.replaceStringWithObjectData(playerDataBaseUrl,data);
    request({
        url,
        json: true,
    }, function(error, response, body){
        res.send(body);
        // logService.responseData(req, body);
      });
}

//Get match score
exports.getMatchScore = async (req, res) => {

    var data, url;
    var date = req.query.date;
    var leagueName = req.query.leagueName
    if(!date){
        return res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("SOCCER.NO_DATE", req.headers.lang),
            error: true,
            data : {}
        });
    }
    var matchScoreBaseUrl = soccer.GOAL_SERVE_BASE_URL+soccer.GOAL_SERVE_API_KEY+soccer.API_ROUTE.GET_MATCH_SCORE;
        
        if(leagueName == 'UEFA'){
            data = {
                LEAGUE_ID : soccer.LEAGUE.UEFA.LEAGUE_ID,
                DATE_TIME : date
            }
            url = await commonFunction.replaceStringWithObjectData(matchScoreBaseUrl,data);
        }else if(leagueName == 'EPL'){
            data = {
                LEAGUE_ID : soccer.LEAGUE.EPL.LEAGUE_ID,
                DATE_TIME : date
            }
            url = await commonFunction.replaceStringWithObjectData(matchScoreBaseUrl,data);
        }else if(leagueName == 'BUNDESLIGA'){
            data = {
                LEAGUE_ID : soccer.LEAGUE.BUNDESLIGA.LEAGUE_ID,
                DATE_TIME : date
            }
            url = await commonFunction.replaceStringWithObjectData(matchScoreBaseUrl,data);
        }else if(leagueName == 'LA_LIGA'){
            data = {
                LEAGUE_ID : soccer.LEAGUE.LA_LIGA.LEAGUE_ID,
                DATE_TIME : date
            }
            url = await commonFunction.replaceStringWithObjectData(matchScoreBaseUrl,data);
        }else if(leagueName == 'ITALY_SERIE_A'){
            data = {
                LEAGUE_ID : soccer.LEAGUE.ITALY_SERIE_A.LEAGUE_ID,
                DATE_TIME : date
            }
            url = await commonFunction.replaceStringWithObjectData(matchScoreBaseUrl,data);
        }else if(leagueName == 'ISL'){
            data = {
                LEAGUE_ID : soccer.LEAGUE.ISL.LEAGUE_ID,
                DATE_TIME : date
            }
            url = await commonFunction.replaceStringWithObjectData(matchScoreBaseUrl,data);
        }else{
            data = {
                LEAGUE_ID : soccer.LEAGUE.UEFA.LEAGUE_ID,
                DATE_TIME : date
            }
            url = await commonFunction.replaceStringWithObjectData(matchScoreBaseUrl,data);
        }
    request({
        url,
        json: true,
    }, function(error, response, body){
        res.send(body);
        // logService.responseData(req, body);
      });
}

//Get live commentary data
exports.getLiveCommentaryData = async (req, res) => {

    var data, url;
    var date = req.query.date;
    var leagueName = req.query.leagueName
    if(!date){
        return res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("SOCCER.NO_DATE", req.headers.lang),
            error: true,
            data : {}
        });
    }
    var liveCommentaryBaseUrl = soccer.GOAL_SERVE_BASE_URL+soccer.GOAL_SERVE_API_KEY+soccer.API_ROUTE.GET_LIVE_COMMENTARIES_DATA;
        
        if(leagueName == 'UEFA'){
            data = {
                LEAGUE_SHORT_NAME : soccer.LEAGUE.UEFA.LEAGUE_SHORT_NAME,
                DATE_TIME : date
            }
            url = await commonFunction.replaceStringWithObjectData(liveCommentaryBaseUrl,data);
        }else if(leagueName == 'EPL'){
            data = {
                LEAGUE_SHORT_NAME : soccer.LEAGUE.EPL.LEAGUE_SHORT_NAME,
                DATE_TIME : date
            }
            url = await commonFunction.replaceStringWithObjectData(liveCommentaryBaseUrl,data);
        }else if(leagueName == 'BUNDESLIGA'){
            data = {
                LEAGUE_SHORT_NAME : soccer.LEAGUE.BUNDESLIGA.LEAGUE_SHORT_NAME,
                DATE_TIME : date
            }
            url = await commonFunction.replaceStringWithObjectData(liveCommentaryBaseUrl,data);
        }else if(leagueName == 'LA_LIGA'){
            data = {
                LEAGUE_SHORT_NAME : soccer.LEAGUE.LA_LIGA.LEAGUE_SHORT_NAME,
                DATE_TIME : date
            }
            url = await commonFunction.replaceStringWithObjectData(liveCommentaryBaseUrl,data);
        }else if(leagueName == 'ITALY_SERIE_A'){
            data = {
                LEAGUE_SHORT_NAME : soccer.LEAGUE.ITALY_SERIE_A.LEAGUE_SHORT_NAME,
                DATE_TIME : date
            }
            url = await commonFunction.replaceStringWithObjectData(liveCommentaryBaseUrl,data);
        }else if(leagueName == 'ISL'){
            data = {
                LEAGUE_SHORT_NAME : soccer.LEAGUE.ISL.LEAGUE_SHORT_NAME,
                DATE_TIME : date
            }
            url = await commonFunction.replaceStringWithObjectData(liveCommentaryBaseUrl,data);
        }else{
            data = {
                LEAGUE_SHORT_NAME : soccer.LEAGUE.UEFA.LEAGUE_SHORT_NAME,
                DATE_TIME : date
            }
            url = await commonFunction.replaceStringWithObjectData(liveCommentaryBaseUrl,data);
        }
    request({
        url,
        json: true,
    }, function(error, response, body){
        res.send(body);
        // logService.responseData(req, body);
      });
}

//Get live commentary data
exports.getInjuryData = async (req, res) => {
    
    var url = soccer.GOAL_SERVE_BASE_URL+soccer.GOAL_SERVE_API_KEY+soccer.API_ROUTE.GET_INJURED_PLAYER_DATA;
    request({
        url,
        json: true,
    }, function(error, response, body){
        res.send(body);
        // logService.responseData(req, body);
      });
}