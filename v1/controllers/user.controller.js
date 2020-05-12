const User = require('../../models/user.model');
const UserKit = require('../../models/userKit.model');
const Follower = require('../../models/follower.model');
const Badge = require('../../models/badge.model');
const GlobalTeamSettings = require('../../models/globalTeamSettings.model');
const GlobalGeneralSettings = require('../../models/globalGeneralSettings.model');
const WalletHistory = require('../../models/walletHistory.model');
const Notification = require('../../models/notification.model');
const UsedPromosBySameDevices = require('../../models/usedPromosBySameDevice.model');
const bcrypt = require('bcryptjs');
const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const requestHelper = require('../../helper/requestHelper.helper');
const logService = require('../../services/log.service');
const sendEmail = require('../../services/email.service');
const messageService = require('../../services/sendMessage.service');
const jwt = require('jsonwebtoken');
const keys = require('../../keys/keys');
const request = require('request');
const _ = require('lodash');

const Lang = require('../../helper/response.helper');

/**
 * User Normal Login
 * @param {String} email - if user wants to login with email
 * @param {Number} mobileNumber - if user wants to login with mobileNumber
 * @param {String} password - user's password
 * @param {String} deviceToken - user's mobile device token Optional
 * @param {String} deviceType - user's mobile device type Optional
 * @returns {Object} data - Returns user data and newly generated token.
 */
exports.userLogin = async (req, res) => {
    const { mobileNumber, email, password, deviceToken, deviceType } = req.body;
    try {
        if (email) {
            var email1 = email.toLowerCase().trim();
        }
        const user = await User.findByCredential(req, mobileNumber, email1, password);
        if (user.isMobileVerified == constants.STATUS.INACTIVE && mobileNumber) {

            user.otp = await commonFunction.generateRandomOtp();

            var userData = await user.save();
            // Send OTP on sms
            let data = {
                otp: userData.otp
            }

            const otpMessage = Lang.smsResponseIn("OTP.OTP_MESSAGE", req.headers.lang)
            var message = await commonFunction.replaceStringWithObjectData(otpMessage, data)
            console.log(message);
            await messageService.sendMessage(userData.mobileNumber, `${message}`);
        }

        if (user.userType !== constants.USER_TYPE.USER) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("GENERAL.UNAUTHRIZED_ACCESS", req.headers.lang),
                error: true,
                data: {}
            });
        }

        const devicelogin = await User.checkSettingForDeviceLogin(user.tokens);

        const token = await user.generateToken();
        if(deviceToken && deviceType){
            
            user.deviceTokens = user.deviceTokens.concat({ deviceToken, deviceType, token });
        }
        
        let data = await user.save();
    
        await commonFunction.removeKeyFromObject(data);

        // await commonFunction.checkImageExist(req, data);
        await commonFunction.getAWSImageUrl(data)

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.LOGIN_SUCCESS,
            message: Lang.responseIn("USER.LOGIN_SUCCESS", req.headers.lang),
            error: false,
            data: data, token
        });

        logService.responseData(req, data);

    } catch (error) {
        if (error.message) {
            res.status(401).send({
                status: constants.STATUS_CODE.FAIL,
                message: error.message,
                // message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
                error: true,
                data: {},
            });
            logService.responseData(req, error);
        } else {
            res.status(401).send({
                status: constants.STATUS_CODE.FAIL,
                message: error.errors[0].message,
                // message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
                error: true,
                data: {},
            });
        }

        logService.responseData(req, error);
    }
}

/**
 * User Social Login
 * @param {String} googleSocialId - if user wants to login with google account
 * @param {String} facebookSocialId - if user wants to login with facebook account
 * @param {String} deviceToken - user's mobile device token Optional
 * @param {String} deviceType - user's mobile device type Optional
 * @returns {Object} data - Returns user data and newly generated token.
 */
exports.userSocialLogin = async (req, res) => {
    const { googleSocialId, facebookSocialId, appleSocialId, deviceToken, deviceType } = req.body;
    try {
        var user;
        if (googleSocialId) {
            user = await User.findOne({ googleSocialId });
            if (!user) {
                return res.status(404).send({
                    status: constants.STATUS_CODE.FAIL,
                    // message: Message.USER_DETAILS_NOT_FOUND,
                    message: Lang.responseIn("USER.USER_DETAILS_NOT_FOUND", req.headers.lang),
                    error: false,
                    data: {}
                });
            }
        }
        if (facebookSocialId) {
            user = await User.findOne({ facebookSocialId });
            if (!user) {
                return res.status(404).send({
                    status: constants.STATUS_CODE.FAIL,
                    // message: Message.USER_DETAILS_NOT_FOUND,
                    message: Lang.responseIn("USER.USER_DETAILS_NOT_FOUND", req.headers.lang),
                    error: false,
                    data: {}
                });
            }
        }

        if (appleSocialId) {
            user = await User.findOne({ appleSocialId });
            if (!user) {
                return res.status(404).send({
                    status: constants.STATUS_CODE.FAIL,
                    // message: Message.USER_DETAILS_NOT_FOUND,
                    message: Lang.responseIn("USER.USER_DETAILS_NOT_FOUND", req.headers.lang),
                    error: false,
                    data: {}
                });
            }
        }

        const devicelogin = await User.checkSettingForDeviceLogin(user.tokens);

        const token = await user.generateToken();
        if(deviceToken && deviceType){ 
            user.deviceTokens = user.deviceTokens.concat({ deviceToken, deviceType, token });
        }
        let data = await user.save()
        
        await commonFunction.removeKeyFromObject(data);

        // await commonFunction.checkImageExist(req, data)
        await commonFunction.getAWSImageUrl(data)

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.LOGIN_SUCCESS,
            message: Lang.responseIn("USER.LOGIN_SUCCESS", req.headers.lang),
            error: false,
            data: data, token
        });

        logService.responseData(req, data);

    } catch (error) {
        console.log(error);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: error.message,
            // message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });

        logService.responseData(req, error);
    }
}

/**
 * Register user, sub admin or accountant
 * @param {String} firstName - Required
 * @param {String} lastName - Required
 * @param {String} userName - Required
 * @param {String} email - Required
 * @param {String} password - Required if it's local sign up
 * @param {String} dob - Required
 * @param {String} userType - Required
 * @param {String} registerType - Required
 * @param {String} state - Required
 * @param {String} lat - Required
 * @param {String} long - Required
 * @param {String} deviceToken - user's mobile device token Optional
 * @param {String} deviceType - user's mobile device type Optional
 * @returns {Object} data - Returns created user data and newly generated token.
 */
exports.register = async (req, res) => {
    let session = await mongoose.startSession({
        readPreference: { mode: 'primary' }
      });
      session.startTransaction();
      let profileKey, panKey
    try {
        let reqdata = req.body;
        // console.log(reqdata);
        let email = (reqdata.email).toLowerCase();

        if (req.files['profilePic']) {
            profileKey = req.files['profilePic'][0].key;
            // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['profilePic'][0].filename)
            // await commonFunction.removeFile(profileImgPath);

            //Remove profile image from s3
            await commonFunction.destroyS3Image(profileKey);
        }
        if (req.files['panCardImage']) {
            panKey = req.files['panCardImage'][0].key;
            // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['panCardImage'][0].filename)
            // await commonFunction.removeFile(profileImgPath);
            
            //Remove pan image from s3
            await commonFunction.destroyS3Image(panKey);
        }

        let userType = reqdata.userType;
        if(userType != constants.USER_TYPE.USER){
            if((!req.user) || req.user.userType != constants.USER_TYPE.ADMIN){
                return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("ADMIN.SUB_ADMIN_OR_ACCOUNTANT_CREATE_RESTRICTION", req.headers.lang),
                    error: true,
                    data: {}
                })
            }
        }

        let country = (reqdata.country).toLowerCase().trim();
        let allowedCountry = constants.ALLOWED_COUNTRY.COUNTRY;
        let isAllowed = allowedCountry.includes(country);

        if(!isAllowed){
            return res.status(500).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.REFER_CODE_NOT_AVAILABLE,
                message: Lang.responseIn("USER.RESTRICTED_COUNTRY", req.headers.lang),
                error: true,
                data: {},
            });
        }

        let isUserExist = await User.findOne({ email, deletedAt: null });
        if (isUserExist && (reqdata.googleSocialId || reqdata.facebookSocialId)) {
            if (reqdata.googleSocialId) {
                isUserExist.googleSocialId = reqdata.googleSocialId;
            }
            if (reqdata.facebookSocialId) {
                isUserExist.facebookSocialId = reqdata.facebookSocialId;
            }
            isUserExist.registerType = constants.REGISTER_TYPE.SOCIAL;
            const token = await isUserExist.generateToken();

            if(reqdata.deviceToken && reqdata.deviceType){
                
                isUserExist.deviceTokens = isUserExist.deviceTokens.concat({ deviceToken: reqdata.deviceToken, deviceType: reqdata.deviceType, token });
            }
            let userData = await isUserExist.save();

            // await commonFunction.checkImageExist(req, userData);
            await commonFunction.getAWSImageUrl(userData)

            await commonFunction.removeKeyFromObject(userData);

            return res.status(200).send({
                status: constants.STATUS_CODE.SUCCESS,
                message: Lang.responseIn("USER.SOCIAL_SIGNUP", req.headers.lang),
                error: false,
                data: userData, token
            })
        }else if(isUserExist){
            return res.status(500).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.EMAIL_ALREADY_EXISTS", req.headers.lang),
                error: true,
                data: {},
            });
        }

        if(reqdata.mobileNumber){
            
            var isMobileExist = await User.findOne({ mobileNumber: reqdata.mobileNumber, deletedAt: null });
    
            if (isMobileExist) {        
                return res.status(500).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("USER.MOBILE_ALREADY_EXISTS", req.headers.lang),
                    error: true,
                    data: {},
                });
            }
        }

        var isUserNameExist = await User.findOne({ userName: reqdata.userName, deletedAt: null });

        if (isUserNameExist) {     
            return res.status(500).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.USER_NAME_ALREADY_EXISTS", req.headers.lang),
                error: true,
                data: {},
            });
        }

        age = dateFormat.getUserAge(reqdata.dob);
        if (age < 18) { 
            return res.status(500).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.AGE_VALIDATION", req.headers.lang),
                error: true,
                data: {},
            });
        }

        var globalGeneralSettings = await GlobalGeneralSettings.findOne();
        if (!globalGeneralSettings) {      
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_GENERAL_SETTINGS_NOT_FOUND", req.headers.lang),
                error: true,
                data: {}
            })
        }
        
        var referredBy, referredByName, referralAmount, deviceId, quantity, referralCode;

        if (reqdata._referBy) {
            
            referralCode = reqdata._referBy;

            if(!reqdata.deviceId){
                return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("USER.DEVICE_ID_REQUIRED", req.headers.lang),
                    error: true,
                    data: {}
                })
            }

            deviceId = reqdata.deviceId;
            let deviceAvaibility = await commonFunction.checkDeviceAvaibility(deviceId);

            if(deviceAvaibility !== 0){
                return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("USER.DEVICE_IS_IN_USE", req.headers.lang),
                    error: true,
                    data: {}
                })
            }

            if (referralCode === await requestHelper.getKeyByValue(constants.PROMO_CODE, constants.PROMO_CODE.JOIN12TH30)) {
                referredBy = null;
                referredByName = await requestHelper.getKeyByValue(constants.PROMO_CODE, constants.PROMO_CODE.JOIN12TH30);
                referralAmount = constants.PROMO_CODE.JOIN12TH30;
                
                quantity = globalGeneralSettings.join12TH30Count;
                
                let promosAvaibility = await commonFunction.checkPromoCodeAvaibility(referredByName, quantity);

                if(promosAvaibility !== 0){
                    return res.status(400).send({
                        status: constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("USER.PROMO_CODE_NOT_AVAILABLE", req.headers.lang),
                        error: true,
                        data: {}
                    })
                }

            }else if (referralCode === await requestHelper.getKeyByValue(constants.PROMO_CODE, constants.PROMO_CODE.JOIN12TH50)) {
                referredBy = null;
                referredByName = await requestHelper.getKeyByValue(constants.PROMO_CODE, constants.PROMO_CODE.JOIN12TH50);
                referralAmount = constants.PROMO_CODE.JOIN12TH50;
                
                quantity = globalGeneralSettings.join12TH50Count;

                let promosAvaibility = await commonFunction.checkPromoCodeAvaibility(referredByName, quantity);

                if(promosAvaibility !== 0){
                    return res.status(400).send({
                        status: constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("USER.PROMO_CODE_NOT_AVAILABLE", req.headers.lang),
                        error: true,
                        data: {}
                    })
                }

            }else if (referralCode === await requestHelper.getKeyByValue(constants.PROMO_CODE, constants.PROMO_CODE.JOIN12TH75)) {
                referredBy = null;
                referredByName = await requestHelper.getKeyByValue(constants.PROMO_CODE, constants.PROMO_CODE.JOIN12TH75);
                referralAmount = constants.PROMO_CODE.JOIN12TH75;
                
                quantity = globalGeneralSettings.join12TH75Count;

                let promosAvaibility = await commonFunction.checkPromoCodeAvaibility(referredByName, quantity);

                if(promosAvaibility !== 0){
                    return res.status(400).send({
                        status: constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("USER.PROMO_CODE_NOT_AVAILABLE", req.headers.lang),
                        error: true,
                        data: {}
                    })
                }

            }else if(referralCode === await requestHelper.getKeyByValue(constants.PROMO_CODE, constants.PROMO_CODE.JOIN12TH110)) {

                referredBy = null;
                referredByName = await requestHelper.getKeyByValue(constants.PROMO_CODE, constants.PROMO_CODE.JOIN12TH110);
                referralAmount = constants.PROMO_CODE.JOIN12TH110;
                
                quantity = globalGeneralSettings.join12TH110Count;

                let promosAvaibility = await commonFunction.checkPromoCodeAvaibility(referredByName, quantity);

                if(promosAvaibility !== 0){
                    return res.status(400).send({
                        status: constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("USER.PROMO_CODE_NOT_AVAILABLE", req.headers.lang),
                        error: true,
                        data: {}
                    })
                }

            }else if(referralCode === await requestHelper.getKeyByValue(constants.PROMO_CODE, constants.PROMO_CODE.JOIN12TH250)) {

                referredBy = null;
                referredByName = await requestHelper.getKeyByValue(constants.PROMO_CODE, constants.PROMO_CODE.JOIN12TH250);
                referralAmount = constants.PROMO_CODE.JOIN12TH250;
                
                quantity = globalGeneralSettings.join12TH250Count;

                let promosAvaibility = await commonFunction.checkPromoCodeAvaibility(referredByName, quantity);

                if(promosAvaibility !== 0){
                    return res.status(400).send({
                        status: constants.STATUS_CODE.FAIL,
                        message: Lang.responseIn("USER.PROMO_CODE_NOT_AVAILABLE", req.headers.lang),
                        error: true,
                        data: {}
                    })
                }

            }else {

                var referredByUser = await User.findOne({ referralCode });
                if (!referredByUser) {
                    return res.status(500).send({
                        status: constants.STATUS_CODE.FAIL,
                        // message: Message.REFER_CODE_NOT_AVAILABLE,
                        message: Lang.responseIn("USER.REFER_CODE_NOT_AVAILABLE", req.headers.lang),
                        error: true,
                        data: {},
                    });
                } else {
                    referredBy = referredByUser._id;
                    referredByName = referredByUser.userName;
                    referralAmount = globalGeneralSettings.referralAmount;
                }
            }
        } else {
            referredBy = null;
            referredByName = null;
        }

        var restrictedStates = constants.RESTRICTED_STATE.INDIA;
        var state = (reqdata.state).toLowerCase();
        var isRestricted = restrictedStates.includes(state);

        if (isRestricted) {
            return res.status(500).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.REFER_CODE_NOT_AVAILABLE,
                message: Lang.responseIn("USER.RESTRICTED_STATE", req.headers.lang),
                error: true,
                data: {},
            });
        }

        user = new User();
        user.firstName = reqdata.firstName;
        user.lastName = reqdata.lastName;
        user.userName = reqdata.userName;
        if(reqdata.registerType != constants.REGISTER_TYPE.LOCAL){
            user.password = null;    
        }else{
            if(!reqdata.password){
                return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("USER.PASSWORD", req.headers.lang),
                    error: true,
                    data: {}
                })
            }
            user.password = await bcrypt.hash(reqdata.password, 10);
        }
        if(reqdata.gender){
            user.gender = reqdata.gender;
        }
        user.dob = reqdata.dob;
        user.userType = reqdata.userType;
        user.registerType = reqdata.registerType;
        if (reqdata.countryCode) {
            user.countryCode = reqdata.countryCode;
        }
        if(reqdata.mobileNumber){
            user.mobileNumber = reqdata.mobileNumber;
        }
        user.email = reqdata.email;
        if (reqdata.googleSocialId) {
            user.googleSocialId = reqdata.googleSocialId;
        }
        if (reqdata.facebookSocialId) {
            user.facebookSocialId = reqdata.facebookSocialId;
        }
        if (reqdata.appleSocialId) {
            user.appleSocialId = reqdata.appleSocialId;
        }
        user.lat = reqdata.lat;
        user.long = reqdata.long;
        user.referralCode = await commonFunction.generateRandomReferralCode();
        user._referBy = referredBy;
        user.referredByName = referredByName;
        if (referredBy || referredByName) {
            user.referralBalance = referralAmount;
        }
        user.otp = await commonFunction.generateRandomOtp();
        user.status = constants.STATUS.INACTIVE;
        user.city = reqdata.city;
        user.state = state;
        user.country = country;

        if (reqdata.preferredLanguage) {
            user.preferredLanguage = reqdata.preferredLanguage;
        }

        user.createdAt = dateFormat.setCurrentTimestamp();
        user.updatedAt = dateFormat.setCurrentTimestamp();
        user.syncAt = dateFormat.setCurrentTimestamp();
        
        // let userdata = await user.save();
        let userdata = await user.save({session});

        if (userdata && referredByUser) {

            referredByUser.referralBalance = referredByUser.referralBalance + globalGeneralSettings.referralAmount;
            // await referredByUser.save();
            await referredByUser.save({session});

            let walletObj = {
                _userId: userdata._id,
                referralWallet: referralAmount,
                amount: referralAmount,
                referredStatus: constants.REFER_STATUS.REFER_TO,
                referredByName: referredByName,
                transactionType: constants.TRANSACTION_TYPE.PLUS,
                transactionFor: constants.TRANSACTION_FOR.REFERRAL,
                createdAt: dateFormat.setCurrentTimestamp(),
                updatedAt: dateFormat.setCurrentTimestamp(),
            }

            walletHistory = new WalletHistory(walletObj)
            // await walletHistory.save()
            await walletHistory.save({session})

            walletObj._userId = userdata._referBy
            walletObj.referredStatus = constants.REFER_STATUS.REFER_BY
            walletObj.referredByName = userdata.userName
            anotherwalletHistory = new WalletHistory(walletObj)
            // await anotherwalletHistory.save()
            await anotherwalletHistory.save({session})

        } else if (userdata && referredByName) {
            let walletObj = {
                _userId: userdata._id,
                referralWallet: referralAmount,
                amount: referralAmount,
                referredStatus: constants.REFER_STATUS.REFER_TO,
                referredByName: referredByName,
                transactionType: constants.TRANSACTION_TYPE.PLUS,
                transactionFor: constants.TRANSACTION_FOR.REFERRAL,
                createdAt: dateFormat.setCurrentTimestamp(),
                updatedAt: dateFormat.setCurrentTimestamp(),
            }

            walletHistory = new WalletHistory(walletObj)
            // await walletHistory.save()
            await walletHistory.save({session})
        }

        if(reqdata._referBy){

            let usedPromosBySameDevice = new UsedPromosBySameDevices({
                _userId : userdata._id,
                deviceId,
                usedPromoCode : referralCode,
                createdAt: dateFormat.setCurrentTimestamp(),
                updatedAt: dateFormat.setCurrentTimestamp(),
            })
    
            // let usedPromoData = await usedPromosBySameDevice.save();
            let usedPromoData = await usedPromosBySameDevice.save({session});

        }

        // await commonFunction.checkImageExist(req, userdata)
        // await commonFunction.getAWSImageUrl(userdata)
        // let userdata = await user.save({session});

        let sendMail = {
            'to': user.email,
            'templateSlug': constants.EMAIL_TEMPLATE.WELCOME_MAIL,
            'data': {
                userName: reqdata.userName,
                otp: userdata.otp
            }
        }

        let isSendEmail = await sendEmail(req, sendMail);
        if (isSendEmail) {
            console.log('email has been sent');
        } else {
            console.log('email has not been sent');
        }

        // Send OTP on sms
        // var data = {
        //     otp: userdata.otp
        // }

        // var message = await commonFunction.replaceStringWithObjectData(commonMessage.SMS.WELCOME_MESSAGE,data);
        // const otpMessage = Lang.smsResponseIn("OTP.OTP_MESSAGE", req.headers.lang)
        // var message = await commonFunction.replaceStringWithObjectData(otpMessage, data)
        // console.log(message);
        // await messageService.sendMessage(userdata.mobileNumber, `${message}`);
        
        const token = await userdata.generateToken();
        if(reqdata.deviceToken && reqdata.deviceType){
            userdata.deviceTokens = userdata.deviceTokens.concat({ deviceToken: reqdata.deviceToken, deviceType: reqdata.deviceType, token });
            await userdata.save();
        }
        await session.commitTransaction();
        session.endSession();

        await commonFunction.getAWSImageUrl(userdata)
        await commonFunction.removeKeyFromObject(userdata);

        res.status(201).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.NEW_USER_CREATED,
            message: Lang.responseIn("USER.NEW_USER_CREATED", req.headers.lang),
            error: false,
            data: userdata, token
        });

        logService.responseData(req, userdata);

    } catch (error) {
        console.log(error)
        await session.abortTransaction();
        session.endSession();
        
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {}
        });

        logService.responseData(req, error);
    }
}

/**
 * Resend OTP
 * @param {String} email - Optional 
 * @param {Number} mobileNumber - Optional
 * @returns {Object} data - Returns resendOtpData.
 * User must needs to pass either email or mobileNumber
 */
exports.resendOtp = async (req, res) => {
    try {
        reqdata = req.body;
        let email, isUserExist;
        
        if (reqdata.email) {
            email = (reqdata.email).toLowerCase();
            isUserExist = await User.findOne({ email, deletedAt: null });
        }else if(reqdata.mobileNumber){
            isUserExist = await User.findOne({ mobileNumber: reqdata.mobileNumber , deletedAt: null });
        }

        if (!isUserExist) {
            return res.status(500).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.USER_DETAILS_NOT_AVAILABLE,
                message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                error: true,
                data: {},
            });
        }
        // isUserExist.status = constants.STATUS.INACTIVE;
        isUserExist.otp = await commonFunction.generateRandomOtp();
        var resendOtpData = await isUserExist.save();
        if (reqdata.email) {

            let sendMail = {
                'to': resendOtpData.email,
                'templateSlug': constants.EMAIL_TEMPLATE.RESEND_OTP,
                'data': {
                    userName: resendOtpData.userName,
                    otp: resendOtpData.otp
                }
            }

            let dt = await sendEmail(req, sendMail);

            //Resend OTP on email
            console.log('email has been sent');

        }

        if (reqdata.mobileNumber) {

            //Resend OTP on sms
            var data = {
                otp: resendOtpData.otp
            }
            const otpMessage = Lang.smsResponseIn("OTP.OTP_MESSAGE", req.headers.lang)
            var message = await commonFunction.replaceStringWithObjectData(otpMessage, data)
            console.log(message);
            await messageService.sendMessage(resendOtpData.mobileNumber, `${message}`);

        }
        // await session.commitTransaction();
        // session.endSession();
        // await commonFunction.checkImageExist(req, resendOtpData)
        await commonFunction.getAWSImageUrl(resendOtpData)

        await commonFunction.removeKeyFromObject(resendOtpData);

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.OTP_SENT,
            message: Lang.responseIn("USER.OTP_SENT", req.headers.lang),
            error: false,
            data: resendOtpData
        });
        logService.responseData(req, resendOtpData);
    } catch (error) {
        console.log(error);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {}
        });
        logService.responseData(req, error);
    }
}

/**
 * verify User
 * @param {String} email - Optional 
 * @param {Number} mobileNumber - Optional
 * @returns {Object} data - Returns userActivationData.
 * User must needs to pass either email or mobileNumber and valid OTP in order to activate his account
 */
exports.verifyUser = async (req, res) => {
    try {
        let reqdata = req.body;
        let email, isUserExist;

        if (reqdata.email) {
            email = (reqdata.email).toLowerCase();
            isUserExist = await User.findOne({ email, deletedAt: null });
        }else if(reqdata.mobileNumber){
            isUserExist = await User.findOne({ mobileNumber: reqdata.mobileNumber , deletedAt: null });
        }

        if (!isUserExist) {
            return res.status(500).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.USER_DETAILS_NOT_AVAILABLE,
                message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                error: true,
                data: {},
            });
        }
        if (isUserExist.otp != reqdata.otp) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.INVALID_OTP", req.headers.lang),
                error: true,
                data: {},
            });
        }
        if (reqdata.email) {
            isUserExist.isEmailVerified = constants.USER.VERIFY;
        }
        if (reqdata.mobileNumber) {
            isUserExist.isMobileVerified = constants.USER.VERIFY;
        }

        isUserExist.status = constants.STATUS.ACTIVE;
        isUserExist.otp = null;
        let userActivationData = await isUserExist.save();

        // await commonFunction.checkImageExist(req, userActivationData);
        await commonFunction.getAWSImageUrl(userActivationData);
        await commonFunction.removeKeyFromObject(userActivationData);

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.USER_ACTIVATION,
            message: Lang.responseIn("USER.USER_ACTIVATION", req.headers.lang),
            error: false,
            data: userActivationData
        });
        logService.responseData(req, userActivationData);
    } catch (error) {
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {}
        });
        logService.responseData(req, error);
    }
}

//Send otp to mobile number
exports.sendOtpForMobileVerification = async (req, res) => {
    try {
        var reqdata = req.body;
        var isUserExist = await User.findOne({ _id: req.user._id, deletedAt: null });

        if (!isUserExist) {
            return res.status(500).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.USER_DETAILS_NOT_AVAILABLE,
                message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                error: true,
                data: {},
            });
        }

        var isMobileExist = await User.findOne({ mobileNumber: reqdata.tempMobileNumber, deletedAt: null });

        if (isMobileExist) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.USER_DETAILS_NOT_AVAILABLE,
                message: Lang.responseIn("USER.MOBILE_ALREADY_EXISTS", req.headers.lang),
                error: true,
                data: {},
            });
        }

        isUserExist.otp = await commonFunction.generateRandomOtp();
        isUserExist.tempMobileNumber = reqdata.tempMobileNumber;
        var resendOtpData = await isUserExist.save();

        // await commonFunction.checkImageExist(req, resendOtpData);
        await commonFunction.getAWSImageUrl(resendOtpData);

        //Resend OTP on sms
        var data = {
            otp: resendOtpData.otp
        }
        const otpMessage = Lang.smsResponseIn("OTP.TEMP_OTP_MESSAGE", req.headers.lang)
        var message = await commonFunction.replaceStringWithObjectData(otpMessage, data)
        console.log(message);
        await messageService.sendMessage(reqdata.tempMobileNumber, `${message}`);
        // await session.commitTransaction();
        // session.endSession();
        
        await commonFunction.removeKeyFromObject(resendOtpData);
        
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.OTP_SENT,
            message: Lang.responseIn("USER.OTP_SENT", req.headers.lang),
            error: false,
            data: resendOtpData
        });
        logService.responseData(req, resendOtpData);
    } catch (error) {
        console.log(error);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {}
        });
        logService.responseData(req, error);
    }
}

//Verify user mobile number
exports.verifyUserMobileNumber = async (req, res) => {
    try {
        let reqdata = req.body;

        var isUserExist = await User.findOne({ tempMobileNumber: reqdata.tempMobileNumber, deletedAt: null });

        if (!isUserExist) {
            return res.status(500).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.USER_DETAILS_NOT_AVAILABLE,
                message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                error: true,
                data: {},
            });
        }
        if (isUserExist.otp != reqdata.otp) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.USER_DETAILS_NOT_AVAILABLE,
                message: Lang.responseIn("USER.INVALID_OTP", req.headers.lang),
                error: true,
                data: {},
            });
        }
        var isMobileExist = await User.findOne({ mobileNumber: reqdata.tempMobileNumber, deletedAt: null });

        if (isMobileExist) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.USER_DETAILS_NOT_AVAILABLE,
                message: Lang.responseIn("USER.MOBILE_ALREADY_EXISTS", req.headers.lang),
                error: true,
                data: {},
            });
        }

        isUserExist.isMobileVerified = constants.USER.VERIFY;
        isUserExist.mobileNumber = reqdata.tempMobileNumber;
        isUserExist.tempMobileNumber = null;
        isUserExist.otp = null;
        let userActivationData = await isUserExist.save();

        // await commonFunction.checkImageExist(req, userActivationData);
        await commonFunction.getAWSImageUrl(userActivationData);
        await commonFunction.removeKeyFromObject(userActivationData);

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.USER_ACTIVATION,
            message: Lang.responseIn("USER.USER_MOBILE_VERIFICATION", req.headers.lang),
            error: false,
            data: userActivationData
        });
        logService.responseData(req, userActivationData);
    } catch (error) {
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {}
        });
        logService.responseData(req, error);
    }
}

//send otp to email
exports.sendOtpForEmailVerification = async (req, res) => {
    try {
        reqdata = req.body;
        var email = (reqdata.tempEmail).toLowerCase();
        var isUserExist = await User.findOne({ _id: req.user._id, deletedAt: null });

        if (!isUserExist) {
            return res.status(500).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                error: true,
                data: {},
            });
        }

        var isEmailExist = await User.findOne({ email, deletedAt: null });

        if (isEmailExist) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.EMAIL_ALREADY_EXISTS", req.headers.lang),
                error: true,
                data: {},
            });
        }

        isUserExist.otp = await commonFunction.generateRandomOtp();
        isUserExist.tempEmail = email;
        var resendOtpData = await isUserExist.save();

        // await commonFunction.checkImageExist(req, resendOtpData);
        await commonFunction.getAWSImageUrl(resendOtpData);

        let sendMail = {
            'to': email,
            'templateSlug': constants.EMAIL_TEMPLATE.RESEND_OTP,
            'data': {
                userName: resendOtpData.userName,
                otp: resendOtpData.otp
            }
        }

        let dt = await sendEmail(req, sendMail);

        //Resend OTP on email
        console.log('email has been sent');

        // await session.commitTransaction();
        // session.endSession();
        await commonFunction.removeKeyFromObject(resendOtpData);

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.OTP_SENT,
            message: Lang.responseIn("USER.OTP_SENT", req.headers.lang),
            error: false,
            data: resendOtpData
        });
        logService.responseData(req, resendOtpData);
    } catch (error) {
        console.log(error);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {}
        });
        logService.responseData(req, error);
    }
}

//verify user email
exports.verifyUserEmail = async (req, res) => {
    try {
        let reqdata = req.body;
        var email = (reqdata.tempEmail).toLowerCase();
        var isUserExist = await User.findOne({ tempEmail: email, deletedAt: null });

        if (!isUserExist) {
            return res.status(500).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.USER_DETAILS_NOT_AVAILABLE,
                message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                error: true,
                data: {},
            });
        }

        if (isUserExist.otp != reqdata.otp) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.USER_DETAILS_NOT_AVAILABLE,
                message: Lang.responseIn("USER.INVALID_OTP", req.headers.lang),
                error: true,
                data: {},
            });
        }

        var isEmailExist = await User.findOne({ email, deletedAt: null });

        if (isEmailExist) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.EMAIL_ALREADY_EXISTS", req.headers.lang),
                error: true,
                data: {},
            });
        }

        isUserExist.isEmailVerified = constants.USER.VERIFY;
        isUserExist.email = email;
        isUserExist.tempEmail = null;
        isUserExist.otp = null;
        let userActivationData = await isUserExist.save();

        // await commonFunction.checkImageExist(req, userActivationData);
        await commonFunction.getAWSImageUrl(userActivationData);
        await commonFunction.removeKeyFromObject(userActivationData);
        
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.USER_ACTIVATION,
            message: Lang.responseIn("USER.USER_EMAIL_VERIFICATION", req.headers.lang),
            error: false,
            data: userActivationData
        });
        logService.responseData(req, userActivationData);
    } catch (error) {
        console.log(error);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {}
        });
        logService.responseData(req, error);
    }
}

//change password
exports.changePassword = async (req, res) => {

    try {
        let reqdata = req.body;

        let user = await User.findOne({ _id: req.user._id, deletedAt: null });

        if (!user) {
            return res.status(404).send({
                status: constants.STATUS_CODE.NOT_FOUND,
                // message: Message.USER_DETAILS_NOT_AVAILABLE,
                message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                error: true,
                data: {},
            });
        }

        //checking for valid password
        if (!user.validPassword(reqdata.oldPassword)) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.INVALID_PASSWORD,
                message: Lang.responseIn("USER.INVALID_CURRENT_PASSWORD", req.headers.lang),
                error: true,
                data: {},
            });
        }

        //checking for password length
        if (reqdata.newPassword.length < 8) {
            return res.status(400).send({
                status: constants.STATUS_CODE.VALIDATION,
                // message: Message.PASSWORD_MIN_LENGTH,
                message: Lang.responseIn("USER.PASSWORD_MIN_LENGTH", req.headers.lang),
                error: true,
                data: {},
            });
        }

        user.password = await bcrypt.hash(reqdata.newPassword, 10);
        user.tokens = [];
        user.deviceTokens = [];
        const token = await user.generateToken();
        if(reqdata.deviceToken && reqdata.deviceType){
            user.deviceTokens = user.deviceTokens.concat({ deviceToken: reqdata.deviceToken, deviceType: reqdata.deviceType, token });
        }
        user.updatedAt = await dateFormat.setCurrentTimestamp();
        var userData = await user.save();

        // await commonFunction.checkImageExist(req, userData);
        await commonFunction.getAWSImageUrl(userData);
        await commonFunction.removeKeyFromObject(userData);

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.PASSWORD_UPDATE_SUCCESS,
            message: Lang.responseIn("USER.PASSWORD_UPDATE_SUCCESS", req.headers.lang),
            error: false,
            data: userData, token
        });
        logService.responseData(req, userData);
    } catch (error) {
        console.log(error);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        logService.responseData(req, error);
    }
}

//get all users profile
exports.getAllUsersProfile = async (req, res) => {

    try {

        const data = [];
        const sort = {};
        const search = req.query.q ? req.query.q : ''; // for searching
        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            field = parts[0];
            parts[1] === 'desc' ? value = -1 : value = 1;
        } else {
            field = "createdAt",
                value = 1;
        }
        const pageOptions = {
            page: parseInt(req.query.page) || constants.PAGE,
            limit: parseInt(req.query.limit) || constants.LIMIT
        }

        var query = {
            deletedAt: { $eq: null },
            userType: constants.USER_TYPE.USER
        }
        if (search) {
            query.$or = [
                { 'userName': new RegExp(search, 'i') },
                { 'email': new RegExp(search, 'i') },
            ]
        }
        var total = await User.countDocuments(query)
        var userData = await User.find(query)
            .sort({ [field]: value })
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

        for (let i = 0; i < userData.length; i++) {
            // userData[i].profilePic ? userData[i].profilePic = commonFunction.getProfilePicUrl(req, userData[i].profilePic) : userData[i].profilePic;
            // await commonFunction.checkImageExist(req, userData[i])
            await commonFunction.getAWSImageUrl(userData[i]);
        }

        let page = pageOptions.page;
        let limit = pageOptions.limit;

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.USER_DATA_RETRIEVED_SUCCESS,
            message: Lang.responseIn("USER.USER_DATA_RETRIEVED_SUCCESS", req.headers.lang),
            error: false,
            data: userData, page, limit, total
        });
        // logService.responseData(req, userData);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        // logService.responseData(req, error);
    }
}

// activate-deactivate user
exports.activateDeactivateUser = async (req, res) => {
    try {
        const { status } = req.body;
        var userType = constants.USER_TYPE.USER
        var id = req.params.id
        const userData = await User.findOne({ userType: userType, _id: id })

        if (!userData) {
            return res.status(500).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.USER_DETAILS_NOT_AVAILABLE,
                message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                error: true,
                data: {},
            });
        }
        var activate = constants.STATUS.ACTIVE;
        var deActivate = constants.STATUS.INACTIVE
        var message = '';
        userData.status = status;
        var data = await userData.save();
        if (status == activate) {
            // message = Message.USER_ACTIVATION;
            message = Lang.responseIn("USER.USER_ACTIVATION", req.headers.lang);
        } else if (status == deActivate) {
            // message = Message.USER_DEACTIVATE;
            message = Lang.responseIn("USER.USER_DEACTIVATE", req.headers.lang);
        }
        // await commonFunction.checkImageExist(req, data)
        await commonFunction.getAWSImageUrl(data);
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
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        logService.responseData(req, error);
    }
}

//get all referred user data
exports.getAllReferredUserData = async (req, res) => {
    try {
        const userData = req.user;

        var field, value;

        const search = req.query.q ? req.query.q : ''; // for searching

        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            field = parts[0];
            parts[1] === 'desc' ? value = -1 : value = 1;
        } else {
            field = "createdAt",
                value = 1;
        }
        const pageOptions = {
            page: parseInt(req.query.page) || constants.PAGE,
            limit: parseInt(req.query.limit) || constants.LIMIT
        }
        var query = {
            deletedAt: null,
            _referBy: userData._id
        }
        if (search) {
            query.$or = [
                { 'userName': new RegExp(search, 'i') },
            ]
        }

        var total = await User.countDocuments(query)
        var referredUsers = await User.find(query)
            .sort({ [field]: value })
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

        var page = pageOptions.page;
        var limit = pageOptions.limit;

        if (!referredUsers.length > 0) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                // message:Message.REFERRED_DATA_NOT_AVAILABLE,
                message: Lang.responseIn("USER.REFERRED_DATA_NOT_AVAILABLE", req.headers.lang),
                error: true,
                data: {}
            })
        }
        for (let i = 0; i < referredUsers.length; i++) {
            // await commonFunction.checkImageExist(req, referredUsers[i])
            await commonFunction.getAWSImageUrl(referredUsers[i]);
        }

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.REFERRED_DATA_RETRIEVE_SUCCESS,
            message: Lang.responseIn("USER.REFERRED_DATA_RETRIEVE_SUCCESS", req.headers.lang),
            error: false,
            data: { referredUsers, page, limit, total }
        });
        // logService.responseData(req, referredUsers);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        // logService.responseData(req, error);
    }
}

//Get user boosters
exports.getUserBoosters = async (req, res) => {
    try {
        let userBoosters = await commonFunction.getUserLatestBoosters(req.user._id)

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.PROFILE_FETCH_SUCCESS,
            message: Lang.responseIn("USER.BOOSTER_FETCH_SUCCESS", req.headers.lang),
            error: false,
            data: userBoosters,
        });
        // logService.responseData(req, userBoosters);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        // logService.responseData(req, error);
    }
}

//get user profile
exports.getUserProfile = async (req, res) => {
    try {
        var data = {};
        let userData = req.user;
        let _userId = req.user._id;
        // await commonFunction.checkImageExist(req, userData);
        await commonFunction.getAWSImageUrl(userData);
        const followers = await Follower.countDocuments({ _userId });
        const following = await Follower.countDocuments({ _followerId: _userId });

        let closestBadge = await Badge.findOne({ badgeKey: userData.badgeKey })
        data.userData = userData;
        data.followers = followers;
        data.following = following;
        data.badge = closestBadge.badgeName;
        // data.badgeImage = commonFunction.getBadgePicUrl(req, closestBadge.badgeImage);
        await commonFunction.generateAWSBadgeImageURL(closestBadge);
        data.badgeImage = closestBadge.badgeImage;

        let userKitData = await UserKit.findOne({ _userId })
        if (userKitData) {
            // await commonFunction.checkKitImageExist(req, userKitData);
            await commonFunction.generateAWSKitImageURL(userKitData);
        }
        data.userKitData = userKitData;

        data.userDFSCount = await commonFunction.getUserDFSCount(_userId);
        data.userLeagueCount = await commonFunction.getUserLeagueCount(_userId);
        data.userH2HCount = await commonFunction.getUserH2HCount(_userId);
        data.totalWinningCount = await commonFunction.getUserWinningCount(_userId);

        await commonFunction.removeKeyFromObject(data.userData);

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.PROFILE_FETCH_SUCCESS,
            message: Lang.responseIn("USER.PROFILE_FETCH_SUCCESS", req.headers.lang),
            error: false,
            data: data,
        });
        // logService.responseData(req, data);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        // logService.responseData(req, error);
    }
}

//get any user profile
exports.getAnyUserProfile = async (req, res) => {
    try {
        var data = {};
        var _userId = req.params._userId
        var userData = await User.findOne({ _id: _userId, userType: { $in: [constants.USER_TYPE.USER, constants.USER_TYPE.BOT] } });
        if (!userData) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                error: true,
                data: {}
            })
        }

        if (userData.status !== constants.STATUS.ACTIVE) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.OTHER_USER_ACTIVATION_ERROR", req.headers.lang),
                error: true,
                data: {}
            })
        }

        // await commonFunction.checkImageExist(req, userData);
        await commonFunction.getAWSImageUrl(userData);

        const followers = await Follower.countDocuments({ _userId });
        const following = await Follower.countDocuments({ _followerId: _userId });
        var followStatus;
        if (req.user._id == _userId) {
            followStatus = constants.FOLLOW_STATUS.SELF;
        } else {
            var alreadyFollowing = await Follower.findOne({ _followerId: req.user._id, _userId })

            if (alreadyFollowing) {
                followStatus = constants.FOLLOW_STATUS.FOLLOWING;
            } else {
                followStatus = constants.FOLLOW_STATUS.NOT_FOLLOWING;
            }
        }
        let closestBadge = await Badge.findOne({ badgeKey: userData.badgeKey });
        data.userData = userData;
        data.followers = followers;
        data.following = following;
        data.followStatus = followStatus;
        data.badge = closestBadge.badgeName;
        // data.badgeImage = commonFunction.getBadgePicUrl(req, closestBadge.badgeImage)
        await commonFunction.generateAWSBadgeImageURL(closestBadge);
        data.badgeImage = closestBadge.badgeImage;

        let userKitData = await UserKit.findOne({ _userId })
        if (userKitData) {
            // await commonFunction.checkKitImageExist(req, userKitData);
            await commonFunction.generateAWSKitImageURL(userKitData);
        }

        data.userKitData = userKitData;

        data.userDFSCount = await commonFunction.getUserDFSCount(_userId);
        data.userLeagueCount = await commonFunction.getUserLeagueCount(_userId);
        data.userH2HCount = await commonFunction.getUserH2HCount(_userId);
        data.totalWinningCount = await commonFunction.getUserWinningCount(_userId);

        await commonFunction.removeKeyFromObject(data.userData);

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.PROFILE_FETCH_SUCCESS,
            message: Lang.responseIn("USER.PROFILE_FETCH_SUCCESS", req.headers.lang),
            error: false,
            data: data,
        });
        // logService.responseData(req, data);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        // logService.responseData(req, error);
    }
}

//Get user wallet history
exports.getUserWalletHistory = async (req, res) => {
    try {
        var walletHistoryData = await WalletHistory.find({ _userId: req.user._id, transactionFor: { $ne: constants.TRANSACTION_FOR.BOOSTER_PURCHASE } }).sort({ createdAt: -1 });

        let userWallets = await commonFunction.getUserLatestBalance(req.user._id)

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.PROFILE_FETCH_SUCCESS,
            message: Lang.responseIn("USER.WALLET_HISTORY_SUCCESS", req.headers.lang),
            error: false,
            data: { walletHistoryData, userWallets }
        });
        // logService.responseData(req, walletHistoryData);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        // logService.responseData(req, error);
    }
}

//update user profile
exports.updateUserProfile = async (req, res) => {
    let profileKey, panKey;
    try {
        let reqdata = req.body;

        if(req.files['profilePic']){
            profileKey = req.files['profilePic'][0].key;

        }
        if(req.files['panCardImage']){
            panKey = req.files['panCardImage'][0].key;
        }

        const user = await User.findOne({ _id: req.user._id, deletedAt: null });
        if (!user) {
            if (req.files['profilePic']) {
                // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['profilePic'][0].filename)
                // await commonFunction.removeFile(profileImgPath);

                //Remove profile image from s3
                await commonFunction.destroyS3Image(profileKey);
            }
            if (req.files['panCardImage']) {
                // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['panCardImage'][0].filename)
                // await commonFunction.removeFile(profileImgPath);

                //Remove profile image from s3
                await commonFunction.destroyS3Image(panKey);
            }

            return res.status(404).send({
                status: constants.STATUS_CODE.NOT_FOUND,
                // message: Message.USER_DETAILS_NOT_AVAILABLE,
                message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                error: true,
                data: {},
            });
        }

        var oldImageName = user.profilePic;
        var oldPanCardImageName = user.panCardImage;

        if (reqdata.firstName) {
            user.firstName = reqdata.firstName;
        }else{
            user.firstName = null;
        }

        if (reqdata.lastName) {
            user.lastName = reqdata.lastName;
        }else{
            user.lastName = null;
        }

        if (reqdata.userName) {
            var isUserNameExist = await User.findOne({ userName: reqdata.userName, _id: { $ne: req.user._id }, deletedAt: null });

            if (isUserNameExist) {
                if (req.files['profilePic']) {
                    // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['profilePic'][0].filename)
                    // await commonFunction.removeFile(profileImgPath);

                    //Remove profile image from s3
                    await commonFunction.destroyS3Image(profileKey);                    
                }
                if (req.files['panCardImage']) {
                    // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['panCardImage'][0].filename)
                    // await commonFunction.removeFile(profileImgPath);

                    //Remove profile image from s3
                    await commonFunction.destroyS3Image(panKey);
                }

                return res.status(500).send({
                    status: constants.STATUS_CODE.FAIL,
                    // message: Message.USER_NAME_ALREADY_EXISTS,
                    message: Lang.responseIn("USER.USER_NAME_ALREADY_EXISTS", req.headers.lang),
                    error: true,
                    data: {},
                });
            } else {
                user.userName = reqdata.userName;
            }
        }

        if (reqdata.preferredLanguage) {
            user.preferredLanguage = reqdata.preferredLanguage;
        }

        if (reqdata.gender) {
            user.gender = reqdata.gender;
        }else{
            user.gender = null;
        }

        if (reqdata.dob) {
            age = dateFormat.getUserAge(reqdata.dob);
            if (age < 18) {
                if (req.files['profilePic']) {
                    // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['profilePic'][0].filename)
                    // await commonFunction.removeFile(profileImgPath);

                    //Remove profile image from s3
                    await commonFunction.destroyS3Image(profileKey);
                }
                if (req.files['panCardImage']) {
                    // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['panCardImage'][0].filename)
                    // await commonFunction.removeFile(profileImgPath);

                    //Remove profile image from s3
                    await commonFunction.destroyS3Image(panKey);
                }

                return res.status(500).send({
                    status: constants.STATUS_CODE.FAIL,
                    // message: Message.AGE_VALIDATION,
                    message: Lang.responseIn("USER.AGE_VALIDATION", req.headers.lang),
                    error: true,
                    data: {},
                });
            }
            user.dob = reqdata.dob;
        }

        if (req.files['profilePic']) {
            // user.profilePic = req.files['profilePic'][0].filename
            // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['profilePic'][0].filename)
            // await commonFunction.resizeImage(profileImgPath);

            //save uploaded profile image to user data
            let fileName = profileKey.split('/');
            user.profilePic = fileName[fileName.length-1];
        }
        if (req.files['panCardImage']) {
            // user.panCardImage = req.files['panCardImage'][0].filename
            // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['panCardImage'][0].filename)
            // await commonFunction.resizeImage(profileImgPath);

            //save uploaded pan image to user data
            let fileName = panKey.split('/');
            user.panCardImage = fileName[fileName.length-1];
        }

        user.updatedAt = await dateFormat.setCurrentTimestamp();
        let savedData = await user.save();

        if (savedData) {
            if (req.files['profilePic']) {
                // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, oldImageName)
                // await commonFunction.removeFile(profileImgPath);

                //aws s3 image remove function
                let profileImgPath = constants.URL.PROFILE_IMG_URL+'/'+oldImageName;
                await commonFunction.destroyS3Image(profileImgPath);
            }
            if (req.files['panCardImage']) {
                // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, oldPanCardImageName)
                // await commonFunction.removeFile(profileImgPath);

                //aws s3 image remove function
                let profileImgPath = constants.URL.PROFILE_IMG_URL+'/'+oldPanCardImageName;
                await commonFunction.destroyS3Image(profileImgPath);
            }
        }

        // await commonFunction.checkImageExist(req, savedData);
        await commonFunction.getAWSImageUrl(savedData);
        await commonFunction.removeKeyFromObject(savedData);

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.PROFILE_UPDATE_SUCCESS,
            message: Lang.responseIn("USER.PROFILE_UPDATE_SUCCESS", req.headers.lang),
            error: false,
            data: savedData
        });
        logService.responseData(req, savedData);
    } catch (error) {
        console.log(error);
        if (req.files['profilePic']) {
            // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['profilePic'][0].filename)
            // await commonFunction.removeFile(profileImgPath);

            //Remove profile image from s3
            await commonFunction.destroyS3Image(profileKey);
        }
        if (req.files['panCardImage']) {
            // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['panCardImage'][0].filename)
            // await commonFunction.removeFile(profileImgPath);

            //Remove profile image from s3
            await commonFunction.destroyS3Image(panKey);
        }

        res.status(400).send({
            status: constants.STATUS_CODE.NOT_FOUND,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        logService.responseData(req, error);
    }
}

//Register user pancard details
exports.registerPanCardDetails = async (req, res) => {
    let panKey;
    try {
        let reqdata = req.body;
        let userNameOnPanCard = reqdata.nameOnPanCard.trim().toLowerCase().split(" ");
       
        const user = req.user;
                
        if(req.files['panCardImage']){
            panKey = req.files['panCardImage'][0].key;
        }

        var oldPanCardImageName = user.panCardImage;
        
        if (reqdata.dobOnPanCard) {
            age = dateFormat.getUserAge(reqdata.dobOnPanCard);
            if (age < 18) {
                if (req.files['panCardImage']) {
                    // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['panCardImage'][0].filename)
                    // await commonFunction.removeFile(profileImgPath);

                    //Remove pan image from s3
                    await commonFunction.destroyS3Image(panKey);
                }

                return res.status(500).send({
                    status: constants.STATUS_CODE.FAIL,
                    // message: Message.AGE_VALIDATION,
                    message: Lang.responseIn("USER.AGE_VALIDATION", req.headers.lang),
                    error: true,
                    data: {},
                });
            }
            user.dobOnPanCard = reqdata.dobOnPanCard;
        }
        
        var options = {
            'method': 'POST',
            'url': keys.AADHAR_API_URL,
            'headers': {
                'qt_api_key': keys.AADHAR_API_KEY,
                'qt_agency_id': keys.AADHAR_AGENCY_ID,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "pan": req.body.panCardNumber })

        };
        request(options, async function (error, response) {
            if (error) throw new Error(error);
            let panData = JSON.parse(response.body);
            // if(pan_status === 'VALID'){
                console.log(panData);
                if(panData){

                    let panCardName = '';

                    if(panData.data[0].first_name){
                       let firstName = (panData.data[0].first_name).toLowerCase();
                       panCardName +=  `${firstName}`;
                    }
                    if(panData.data[0].middle_name){
                        let middleName = (panData.data[0].middle_name).toLowerCase();
                        panCardName +=  ` ${middleName}`;
                    }
                    if(panData.data[0].last_name){
                        let lastName = (panData.data[0].last_name).toLowerCase();
                        panCardName +=   ` ${lastName}`;
                    }
                    
                    let valid = false;
                    for(let i=0; i<userNameOnPanCard.length;i++){
                        if(panCardName.includes(userNameOnPanCard[i])){
                            valid = true;
                        }else{
                            valid = false;
                            break;
                        }
                    }
                    
                    if(valid){
                        console.log(panCardName);
                    }else{
                        if (req.files['panCardImage']) {
                            // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['panCardImage'][0].filename)
                            // await commonFunction.removeFile(profileImgPath);
        
                            //Remove pan image from s3
                            await commonFunction.destroyS3Image(panKey);
                        }
                        return res.status(400).send({
                                    status: constants.STATUS_CODE.NOT_FOUND,
                                    message: Lang.responseIn("USER.PANCARD_DETAIL_FAIL", req.headers.lang),
                                    error: true,
                                    data: {},
                                });
                    }
                }else{
                    if (req.files['panCardImage']) {
                        // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['panCardImage'][0].filename)
                        // await commonFunction.removeFile(profileImgPath);
    
                        //Remove pan image from s3
                        await commonFunction.destroyS3Image(panKey);
                    }
                    return res.status(400).send({
                        status: constants.STATUS_CODE.NOT_FOUND,
                        message: Lang.responseIn("USER.PANCARD_DETAIL_FAIL", req.headers.lang),
                        error: true,
                        data: {},
                    });
                }

            // const userData = await User.findOne({ _id: {$ne:req.user._id}, panCardNumber:reqdata.panCardNumber, deletedAt: null });

            // if (userData) {
            //     if(req.files['panCardImage']){
            //         profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH,req.files['panCardImage'][0].filename)
            //         await commonFunction.removeFile(profileImgPath);
            //     }

            //     return res.status(404).send({
            //         status: constants.STATUS_CODE.NOT_FOUND,
            //         // message: Message.USER_PANCARD_EXIST,
            //         message: Lang.responseIn("USER.USER_PANCARD_EXIST", req.headers.lang),
            //         error: true,
            //         data: {},
            //     });
            // }



            user.nameOnPanCard = reqdata.nameOnPanCard;
            user.panCardNumber = reqdata.panCardNumber;
            user.isPanVerified = constants.USER.VERIFY;

            if (req.files['panCardImage']) {
                // user.panCardImage = req.files['panCardImage'][0].filename
                // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['panCardImage'][0].filename)
                // await commonFunction.resizeImage(profileImgPath);

                let fileName = panKey.split('/');
                user.panCardImage = fileName[fileName.length-1];
                
            }

            user.updatedAt = await dateFormat.setCurrentTimestamp();
            let savedData = await user.save();

            if (savedData) {
                if (req.files['panCardImage']) {
                    // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, oldPanCardImageName)
                    // await commonFunction.removeFile(profileImgPath);

                    //aws s3 image remove function
                    var profileImgPath = constants.URL.PROFILE_IMG_URL+'/'+oldPanCardImageName;
                    await commonFunction.destroyS3Image(profileImgPath);
                }
            }
            // await commonFunction.checkImageExist(req, savedData);
            await commonFunction.getAWSImageUrl(savedData);
            await commonFunction.removeKeyFromObject(savedData);

            res.status(200).send({
                status: constants.STATUS_CODE.SUCCESS,
                // message: Message.PANCARD_DETAIL_UPDATED,
                message: Lang.responseIn("USER.PANCARD_DETAIL_UPDATED", req.headers.lang),
                error: false,
                data: savedData
            });
            logService.responseData(req, savedData);
        });
    } catch (error) {
        console.log(error);
        if (req.files['panCardImage']) {
            // profileImgPath = await commonFunction.generatePath(constants.PATH.PROFILE_IMG_PATH, req.files['panCardImage'][0].filename)
            // await commonFunction.removeFile(profileImgPath);

            //Remove pan image from s3
            await commonFunction.destroyS3Image(panKey);
        }

        res.status(400).send({
            status: constants.STATUS_CODE.NOT_FOUND,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        logService.responseData(req, error);
    }
}

exports.sendOtp = async (req, res) => {
    try {
        let reqdata = req.body;
        var email = (reqdata.email).toLowerCase();
        // var email = new RegExp('^' + emailReg.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
        var user = await User.findOne({ email, deletedAt: null });

        if (!user) {
            return res.status(404).send({
                status: constants.STATUS_CODE.NOT_FOUND,
                // message: message.USER_EMAIL_NOT_FOUND,
                message: Lang.responseIn("USER.USER_EMAIL_NOT_FOUND", req.headers.lang),
                error: true,
                data: {},
            });
        }
        // var token = jwt.sign({ email }, keys.JWT_SECRET).toString();

        user.otp = await commonFunction.generateRandomOtp();
        //add hours to check expire time
        user.otpExpires = dateFormat.addTimeToCurrentTimestamp(1, 'hours');
        await user.save();

        let sendMail = {
            'to': user.email,
            'templateSlug': constants.EMAIL_TEMPLATE.RESEND_OTP,
            'data': {
                userName: user.userName,
                otp: user.otp
            }
        }

        let dt = await sendEmail(req, sendMail);

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.FORGOTPASSWORD_OTP_SUCCESS,
            message: Lang.responseIn("USER.FORGOTPASSWORD_OTP_SUCCESS", req.headers.lang),
            error: false,
            data: {}
        });
        logService.responseData(req, user);
    } catch (error) {
        console.log(error)
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.FORGOTPASSWORD_OTP_FAIL,
            message: Lang.responseIn("USER.FORGOTPASSWORD_OTP_FAIL", req.headers.lang),
            error: true,
            data: {},
        });
        logService.responseData(req, error);
    }
}

//set new password with otp
exports.setNewPasswordByOTP = async (req, res) => {
    try {
        const { otp, newPassword } = req.body;

        let currentDate = await dateFormat.setCurrentTimestamp();

        //check token with expire time
        var user = await User.findOne({ otp, otpExpires: { $gte: currentDate } });
        console.log(user)
        if (!user) {
            return res.status(404).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.USER_DETAILS_NOT_AVAILABLE,
                message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                error: true,
                data: {},
            });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = null;
        user.updatedAt = await dateFormat.setCurrentTimestamp();
        await user.save();
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.PASSWORD_UPDATE_SUCCESS,
            message: Lang.responseIn("USER.PASSWORD_UPDATE_SUCCESS", req.headers.lang),
            error: false,
            data: {}
        });
        logService.responseData(req, user);
    } catch (error) {
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
        logService.responseData(req, error);
    }
}

exports.forgotPassword = async (req, res) => {
    try {
        let reqdata = req.body;
        var email = (reqdata.email).toLowerCase();
        var user = await User.findOne({ email, deletedAt: null });

        if (!user) {
            return res.status(404).send({
                status: constants.STATUS_CODE.NOT_FOUND,
                // message: message.USER_DETAILS_NOT_AVAILABLE,
                message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
                error: true,
                data: {},
            });
        }
        var token = jwt.sign({ email }, keys.JWT_SECRET).toString();
        user.resetPasswordToken = token;
        //add hours to check expire time
        user.resetPasswordExpires = dateFormat.addTimeToCurrentTimestamp(1, 'hours');
        await user.save();

        // const mailUrl = req.app.locals.base_url + '/api/v1/user/reset-password/';
        const mailUrl = keys.ANGULAR_BASE_URL;

        let sendMail = {
            'to': email,
            'templateSlug': constants.EMAIL_TEMPLATE.PASSWORD_RESET,
            'data': {
                userName: user.userName,
                url: mailUrl + token,
            }
        }

        let dt = await sendEmail(req, sendMail);

        // await sendEmail(email, 'Password Reset', forgotPasswordTemplate({ url: mailUrl + token, logoURL: logoURL }));

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.FORGOTPASSWORD_EMAIL_SUCCESS,
            message: Lang.responseIn("USER.FORGOTPASSWORD_EMAIL_SUCCESS", req.headers.lang),
            error: false,
            data: {}
        });
        logService.responseData(req, user);
    } catch (error) {
        console.log(error)
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.FORGOTPASSWORD_EMAIL_FAIL,
            message: Lang.responseIn("USER.FORGOTPASSWORD_EMAIL_FAIL", req.headers.lang),
            error: true,
            data: {},
        });
        logService.responseData(req, error);
    }
}

//set new password from angular
exports.setNewPassword = async (req, res) => {
    try {
        const { newPassword, resetPasswordToken } = req.body;
        // let currentDate = moment().format();
        let currentDate = await dateFormat.setCurrentTimestamp();
        if (!resetPasswordToken) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.FORGOTPASSWORD_EMAIL_FAIL,
                message: Lang.responseIn("USER.LINK_EXPIRED", req.headers.lang),
                error: true,
                data: {},
            });
        }

        //check token with expire time
        var user = await User.findOne({ resetPasswordToken, resetPasswordExpires: { $gte: currentDate } });
        // console.log(user)
        if (!user) {
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                // message: Message.FORGOTPASSWORD_EMAIL_FAIL,
                message: Lang.responseIn("USER.LINK_EXPIRED", req.headers.lang),
                error: true,
                data: {},
            });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = null;
        user.tokens = [];
        // const token = await user.generateToken();
        user.updatedAt = await dateFormat.setCurrentTimestamp();
        userData = await user.save();
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.FORGOTPASSWORD_EMAIL_SUCCESS,
            message: Lang.responseIn("USER.PASSWORD_RESET_SUCCESS", req.headers.lang),
            error: false,
            data: {}
        });
        logService.responseData(req, userData);
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

//logout user from single device
exports.logoutSingleDevice = async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
        req.user.deviceTokens = req.user.deviceTokens.filter((token) => token.token !== req.token)
        await req.user.save()

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.LOGOUT_SUCCESS,
            message: Lang.responseIn("USER.LOGOUT_SUCCESS", req.headers.lang),
            error: false,
            data: {},
        })
        // logService.responseData(req, req.user);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.LOGOUT_FAILED,
            message: Lang.responseIn("USER.LOGOUT_FAILED", req.headers.lang),
            error: true,
            data: {},
        })
        logService.responseData(req, error);
    }
}

//logout user from all devices
exports.logoutAllDevice = async (req, res) => {
    try {
        req.user.tokens = []
        req.user.deviceTokens = []
        await req.user.save()

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.LOGOUT_SUCCESS,
            message: Lang.responseIn("USER.LOGOUT_SUCCESS", req.headers.lang),
            error: false,
            data: {},
        })
        // logService.responseData(req, req.user);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.LOGOUT_FAILED,
            message: Lang.responseIn("USER.LOGOUT_FAILED", req.headers.lang),
            error: true,
            data: {},
        })
        logService.responseData(req, error);
    }
}

//get user notifications
exports.getAllNotifications = async (req, res) => {
    try {

        let field, value;

        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            field = parts[0];
            parts[1] === 'desc' ? value = -1 : value = 1;
        } else {
            field = "createdAt",
                value = -1;
        }
        const pageOptions = {
            page: parseInt(req.query.page) || constants.PAGE,
            limit: parseInt(req.query.limit) || constants.LIMIT
        }

        let total = await Notification.countDocuments({ _userId: req.user._id });
        let notifications = await Notification.find({ _userId: req.user._id })
            .sort({ [field]: value })
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

        for (let i = 0; i < notifications.length; i++) {
            // notifications[i].notificationImage = await commonFunction.getNotificationPicUrl(req, notifications[i].notificationImage)
            await commonFunction.generateAWSNotificationImageURL(notifications[i]);
        }

        var page = pageOptions.page;
        var limit = pageOptions.limit;

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.LOGOUT_SUCCESS,
            message: Lang.responseIn("USER.NOTIFICATION_FETCH_SUCCESS", req.headers.lang),
            error: false,
            data: { notifications, page, limit, total }
        })
        // logService.responseData(req, notifications);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.LOGOUT_FAILED,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        })
        // logService.responseData(req, error);
    }
}

//Read user notifications
exports.readAllNotifications = async (req, res) => {
    try {

        let notifications = await Notification.updateMany({ _userId: req.user._id }, {$set : {isRead : constants.NOTIFICATION_READ.READ}});

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.LOGOUT_SUCCESS,
            message: Lang.responseIn("USER.NOTIFICATION_READ_SUCCESS", req.headers.lang),
            error: false,
            data: {}
        })
        // logService.responseData(req, notifications);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.LOGOUT_FAILED,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        })
        // logService.responseData(req, error);
    }
}

//Get notifications count
exports.getNotificationCount = async (req, res) => {
    try {

        let notificationCount = await Notification.countDocuments({ _userId: req.user._id, isRead : constants.NOTIFICATION_READ.UNREAD });

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.LOGOUT_SUCCESS,
            message: Lang.responseIn("USER.NOTIFICATION_COUNT_FETCH_SUCCESS", req.headers.lang),
            error: false,
            data: {notificationCount}
        })
        // logService.responseData(req, notificationCount);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.LOGOUT_FAILED,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        })
        // logService.responseData(req, error);
    }
}

/**
 * Download APK file
 */
exports.downloadAPKFile = async (req, res) => {
    try {

        let url = `${keys.AWS_IMG_BASE_URL}/${constants.URL.APK_URL}/${keys.APK_KEY}.apk`;
        // res.send(url);
        res.redirect(url)
        // logService.responseData(req, badgeDetail);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.LOGOUT_FAILED,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        })
        // logService.responseData(req, error);
    }
}

//Get login badge detail
exports.getUserBadgeDetail = async (req, res) => {
    try {

        let badgeDetail = await Badge.findOne({ badgeKey: req.user.badgeKey });

        // badgeDetail.badgeImage = await commonFunction.getBadgePicUrl(req, badgeDetail.badgeImage)
        await commonFunction.generateAWSBadgeImageURL(badgeDetail);

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.LOGOUT_SUCCESS,
            message: Lang.responseIn("USER.BADGE_DETEAIL_SUCCESS", req.headers.lang),
            error: false,
            data: badgeDetail
        })
        // logService.responseData(req, badgeDetail);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            // message: Message.LOGOUT_FAILED,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        })
        // logService.responseData(req, error);
    }
}
