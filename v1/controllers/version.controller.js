const VersionNumber = require('../../models/version.model');
const User = require('../../models/user.model');
const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const notificationFunction = require('../../helper/notificationFunction.helper');
const notificationService = require('../../services/notification');
const logService = require('../../services/log.service');
const messageService = require('../../services/sendMessage.service');
const Lang = require('../../helper/response.helper');

//create Version
exports.createVersion = async (req, res) => {

    try{
        let reqdata = req.body;

        var version = (reqdata.versionNumber).trim()
        
        var regex = new RegExp('^' + version.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
        
        var isversionNumberExist = await VersionNumber.findOne({$and:[{versionNumber: {$regex : regex}}, {deviceType: reqdata.deviceType}]});
        
        if(isversionNumberExist){
            return res.status(500).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("VERSION.VERSION_ALREADY_EXISTS", req.headers.lang),
                error: true,
                data: {},
            });
        }

        var isversionNumberLower = await VersionNumber.findOne({$and:[{versionNumber:{$gte:version}}, {deviceType: reqdata.deviceType}]})
        if(isversionNumberLower){
            return res.status(500).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("VERSION.VERSION_NUMBER_LOWER", req.headers.lang),
                error: true,
                data: {},
            });
        }

        versionNum = new VersionNumber();
        versionNum.versionNumber = reqdata.versionNumber;
        versionNum.deviceType = reqdata.deviceType;
        versionNum.isForceUpdate = reqdata.isForceUpdate;
        versionNum.createdAt = dateFormat.setCurrentTimestamp();
        versionNum.updatedAt = dateFormat.setCurrentTimestamp();

        let versionNumData = await versionNum.save();
        if(versionNumData){
            d_type = versionNumData.deviceType;
            //Send Notification
            await notificationFunction.sendVersionNotification(d_type)
        }
        res.status(201).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("VERSION.VERSION_NUMBER_CREATED_SUCCESS", req.headers.lang),
            error: false,
            data : versionNumData
        });

        logService.responseData(req, versionNumData);

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

//get all version number data
exports.getAllVersionData = async (req, res) => {

    try{
        let versionData = [];

        let latestVersionData = await VersionNumber.aggregate([
            { $group : { 
                _id : "$deviceType",
                versionNumber: { $max : "$versionNumber" }
                }
            },
        ]);

        for(let i=0;i<latestVersionData.length;i++){
            var updateVersionData = await VersionNumber.findOne({versionNumber:latestVersionData[i].versionNumber, deviceType: latestVersionData[i]._id})

            versionData.push(updateVersionData)

        }

        res.status(200).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("VERSION.VERSION_DETAIL_RETRIEVE", req.headers.lang),
            error: false,
            data : {versionData}
        });

        // logService.responseData(req, versionData);

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
 * get app version
 * @param {String} deviceType - Will get deviceType from request body.
 * @param {String} versionNumber - Will get versionNumber from request body.
 * @returns {Object} updateStatus - Returns updateStatus with respective message.
*/
exports.getAppVersion = async (req, res) => {
    try{
        let reqdata = req.body

        let deviceType = new RegExp(reqdata.deviceType, 'i');
        let deviceVersion = reqdata.versionNumber;

        let message, updateStatus;

        let isForceUpdate = await VersionNumber.findOne({versionNumber: { $gt : deviceVersion}, deviceType, isForceUpdate : 1 })
        if(isForceUpdate){
            message = Lang.responseIn("VERSION.FORCE_UPDATE", req.headers.lang);
            updateStatus = constants.VERSION_STATUS.FORCE_UPDATE;
        }else{
            let isOptionalUpdate = await VersionNumber.findOne({versionNumber: { $gt : deviceVersion}, deviceType, isForceUpdate : 0 })
            if(isOptionalUpdate){
                message = Lang.responseIn("VERSION.OPTIONAL_UPDATE", req.headers.lang);
                updateStatus = constants.VERSION_STATUS.OPTIONAL_UPDATE;
            }else{
                message = Lang.responseIn("VERSION.NO_UPDATE", req.headers.lang);
                updateStatus = constants.VERSION_STATUS.NO_UPDATE;
            }
        }

        res.status(200).send({
            status:constants.STATUS_CODE.SUCCESS,
            message,
            error: false,
            data : {updateStatus}
        });

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