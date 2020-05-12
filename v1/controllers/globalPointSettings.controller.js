const GlobalPointSettings = require('../../models/globalPointSettings.model');
const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');


/**
 * Create global point settings
 * @function
 * @param {String} actionName - .
 * @param {Number} actionPoint - .
 * @param {Number} actionCount - .
 * @param {Number} createdAt - .
 * @param {Number} updatedAt - .
 * @returns {Object} globalPointSettingsData - Returns globalPointSettingsData.
 */
exports.createGlobalPointSettings = async (req, res) => {

    try{
        let reqdata = req.body;

        var actionName = (reqdata.actionName).trim()
        
        var regex = new RegExp('^' + actionName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
        var isActionNameExist = await GlobalPointSettings.findOne({actionName: {$regex : regex}, deletedAt:null});
        if(isActionNameExist){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_POINT_NAME_ALREADY_EXIST", req.headers.lang),
                error:true,
                data:{}
            })
        }

        let globalPointSettings = new GlobalPointSettings({
            actionName : reqdata.actionName,
            actionPoint : reqdata.actionPoint,
            actionCount : reqdata.actionCount,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp(),
        });

        let globalPointSettingsData = await globalPointSettings.save();
        
        res.status(201).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_POINT_SETTINGS_CREATED_SUCCESS", req.headers.lang),
            error: false,
            data : globalPointSettingsData
        });

        logService.responseData(req, globalPointSettingsData);

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
 * Get all global point settings
 * @function
 * @returns {Array} globalPointSettings - Returns globalPointSettings.
 * It will return all the global point settings
 */
exports.getAllGlobalPointSettings = async (req, res) => {

    try{

        let field, value; 
        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            field = parts[0];
            parts[1] ==='desc' ? value=-1 : value= 1;
        }else{
            field = "actionName",
            value = 1;
        }
        // let globalPointSettings = await GlobalPointSettings.find({});

        let globalPointSettings = await GlobalPointSettings.aggregate(
            [
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
            )
            .sort({[field] : value})
            .collation({ locale: "en" });
        
        res.status(200).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_POINT_SETTINGS_RETRIEVE", req.headers.lang),
            error: false,
            data : globalPointSettings
        });

        // logService.responseData(req, globalPointSettings);

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
 * Get global point settings
 * @function
 * @param {String} actionName - Pass the name of particular action which you want to get.
 * @returns {Object} globalPointSettings - Returns globalPointSettings.
 * It will return an object of mentioned action name globalPointSettings.
 */
exports.getGlobalPointSettings = async (req, res) => {

    try{
        var actionName = (req.params.actionName).trim();
    
        var regex = new RegExp('^' + actionName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
        var globalPointSettings = await GlobalPointSettings.findOne({actionName: {$regex : regex}, deletedAt:null});
        if(!globalPointSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_POINT_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        
        res.status(200).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_POINT_SETTINGS_RETRIEVE", req.headers.lang),
            error: false,
            data : globalPointSettings
        });

        // logService.responseData(req, globalPointSettings);

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
 * Update global point settings
 * @function
 * @param {ObjectId} _id - Pass the _id of particular action which you want to update.
 * @param {String} actionName - Pass the name of particular action which you want to update.
 * @param {Number} actionPoint - .
 * @param {Number} actionCount - .
 * @param {Number} updatedAt - .
 * @returns {Object} globalPointSettingsData - Returns globalPointSettingsData.
 * It will return an object of updated globalPointSettings.
 */
// exports.updateGlobalPointSettings = async (req, res) => {

//     try{
//         let reqdata = req.body;

//         var globalPointSettings = await GlobalPointSettings.findById(reqdata._id);
//         if(!globalPointSettings){
//             return res.status(400).send({
//                 status:constants.STATUS_CODE.FAIL,
//                 message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_POINT_SETTINGS_NOT_FOUND", req.headers.lang),
//                 error:true,
//                 data:{}
//             })
//         }

//         if(reqdata.actionName){
//             var actionName = (reqdata.actionName).trim();
        
//             var regex = new RegExp('^' + actionName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
//             var isactionNameExist = await GlobalPointSettings.findOne({actionName: {$regex : regex}, _id: {$ne: reqdata._id }, deletedAt:null});
//             if(isactionNameExist){
//                 return res.status(400).send({
//                     status:constants.STATUS_CODE.FAIL,
//                     message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_POINT_NAME_ALREADY_EXIST", req.headers.lang),
//                     error:true,
//                     data:{}
//                 })
//               }
//               globalPointSettings.actionName = reqdata.actionName;
//         }
        
//         if(reqdata.actionPoint){
//               globalPointSettings.actionPoint = reqdata.actionPoint;
//         }

//         if(reqdata.actionCount){
//             globalPointSettings.actionCount = reqdata.actionCount;
//       }

//         globalPointSettings.updatedAt = dateFormat.setCurrentTimestamp();

//         let globalPointSettingsData = await globalPointSettings.save();
        
//         res.status(200).send({
//             status:constants.STATUS_CODE.SUCCESS,
//             message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_POINT_SETTINGS_UPDATED_SUCCESS", req.headers.lang),
//             error: false,
//             data : globalPointSettingsData
//         });

//         logService.responseData(req, globalPointSettingsData);

//     }catch(error){
//         console.log(error)
        
//         res.status(400).send({
//             status:constants.STATUS_CODE.FAIL,
//             message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
//             error: true,
//             data:{}
//         });

//         logService.responseData(req, error);
//     }
// }

/**
 * Update global point settings
 * @function
 * @param {String} actionName - Pass the name of particular action which you want to update.
 * @param {Number} actionPoint - .
 * @param {Number} actionCount - .
 * @param {Number} updatedAt - .
 * @returns {Object} globalPointSettingsData - Returns globalPointSettingsData.
 * It will return an object of updated globalPointSettings.
 */
exports.updateGlobalPointSettings = async (req, res) => {

    try{
        let reqdata = req.body;
        let actionName = (reqdata.actionName).trim();
        let actionPoint = reqdata.actionPoint;
        let actionCount = reqdata.actionCount;

        let globalPointSettingsData;
        
        let regex = new RegExp('^' + actionName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
        let isactionNameExist = await GlobalPointSettings.findOne({actionName: {$regex : regex}, deletedAt:null})
        .sort({createdAt : -1});

        let existActionPoint = isactionNameExist.actionPoint;
        let existActionCount = isactionNameExist.actionCount;

        if(isactionNameExist && actionPoint == existActionPoint && actionCount == existActionCount){
            globalPointSettingsData = isactionNameExist;
        }else{
            let globalPointSettings = new GlobalPointSettings({
                actionName : reqdata.actionName,
                actionPoint : reqdata.actionPoint,
                actionCount : reqdata.actionCount,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp(),
            });
    
            globalPointSettingsData = await globalPointSettings.save();
        }
       
        res.status(200).send({
            status:constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_POINT_SETTINGS_UPDATED_SUCCESS", req.headers.lang),
            error: false,
            data : globalPointSettingsData
        });

        // logService.responseData(req, globalPointSettingsData);

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