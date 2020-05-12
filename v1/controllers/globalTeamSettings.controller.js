const GlobalTeamSettings = require('../../models/globalTeamSettings.model');
const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');


//create global team settings
exports.createGlobalTeamSettings = async (req, res) => {

    try{
        let reqdata = req.body;

        let maxPlayersInEleven = reqdata.maxPlayersFromSameTeamInEleven;
        let maxPlayersInThree = reqdata.maxPlayersFromSameTeamInThree;
        
        let minPlayersInEleven = constants.TEAM_FORMAT.ELEVEN - maxPlayersInEleven;
        let minPlayersInThree = constants.TEAM_FORMAT.THREE - maxPlayersInThree;

        globalTeamSettings = new GlobalTeamSettings({
            minNoOfGoalKeeper : reqdata.minNoOfGoalKeeper,
            maxNoOfGoalKeeper : reqdata.maxNoOfGoalKeeper,
            minNoOfDefender : reqdata.minNoOfDefender,
            maxNoOfDefender : reqdata.maxNoOfDefender,
            minNoOfStrikers : reqdata.minNoOfStrikers,
            maxNoOfStrikers : reqdata.maxNoOfStrikers,
            minNoOfMidfielders : reqdata.minNoOfMidfielders,
            maxNoOfMidfielders : reqdata.maxNoOfMidfielders,
            substitutesInElevenFormat : reqdata.substitutesInElevenFormat,
            substitutesInThreeFormat : reqdata.substitutesInThreeFormat,
            creditToElevenTeam : reqdata.creditToElevenTeam,
            creditToThreeTeam : reqdata.creditToThreeTeam,
            creditToElevenTeamInLeague : reqdata.creditToElevenTeamInLeague,
            creditToThreeTeamInLeague : reqdata.creditToThreeTeamInLeague,
            maxPlayersFromSameTeamInEleven : maxPlayersInEleven,
            minPlayersFromSameTeamInEleven : minPlayersInEleven,
            maxPlayersFromSameTeamInThree : maxPlayersInThree,
            minPlayersFromSameTeamInThree : minPlayersInThree,
            noOfTeamInContest : reqdata.noOfTeamInContest,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp(),
        });

        let globalTeamSettingsData = await globalTeamSettings.save();
        
        res.status(201).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_TEAM_SETTINGS_CREATED_SUCCESS", req.headers.lang),
            error: false,
            data : globalTeamSettingsData
        });

        logService.responseData(req, globalTeamSettingsData);

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

//Get global team settings
exports.getGlobalTeamSettings = async (req, res) => {
    try{
        
        var globalTeamSettings = await GlobalTeamSettings.findOne();
        if(!globalTeamSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_TEAM_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        res.status(200).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_TEAM_SETTINGS_RETRIEVE", req.headers.lang),
            error: false,
            data : globalTeamSettings
        });

        // logService.responseData(req, globalTeamSettings);

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

//Update global team settings
exports.updateGlobalTeamSettings = async (req, res) => {

    try{
        let reqdata = req.body;

        var globalTeamSettings = await GlobalTeamSettings.findById(reqdata._id);
        if(!globalTeamSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_TEAM_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        if(reqdata.minNoOfGoalKeeper){
            globalTeamSettings.minNoOfGoalKeeper = reqdata.minNoOfGoalKeeper;
        }
        if(reqdata.maxNoOfGoalKeeper){
            globalTeamSettings.maxNoOfGoalKeeper = reqdata.maxNoOfGoalKeeper;
        }
        if(reqdata.minNoOfDefender){
            globalTeamSettings.minNoOfDefender = reqdata.minNoOfDefender;
        }
        if(reqdata.maxNoOfDefender){
            globalTeamSettings.maxNoOfDefender = reqdata.maxNoOfDefender;
        }
        if(reqdata.minNoOfStrikers){
            globalTeamSettings.minNoOfStrikers = reqdata.minNoOfStrikers;
        }
        if(reqdata.maxNoOfStrikers){
            globalTeamSettings.maxNoOfStrikers = reqdata.maxNoOfStrikers;
        }
        if(reqdata.minNoOfMidfielders){
            globalTeamSettings.minNoOfMidfielders = reqdata.minNoOfMidfielders;
        }
        if(reqdata.maxNoOfMidfielders){
            globalTeamSettings.maxNoOfMidfielders = reqdata.maxNoOfMidfielders;
        }
        if(reqdata.substitutesInElevenFormat){
            globalTeamSettings.substitutesInElevenFormat = reqdata.substitutesInElevenFormat;
        }
        if(reqdata.substitutesInThreeFormat){
            globalTeamSettings.substitutesInThreeFormat = reqdata.substitutesInThreeFormat;
        }
        if(reqdata.creditToElevenTeam){
            globalTeamSettings.creditToElevenTeam = reqdata.creditToElevenTeam;
        }
        if(reqdata.creditToThreeTeam){
            globalTeamSettings.creditToThreeTeam = reqdata.creditToThreeTeam;
        }
        if(reqdata.creditToElevenTeamInLeague){
            globalTeamSettings.creditToElevenTeamInLeague = reqdata.creditToElevenTeamInLeague;
        }
        if(reqdata.creditToThreeTeamInLeague){
            globalTeamSettings.creditToThreeTeamInLeague = reqdata.creditToThreeTeamInLeague;
        }
        if(reqdata.maxPlayersFromSameTeamInEleven){
            let maxPlayersInEleven = reqdata.maxPlayersFromSameTeamInEleven;
            let minPlayersInEleven = constants.TEAM_FORMAT.ELEVEN - maxPlayersInEleven;
            globalTeamSettings.maxPlayersFromSameTeamInEleven = maxPlayersInEleven;
            globalTeamSettings.minPlayersFromSameTeamInEleven = minPlayersInEleven;
        }
        if(reqdata.maxPlayersFromSameTeamInThree){
            let maxPlayersInThree = reqdata.maxPlayersFromSameTeamInThree;
            let minPlayersInThree = constants.TEAM_FORMAT.THREE - maxPlayersInThree;
            globalTeamSettings.maxPlayersFromSameTeamInThree = maxPlayersInThree;
            globalTeamSettings.minPlayersFromSameTeamInThree = minPlayersInThree;
        }
        
        if(reqdata.noOfTeamInContest){
            globalTeamSettings.noOfTeamInContest = reqdata.noOfTeamInContest;
        }
        globalTeamSettings.updatedAt = dateFormat.setCurrentTimestamp();

        let globalTeamSettingsData = await globalTeamSettings.save();
        
        res.status(200).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_TEAM_SETTINGS_UPDATED_SUCCESS", req.headers.lang),
            error: false,
            data : globalTeamSettingsData
        });

        logService.responseData(req, globalTeamSettingsData);

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