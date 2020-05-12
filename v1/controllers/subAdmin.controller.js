const User = require('../../models/user.model');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');

//Sub admin login
exports.subAdminLogin = async (req, res) => {
    const { mobileNumber, email, password } = req.body;
    try {
        if(email){
            var email1 = email.toLowerCase().trim();
        }
        const user = await User.findByCredential(req, mobileNumber, email1, password);
        
        if (user.userType !== constants.USER_TYPE.SUB_ADMIN) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("GENERAL.UNAUTHRIZED_LOGIN", req.headers.lang),
                error: false,
                data : {}
            });
        }

        const devicelogin = await User.checkSettingForDeviceLogin(user.tokens);

        const token = await user.generateToken();

        var data = user;
        
        // if (data.profilePic) {
        //     data.profilePic = commonFunction.getProfilePicUrl(req, data.profilePic);
        // }
        await commonFunction.removeKeyFromObject(data);
        await commonFunction.getAWSImageUrl(data);

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("USER.LOGIN_SUCCESS", req.headers.lang),
            error: false,
            data : data, token
        });

        logService.responseData(req, data);

    } catch (error) {
        console.log(error);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: error.message,
            error: true,
            data: {},
        });

        logService.responseData(req, error);
    }
}

//get all sub admin details
exports.getSubAdminData = async (req, res) => {

    try {

        const data = [];
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
            deletedAt: { $eq: null },
            userType : constants.USER_TYPE.SUB_ADMIN
        }
        if (search) {
            query.$or = [
                { 'userName': new RegExp(search, 'i') },
                { 'email': new RegExp(search, 'i') },
            ]
        }
        var total = await User.countDocuments(query)
        var subAdminData = await User.find(query)
        .sort({[field]: value})
        .skip((pageOptions.page - 1) * pageOptions.limit)
        .limit(pageOptions.limit)
        .collation({ locale: "en" });

        for(let i=0; i<subAdminData.length;i++){
            // subAdminData[i].profilePic ? subAdminData[i].profilePic = commonFunction.getProfilePicUrl(req, subAdminData[i].profilePic):subAdminData[i].profilePic; 
            await commonFunction.getAWSImageUrl(subAdminData[i]);
        }

        let page = pageOptions.page;
        let limit = pageOptions.limit; 

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("GENERAL.FETCH_SUCCESS", req.headers.lang),
            error: false,
            data: subAdminData, page, limit, total
        })
        // logService.responseData(req, subAdminData);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        })
        // logService.responseData(req, error);
    }
}

// activate-deactivate sub admin
exports.activateDeactivateSubAdmin = async (req, res) => {
    try {
        const {status} = req.body;
        var userType = constants.USER_TYPE.SUB_ADMIN
        var id = req.params.id
        const userData = await User.findOne({userType:userType, _id:id})
        
        if(!userData){
            return res.status(500).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("SUB_ADMIN.SUB_ADMIN_DETAILS_NOT_AVAILABLE", req.headers.lang),
                error: true,
                data: {},
            });
        }
        var activate = constants.STATUS.ACTIVE;
        var deActivate = constants.STATUS.INACTIVE
        var message = '';
        userData.status = status;
        var data = await userData.save();
        if(status == activate ){
            message = Lang.responseIn("SUB_ADMIN.SUB_ADMIN_ACTIVATION", req.headers.lang);
        }else if(status == deActivate){
            message = Lang.responseIn("SUB_ADMIN.SUB_ADMIN_DEACTIVATE", req.headers.lang);
        }
        
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: message,
            error: false,
            data: data,
        });
        logService.responseData(req, data);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        logService.responseData(req, error);
    }
}
