const Badge = require('../../models/badge.model');
const User = require('../../models/user.model');
const dateFormate = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const Lang = require('../../helper/response.helper');
const logService = require('../../services/log.service');


exports.addBadge = async (req, res) => {
    const { badgeName, contestCount } = req.body;
    let imageKey, imageName;
    try {
        if(req.files['badgeImage']){
            imageKey = req.files['badgeImage'][0].key;
            let fileName = imageKey.split('/');
            imageName = fileName[fileName.length-1];
          }
        isContestCountExist = await Badge.findOne({
             $or: [
                { "badgeName": { "$regex": badgeName, "$options": "i" } }
                , { contestCount, } ],
                deletedAt: { $eq: null }
        })
        if (isContestCountExist) {
            if(req.files['badgeImage']){
                // badgeImgPath = await commonFunction.generatePath(constants.PATH.BADGE_IMAGE_PATH,req.file.filename)
                // await commonFunction.removeFile(badgeImgPath);

                //Remove profile image from s3
                await commonFunction.destroyS3Image(imageKey);
            }
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("BADGE.BADGE_ALREADY_EXIST", req.headers.lang),
                error: true,
                data: {},
            });
        }
        const badge = new Badge();
        badge.badgeName = badgeName;
        badge.contestCount = contestCount;
        badge.isActive = constants.STATUS.ACTIVE;
        // if (req.file) {
        //     badge.badgeImage = req.file.filename;
        //     let badgeImgPath = await commonFunction.generatePath(constants.PATH.BADGE_IMAGE_PATH,req.file.filename)
        //     await commonFunction.resizeImage(badgeImgPath);
        // }
        badge.badgeImage = imageName;
        let latestKey = await Badge.findOne({}).sort({badgeKey : -1})
        let badgeKey;
        if(!latestKey){
            badgeKey = 1;
        }else{
            badgeKey = latestKey.badgeKey + 1;
        }

        badge.badgeKey =  badgeKey;
        badge.createdAt = dateFormate.setCurrentTimestamp();
        badge.updatedAt = dateFormate.setCurrentTimestamp();
        badge.syncAt = dateFormate.setCurrentTimestamp();
        const badgeData = await badge.save();
        // if(badgeData){
        //     if(badgeData.badgeImage != null){
        //         badgeData.badgeImage = commonFunction.getBadgePicUrl(req, badgeData.badgeImage)
        //     }
        // }
        await commonFunction.generateAWSBadgeImageURL(badgeData);

        res.status(201).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("BADGE.BADGE_CREATE_SUCCESS", req.headers.lang),
            error: false,
            data: badgeData
        });
        logService.responseData(req, badgeData);
    } catch (error) {
        console.log(error)
        if(req.file){
            // badgeImgPath = await commonFunction.generatePath(constants.PATH.BADGE_IMAGE_PATH,req.file.filename)
            // await commonFunction.removeFile(badgeImgPath);

            //Remove profile image from s3
            await commonFunction.destroyS3Image(imageKey);
        }
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        logService.responseData(req, error);
    }
}

exports.getBadgeList = async (req, res) => {
    try {
        const sort = {};
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
            deletedAt: { $eq: null }
        }
        if (search) {
            query.$or = [
                { 'badgeName': new RegExp(search, 'i') },
                // { 'isActive': new RegExp(search, 'i') }
            ]
        }
        const total = await Badge.countDocuments(query)
        const badges = await Badge.find(query)
            .sort({[field] : value})
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });
    
        if(badges.length>0){
            for(let i=0;i<badges.length;i++){
                // if(badges[i].badgeImage != null){
                //     badges[i].badgeImage = commonFunction.getBadgePicUrl(req, badges[i].badgeImage)
                // }
                await commonFunction.generateAWSBadgeImageURL(badges[i]);
            }
        }
    
        var page = pageOptions.page;
        var limit = pageOptions.limit;
    
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("BADGE.BADGE_DETEAIL_SUCCESS", req.headers.lang),
            error: false,
            data: badges, page, limit, total
        });
        // logService.responseData(req, badges);
    } catch (error) {
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        // logService.responseData(req, error);
    }
}

exports.getBadge = async (req, res) => {
    try {
        const id = req.params.id;
        const badge = await Badge.findOne({
            _id: id,
            deletedAt: { $eq: null }
        });
        if (!badge) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("BADGE.BADGE_NOT_EXIST", req.headers.lang),
                error: true,
                data: {}
            })
        }
        // badge.badgeImage ? badge.badgeImage = commonFunction.getBadgePicUrl(req, badge.badgeImage) : null;
        await commonFunction.generateAWSBadgeImageURL(badge);
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("BADGE.BADGE_DETEAIL_SUCCESS", req.headers.lang),
            error: false,
            data: badge
        });
        // logService.responseData(req, badge);
    } catch (error) {
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        // logService.responseData(req, error);
    }
}

exports.updateBadge = async (req, res) => {
    console.log(req.params.id)
    const id = req.params.id;
    const { badgeName, contestCount, isActive } = req.body;
    let imageKey, imageName;
    try {
        if(req.files['badgeImage']){
            imageKey = req.files['badgeImage'][0].key;
            let fileName = imageKey.split('/');
            imageName = fileName[fileName.length-1];
        }
        const badge = await Badge.findOne({
            _id: id,
            deletedAt: { $eq: null }
        });

        if (!badge) {
            if(req.files['badgeImage']){
                // badgeImgPath = await commonFunction.generatePath(constants.PATH.BADGE_IMAGE_PATH,req.file.filename)
                // await commonFunction.removeFile(badgeImgPath);

                //Remove profile image from s3
                await commonFunction.destroyS3Image(imageKey);
            }
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("BADGE.BADGE_NOT_EXIST", req.headers.lang),
                error: true,
                data: {}
            })
        }
        
        if (badgeName){
            
            let regex = new RegExp('^' + badgeName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
    
            isContestCountExist = await Badge.findOne({
                _id: { $ne: id },
                $or: [
                    { "badgeName": { "$regex": regex} }
                    , { contestCount, } ],
                    deletedAt: { $eq: null }
            })
            if (isContestCountExist) {
                if(req.files['badgeImage']){
                    // badgeImgPath = await commonFunction.generatePath(constants.PATH.BADGE_IMAGE_PATH,req.file.filename)
                    // await commonFunction.removeFile(badgeImgPath);

                    //Remove profile image from s3
                    await commonFunction.destroyS3Image(imageKey);
                }
                return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("BADGE.BADGE_ALREADY_EXIST", req.headers.lang),
                    error: true,
                    data: {},
                });
            }

            badge.badgeName = badgeName;
            
        }
            

        if(badge.isActive === constants.STATUS.DEFAULT){
            if(req.files['badgeImage']){
                // badgeImgPath = await commonFunction.generatePath(constants.PATH.BADGE_IMAGE_PATH,req.file.filename)
                // await commonFunction.removeFile(badgeImgPath);

                //Remove profile image from s3
                await commonFunction.destroyS3Image(imageKey);
            }
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("BADGE.BADGE_UPDATE_DELETE_ERROR", req.headers.lang),
                error: true,
                data: {}
            })
        }

        let oldBadgeImage = badge.badgeImage;

        if (contestCount){

            let isExistInUserProfile = await User.findOne({badgeKey : badge.badgeKey})

            if(isExistInUserProfile){
                if(req.files['badgeImage']){
                    // badgeImgPath = await commonFunction.generatePath(constants.PATH.BADGE_IMAGE_PATH,req.file.filename)
                    // await commonFunction.removeFile(badgeImgPath);

                    //Remove profile image from s3
                    await commonFunction.destroyS3Image(imageKey);
                }
                return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("BADGE.BADGE_EXIST_IN_USER_PROFILE", req.headers.lang),
                    error: true,
                    data: {}
                })
            }

            badge.contestCount = contestCount;
        }

        if (isActive)
            badge.isActive = isActive;
        if(req.files['badgeImage']){
            badge.badgeImage = imageName;
            
            // let badgeImgPath = await commonFunction.generatePath(constants.PATH.BADGE_IMAGE_PATH,req.file.filename)
            // await commonFunction.resizeImage(badgeImgPath);

            // let oldImgPath = await commonFunction.generatePath(constants.PATH.BADGE_IMAGE_PATH,oldBadgeImage)
            // await commonFunction.removeFile(oldImgPath);

            //aws s3 image remove function
            let badgeImgPath = constants.URL.BADGE_IMG_URL+'/'+oldBadgeImage;
            await commonFunction.destroyS3Image(badgeImgPath);
            
        }
        badge.updatedAt = dateFormate.setCurrentTimestamp();
        let updateBadgeData = await badge.save();

        // updateBadgeData.badgeImage ? updateBadgeData.badgeImage = commonFunction.getBadgePicUrl(req, updateBadgeData.badgeImage) : null;
        
        await commonFunction.generateAWSBadgeImageURL(updateBadgeData);

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("BADGE.BADGE_UPDATE_SUCCESS", req.headers.lang),
            error: false,
            data: updateBadgeData
        });
        logService.responseData(req, updateBadgeData);
    } catch (error) {
        console.log(error)
        if(req.files['badgeImage']){
            // badgeImgPath = await commonFunction.generatePath(constants.PATH.BADGE_IMAGE_PATH,req.file.filename)
            // await commonFunction.removeFile(badgeImgPath);

            //Remove profile image from s3
            await commonFunction.destroyS3Image(imageKey);
        }
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        logService.responseData(req, error);
    }
}

exports.deleteBadge = async (req, res) => {
    try {        
        const id = req.params.id;
        
        const badge = await Badge.findOne({
            _id: id,
            deletedAt: { $eq: null }
        });
        if (!badge) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("BADGE.BADGE_NOT_EXIST", req.headers.lang),
                error: true,
                data: {}
            })
        }

        if(badge.isActive === constants.STATUS.DEFAULT){
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("BADGE.BADGE_UPDATE_DELETE_ERROR", req.headers.lang),
                error: true,
                data: {}
            })
        }
        
        let isExistInUserProfile = await User.findOne({badgeKey : badge.badgeKey})

        if(isExistInUserProfile){
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("BADGE.BADGE_EXIST_IN_USER_PROFILE", req.headers.lang),
                error: true,
                data: {}
            })
        }

        badge.isActive = constants.STATUS.INACTIVE;
        badge.deletedAt = dateFormate.setCurrentTimestamp();
        let deletedBadgeData = await badge.save();
        // deletedBadgeData.badgeImage ? deletedBadgeData.badgeImage = commonFunction.getBadgePicUrl(req, deletedBadgeData.badgeImage) : null;
        await commonFunction.generateAWSBadgeImageURL(deletedBadgeData);

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("BADGE.BADGE_DELETE_SUCCESS", req.headers.lang),
            error: false,
            data: deletedBadgeData
        });
        logService.responseData(req, deletedBadgeData);
    } catch (error) {
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        logService.responseData(req, error);
    }
}