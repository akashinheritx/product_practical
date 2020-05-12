const constants = require('../config/constants');
const Lang = require('../helper/response.helper');

//only admin access
let adminSubAdminAccess = async function(req, res, next){
    try{
        if(req.user.userType === constants.USER_TYPE.ADMIN || req.user.userType === constants.USER_TYPE.SUB_ADMIN){
            next();     
        }else{
            return res.status(401).send({
                statusCode:constants.STATUS_CODE.UNAUTHENTICATED,
                message: Lang.responseIn("GENERAL.UNAUTHRIZED_ACCESS", req.headers.lang),
                error:true,
                data:{},         
                });
        }
        
    }catch(error){
        res.status(401).send({
            statusCode:constants.STATUS_CODE.UNAUTHENTICATED,
            message: Lang.responseIn("GENERAL.UNAUTHRIZED_LOGIN", req.headers.lang),
            error:true,
            data:{},            
        });
    }
}

module.exports = adminSubAdminAccess;