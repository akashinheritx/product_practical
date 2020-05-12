const fs = require('fs');
const path = require("path");
const gm = require('gm').subClass({imageMagick: true});
var _ = require('lodash');
const mongoose = require('mongoose');
const location = require('../app');
const AWS = require('aws-sdk');

const { validationResult } = require('express-validator');

const constants = require('../config/constants');
const soccer = require('../config/soccer');
const dateFormat = require('./dateFormate.helper');
const User = require('../models/user.model');
const WalletHistory = require('../models/walletHistory.model');
const GlobalBoosterSettings = require('../models/globalBoosterSettings.model');
const GlobalGeneralSettings = require('../models/globalGeneralSettings.model');
const Trivia = require('../models/trivia.model');
const FootBallLeagueWeek = require('../models/footBallLeagueWeeks.model');
const FootBallPlayerName = require('../models/footBallPlayerNames.model');
const UserFootBallTeam = require('../models/userFootBallTeam.model');
const SelectFootBallTeamPlayer = require('../models/selectFootBallTeamPlayer.model');
const SelectLeagueFootBallTeamPlayer = require('../models/selectLeagueFootBallTeamPlayer.model');
const FootBallLeagueContest = require('../models/footBallLeagueContest.model');
const EnrollFootBallLeagueContest = require('../models/enrollFootBallLeagueContest.model');
const LeagueWinnerListWithPrizeAmount = require('../models/leagueWinnerListwithPrizeAmounts.model');
const FootBallDFSContest = require('../models/footBallDFSContest.model');
const EnrollFootBallDFSContest = require('../models/enrollFootBallDFSContest.model');
const DFSWinnerListWithPrizeAmount = require('../models/dfsWinnerListwithPrizeAmounts.model');
const TriviaWinnerListWithPrizeAmount = require('../models/triviaWinnerListwithPrizeAmounts.model');
const Lang = require('../helper/response.helper');
const requestHelper = require('../helper/requestHelper.helper');
const notificationFunction = require('../helper/notificationFunction.helper');
const Notification = require('../models/notification.model');
const Follower = require('../models/follower.model');
const LeagueWeekMaster = require('../models/leagueWeekMaster.model');
const UsedPromosBySameDevices = require('../models/usedPromosBySameDevice.model');
const sendEmail = require('../services/email.service');
const keys = require('../keys/keys');

var s3 = new AWS.S3({
    accessKeyId: keys.AWS_ACCESS_KEY_ID,
    secretAccessKey: keys.AWS_SECRET_ACCESS_KEY_ID,
    region: keys.AWS_REGION 
  });

/**
 * Resize an image after uploading it.
 * @function
 * @param {String} imagePath - Give folder path where your image is stored 
 */
exports.resizeImage = function(imagePath){
    gm(imagePath)
        .resize(240,240)
        .gravity('Center')
        // .extent(width,height)
        .noProfile()
        .write(imagePath, function (err) {
            if (err) {
                console.log(err)
                throw new Error();
            }
        });
}

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
 * Generate 6 digit random OTP.
 * @function
 * @returns {Number} response - Return 6 digit otp.
 */
exports.generateRandomOtp = function () { 
    
    let otp = Math.floor(100000 + Math.random() * 900000);
    return otp; 
}

/**
 * Generate 10 digit random referal code.
 * @function
 * @returns {String} response - Return 10 digit random referral code.
 */
exports.generateRandomReferralCode = function() {
    var code = '';
    var char_list = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 10; i++) {
    code += char_list.charAt(Math.floor(Math.random() * char_list.length));
    }
    return code;
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
 * Get profile pic url
 * @function
 * @param {String} profilePic - This is saved name of your image in database
 * @returns {URL} response - Return an image url
 */
exports.getProfilePicUrl = function (req, profilePic) {
    var profilePicUrl = app_base_url + '/' + constants.URL.PROFILE_IMG_URL + '/' + profilePic; 
    return profilePicUrl;
}

/**
 * Get badge pic url
 * @function
 * @param {String} badgePic - This is saved name of badge image in database
 * @returns {URL} response - Return an badge image url if image stored in database else will return null
 */
exports.getBadgePicUrl = function (req, badgePic) {
    if(badgePic){
        var badgePicUrl = app_base_url + '/' + constants.URL.BADGE_IMG_URL + '/' + badgePic; 
        return badgePicUrl;
    }else{
        return null
    }
}

/**
 * Get Logo url
 * @function
 * @returns {URL} response - Return logo image url
 */
exports.getLogoUrl = function (req) {
    var logoPicUrl = app_base_url+'/'+constants.COMMONAPP_LOGO+'/'+constants.COMMONAPP_LOGO_IMAGE;
    return logoPicUrl;
}

/**
 * Get notification image
 * @function
 * @param {String} notificationPic - This is saved name of notification image in database
 * @returns {URL} response - Return an notification image url
 */
exports.getNotificationPicUrl = function (req, notificationPic) {
    if(notificationPic != null){
        var notificationPicUrl = app_base_url + '/' + constants.URL.NOTIFICATION_IMG_URL + '/' + notificationPic; 
        return notificationPicUrl;
    }
}

/**
 * Generate Path
 * @function
 * @param {String} path - Predefined path of your local folder
 * @param {String} file - which you just have stored in that folder
 * @returns {String} response - Return full path to that file
 */
exports.generatePath = function (path, file) {
    return profileImgPath = path+'/'+file;
}

/**
 * Generate URL if profilePic or panCardImage exist
 * @function
 * @param {Object} data - object of user data.
 * @returns {URL} response - Return URLs if image exist.
 */
exports.checkImageExist = function (req, data){
    if(data){
        if (data.profilePic !== null) {
            data.profilePic = app_base_url + '/' + constants.URL.PROFILE_IMG_URL + '/' + data.profilePic; 
        }
        if (data.panCardImage !== null) {
            data.panCardImage = app_base_url + '/' + constants.URL.PROFILE_IMG_URL + '/' + data.panCardImage; 
        }  
    }
}

/**
 * Generate URL if kit exist
 * @function
 * @param {Object} data - object of user data.
 * @returns {URL} response - Return URLs if kit image exist.
 */
exports.checkKitImageExist = function (req, data){
    if(data){
        if (data.kitFrontImage !== null) {
            data.kitFrontImage = app_base_url + '/' + constants.URL.KIT_IMG_URL + '/' + data.kitFrontImage; 
        }
        if (data.kitBackImage !== null) {
            data.kitBackImage = app_base_url + '/' + constants.URL.KIT_IMG_URL + '/' + data.kitBackImage; 
        }  
    }
}

/**
 * Set user default image
 * @function
 */
exports.setDefaultImage = function() {
  
    const imageName = `profilePic-${dateFormat.setCurrentTimestamp()}`;
    fs.copyFileSync('./public/images/defaultImage/user.png', `./public/images/profilePic/${imageName}.png`);  
    return `${imageName}.png`;
    
};

/**
 * Get user latest balance
 * @function
 * @param {ObjectId} _id - _id of user whom latest balance you wanna get.
 * @returns {Object} response - Return user latest wallet object.
 */
exports.getUserLatestBalance = async function(_id){
    const userWallets = await User.findOne({_id},{depositBalance: 1,referralBalance:1, winningBalance:1,_id:0});
    return userWallets;
}

/**
 * Get user latest booster
 * @function
 * @param {ObjectId} _id - _id of user whom latest booster you wanna get.
 * @returns {Object} response - Return user latest boosters object.
 */
exports.getUserLatestBoosters = async function(_id){
    const userBoosters = await User.findOne({_id},{boosters: 1, _id:0});
    return userBoosters;
}

/**
 * Get booster details
 * @function
 * @param {ObjectId} _id - _id of booster whom details you wanna get.
 * @returns {Object} response - Return booster details object.
 */
exports.getBoosterDetails = async function(_id){
    const boosterDetails = await GlobalBoosterSettings.findOne({_id});
    return boosterDetails;
}

/**
 * Find duplicates items length
 * @function
 * @param {Array} arr - array containing an items.
 * @returns {Number} response - Return more than 0 if there are any duplicates value.
 */
exports.findDuplicates = async function(arr) { 
   let arrLength = arr.filter((item, index) => arr.indexOf(item) != index)
   return arrLength.length
}

/**
 * Find league team players
 * @function
 * @param {ObjectId} _leagueTeamId - Id of team which you want to get.
 * @param {String} weekNumber - weekNumber of which week you want to get a team.
 * @returns {Array} response - Returns playerIds for that particular week.
 */
exports.findLeagueTeamPlayersIds = async function(_leagueTeamId, weekNumber) { 
    let playerIds = [];

    let allPlayers = await SelectLeagueFootBallTeamPlayer.find({_leagueTeamId, gameWeek : weekNumber })

    for(let i=0;i<allPlayers.length;i++){
        playerIds.push(allPlayers[i]._playerId)
    }
    return playerIds;
 }

/**
 * Find league team substitutes players
 * @function
 * @param {ObjectId} _leagueTeamId - Id of team which you want to get.
 * @param {String} weekNumber - weekNumber of which week you want to get a team.
 * @returns {Array} response - Returns substitutes playerIds for that particular week.
 */
exports.findLeagueTeamSubstitutePlayersIds = async function(_leagueTeamId,  weekNumber) { 
    let substitutePlayerIds = [];

    let allPlayers = await SelectLeagueFootBallTeamPlayer.find({_leagueTeamId , playerRole : constants.PLAYER_ROLE.SUBSTITUTION, gameWeek : weekNumber});

    for(let i=0;i<allPlayers.length;i++){
        substitutePlayerIds.push(allPlayers[i]._playerId)
    }
    return substitutePlayerIds;
 }

/**
 * Get player ratings
 * @function
 * @param {ObjectId} _id - _id of player.
 * @param {Array} matchTeamIds - match IDs array for particular match.
 * @param {String} playerPosition - player position G for GoalKeeper, M for Mid Fielder, D for Defender and A for Attacker.
 * @returns {Object} response - Returns ratings for that player with checking whether that player is in that team or not and if not then it will return null.
 */
exports.getPlayerRatings = async function(_id, matchTeamIds, playerPosition){
    const playerRatings = await FootBallPlayerName.findOne({_id, playerPosition, teamId : {$in : matchTeamIds}},{playerRating: 1,_id:0});
    return playerRatings;
}

/**
 * Get player
 * @function
 * @param {ObjectId} _id - _id of player.
 * @param {Array} matchTeamIds - match IDs array for particular match.
 * @returns {Object} response - Returns player object if player is in that team and if not then it will return null.
 */
exports.getPlayer = async function(_id, matchTeamIds){
    const player = await FootBallPlayerName.findOne({_id, teamId : {$in : matchTeamIds}});
    return player;
}

/**
 * Get player profile
 * @function
 * @param {ObjectId} _id - _id of player.
 * @returns {Object} response - Returns player object if player exist and if not then it will return null.
 */
exports.getPlayerProfile = async function(_id){
    const playerProfile = await FootBallPlayerName.findOne({_id});
    return playerProfile;
}

/**
 * Get Current participant count of Trivia
 * @function
 * @param {Number} startDate - Timestamp of startDate.
 * @param {Number} endDate - Timestamp of endDate.
 * @returns {Number} response - Returns number of total trivia participants.
 */
exports.checkTriviaCurrentParticipantCount = async function(startDate, endDate) {

    const totalTriviaParticipantCount = await Trivia.aggregate([
        {$match : {$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}]}},
        {
            $group:{
                _id: null,
                totalTriviaParticipant: {$sum: "$currentParticipants" }
            },
        }
    ]);

    let totalTriviaParticipant;
    if(totalTriviaParticipantCount.length<1){
        totalTriviaParticipant = 0;
    }else{
        totalTriviaParticipant = totalTriviaParticipantCount[0].totalTriviaParticipant;
    }
    return totalTriviaParticipant;
}

/**
 * Get user DFS count
 * @function
 * @param {ObjectId} _id - _id of user of whom we need to find regular DFS count.
 * @returns {Number} response - Returns number of total participated in regular DFS contest for _id user.
 */
exports.getUserDFSCount = async function(_id){

    let dfsContests = await FootBallDFSContest.find({contestType : constants.CONTEST_TYPE.REGULAR},{_id : 1})

    let dfsContestIds = [];
    for(let i=0;i<dfsContests.length;i++){
        dfsContestIds.push(dfsContests[i]._id);
    }

    let enrolledContests = await EnrollFootBallDFSContest.countDocuments({_userId: _id, _dfsContestId : {$in : dfsContestIds}});

    return enrolledContests;
    
}

/**
 * Get Current participant count of DFS
 * @function
 * @param {Number} startDate - Timestamp of startDate.
 * @param {Number} endDate - Timestamp of endDate.
 * @param {Number} contestType - Contest type 1 if Regular and 2 if H2H.
 * @param {Number} teamFormat - Team format 11 if Eleven and 3 if Three.
 * @returns {Number} response - Returns number of total participaant in particular DFS contest format.
 */
exports.checkDFSCurrentParticipantCount = async function(startDate, endDate, contestType, teamFormat) {

    const totalCount = await FootBallDFSContest.aggregate([
        {$match : {$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {contestType}, {teamFormat}]}},
        {
            $group:{
                _id: null,
                totalFBDFSParticipant: {$sum: "$currentParticipants" }
            },
        }
    ]);

    let totalFBDFSParticipant;
    if(totalCount.length<1){
        totalFBDFSParticipant = 0;
    }else{
        totalFBDFSParticipant = totalCount[0].totalFBDFSParticipant;
    }
    return totalFBDFSParticipant;
}

/**
 * Get user league count
 * @function
 * @param {ObjectId} _id - _id of user of whom we need to find regular League count.
 * @returns {Number} response - Returns number of total participated in regular League contest for _id user.
 */
exports.getUserLeagueCount = async function(_id){

    let leagueContests = await FootBallLeagueContest.find({contestType : constants.CONTEST_TYPE.REGULAR},{_id : 1})

    let leagueContestIds = [];
    for(let i=0;i<leagueContests.length;i++){
        leagueContestIds.push(leagueContests[i]._id);
    }

    let enrolledContests = await EnrollFootBallLeagueContest.countDocuments({_userId: _id, _dfsContestId : {$in : leagueContestIds}});

    return enrolledContests;
    
}

/**
 * Get Current participant count of League
 * @function
 * @param {Number} startDate - Timestamp of startDate.
 * @param {Number} endDate - Timestamp of endDate.
 * @param {Number} contestType - Contest type 1 if Regular and 2 if H2H.
 * @param {Number} teamFormat - Team format 11 if Eleven and 3 if Three.
 * @returns {Number} response - Returns number of total participaant in particular League contest format.
 */
exports.checkLeagueCurrentParticipantCount = async function(startDate, endDate, contestType, teamFormat) {

    const totalCount = await FootBallLeagueContest.aggregate([
        {$match : {$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {contestType}, {teamFormat}]}},
        {
            $group:{
                _id: null,
                totalFBLeagueParticipant: {$sum: "$currentParticipants" }
            },
        }
    ]);

    let totalFBLeagueParticipant;
    if(totalCount.length<1){
        totalFBLeagueParticipant = 0;
    }else{
        totalFBLeagueParticipant = totalCount[0].totalFBLeagueParticipant;
    }
    return totalFBLeagueParticipant;
}

/**
 * Get user H2H count
 * @function
 * @param {ObjectId} _id - _id of user of whom we need to find H2H count for DFS and League.
 * @returns {Number} response - Returns number of total participated in H2H contest of League and DFS for _id user.
 */
exports.getUserH2HCount = async function(_id){

    let dfsContests = await FootBallDFSContest.find({contestType : constants.CONTEST_TYPE.H2H},{_id : 1})

    let dfsContestIds = [];
    for(let i=0;i<dfsContests.length;i++){
        dfsContestIds.push(dfsContests[i]._id);
    }

    let dfsEnrolledContests = await EnrollFootBallDFSContest.countDocuments({_userId: _id, _dfsContestId : {$in : dfsContestIds}});

    let leagueContests = await FootBallLeagueContest.find({contestType : constants.CONTEST_TYPE.H2H},{_id : 1})

    let leagueContestIds = [];
    for(let i=0;i<leagueContests.length;i++){
        leagueContestIds.push(leagueContests[i]._id);
    }

    let leagueEnrolledContests = await EnrollFootBallLeagueContest.countDocuments({_userId: _id, _dfsContestId : {$in : leagueContestIds}});

    let totalContest = dfsEnrolledContests + leagueEnrolledContests;
    
    return totalContest;
    
}

/**
 * Get user winning count
 * @function
 * @param {ObjectId} _id - _id of user of whom we need to find total winning count in Trivia, DFS and League.
 * @returns {Number} response - Returns number of total winning of _id user with minimum and maximum range defined in constants.
 */
exports.getUserWinningCount = async function(_id){

    let triviaWinningCount = await TriviaWinnerListWithPrizeAmount.countDocuments({_userId : _id, rank : {$gte : constants.MIN_RANK}, rank : {$lte : constants.MAX_RANK}});

    let dfsWinningCount = await DFSWinnerListWithPrizeAmount.countDocuments({_userId : _id, rank : {$gte : constants.MIN_RANK}, rank : {$lte : constants.MAX_RANK}});

    let leagueWinningCount = await LeagueWinnerListWithPrizeAmount.countDocuments({_userId : _id, rank : {$gte : constants.MIN_RANK}, rank : {$lte : constants.MAX_RANK}});

    let totalWinningCount = triviaWinningCount + dfsWinningCount + leagueWinningCount;
    
    return totalWinningCount;
    
}

/**
 * Pay entry fees
 * @function
 * @param {Object} user - User from we need to deduct payment.
 * @param {Number} totalBalanceIn - Total balance that user has in his wallet.
 * @param {Number} entryFee - How much entry fee that user needs to pay.
 * @param {ObjectId} walletHistoryObj - Predefined wallet object which we need to add.
 * @returns {Number} response - Returns number if payment successfull else it will return null.
 * it will deduct amount starting from referral wallet then follwed by winning wallet and then deposit wallet.
 */
exports.payEntryFees = async function(user, totalBalanceIn, entryFee, walletHistoryObj){
    try {
        let userWallets = await User.findOne({_id : user._id});
        let totalBalance = userWallets.referralBalance + userWallets.winningBalance + userWallets.depositBalance;

        if(userWallets.referralBalance >= entryFee){
            userWallets.referralBalance = userWallets.referralBalance - entryFee;
            await userWallets.save();
            // await userWallets.save({session});

            walletHistoryObj = new WalletHistory(walletHistoryObj)
            walletHistoryObj.referralWallet = entryFee;
            await walletHistoryObj.save();
            // await walletHistoryObj.save({session});
    
        }else if((userWallets.referralBalance + userWallets.winningBalance) >= entryFee){
            let lastReferralAmount = userWallets.referralBalance
            let remainPaidAmount = entryFee - userWallets.referralBalance;
            userWallets.referralBalance = 0;
            userWallets.winningBalance = userWallets.winningBalance - remainPaidAmount;
            await userWallets.save();
            // await userWallets.save({session});
    
            walletHistoryObj = new WalletHistory(walletHistoryObj)
            walletHistoryObj.referralWallet = lastReferralAmount;
            walletHistoryObj.winningWallet = remainPaidAmount;
            await walletHistoryObj.save();
            // await walletHistoryObj.save({session});
    
        }else if(totalBalance >= entryFee){
            let lastReferralAmount = userWallets.referralBalance;
            let lastWinningAmount = userWallets.winningBalance;
            let remainAmount1 = entryFee - userWallets.referralBalance;
            userWallets.referralBalance = 0;
            let remainAmount2 = remainAmount1 - userWallets.winningBalance;
            userWallets.winningBalance = 0;
            userWallets.depositBalance = user.depositBalance - remainAmount2;
            await userWallets.save();
            // await userWallets.save({session});
    
            walletHistoryObj = new WalletHistory(walletHistoryObj)
            walletHistoryObj.referralWallet = lastReferralAmount;
            walletHistoryObj.winningWallet = lastWinningAmount;
            walletHistoryObj.depositWallet = remainAmount2;
            await walletHistoryObj.save();
            // await walletHistoryObj.save({session});
    
        }else if(totalBalance < entryFee){
            console.log('you don\'t have anything here');
            return null;
        }
        
        return 1;
        
    } catch (error) {
        console.log(error);
    }
}

/**
 * Get device type count
 * @function
 * @param {Number} startDate - Timestamp of startDate.
 * @param {Number} endDate - Timestamp of endDate.
 * @param {String} deviceType - Device type as in Android or IOS.
 * @returns {Number} response - Returns number of total logged in count.
 */
exports.deviceTypeCount = async function(startDate, endDate, deviceType) {
    const deviceTypeCount = await User.aggregate([
        { $unwind : "$deviceTokens" },
        { $match : 
            {$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}},{"deviceTokens.deviceType": deviceType}]}
        },
        {
            $group : {
                _id : {
                    deviceType : "$deviceTokens.deviceType"
                },
                count : { $sum: 1 }
            }
        }
    ])
    if(deviceTypeCount.length<1){
        return 0;
    }else{
        return deviceTypeCount[0].count;
    }
}

/**
 * Get all deposit amount sum
 * @function
 * @param {Number} startDate - Timestamp of startDate.
 * @param {Number} endDate - Timestamp of endDate.
 * @returns {Number} response - Returns total amount of money which have been deposited into the system for period of time.
 */
exports.depositAmountSum = async function(startDate, endDate) {
    const totalDeposit = await WalletHistory.aggregate([
        {
            $match : {$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}},{transactionFor: constants.TRANSACTION_FOR.DEPOSIT}, {transactionType : constants.TRANSACTION_TYPE.PLUS}]}
        },
        {
            $group :{
                _id :null,
                totalDepositAmount: {$sum: "$amount" }
            }
        }
    ])
    if(totalDeposit.length < 1){
        return 0;
    }else{
        return totalDeposit[0].totalDepositAmount;
    }
}

/**
 * Get all withdrawal amount sum
 * @function
 * @param {Number} startDate - Timestamp of startDate.
 * @param {Number} endDate - Timestamp of endDate.
 * @returns {Number} response - Returns total amount of money which have been withdrawn from the system for period of time.
 */
exports.withdrawalAmountSum = async function(startDate, endDate) {
    const totalWithdrawal = await WalletHistory.aggregate([
        {
            $match : {$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}},{transactionFor: constants.TRANSACTION_FOR.WITHDRAWAL}, {transactionType : constants.TRANSACTION_TYPE.MINUS}]}
        },
        {
            $group :{
                _id :null,
                totalWithdrawalAmount: {$sum: "$amount" }
            }
        }
    ])
    if(totalWithdrawal.length < 1){
        return 0;
    }else{
        return totalWithdrawal[0].totalWithdrawalAmount;
    }
}

/**
 * Get all participant amount sum
 * @function
 * @param {Number} startDate - Timestamp of startDate.
 * @param {Number} endDate - Timestamp of endDate.
 * @returns {Number} response - Returns total amount of money which have been used in order to participate in any contest format for period of time.
 */
exports.participatedAmountSum = async function(startDate, endDate) {
    const totalParticipated = await WalletHistory.aggregate([
        {
            $match : {$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}},{transactionFor: constants.TRANSACTION_FOR.PARTICIPATE}]}
        },
        {
            $group :{
                _id :null,
                totalParticipantAmount: {$sum: "$amount" }
            }
        }
    ])
    if(totalParticipated.length < 1){
        return 0;
    }else{
        return totalParticipated[0].totalParticipantAmount;
    }
}

/**
 * Get all refunded amount sum
 * @function
 * @param {Number} startDate - Timestamp of startDate.
 * @param {Number} endDate - Timestamp of endDate.
 * @returns {Number} response - Returns total amount of money which have been refunded to user wallets for period of time.
 */
exports.refundedAmountSum = async function(startDate, endDate) {
    const totalRefunded = await WalletHistory.aggregate([
        {
            $match : {$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}},{transactionFor: constants.TRANSACTION_FOR.REFUND}]}
        },
        {
            $group :{
                _id :null,
                totalRefundedAmount: {$sum: "$amount" }
            }
        }

    ])
    if(totalRefunded.length<1){
        return 0;
    }else{
        return totalRefunded[0].totalRefundedAmount;
    }
}

/**
 * Get all winning amount sum
 * @function
 * @param {Number} startDate - Timestamp of startDate.
 * @param {Number} endDate - Timestamp of endDate.
 * @returns {Number} response - Returns total amount of money which user has won in any contest for period of time.
 */
exports.winningAmountSum = async function(startDate, endDate) {
    const totalWinning = await WalletHistory.aggregate([
        {
            $match : {$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}},{transactionFor: constants.TRANSACTION_FOR.WINNING}]}
        },
        {
            $group :{
                _id :null,
                totalWinningAmount: {$sum: "$amount" }
            }
        }
    ])
    if(totalWinning.length<1){
        return 0;
    }else{
        return totalWinning[0].totalWinningAmount;
    }
}

/**
 * Get team count
 * @function
 * @param {Array} playerArr - Take playerArr which have been selected in order to participate in DFS contest
 * @returns {Number} response - Returns count of players from same team.
 */
exports.teamCount = async function(playerArr) {
    let playerData = await FootBallPlayerName.aggregate([
        {
            $match : {_id : {$in : playerArr}}
        },
        {
            $group : {
                _id : {
                    teamId : "$teamId"
                },
                count : { $sum: 1 }
            }
        }            
    ])
    if(playerData.length<1){
        return 0;
    }else{
        return playerData[0].count;
    }
}

/**
 * Get league team count
 * @function
 * @param {Array} playerArr - Take playerArr which have been selected in order to participate in League contest
 * @returns {Array} response - Returns an array of players count from same team.
 */
exports.leagueTeamCount = async function(playerArr) {
    let leaguePlayerData = await FootBallPlayerName.aggregate([
        {
            $match : {_id : {$in : playerArr}}
        },
        {
            $group : {
                _id : {
                    teamId : "$teamId"
                },
                count : { $sum: 1 }
            }
        }            
    ])
    return leaguePlayerData
}

/**
 * Get league team arr
 * @function
 * @param {ObjectId} _leagueId - _leagueId of particular league
 * @returns {Array} response - Returns an array of teamIds for that particular league.
 */
exports.leagueTeamArr = async function(_leagueId) {
    const leagueMatches = await FootBallLeagueWeek.find({_leagueId},{localTeamId : 1, visitorTeamId : 1});

    let teamIds = []

    for(let i=0;i<leagueMatches.length;i++){
        teamIds.push(leagueMatches[i].localTeamId, leagueMatches[i].visitorTeamId)
    }
    teamIdsArr = [];
        for (let j=0;j<teamIds.length;j++){
          if ( teamIdsArr.indexOf(teamIds[j]) == -1){
            teamIdsArr.push(teamIds[j]);
          }
      }
    
    return teamIdsArr;
}

/**
 * Find top 3 value from any object
 * @function
 * @param {Object} obj - Object with key and value.
 * @returns {Array} response - Returns an array with top 3 value.
 */
exports.sortObject = function(obj) {
    var arr = [];
    var prop;
    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        arr.push({
          key: prop,
          value: obj[prop]
        });
      }
    }
    arr.sort(function(a, b) {
      return b.value - a.value;
    });
    return arr;
}

/**
 * Round number nearest to 0.5 or round number
 * @function
 * @param {Number} DValue - Any numeric value .
 * @returns {Number} response - Returns an respective decimal value for example 1.0 or 1.5.
 */
exports.DecimalRound = function(DValue){
    return Math.round(DValue / 0.5) * 0.5;
}

/**
 * Get players for particular teams and position
 * @function
 * @param {String} localTeam - Local team Id .
 * @param {String} visitorTeam - Visitor team Id .
 * @param {String} playerPosition - Player position .
 * @returns {Array} response - Returns an array of players for particular two teams and particular position.
 */
exports.getTeamPlayerWithPosition = async function(localTeam, visitorTeam, playerPosition){
    let footballMatchPlayers = await FootBallPlayerName.find({$or:[{teamId: localTeam},{teamId: visitorTeam}, playerPosition]})
    return footballMatchPlayers;
}

/**
 * Shuffle an array
 * @function
 * @param {Array} array - An array which you want to shuffle
 * @returns {Array} response - Returns a shuffled array.
 */
exports.shuffleAnArray = async function (array) {
    array.sort(() => Math.random() - 0.5);
}

/**
 * Get percentage value
 * @function
 * @param {Number} sub - Any numeric value
 * @param {Number} total - Any numeric value
 * @returns {Number} response - Returns percentage for above two parameters.
 */
exports.getPercentageValue = async (sub, total) => {
    return Math.round((sub * 100) / total)
};

/**
 * Add objectId
 * @function
 * @param {Array} arrayData - An array containing string ids
 * Add an ObjectId in string Id.
 * @returns {Array} response - Returns an array of ObjectIds.
 */
exports.assignObjectIdToValue = async (arrayData) => {
    return arrayData.map((key) => {
        return mongoose.Types.ObjectId(key);
    })
}

/**
 * Get point on particular action
 * @function
 * @param {Object} globalPointSystem - An object
 * @param {Object} idsObject - An object
 * @param {Object} apiRespObject - An object
 * @returns {Object} response - Returns an object.
 */
exports.getPointsOnAction = async (globalPointSystem, apiRespObject) => {
    //console.log(globalPointSystem)
    let actionValue = value = 0;
    let resultObj = {};
    if(apiRespObject){
        for (let key in apiRespObject){
            if(apiRespObject.hasOwnProperty(key)){
              //console.log(`${key} : ${apiRespObject[key]}`)
              resultObj['position'] = apiRespObject['position'];
              
              switch(key){
                case 'pass':
                    objectVal = globalVal = 'pass';
                    resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    break;
                case 'dribble':
                    objectVal = globalVal = 'dribble';
                    resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    break;
                case 'foul':
                    objectVal = globalVal = 'foul';
                    resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    break;
                case 'yellowCard':
                    objectVal = globalVal = 'yellowCard';
                    resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    break;
                case 'redCard':
                    objectVal = globalVal = 'redCard';
                    resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    break;
                case 'shot':
                    objectVal = globalVal = 'shot';
                    resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    break;
                case 'tackle':
                    objectVal = globalVal = 'tackle';
                    resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    break;
                case 'missedPenalty':
                    objectVal = globalVal = 'missedPenalty';
                    resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    break;
                case 'ownGoal':
                    objectVal = globalVal = 'ownGoal';
                    resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    break;
                case 'assist':
                    objectVal = globalVal = 'assist';
                    if(apiRespObject['position'] == soccer.PLAYER_POSITION.GOAL_KEEPER){
                        globalVal = 'goalkeeperAssist';
                    }else if(apiRespObject['position'] == soccer.PLAYER_POSITION.MIDFIELDER){
                        globalVal = 'midfielderAssist';
                    }else if(apiRespObject['position'] == soccer.PLAYER_POSITION.DEFENDER){
                        globalVal = 'defenderAssist';
                    }else if(apiRespObject['position'] == soccer.PLAYER_POSITION.ATTACKER){
                        globalVal = 'forwardAssist';
                    }
                    resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    break;
                case 'goalScored':
                    objectVal = globalVal = 'goalScored';
                    if(apiRespObject['position'] == soccer.PLAYER_POSITION.GOAL_KEEPER){
                        globalVal = 'goalScoredByGoalkeeper';
                    }else if(apiRespObject['position'] == soccer.PLAYER_POSITION.MIDFIELDER){
                        globalVal = 'goalScoredByMidfielder';
                    }else if(apiRespObject['position'] == soccer.PLAYER_POSITION.DEFENDER){
                        globalVal = 'goalScoredByDefender';
                    }else if(apiRespObject['position'] == soccer.PLAYER_POSITION.ATTACKER){
                        globalVal = 'goalScoredByForward';
                    }
                    resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    break;
                case 'minsPlayed':
                    playingUpToMinsCount = globalPointSystem['playingUpToMins']['actionCount'];
                    playingMoreThanMinsCount = globalPointSystem['playingMoreThanMins']['actionCount'];
                    
                    objectVal = 'minsPlayed'; 
                    globalVal = 'playingUpToMins';
                    if(apiRespObject[key] && (parseInt(apiRespObject[key]) <= playingUpToMinsCount)){
                        resultObj['playingUpToMins'] = globalPointSystem[globalVal]['actionPoint'];
                    }else{
                        resultObj['playingUpToMins'] = constants.DEFAULT_VALUE;
                    }
                    
                    objectVal = 'minsPlayed';
                    globalVal = 'playingMoreThanMins';
                    if(apiRespObject[key] && (parseInt(apiRespObject[key]) > playingMoreThanMinsCount)){
                        resultObj['playingMoreThanMins'] = globalPointSystem[globalVal]['actionPoint'];
                    }else{
                        resultObj['playingMoreThanMins'] = constants.DEFAULT_VALUE;
                    }
                    break;
                case 'cleanSheet':
                    globalVal = 'cleanSheetByGoalkeeper';
                    objectVal = 'cleanSheet';
                    if(apiRespObject['position'] == soccer.PLAYER_POSITION.GOAL_KEEPER){
                        globalVal = 'cleanSheetByGoalkeeper';
                        resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    }else if(apiRespObject['position'] == soccer.PLAYER_POSITION.MIDFIELDER){
                        globalVal = 'cleanSheetByMidfielder';
                        resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    }else if(apiRespObject['position'] == soccer.PLAYER_POSITION.DEFENDER){
                        globalVal = 'cleanSheetByDefender';
                        resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    }
                break;
                case 'saves':
                    objectVal = globalVal = 'saves';
                    globalVal = 'saveByGoalkeeper';
                    if(apiRespObject['position'] == soccer.PLAYER_POSITION.GOAL_KEEPER){
                        resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    }else{
                        resultObj[objectVal] = 0;
                    }
                    break;
                case 'penaltySave':
                    objectVal = globalVal = 'penaltySave';
                    resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    break;
                case 'goalConceded':
                    objectVal = globalVal = 'goalConceded';
                    if(apiRespObject['position'] == soccer.PLAYER_POSITION.GOAL_KEEPER){
                        globalVal = 'goalConcededByGoalkeeper';
                        resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    }else if(apiRespObject['position'] == soccer.PLAYER_POSITION.MIDFIELDER){
                        globalVal = 'goalConcededByMidfielder';
                        resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    }else if(apiRespObject['position'] == soccer.PLAYER_POSITION.DEFENDER){
                        globalVal = 'goalConcededByDefender';
                        resultObj[objectVal] = await requestHelper.assignPointOnActionValue(apiRespObject[key], globalPointSystem[globalVal]['actionCount'], globalPointSystem[globalVal]['actionPoint']);
                    }
                    break;
                default:
                    resultObj[key] = apiRespObject[key];
                    //console.log('Default case called');
              }
            }
         }
    }
    //console.log("resultObj", resultObj);
    return resultObj;
}

/**
 * Point calculation
 * @function
 * @param {Object} playerStatsData - An object
 * @param {Array} boosterArr - An array
 * @returns {Number} response - Returns sum of particular action with booster value.
 */
exports.getPointsCalculation = async (playerStatsData, boosterArr, detailsObj) => {
    // console.log("Inside get points calculation");
    // console.log(playerStatsData);
    // console.log("boosterArr", boosterArr);
    // process.exit(0)
    let sumValue = 0;
    let teamSystemId = detailsObj.teamSystemId;
    let contestLevel = detailsObj.contestLevel;
    let weekNumber = detailsObj.weekNumber;

    if(playerStatsData){
        if(boosterArr.length > 0){
            playerStatsData = await requestHelper.applyBoosterPoints(playerStatsData, boosterArr);
        }
        playerStats = playerStatsData;

        // console.log("PlayerId: "+playerStats._playerId);
        // console.log("TeamId: "+teamSystemId);
        for (let key in playerStats){
            if(playerStats.hasOwnProperty(key)){
                 //console.log(key);
                // console.log(sumValue, playerStats[key]);
              //console.log(`${key} : ${playerStats[key]}`)
              switch(key){
                case 'pass':
                    sumValue += playerStats[key];
                    //console.log('pass',playerStats[key]);
                    break;
                case 'dribble':
                    sumValue += playerStats[key];
                    //console.log('dribble',playerStats[key]);
                    break;
                case 'foul':
                    sumValue += playerStats[key];
                    //console.log('foul',playerStats[key]);
                    break;
                case 'yellowCard':
                    sumValue += playerStats[key];
                    //console.log('yellowCard',playerStats[key]);
                    break;
                case 'redCard':
                    sumValue += playerStats[key];
                    //console.log('redCard',playerStats[key]);
                    break;
                case 'shot':
                    sumValue += playerStats[key];
                    //console.log('shot',playerStats[key]);
                    break;
                case 'tackle':
                    sumValue += playerStats[key];
                    //console.log('tackle',playerStats[key]);
                    break;
                case 'missedPenalty':
                    sumValue += playerStats[key];
                    //console.log('missedPenalty',playerStats[key]);
                    break;
                case 'ownGoal':
                    sumValue += playerStats[key];
                    //console.log('ownGoal',playerStats[key]);
                    break;
                case 'assist':
                    sumValue += playerStats[key];
                    //console.log('assist',playerStats[key]);
                    break;
                case 'goalScored':
                    sumValue += playerStats[key];
                    //console.log('goalScored',playerStats[key]);
                    break;
                case 'playingUpToMins':
                    sumValue += playerStats[key];
                    //console.log('playingUpToMins',playerStats[key]);
                    break;
                case 'playingMoreThanMins':
                    sumValue += playerStats[key];
                    //console.log('playingMoreThanMins',playerStats[key]);
                    break;
                case 'cleanSheet':
                    sumValue += playerStats[key];
                    //console.log('cleanSheet',playerStats[key]);
                    break;
                case 'saves':
                    sumValue += playerStats[key];
                    //console.log('saves',playerStats[key]);
                    break;
                case 'penaltySave':
                    sumValue += playerStats[key];
                    //console.log('penaltySave',playerStats[key]);
                    break;
                case 'goalConceded':
                    sumValue += playerStats[key];
                    //console.log('goalConceded',playerStats[key]);
                    break;
                default:
                    break;
                    //console.log('Default case called');
              }
            }
         }
    }

    // console.log("sumValue: "+sumValue);
    if(contestLevel == constants.CONTEST_LEVEL.DFS){
        let updateTotalPlayerPoints = await SelectFootBallTeamPlayer.findOneAndUpdate({
            _playerId: playerStatsData._playerId,
            _teamId: teamSystemId,
        },{
            totalPoints: sumValue,
            updatedAt: dateFormat.setCurrentTimestamp()
        });
    }else{
        let updateTotalPlayerPointsForLeagueWeek = await SelectLeagueFootBallTeamPlayer.findOneAndUpdate({
            _playerId: playerStatsData._playerId,
            _leagueTeamId: teamSystemId,
            gameWeek: weekNumber
        },{
            updatedAt: dateFormat.setCurrentTimestamp(),
            $inc : {totalPoints : sumValue}
        });
    }
    return sumValue;
}

/**
 * Insert Notification into database
 * @function
 * @param {ObjectId} _userId - User id
 * @param {String} message - Message which you want to save
 * @param {String} status - Notification type meaning which kind of notification it is.
 * @param {String} image - Notification image
 * @param {ObjectId} _contestId - Contest Id
 * @param {String} contestName - Contest Name
 * @param {ObjectId} _teamId - Team Ids
 * Save document with above data in Notification collection.
 */
exports.insertNotification = async (_userId, message, status, image, _contestId = null, contestName = null, _teamId = null, orderId = null) => {
    const notificationCreate = await new Notification({
        notification: message,
        _userId,
        _contestId,
        contestName,
        _teamId,
        orderId,
        notificationType : status,
        notificationImage : image,
        createdAt : dateFormat.setCurrentTimestamp(),
        updatedAt : dateFormat.setCurrentTimestamp(),
    });
    await notificationCreate.save();
}

/**
 * Send Notification to follower
 * @function
 * @param {Object} userData - User object
 * @param {Number} status - Notification status number
 * Call sendUserNotification function and passed followerId, userId, userName and notification status
 */
exports.sendNotificationToFollower = async (userData, status) => {
    let followerUser = await Follower.find({_userId : userData._id},{_followerId : 1})

    for(let i=0;i<followerUser.length;i++){
        await notificationFunction.sendUserNotification(followerUser[i]._followerId, userData._id, userData.userName, status);
    }
}

/**
 * Send Notification to follower for high rank
 * @function
 * @param {Object} userData - User object
 * @param {Number} status - Notification status number
 * @param {Number} rank - Rank that user got in particular contest
 * @param {ObjectId} _contestId - Contest Id
 * @param {String} contestName - Contest Name
 * @param {ObjectId} _teamId - Team Id
 * Call sendUserNotificationForHighRank function and passed followerId, userName, _contestId, contestName, status, rank and _teamId.
 */
exports.sendNotificationToFollowerForHighRank = async (userData, status, rank, _contestId, contestName, _teamId) => {
    let followerUser = await Follower.find({_userId : userData._id},{_followerId : 1})

    for(let i=0;i<followerUser.length;i++){
        await notificationFunction.sendUserNotificationForHighRank(followerUser[i]._followerId, userData.userName, _contestId, contestName, status, rank, _teamId);
    }
}

/**
 * Find previous game week
 * @function
 * @param {ObjectId} _leagueId - League Id
 * @returns {Number} response - Returns previous week number of particular league.
 */
exports.getPreviousGameWeek = async (_leagueId) => {
    
    let currentTimeStamp = +await dateFormat.setCurrentTimestamp();

    let gameWeek = await LeagueWeekMaster.findOne({_leagueId, weekFirstMatchStartTime :{$lte : currentTimeStamp}})
    .sort({weekFirstMatchStartTime : -1})
    .skip(1)
    if(gameWeek){
        return gameWeek.weekNumber
    }else{
        return constants.DEFAULT_VALUE
    }

}

/**
 * Find current game week
 * @function
 * @param {ObjectId} _leagueId - League Id
 * @returns {Number} response - Returns current week number of particular league.
 */
exports.getCurrentGameWeek = async (_leagueId) => {

    let currentTimeStamp = +await dateFormat.setCurrentTimestamp();

    let gameWeek = await LeagueWeekMaster.findOne({_leagueId, weekFirstMatchStartTime :{$lte : currentTimeStamp}}).sort({weekFirstMatchStartTime : -1})

    if(gameWeek){
        return gameWeek.weekNumber
    }else{
        return constants.DEFAULT_VALUE
    }

}

/**
 * Find next game week
 * @function
 * @param {ObjectId} _leagueId - League Id
 * @returns {Number} response - Returns next week number of particular league.
 */
exports.getNextGameWeek = async (_leagueId, next1Hr = null) => {
    let currentTimeStamp;
    if(next1Hr == null){
        currentTimeStamp = +await dateFormat.setCurrentTimestamp();
    }else{
        currentTimeStamp = next1Hr;
    }

    let gameWeek = await LeagueWeekMaster.findOne({_leagueId, weekFirstMatchStartTime :{$gt : currentTimeStamp}})

    if(gameWeek){
        return gameWeek.weekNumber
    }else{
        return constants.DEFAULT_VALUE
    }
}

/**
 * Check booster available in his profile
 * @function
 * @param {ObjectId} _id - user _id who is trying to apply booster in the contest
 * @param {ObjectId} _boosterId - _boosterId which is trying to apply in the contest
 * @returns {Number} response - Returns 1 if user has booster quntity more than 0 in his wallet or else null.
 */
exports.checkUserBoosters = async (_id, _boosterId) => {

    let isUserBoosterAvailable = await User.findOne({_id, boosters : { $elemMatch: { _boosterId, boosterQty: {$gt:0}}}})
    
    if(isUserBoosterAvailable){
        return constants.BOOSTER_ASSIGNED_BY.PRIVATE;
    }else{
        return null;
    }
}

/**
 * Deduct booster available in his profile
 * @function
 * @param {ObjectId} _id - user _id who is trying to apply booster in the contest
 * @param {ObjectId} _boosterId - _boosterId which is trying to apply in the contest
 * @returns {Number} response - Returns 1 if booster quntity deducted successfully from user wallet or else null.
 */
exports.deductUserBoosters = async (_id, _boosterId) => {

    let isUserBoosterAvailable = await User.findOneAndUpdate({_id, boosters : { $elemMatch: { _boosterId, boosterQty: {$gt:0}}}},{
        $inc : {"boosters.$.boosterQty" : -1}
        })
    
    if(isUserBoosterAvailable){
        return constants.BOOSTER_ASSIGNED_BY.PRIVATE;
    }else{
        return null;
    }
}

/**
 * Give booster back to user
 * @function
 * @param {ObjectId} _id - user _id who has applied booster in the contest
 * @param {ObjectId} _boosterId - _boosterId which applied in the contest
 * It will increase quntity of booster which user has applied in the contest
 */
exports.giveBoosterBackToUser = async (_id, _boosterId) => {
    let user = await User.findOneAndUpdate({_id, boosters : { $elemMatch: { _boosterId }}},{
        $inc : {"boosters.$.boosterQty" : 1}
        })
}

/**
 * Check whether device is available or not
 * @function
 * @param {String} deviceId - deviceId which user has used in order to sign up with promocode
 * @returns {Number} response - Returns 1 if deviceId is been used else 0.
 */
exports.checkDeviceAvaibility = async (deviceId) => {

    let count = await UsedPromosBySameDevices.countDocuments({deviceId});
    if(count > 0){
        return 1;
    }else{
        return 0
    }

}

/**
 * Check whether Promocode is available or not
 * @function
 * @param {String} usedPromoCode - promocode which user has used in order to sign up
 * @param {Number} quantity - quantity of promocode, how many available in total
 * @returns {Number} response - Returns 1 if promocode is available else 0.
 */
exports.checkPromoCodeAvaibility = async (usedPromoCode, quantity) => {

    let count = await UsedPromosBySameDevices.countDocuments({usedPromoCode});
    if(count >= quantity){
        return 1;
    }else{
        return 0
    }

}

/**
 * Deduct TDS amount form user winning wallet if amount is greater  or equal than 10000 in DFS
 * @function
 * @param {Request} req - 
 * @param {ObjectId} _dfsContestId - _dfsContestId in which user has won amount of 10000 or more
 * It will check in the wallet history for particular DFS contest and see if user has won more than 10000 rs.
 * If is there any enrty then it will deduct TDS percentage from that amount and will create new entry.
 * After this, It will fire an email to particular TDS email address to file TDS amount with user verified pan number.
 * If user has not verified his pan then will fire an email to TDS email address saying please contact user to verify his pan card number in order to file an TDS.
 */
exports.deductTDSAmountFromUserAccountForDFS = async (req, _dfsContestId) => {

    let globalGeneralSettings = await GlobalGeneralSettings.findOne();
    let tdsAmount = globalGeneralSettings.tdsAmount;
    let tdsPercentage = globalGeneralSettings.tdsPercentage;
    let email = globalGeneralSettings.adminEmailForTDS;

    let walletData = await WalletHistory.find({_dfsContestId, winningWallet : {$gte : tdsAmount}, transactionFor : constants.TRANSACTION_FOR.WINNING })

    for(let y=0;y<walletData.length;y++){
        
        let winningAmount = walletData[y].winningWallet;
        let amount = winningAmount / tdsPercentage;
        let _userId = walletData[y]._userId
        let _dfsContestId = walletData[y]._dfsContestId;
        let _teamId = walletData[y]._teamId;
        let dfsContestName = walletData[y].dfsContestName;

        let updatedUserData = await User.findOneAndUpdate({_id: _userId},
            {
                $inc : {winningBalance : -(amount)}
            });
        
        let walletHistoryObj = new WalletHistory({
            _userId,
            _teamId,
            _dfsContestId,
            dfsContestName,
            winningWallet: amount,
            amount: amount,
            competitionType : constants.COMPETITION_TYPE.DFS,
            transactionType : constants.TRANSACTION_TYPE.MINUS,
            transactionFor : constants.TRANSACTION_FOR.TDS,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp()
        })

        let data = await walletHistoryObj.save();
        
        if(data){
            let templateSlug = (updatedUserData.isPanVerified) ? constants.EMAIL_TEMPLATE.TDS_DEDUCTION : constants.EMAIL_TEMPLATE.TDS_DEDUCTION_WITHOUT_PAN;

            let sendMail = {
                'to': email,
                'templateSlug': templateSlug,
                'data': {
                    winningAmount,
                    amount,
                    _userId,
                    _contestId: _dfsContestId,
                    contestName: dfsContestName,
                    userName : updatedUserData.userName,
                    panCardNumber : updatedUserData.panCardNumber,
                    email: updatedUserData.email
                }
            }
    
            let isSendEmail = await sendEmail(req, sendMail);
            if (isSendEmail) {
                console.log('email has been sent');
            } else {
                console.log('email has not been sent');
            }
        }


    }

}

/**
 * Deduct TDS amount form user winning wallet if amount is greater  or equal than 10000 in League
 * @function
 * @param {Request} req - 
 * @param {ObjectId} _leagueContestId - _leagueContestId in which user has won amount of 10000 or more
 * It will check in the wallet history for particular League contest and see if user has won more than 10000 rs.
 * If is there any enrty then it will deduct TDS percentage from that amount and will create new entry.
 * After this, It will fire an email to particular TDS email address to file TDS amount with user verified pan number.
 * If user has not verified his pan then will fire an email to TDS email address saying please contact user to verify his pan card number in order to file an TDS.
 */
exports.deductTDSAmountFromUserAccountForLeague = async (req, _leagueContestId) => {

    let globalGeneralSettings = await GlobalGeneralSettings.findOne();
    let tdsAmount = globalGeneralSettings.tdsAmount;
    let tdsPercentage = globalGeneralSettings.tdsPercentage;
    let email = globalGeneralSettings.adminEmailForTDS;

    let walletData = await WalletHistory.find({_leagueContestId, winningWallet : {$gte : tdsAmount}, transactionFor : constants.TRANSACTION_FOR.WINNING })

    for(let y=0;y<walletData.length;y++){
        
        let winningAmount = walletData[y].winningWallet;
        let amount = winningAmount / tdsPercentage;
        let _userId = walletData[y]._userId
        let _leagueContestId = walletData[y]._leagueContestId;
        let _teamId = walletData[y]._teamId;
        let leagueContestName = walletData[y].leagueContestName;

        let updatedUserData = await User.findOneAndUpdate({_id: _userId},
            {
                $inc : {winningBalance : -(amount)}
            });
        
        let walletHistoryObj = new WalletHistory({
            _userId,
            _teamId,
            _leagueContestId,
            leagueContestName,
            winningWallet: amount,
            amount: amount,
            competitionType : constants.COMPETITION_TYPE.LEAGUE,
            transactionType : constants.TRANSACTION_TYPE.MINUS,
            transactionFor : constants.TRANSACTION_FOR.TDS,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp()
        })

        let data = await walletHistoryObj.save();
        
        if(data){
            let templateSlug = (updatedUserData.isPanVerified) ? constants.EMAIL_TEMPLATE.TDS_DEDUCTION : constants.EMAIL_TEMPLATE.TDS_DEDUCTION_WITHOUT_PAN;

            let sendMail = {
                'to': email,
                'templateSlug': templateSlug,
                'data': {
                    winningAmount,
                    amount,
                    _userId,
                    _contestId: _leagueContestId,
                    contestName: leagueContestName,
                    userName : updatedUserData.userName,
                    panCardNumber : updatedUserData.panCardNumber,
                    email: updatedUserData.email
                }
            }
    
            let isSendEmail = await sendEmail(req, sendMail);
            if (isSendEmail) {
                console.log('email has been sent');
            } else {
                console.log('email has not been sent');
            }
        }


    }

}

/**
 * Deduct TDS amount form user winning wallet if amount is greater  or equal than 10000 in Trivia
 * @function
 * @param {Request} req - 
 * @param {ObjectId} _triviaId - _triviaId in which user has won amount of 10000 or more
 * It will check in the wallet history for particular Trivia contest and see if user has won more than 10000 rs.
 * If is there any enrty then it will deduct TDS percentage from that amount and will create new entry.
 * After this, It will fire an email to particular TDS email address to file TDS amount with user verified pan number.
 * If user has not verified his pan then will fire an email to TDS email address saying please contact user to verify his pan card number in order to file an TDS.
 */
exports.deductTDSAmountFromUserAccountForTrivia = async (req, _triviaId) => {

    let globalGeneralSettings = await GlobalGeneralSettings.findOne();
    let tdsAmount = globalGeneralSettings.tdsAmount;
    let tdsPercentage = globalGeneralSettings.tdsPercentage;
    let email = globalGeneralSettings.adminEmailForTDS;

    let walletData = await WalletHistory.find({_triviaId, winningWallet : {$gte : tdsAmount}, transactionFor : constants.TRANSACTION_FOR.WINNING })

    for(let y=0;y<walletData.length;y++){
        
        let winningAmount = walletData[y].winningWallet;
        let amount = winningAmount / tdsPercentage;
        let _userId = walletData[y]._userId
        let _triviaId = walletData[y]._triviaId;
        let triviaName = walletData[y].triviaName;

        let updatedUserData = await User.findOneAndUpdate({_id: _userId},
            {
                $inc : {winningBalance : -(amount)}
            });
        
        let walletHistoryObj = new WalletHistory({
            _userId,
            _triviaId,
            triviaName,
            winningWallet: amount,
            amount: amount,
            competitionType : constants.COMPETITION_TYPE.TRIVIA,
            transactionType : constants.TRANSACTION_TYPE.MINUS,
            transactionFor : constants.TRANSACTION_FOR.TDS,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp()
        })

        let data = await walletHistoryObj.save();
        
        if(data){

            let templateSlug = (updatedUserData.isPanVerified) ? constants.EMAIL_TEMPLATE.TDS_DEDUCTION : constants.EMAIL_TEMPLATE.TDS_DEDUCTION_WITHOUT_PAN;

            let sendMail = {
                'to': email,
                'templateSlug': templateSlug,
                'data': {
                    winningAmount,
                    amount,
                    _userId,
                    _contestId: _triviaId,
                    contestName: triviaName,
                    userName : updatedUserData.userName,
                    panCardNumber : updatedUserData.panCardNumber,
                    email: updatedUserData.email
                }
            }
    
            let isSendEmail = await sendEmail(req, sendMail);
            if (isSendEmail) {
                console.log('email has been sent');
            } else {
                console.log('email has not been sent');
            }
        }


    }

}

/**
 * Remove specific keys from an object
 * @function
 * @param {Object} data - user object from which we want to remove specified keys
 * It will remove keys specified below from given object
 */
exports.removeKeyFromObject = async(data) => {
    data.deviceTokens = undefined;
    data.tokens = undefined;
    data.resetPasswordExpires = undefined;
    data.resetPasswordToken = undefined;
    data.deviceToken = undefined;
    data.deviceType = undefined;
    data.referredByName = undefined;
    data.__v = undefined;
    data.syncAt = undefined;
    data.updatedAt = undefined;
    data.createdAt = undefined;
    data.deletedAt = undefined;
    data.otp = undefined;
    data._referBy = undefined;
    data.referredByName = undefined;
}

/**
 * Remove an image from bucket
 * @function
 * @param {String} filename - Give key where image is stored in S3 bucket
 * It will remove an image from S3 bucket
 */
exports.destroyS3Image = async function (filename, callback) {

        var params = {
    
            Bucket: keys.AWS_BUCKET,
    
            Key: filename
    
        };
    
        console.log("Call destroyS3Image " + filename);
    
        await s3.headObject(params, async function (err, metadata) {  
    
            if (err && err.code === 'NotFound') {  
    
                //callback(err);
    
            } else {      
                console.log("image found: " + filename);
                    await s3.deleteObject(params, function(err, data) {
                        if (err) {
                            console.log(err);
                            //callback(err);
                        } else {
                            console.log('image deleted');
                            //callback(null);
                        }
                    }); 
                }
            });     
    }

/**
 * Resize an image
 * @function
 * @param {String} filename - Give key where image is stored in S3 bucket
 * @param {String} filePath - Give '' if your key is containing the whole path to your image else path where your file is exist
 * It will resize an image from S3 bucket
 */
 exports.resizeImageInAWS = async function (fileName, filePath) {

        try {
    
            console.log(fileName)
    
            // await fse.copy(fileName, destinationFolder)
    
            //console.log('success!')
    
            var MAX_WIDTH  = 240;
    
            var MAX_HEIGHT = 240;

            var srcKey    = decodeURIComponent(filePath+fileName);  
    
            var dstKey    = fileName;
       
            var typeMatch = srcKey.match(/\.([^.]*)$/);
    
            if (!typeMatch) {
    
                //throw new Error('Could not determine the image type.');
    
            }
            var imageType = typeMatch[1];
            if (imageType == "gif") {
                    const params = {
                        Bucket: keys.AWS_BUCKET,
                        Key: srcKey,
                    };
                   await s3.headObject(params, function (err, metadata) {  
                        //if (err && err.code === 'NotFound') throw new Error(err);
                    });
              const result = await s3.getObject(params).promise();
                    params.Body = result.Body;
                    params.Key = dstKey;
                    params.ACL = 'public-read';
                    // //putObject // upload
                    await s3.putObject(params, function(s3Err, data) {
                        //if (s3Err) throw new Error(s3Err);
                        console.log(`File uploaded successfully at ${dstKey}`)
                    });
                }else{
                    async.waterfall([
                        function download(next) {
                            // Download the image from S3 into a buffer.
                            s3.getObject({
                                Bucket: keys.AWS_BUCKET,
                                Key: srcKey
                            }, next);
                        },
                        function transform(response, next) {                    
                            gm(response.Body).size(function(err, size) {
                                console.log(err)
                                console.log(size)
                                if(err){
                                    next(null,response.ContentType,response.Body)
                                }else{
                                    // Infer the scaling factor to avoid stretching the image unnaturally.
                                    var scalingFactor = Math.min(
                                        MAX_WIDTH / size.width,
                                        MAX_HEIGHT / size.height
                                    );
                                        var width  = scalingFactor * size.width;
                                    var height = scalingFactor * size.height;
                                    // Transform the image buffer in memory.
                                    this.resize(width, height).toBuffer(imageType, function(err, buffer) {
                                        if (err) {
                                            next(err);
                                        } else {
                                            next(null, response.ContentType, buffer);
                                        }
                                    });
                                }
                            });
                        },
                        function upload(contentType, data, next) {
                            // Stream the transformed image to a different S3 bucket.
                            s3.putObject({
                                Bucket: keys.AWS_BUCKET,
                                Key: dstKey,
                                Body: data,
                                ContentType: contentType,
                                ACL: 'public-read'
                            }, next);
                        }
                    ], function (err) {
                        if (err) {
                            console.error('Unable to resize ' + srcKey + ' and upload to ' + dstKey + ' due to an error: ' + err);
                        } else {
                            console.log('Successfully resized ' + srcKey +' and uploaded to ' + dstKey);
                        }
                    });
                }
            } catch (error) {
        console.log(error);
    //         await dynamicmail.sendErrorReportToDeveloper(error);
            }
        };

/**
 * Get AWS image url
 * @function
 * @param {Object} data - user object
 * @returns {URL} response - Returns URLs if if user has profilePic or panCardImage value in object.
 */
exports.getAWSImageUrl = function (data) {

    if(data){
        if (data.profilePic) {
            data.profilePic = keys.AWS_IMG_BASE_URL + '/' + constants.URL.PROFILE_IMG_URL + '/' + data.profilePic; 
        }
        if (data.panCardImage) {
            data.panCardImage = keys.AWS_IMG_BASE_URL + '/' + constants.URL.PROFILE_IMG_URL + '/' + data.panCardImage; 
        }  
    }

}

/**
 * Generate URL if kit exist
 * @function
 * @param {object} data - object of user data.
 * @returns {URL} response - Returns URLs if kit image exist.
 */
exports.generateAWSKitImageURL = function (data){
    if(data){
        if (data.kitFrontImage) {
            data.kitFrontImage = keys.AWS_IMG_BASE_URL + '/' + constants.URL.KIT_IMG_URL + '/' + data.kitFrontImage; 
        }
        if (data.kitBackImage) {
            data.kitBackImage = keys.AWS_IMG_BASE_URL + '/' + constants.URL.KIT_IMG_URL + '/' + data.kitBackImage; 
        }  
    }
}

/**
 * Generate URL if badge image exist
 * @function
 * @param {object} data - object of user data.
 * @returns {URL} response - Returns URLs if kit image exist.
 */
exports.generateAWSBadgeImageURL = function (data){
    if(data){
        if (data.badgeImage) {
            data.badgeImage = keys.AWS_IMG_BASE_URL + '/' + constants.URL.BADGE_IMG_URL + '/' + data.badgeImage; 
        } 
    }
}

/**
 * Generate URL if notification image exist
 * @function
 * @param {object} data - object of user data.
 * @returns {URL} response - Returns URLs if kit image exist.
 */
exports.generateAWSNotificationImageURL = function (data){
    if(data){
        if (data.notificationImage) {
            data.notificationImage = keys.AWS_IMG_BASE_URL + '/' + constants.URL.NOTIFICATION_IMG_URL + '/' + data.notificationImage; 
        } 
    }
}

/**
 * Copy badge images to AWS s3
 * @function
 */
exports.copyFilesToBadgeImageInAWSS3 = async () => {
    // configuration
    const config = {
    // folderPath: 'public/images/badgeImage' // path relative script's location
    folderPath: constants.PATH.BADGE_IMAGE_PATH // path relative script's location
    };

    // resolve full folder path
    const distFolderPath = path.join(__dirname, `../${config.folderPath}`);

    // get of list of files from 'dist' directory
    fs.readdir(distFolderPath, (err, files) => {

        if(!files || files.length === 0) {
            console.log(`provided folder '${distFolderPath}' is empty or does not exist.`);
            console.log('Make sure your project was compiled!');
            return;
        }

        // for each file in the directory
        for (let fileName of files) {

            // get the full path of the file
            const filePath = path.join(distFolderPath, fileName);
            
            // ignore if directory
            if (fs.lstatSync(filePath).isDirectory()) {
                continue;
            }

            // read file contents
            fs.readFile(filePath, (error, fileContent) => {
                // if unable to read file contents, throw exception
                if (error) { throw error; }

                // upload file to S3
                s3.putObject({
                    Bucket: keys.AWS_BUCKET,
                    Key: `${constants.URL.BADGE_IMG_URL}/${fileName}`,
                    Body: fileContent,
                    ACL: 'public-read'
                }, (res) => {
                    console.log(`Successfully uploaded '${fileName}'!`);
                });

            });
        }
    });
}

/**
 * Copy notification images to AWS s3
 * @function
 */
exports.copyFilesToNotificationImageInAWSS3 = async () => {
    // configuration
    const config = {
    // folderPath: 'public/images/badgeImage' // path relative script's location
    folderPath: constants.PATH.NOTIFICATION_IMAGE_PATH // path relative script's location
    };

    // resolve full folder path
    const distFolderPath = path.join(__dirname, `../${config.folderPath}`);

    // get of list of files from 'dist' directory
    fs.readdir(distFolderPath, (err, files) => {

        if(!files || files.length === 0) {
            console.log(`provided folder '${distFolderPath}' is empty or does not exist.`);
            console.log('Make sure your project was compiled!');
            return;
        }

        // for each file in the directory
        for (let fileName of files) {

            // get the full path of the file
            const filePath = path.join(distFolderPath, fileName);
            
            // ignore if directory
            if (fs.lstatSync(filePath).isDirectory()) {
                continue;
            }

            // read file contents
            fs.readFile(filePath, (error, fileContent) => {
                // if unable to read file contents, throw exception
                if (error) { throw error; }

                // upload file to S3
                s3.putObject({
                    Bucket: keys.AWS_BUCKET,
                    Key: `${constants.URL.NOTIFICATION_IMG_URL}/${fileName}`,
                    Body: fileContent,
                    ACL: 'public-read'
                }, (res) => {
                    console.log(`Successfully uploaded '${fileName}'!`);
                });

            });
        }
    });
}

/**
 * wait Randomly
 * @function
 */
exports.waitRandomly = async () => {
    await new Promise(async (resolve, reject) => {
        const rand = ((Math.random() * 500) + (Math.random() * 500));
       await setTimeout(()=>{
          resolve(console.log('first here'))
       }, rand)
     console.log(rand,'rand');
    })
    console.log('please check');
}

/**
 * Find duplicate numbers
 * @function
 */
exports.findDuplicateNumbers = async (arr) => {
    var counts = {};
    let num = 0;
    arr.forEach(function(x) { 
        counts[x] = (counts[x] || 0)+1; 
        if(counts[x] > 1){
            num = counts[x]
        }
    });
    return num;
 }

/**
 * Get point on particular action
 * @function
 * @param {Object} apiRespObject - An object
 * @returns {Object} response - Returns an object.
 */
exports.getActionsOfPlayer = async (apiRespObject) => {
    let resultObj = {};
    if(apiRespObject){
        for (let key in apiRespObject){
            if(apiRespObject.hasOwnProperty(key)){
              //console.log(`${key} : ${apiRespObject[key]}`)
              resultObj['position'] = apiRespObject['@pos'];

              switch(key){
                case '@passes':
                    objectVal = 'pass';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                    break;
                case '@dribbleSucc':
                    objectVal = 'dribble';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                    break;
                case '@fouls_commited':
                    objectVal = 'foul';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                    break;
                case '@yellowcards':
                    objectVal = 'yellowCard';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                    break;
                case '@redcards':
                    objectVal = 'redCard';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                    break;
                case '@shots_total':
                    objectVal = 'shot';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                    break;
                case '@tackles':
                    objectVal = 'tackle';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                    break;
                case '@pen_miss':
                    objectVal = 'missedPenalty';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                    break;
                case '@own_goal':
                    objectVal = 'ownGoal';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                    break;
                case '@assists':
                    objectVal = 'assist';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                    break;
                case '@goals':
                    objectVal = 'goalScored';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                    break;
                case '@minutes_played':
                    objectVal = 'minsPlayed';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                    break;
                case '@clean_sheet':
                    objectVal = 'cleanSheet';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                break;
                case '@saves':
                    objectVal = 'saves';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                    break;
                case '@pen_save':
                    objectVal = 'penaltySave';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                    break;
                case '@goals_conceded':
                    objectVal = 'goalConceded';
                    resultObj[objectVal] = await getOriginalOrEmptyValueInResponse(apiRespObject[key]);
                    break;
                default:
                    //console.log('Default case called');
              }
            }
         }
    }
    // console.log(resultObj);
    // process.exit(1);
    return resultObj;
}

let getOriginalOrEmptyValueInResponse = async(value) => {
    return ((value) ? parseInt(value) : constants.DEFAULT_NUMBER)
}

exports.checkOneArrayValuesInOtherArray = (arr, target) => target.every(v => arr.includes(v));