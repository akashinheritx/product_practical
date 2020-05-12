const jwt = require('jsonwebtoken');

const User = require('../models/user.model');
const constants = require('../config/constants');
const keys = require('../keys/keys');
const Lang = require('../helper/response.helper');


let auth = async function (req, res, next) {
    try {
        // var token = req.headers['x-access-token'];
        if(!req.header('Authorization')){
            return res.status(401).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("GENERAL.UNAUTHRIZED_LOGIN", req.headers.lang),
                error: true,
                data: {},
            });
        }
        const token = req.header('Authorization').replace('Bearer ', '')
        if (!token) {
            // throw new Error('No token provided.');
            return res.status(401).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("GENERAL.UNAUTHRIZED_LOGIN", req.headers.lang),
                error: true,
                data: {},
            });
        }
        const decoded = jwt.verify(token, keys.JWT_SECRET);
        
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
        
        if (!user) {
            return res.status(401).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("GENERAL.UNAUTHRIZED_LOGIN", req.headers.lang),
                error: true,
                data: {},
            });
        }
        if(user.status !== constants.STATUS.ACTIVE){
            return res.status(401).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.USER_ACTIVATION_ERROR", req.headers.lang),
                error: true,
                data: {},
            });
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        console.log(error)
        res.status(401).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
    }
}

module.exports = auth;