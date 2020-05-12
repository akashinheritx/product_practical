const router = express.Router();
const State = require('../models/stateNames.model');
const constants = require('../config/constants');
const Lang = require('../helper/response.helper');
const auth = require('../middleware/auth.middleware');
const adminAccess = require('../middleware/adminAccess.middleware');

router.post('/add-state', auth, adminAccess, async (req,res)=>{
    try{
        var reqdata = req.body;
        var stateName = (reqdata.stateName).trim()
        
        var regex = new RegExp('^' + stateName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
        
        const isStateExist = await State.findOne({stateName : {$regex : regex}});
        console.log(isStateExist, 'isStateExist');
        if(isStateExist){
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SERVICES.STATE_ALREADY_EXIST", req.headers.lang),
                error: true,
                data: {}
            })
          }
          var state = new State({
            stateName : reqdata.stateName,
            stateType : reqdata.stateType
          })

          var stateData = await state.save();

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
                    message: Lang.responseIn("SERVICES.STATE_CREATE_SUCCESS", req.headers.lang),
                    error: false,
                    data: stateData
        })
    }catch(e){
        console.log(e);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SERVICES.STATE_CREATE_FAIL", req.headers.lang),
                    error: true,
                    data: {}
        })
    }
    
});

router.get('',async (req,res)=>{
    try{
        if(req.query){
            var state = req.query.stateName;
            var type = req.query.stateType;
            var query = { 'stateName': new RegExp(state, 'i') }
            query.$or = [
                { 'stateType' : new RegExp(type, 'i') }
            ]
        }
            const pageOptions = {
                page: parseInt(req.query.page) || constants.PAGE,
                limit: parseInt(req.query.limit) || constants.LIMIT
            }
            
            const total = await State.countDocuments(query)
            const stateData = await State.find(query)
        // .sort({[field] : value})
        .skip((pageOptions.page - 1) * pageOptions.limit)
        .limit(pageOptions.limit)
        .collation({ locale: "en" });

        var page = pageOptions.page;
        var limit = pageOptions.limit;
        
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
                    message: Lang.responseIn("SERVICES.STATE_RETRIEVE_SUCCESS", req.headers.lang),
                    error: false,
                    data: stateData, page, limit, total
        })
    }catch(e){
        console.log(e);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SERVICES.STATE_RETRIEVE_FAIL", req.headers.lang),
                    error: true,
                    data: {}
        })
    }
    
});

module.exports = router;
