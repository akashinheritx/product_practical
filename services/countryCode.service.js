const router = express.Router();
const Country = require('../models/countryCode.model');
const constants = require('../config/constants');
const Lang = require('../helper/response.helper');

router.get('',async (req,res)=>{
    try{
        if(req.query){
            var country = req.query.countryName;
            var code = req.query.countryCode;
            var query ={ 'countryName': new RegExp(country, 'i') };
            query.$or = [                
                { 'countryCode' : new RegExp(code, 'i') },
            ]
        }
        console.log(query);
            const pageOptions = {
                page: parseInt(req.query.page) || constants.PAGE,
                limit: parseInt(req.query.limit) || constants.LIMIT
            }
            
            const total = await Country.countDocuments(query)
            const contryData = await Country.find(query)
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

            var page = pageOptions.page;
            var limit = pageOptions.limit;

            res.status(200).send({
                    status: constants.STATUS_CODE.SUCCESS,
                    message: Lang.responseIn("SERVICES.COUNTRY_CODE_RETRIEVE_SUCCESS", req.headers.lang),
                    error: false,
                    data: {contryData, page, limit, total}
        })
    }catch(e){
        console.log(e);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("SERVICES.COUNTRY_CODE_RETRIEVE_FAIL", req.headers.lang),
                    error: true,
                    data: {}
        })
    }
    
});

module.exports = router;
