const request = require('request');
const bcrypt = require('bcryptjs');
// const Bot = require('../models/bot.model');
const User = require('../../models/user.model');
const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const Lang = require('../../helper/response.helper');
const logService = require('../../services/log.service');
const requestHelper = require('../../helper/requestHelper.helper');


exports.addBots = async (req, res, next) => {
  try {
    const botAmount = req.body.botAmount;
    var uniqueBots = [];
    var existingEmails = [];
    var existingMobileNumber = [];
    var existingUserName = [];
    request(
      `https://uinames.com/api/?region=india&amount=${botAmount}&ext`,
      async (err, response, body) => {
        if (err) {
          console.log(err);
          return res.send(err);
        }
        const allBots = JSON.parse(body);

        const existingBots = await User.find();
        existingBots.forEach(bot => {
          existingEmails.push(bot.email);
          existingMobileNumber.push(bot.mobileNumber);
          existingUserName.push(bot.userName);
        });
        for (let i = 0; i < allBots.length; i++) {
          var userName = allBots[i].name + commonFunction.generateRandomOtp();
          var mobileNumber = (allBots[i].phone).trim()
        var regexMobileNumber = new RegExp('^' + mobileNumber.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
          if (existingEmails.includes(allBots[i].email) === false && existingMobileNumber.includes(regexMobileNumber) === false && existingUserName.includes(userName) === false) {
            existingEmails.push(allBots[i].email);
            allBots[i].email = allBots[i].email.replace(/@(.*)/, '@mailnesia.com');
            uniqueBots.push(
              new Object({
                email: allBots[i].email,
                password : await bcrypt.hash('123456', 10),
                firstName: allBots[i].name,
                lastName: allBots[i].surname,
                userName: userName,
                dob: allBots[i].birthday.mdy,
                gender: allBots[i].gender,
                userType: constants.USER_TYPE.BOT,
                mobileNumber: allBots[i].phone,
                lat:commonFunction.generateRandomOtp(),
                long:commonFunction.generateRandomOtp(),
                registerType: constants.REGISTER_TYPE.LOCAL,
                referralCode: commonFunction.generateRandomReferralCode(),
                createdAt: dateFormat.setCurrentTimestamp(),
                updatedAt: dateFormat.setCurrentTimestamp()
              })
            );
          }
        }
        const newBots = await User.insertMany(uniqueBots);
      }
    );

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("BOT.NEW_BOT_CREATED", req.headers.lang),
      error: false,
      data: {}
    });
    logService.responseData(req, newBots);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      status: constants.STATUS_CODE.FAIL,
      message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
      error: false,
      data: {}
    });
    logService.responseData(req, error);
  }
};

exports.getDuplicates = async (req, res, next) => {
  try {
    const duplicates = await User.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null }, count: { $gt: 1 } } },
      { $project: { email: '$_id', _id: 0 } }
    ]);
    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("BOT.FOUND_DUPLICATE_ENTRY", req.headers.lang),
      error: false,
      data: {}
    });
    logService.responseData(req, duplicates);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      status: constants.STATUS_CODE.FAIL,
      message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
      error: false,
      data: {}
    });
    logService.responseData(req, error);
  }
};

exports.addBotUserToPlatform = async (insertCount) => {
  try{
      console.log("Need to insert bot: "+insertCount);
      console.log("API Request per data: "+constants.FAKE_USER_API.UINAMES.PER_REQUEST_DATA);

      let iteration = 0;
      let count = 0;

      if(insertCount){
          if(insertCount && insertCount > constants.FAKE_USER_API.UINAMES.PER_REQUEST_DATA){
              iteration = Math.ceil(insertCount / constants.FAKE_USER_API.UINAMES.PER_REQUEST_DATA);
              console.log("Iteration Round value: "+Math.ceil(iteration))
          }else{
              iteration = 1;
          }

          console.log("Total loop Iteration: "+iteration);

          for(let j=1; j <= iteration; j++){
              var uniqueBots = [];
              var existingEmails = [];
              var existingMobileNumber = [];
              var existingUserName = [];
              let url = await requestHelper.generateUrlForUINamesFakeDataAPI();
              
              console.log("API url for fake data: "+url);
              let result = await requestHelper.callApi(url)
              if(result){
                
                const allBots = result;
                
                const existingBots = await User.find();
                existingBots.forEach(bot => {
                    existingEmails.push(bot.email);
                    existingMobileNumber.push(bot.mobileNumber);
                    existingUserName.push(bot.userName);
                });
                for (let i = 0; i < allBots.length; i++) {
                    var userName = allBots[i].name + commonFunction.generateRandomOtp();
                    var mobileNumber = (allBots[i].phone).trim()
                    var regexMobileNumber = new RegExp('^' + mobileNumber.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
                    if (existingEmails.includes(allBots[i].email) === false && existingMobileNumber.includes(regexMobileNumber) === false && existingUserName.includes(userName) === false) {
                        existingEmails.push(allBots[i].email);
                        allBots[i].email = allBots[i].email.replace(/@(.*)/, '@mailnesia.com');
                        uniqueBots.push(
                        new Object({
                            email: allBots[i].email,
                            password : await bcrypt.hash('Inx@!123', 10),
                            status : constants.STATUS.ACTIVE,
                            isMobileVerified : constants.STATUS.ACTIVE,
                            isEmailVerified : constants.STATUS.ACTIVE,
                            firstName: allBots[i].name,
                            lastName: allBots[i].surname,
                            userName: userName,
                            dob: allBots[i].birthday.mdy,
                            gender: allBots[i].gender,
                            userType: constants.USER_TYPE.BOT,
                            mobileNumber: allBots[i].phone,
                            lat:commonFunction.generateRandomOtp(),
                            long:commonFunction.generateRandomOtp(),
                            registerType: constants.REGISTER_TYPE.LOCAL,
                            referralCode: commonFunction.generateRandomReferralCode(),
                            createdAt: dateFormat.setCurrentTimestamp(),
                            updatedAt: dateFormat.setCurrentTimestamp()
                        })
                        );
                        count++;
                        if (insertCount <= count) { break; }
                    }
                }
        
                const newBots = await User.insertMany(uniqueBots);
        
                console.log("Iteration: "+iteration);
                console.log("count: "+count);
                console.log("j: "+j);
        
                if(iteration == j){
                    if(count <= insertCount){
                        console.log(insertCount);
                        console.log(count);
                        insCount = insertCount - count;
                        return exports.addBotUserToPlatform(insCount);
                    }
                }
              }
      
          }
      }
      return true;
  }catch(error){
      console.log(error);
      return false;
  }
}
