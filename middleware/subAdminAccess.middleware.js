const constants = require('../config/constants');
const Lang = require('../helper/response.helper');

//only admin access
let subAdminAccess = async function(req, res, next){
    try{
        if(req.user.userType !== constants.USER_TYPE.SUB_ADMIN){
            return res.status(401).send({
            statusCode:constants.STATUS_CODE.UNAUTHENTICATED,
            message: Lang.responseIn("GENERAL.UNAUTHRIZED_ACCESS", req.headers.lang),
            error:true,
            data:{},         
            });
        }
        next();
    }catch(error){
        res.status(401).send({
            statusCode:constants.STATUS_CODE.UNAUTHENTICATED,
            message: Lang.responseIn("GENERAL.UNAUTHRIZED_LOGIN", req.headers.lang),
            error:true,
            data:{},            
        });
    }
}

module.exports = subAdminAccess;