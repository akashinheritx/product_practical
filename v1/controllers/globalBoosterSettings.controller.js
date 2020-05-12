const GlobalBoosterSettings = require('../../models/globalBoosterSettings.model');
const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');


//create global booster settings
exports.createGlobalBoosterSettings = async (req, res) => {

    try{
        let reqdata = req.body;

        var boosterName = (reqdata.boosterName).trim()
        
        var regex = new RegExp('^' + boosterName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
        var isboosterNameExist = await GlobalBoosterSettings.findOne({boosterName: {$regex : regex}, deletedAt:null});
        if(isboosterNameExist){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_NAME_ALREADY_EXIST", req.headers.lang),
                error:true,
                data:{}
            })
        }

        var isboosterTypeExist = await GlobalBoosterSettings.findOne({boosterType : reqdata.boosterType});
        if(isboosterTypeExist){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_TYPE_ALREADY_EXIST", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let globalBoosterSettings = new GlobalBoosterSettings({
            boosterName : reqdata.boosterName,
            boosterType : reqdata.boosterType,
            boosterCount : reqdata.boosterCount,
            boosterPrice : reqdata.boosterPrice,
            boosterPoint : reqdata.boosterPoint,
            requiredIds : reqdata.requiredIds,
            boosetrDetail : reqdata.boosetrDetail,
            boosetrValidity : reqdata.boosetrValidity,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp()
        });

        let globalBoosterSettingsData = await globalBoosterSettings.save();
        
        res.status(201).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_SETTINGS_CREATED_SUCCESS", req.headers.lang),
            error: false,
            data : globalBoosterSettingsData
        });

        logService.responseData(req, globalBoosterSettingsData);

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

//Get global all boosters settings
exports.getAllGlobalBoosterSettings = async (req, res) => {

    try{
        
        var allGlobalBoosterSettings = await GlobalBoosterSettings.find();
        
        res.status(200).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_SETTINGS_RETRIEVE", req.headers.lang),
            error: false,
            data : allGlobalBoosterSettings
        });

        // logService.responseData(req, allGlobalBoosterSettings);

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

//Get global booster settings
exports.getGlobalBoosterSettings = async (req, res) => {

    try{
        const _boosterId = req.params._boosterId
        var globalBoosterSettings = await GlobalBoosterSettings.findById(_boosterId);
        if(!globalBoosterSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        res.status(200).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_SETTINGS_RETRIEVE", req.headers.lang),
            error: false,
            data : globalBoosterSettings
        });

        // logService.responseData(req, globalBoosterSettings);

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

//Update global booster settings
exports.updateGlobalBoosterSettings = async (req, res) => {

    try{
        let reqdata = req.body;

        var globalBoosterSettings = await GlobalBoosterSettings.findById(reqdata._id);
        if(!globalBoosterSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        if(reqdata.boosterName){

            var boosterName = (reqdata.boosterName).trim()
        
            var regex = new RegExp('^' + boosterName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
            var isboosterNameExist = await GlobalBoosterSettings.findOne({boosterName: {$regex : regex}, _id: {$ne: reqdata._id }, deletedAt:null});
            if(isboosterNameExist){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_NAME_ALREADY_EXIST", req.headers.lang),
                    error:true,
                    data:{}
                })
              }
            globalBoosterSettings.boosterName = reqdata.boosterName;
        }

        if(reqdata.boosterType){
        
            var isboosterTypeExist = await GlobalBoosterSettings.findOne({boosterType: reqdata.boosterType, _id: {$ne: reqdata._id }, deletedAt:null});
            if(isboosterTypeExist){
                return res.status(400).send({
                    status:constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_TYPE_ALREADY_EXIST", req.headers.lang),
                    error:true,
                    data:{}
                })
              }
            globalBoosterSettings.boosterType = reqdata.boosterType;
        }

        if(reqdata.boosterCount){
            globalBoosterSettings.boosterCount = reqdata.boosterCount;
        }
        if(reqdata.boosterPrice){
            globalBoosterSettings.boosterPrice = reqdata.boosterPrice;
        }
        if(reqdata.boosterPoint){
            globalBoosterSettings.boosterPoint = reqdata.boosterPoint;
        }
        if(reqdata.requiredIds){
            globalBoosterSettings.requiredIds = reqdata.requiredIds;
        }
        if(reqdata.boosetrDetail){
            globalBoosterSettings.boosetrDetail = reqdata.boosetrDetail;
        }
        if(reqdata.boosetrValidity){
            globalBoosterSettings.boosetrValidity = reqdata.boosetrValidity;
        }
        globalBoosterSettings.updatedAt = dateFormat.setCurrentTimestamp();

        let globalBoosterSettingsData = await globalBoosterSettings.save();
        
        res.status(200).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_SETTINGS_UPDATED_SUCCESS", req.headers.lang),
            error: false,
            data : globalBoosterSettingsData
        });

        logService.responseData(req, globalBoosterSettingsData);

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