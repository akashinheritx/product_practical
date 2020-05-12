const User = require('../../models/user.model');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');

//Accountant login
exports.accountantLogin = async (req, res) => {
    const { mobileNumber, email, password } = req.body;
    try {
        if(email){
            var email1 = email.toLowerCase().trim();
        }
        const user = await User.findByCredential(req, mobileNumber, email1, password);
        
        if (user.userType !== constants.USER_TYPE.ACCOUNTANT) {
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
        //     // data.profilePic = commonFunction.getProfilePicUrl(req, data.profilePic);
        // }
        await commonFunction.removeKeyFromObject(data);
        await commonFunction.getAWSImageUrl(data);
        
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("USER.LOGIN_SUCCESS", req.headers.lang),
            error: false,
            data : data, token
        });

        // logService.responseData(req, data);

    } catch (error) {
        console.log(error);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: error.message,
            // message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });

        // logService.responseData(req, error);
    }
}

//get all accountant details
exports.getAccountantData = async (req, res) => {

    try {

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
            userType : constants.USER_TYPE.ACCOUNTANT
        }
        if (search) {
            query.$or = [
                { 'userName': new RegExp(search, 'i') },
                { 'email': new RegExp(search, 'i') },
            ]
        }
        var total = await User.countDocuments(query)
        var accountantData = await User.find(query)
        .sort({[field]: value})
        .skip((pageOptions.page - 1) * pageOptions.limit)
        .limit(pageOptions.limit)
        .collation({ locale: "en" });

        for(let i=0; i<accountantData.length;i++){
            // accountantData[i].profilePic ? accountantData[i].profilePic = commonFunction.getProfilePicUrl(req, accountantData[i].profilePic):accountantData[i].profilePic;
            await commonFunction.getAWSImageUrl(accountantData[i])
        }

        let page = pageOptions.page
        let limit = pageOptions.limit; 

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("GENERAL.FETCH_SUCCESS", req.headers.lang),
            error: false,
            data: accountantData, page, limit, total
        })
        // logService.responseData(req, accountantData);
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

// activate-deactivate accountant
exports.activateDeactivateAccountant = async (req, res) => {
    try {
        const {status} = req.body;
        var userType = constants.USER_TYPE.ACCOUNTANT;
        var id = req.params.id
        const userData = await User.findOne({userType:userType, _id:id})
        
        if(!userData){
            return res.status(500).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ACCOUNTANT.ACCOUNTANT_DETAILS_NOT_AVAILABLE", req.headers.lang),
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
            message = Lang.responseIn("ACCOUNTANT.ACCOUNTANT_ACTIVATION", req.headers.lang);
        }else if(status == deActivate){
            message = Lang.responseIn("ACCOUNTANT.ACCOUNTANT_DEACTIVATE", req.headers.lang);
        }
        
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: message,
            error: false,
            data: data,
        });
        // logService.responseData(req, data);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        // logService.responseData(req, error);
    }
}
