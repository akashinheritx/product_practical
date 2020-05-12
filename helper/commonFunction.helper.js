const fs = require('fs');
const path = require("path");
const gm = require('gm').subClass({imageMagick: true});
var _ = require('lodash');
const mongoose = require('mongoose');

const { validationResult } = require('express-validator');

const constants = require('../config/constants');
const dateFormat = require('./dateFormat.helper');

const keys = require('../keys/keys');

/**
 * Remove an image from folder.
 * @function
 * @param {String} imagePath - Give folder path where your image is stored 
 */
exports.removeFile = function(delPath){
    if (fs.existsSync(delPath)) {
        fs.unlinkSync(delPath);
    }
}

/**
 * Replace string with object keys and value.
 * @function
 * @param {String} str - string which you want to replace with specific words
 * @param {Object} object - object containing specific key which you want in order to replace your string 
 * @returns {String} response - Return replaced string
 */
exports.replaceStringWithObjectData = function(str, object){
	if(!_.isEmpty(object)){
		stringStartSymbol = (typeof(constants.ENCRYPT_STRING.START_SYMBOL)===undefined) ? '{!{' : constants.ENCRYPT_STRING.START_SYMBOL

		stringEndSymbol = (typeof(constants.ENCRYPT_STRING.END_SYMBOL)===undefined) ? '}!}' : constants.ENCRYPT_STRING.END_SYMBOL

		for (let data in object) {

			msg = stringStartSymbol+data+stringEndSymbol
			str = str.replace(new RegExp(msg, 'g'), object[data])  //for replace all occurance
            //str = str.replace(msg, object[data])
		}
		return str;
	}
	return "";
}

/**
 * Show validation error message.
 * @function
 * @returns {Object} response - Return an error object 
 */
exports.validatorFunc = (req, res, next) => {
    let errArray = {};
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      
      return res.status(422).send({
          statusCode:constants.STATUS_CODE.VALIDATION,
        //   message: errors.array()[0].msg,
          message: Lang.validationResponseIn(errors.array()[0].msg, req.headers.lang),
          error: true,
          data:{}
        });

    }
    next();
};

/**
 * Get product pic url
 * @function
 * @param {String} productPic - This is saved name of your image in database
 * @returns {URL} response - Return an image url
 */
exports.getProductPicUrl = function (req, productPic) {
    var productPicUrl = app_base_url + '/' + constants.URL.PROFILE_IMG_URL + '/' + productPic; 
    return productPicUrl;
}