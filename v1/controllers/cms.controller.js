const Cms = require('../../models/cms.model');
const dateFormate = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const Lang = require('../../helper/response.helper');
const logService = require('../../services/log.service');

exports.addCms = async (req, res) => {
    const { title, slug, content } = req.body;
    try {
        var cmsTitleExist = await Cms.findOne({title});
        if(cmsTitleExist){
            res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("CMS.CMS_TITLE_EXIST", req.headers.lang),
                error: true,
                data: {},
            });
        }

        var cmsSlugExist = await Cms.findOne({slug});
        if(cmsSlugExist){
            res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("CMS.CMS_SLUG_EXIST", req.headers.lang),
                error: true,
                data: {},
            });
        }

        const cmsData = new Cms();
        cmsData.title = title;
        cmsData.slug = slug;
        cmsData.content = content;
        cmsData.createdAt = dateFormate.setCurrentTimestamp();
        cmsData.updatedAt = dateFormate.setCurrentTimestamp();
        const data = await cmsData.save();

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("CMS.CMS_CREATE_SUCCESS", req.headers.lang),
            error: false,
            data
        });
        logService.responseData(req, data);
    } catch (error) {
        console.log(error)
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        logService.responseData(req, error);
    }
}

//Get cms list
exports.getCmsList = async (req, res) => {
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
                { 'title': new RegExp(search, 'i') },
                // { 'isActive': new RegExp(search, 'i') }
            ]
        }
        const total = await Cms.countDocuments(query)
        const cmsData = await Cms.find(query)
            .sort({[field]: value})
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" })
    
            var page = pageOptions.page;
            var limit = pageOptions.limit;

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("CMS.CMS_RETRIEVE_SUCCESS", req.headers.lang),
            error: false,
            data: cmsData, page, limit, total
        });
        // logService.responseData(req, cmsData);
    } catch (error) {
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

//Get single cms list
exports.getSingleCms = async (req, res) => {
    try {
        var _id = req.params.id;
        const cmsData = await Cms.findOne({_id, deletedAt:null});
        if(!cmsData){
            return res.status(404).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("CMS.CMS_NOT_FOUND", req.headers.lang),
                error: true,
                data: {},
            })
        }
    
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("CMS.CMS_RETRIEVE_SUCCESS", req.headers.lang),
            error: false,
            data: cmsData
        });
        // logService.responseData(req, cmsData);
    } catch (error) {
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

//Edit cms 
exports.updateCms = async (req, res) => {
    try {
        var reqdata = req.body
        var id = req.params.id
        const cmsData = await Cms.findOne({_id:id});
        if(!cmsData){
            res.status(404).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("CMS.CMS_NOT_FOUND", req.headers.lang),
                error: true,
                data: {},
            });
        }
        if(reqdata.title){
            var cmsTitleExist = await Cms.findOne({title: reqdata.title, _id: {$ne: id }});
            if(cmsTitleExist){
                res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("CMS.CMS_TITLE_EXIST", req.headers.lang),
                    error: true,
                    data: {},
                });
            }else{
                cmsData.title = reqdata.title;
            }
        }

        if(reqdata.slug){
            var cmsSlugExist = await Cms.findOne({slug: reqdata.slug, _id: {$ne: id }});
            if(cmsSlugExist){
                res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("CMS.CMS_SLUG_EXIST", req.headers.lang),
                    error: true,
                    data: {},
                });
            }else{
                cmsData.slug = reqdata.slug;
            }
        }
        if(reqdata.content){
            cmsData.content = reqdata.content;
        }
        cmsData.updatedAt = dateFormate.setCurrentTimestamp();
        const data = await cmsData.save();

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("CMS.CMS_UPDATE_SUCCESS", req.headers.lang),
            error: false,
            data
        });
        // logService.responseData(req, data);
    } catch (error) {
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


//Delete cms 
exports.deleteCms = async (req, res) => {
    try {
        var id = req.params.id
        const cmsData = await Cms.findOne({_id:id});
        if(!cmsData){
            res.status(404).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("CMS.CMS_NOT_FOUND", req.headers.lang),
                error: true,
                data: {},
            });
        }

        cmsData.updatedAt = dateFormate.setCurrentTimestamp();
        cmsData.deletedAt = dateFormate.setCurrentTimestamp();
        const data = await cmsData.save();

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("CMS.CMS_DELETE_SUCCESS", req.headers.lang),
            error: false,
            data
        });
        logService.responseData(req, data);
    } catch (error) {
        console.log(error)
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        logService.responseData(req, error);
    }
}