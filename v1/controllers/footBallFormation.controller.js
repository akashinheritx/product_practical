const FootBallFormation = require('../../models/footBallFormation.model');

const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');

//Create DFS contest
exports.createFootBallFormation = async (req, res) => {
    try {            
        let reqdata = req.body;

        var formationType = (reqdata.formationType).trim()

        var regex = new RegExp('^' + formationType.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
        var isFormationTypeExist = await FootBallFormation.findOne({formationType: {$regex : regex}});
        
        if(isFormationTypeExist){
            return res.status(500).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SOCCER.FORMATION_EXIST", req.headers.lang),
                error: true,
                data: {},
            });
        }
        const newFootBallFormation = new FootBallFormation({
          formationType: reqdata.formationType,
          createdAt: dateFormat.setCurrentTimestamp(),
          updatedAt: dateFormat.setCurrentTimestamp()
        });
      
        var footBallFormationData = await newFootBallFormation.save();
    
            res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("SOCCER.FORMATION_CREATE", req.headers.lang),
            error: false,
            data: footBallFormationData
            });
            logService.responseData(req, footBallFormationData);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
        logService.responseData(req, error);
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
                field = "formationType",
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