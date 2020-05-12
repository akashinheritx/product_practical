const User = require('../../models/user.model');
const WalletHistory = require('../../models/walletHistory.model');
const Trivia = require('../../models/trivia.model');
const FootBallDFSContest = require('../../models/footBallDFSContest.model');
const FootBallLeagueContest = require('../../models/footBallLeagueContest.model');
const EnrollTrivia = require('../../models/enrollTrivia.model');
const EnrollFootBallDFSContest = require('../../models/enrollFootBallDFSContest.model');
const EnrollFootBallLeagueContest = require('../../models/enrollFootBallLeagueContest.model');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const Json2csvParser = require('json2csv').Parser;
const fs = require('fs');
const logService = require('../../services/log.service');
const dateFormat = require('../../helper/dateFormate.helper');
const Lang = require('../../helper/response.helper');
const BotController = require('./bot.controller');

//admin login
exports.adminLogin = async (req, res) => {
    const { mobileNumber, email, password } = req.body;
    try {
        if(email){
            var email1 = email.toLowerCase().trim();
        }
        const user = await User.findByCredential(req, mobileNumber, email1, password);
        if (user.userType === constants.USER_TYPE.ADMIN || user.userType === constants.USER_TYPE.SUB_ADMIN || user.userType === constants.USER_TYPE.ACCOUNTANT) {
            console.log('admin or sub admin');
        }else{
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("GENERAL.UNAUTHRIZED_LOGIN", req.headers.lang),
                error: false,
                data : {}
            });
        }
        
        // const devicelogin = await User.deviceLogin(user.tokens);
        
        const token = await user.generateToken();
        user.tokens.token = token;
        var data = await user.save();        
        
        await commonFunction.removeKeyFromObject(data);

        // await commonFunction.checkImageExist(req, data);
        await commonFunction.getAWSImageUrl(data);
        
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("USER.LOGIN_SUCCESS", req.headers.lang),
            error: false,
            data : {user, token}
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

/**
 * Admin Panel dashboard features :-
1. Total users count with filter of date -> done
2. Total bots count -> done
3. Total deposit with filter of date -> done
4. Total contests -> done
5. Total active contest -> done
6. Total active players -> done
7. Total inactive players -> done
8. Android /IOS downloads (Approx count) -> done will be dependent upon login
9. Top3 most created contest formate -> done
10 Top 3 most praticitated contest formate -> done
11. Total monthly revenue -> done
12. Total Annual revenue -> done
13. Total Revenue -> done
14 . Growth of monthly revenue -> done
15. Growth of annual revenue -> done
16. List of transasction with date filter and export as Excep/CSV option on click of revenue -> done
17. Graph of user stat by country /City (Default will be all country, on select of county name will give user stat by city on graph) -> done
18. Graph of user stat by age -> done
 */

//Admin dashboard
exports.adminDashBoard = async (req, res) => {

    try {
        const data = {};
        
        const currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        
        let startDate, endDate;
        if(req.query.startDate){
            startDate = parseInt(req.query.startDate)
        }else{
            startDate = 0
        }

        if(req.query.endDate){
            endDate = parseInt(req.query.endDate)
        }else{
            endDate = currentTimeStamp
        }

        const userCount = await User.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {userType: constants.USER_TYPE.USER}]});
        const botCount = await User.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {userType: constants.USER_TYPE.BOT}]});
        const totalTriviaContest = await Trivia.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}]});
        const totalFootBallDFSContest = await FootBallDFSContest.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}]});
        const totalFootBallLeagueContest = await FootBallLeagueContest.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}]});

        const totalActiveTriviaContest = await Trivia.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {status : constants.TRIVIA_STATUS.OPEN}]});
        const totalActiveFootBallDFSContest = await FootBallDFSContest.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {status : constants.DFS_STATUS.OPEN}]});
        const totalActiveFootBallLeagueContest = await FootBallLeagueContest.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {status : constants.LEAGUE_STATUS.OPEN}]});
        
        const activeUserIds = [];

        let enrolledTriviaUsers = await EnrollTrivia.find({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}]},{_userId : 1, _id : 0});
        for(let i=0;i<enrolledTriviaUsers.length;i++){
            activeUserIds.push(enrolledTriviaUsers[i]._userId)
        }

        let enrollFootBallDFSUsers = await EnrollFootBallDFSContest.find({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}]},{_userId : 1, _id : 0});
        for(let j=0;j<enrollFootBallDFSUsers.length;j++){
            activeUserIds.push(enrollFootBallDFSUsers[j]._userId)
        }

        let enrollFootBallLeagueUsers = await EnrollFootBallLeagueContest.find({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}]},{_userId : 1, _id : 0});
        for(let k=0;k<enrollFootBallLeagueUsers.length;k++){
            activeUserIds.push(enrollFootBallLeagueUsers[k]._userId)
        }

        const activeUsersCount = await User.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}},{_id : {$in : activeUserIds}}, {userType : constants.USER_TYPE.USER}]})
        const inactiveUsersCount = await User.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}},{_id : {$nin : activeUserIds}}, {userType : constants.USER_TYPE.USER}]})

        let iosUsers = await commonFunction.deviceTypeCount(startDate, endDate, "ios"); 
        let androidUsers = await commonFunction.deviceTypeCount(startDate, endDate, "android");

        const totalMega11FormatInDFS = await FootBallDFSContest.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {contestType : constants.CONTEST_TYPE.REGULAR}, {teamFormat : constants.TEAM_FORMAT.ELEVEN}]});
        const totalMega3FormatInDFS = await FootBallDFSContest.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {contestType : constants.CONTEST_TYPE.REGULAR}, {teamFormat : constants.TEAM_FORMAT.THREE}]});
        const totalH2H11FormatInDFS = await FootBallDFSContest.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {contestType : constants.CONTEST_TYPE.H2H}, {teamFormat : constants.TEAM_FORMAT.ELEVEN}]});
        const totalH2H3FormatInDFS = await FootBallDFSContest.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {contestType : constants.CONTEST_TYPE.H2H}, {teamFormat : constants.TEAM_FORMAT.THREE}]});
        
        const totalMega11FormatInLeague = await FootBallLeagueContest.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {contestType : constants.CONTEST_TYPE.REGULAR}, {teamFormat : constants.TEAM_FORMAT.ELEVEN}]});
        const totalMega3FormatInLeague = await FootBallLeagueContest.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {contestType : constants.CONTEST_TYPE.REGULAR}, {teamFormat : constants.TEAM_FORMAT.THREE}]});
        const totalH2H11FormatInLeague = await FootBallLeagueContest.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {contestType : constants.CONTEST_TYPE.H2H}, {teamFormat : constants.TEAM_FORMAT.ELEVEN}]});
        const totalH2H3FormatInLeague = await FootBallLeagueContest.countDocuments({$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {contestType : constants.CONTEST_TYPE.H2H}, {teamFormat : constants.TEAM_FORMAT.THREE}]});
        

        const contestData = {
            trivia: totalTriviaContest,
            footBallMegaElevenDFS: totalMega11FormatInDFS,
            footBallMegaThreeDFS: totalMega3FormatInDFS,
            footBallH2HElevenDFS: totalH2H11FormatInDFS,
            footBallH2HThreeDFS: totalH2H3FormatInDFS,
            footBallMegaElevenLeague : totalMega11FormatInLeague,
            footBallMegaThreeDFSLeague : totalMega3FormatInLeague,
            footBallH2HElevenLeague : totalH2H11FormatInLeague,
            footBallH2HThreeLeague : totalH2H3FormatInLeague,
          };
          
        const top3Contests = await commonFunction.sortObject(contestData).slice(0, 3);

        let totalTriviaParticipant =  await commonFunction.checkTriviaCurrentParticipantCount(startDate, endDate);

        let totalFBMEDFSParticipant = await commonFunction.checkDFSCurrentParticipantCount(startDate, endDate, constants.CONTEST_TYPE.REGULAR, constants.TEAM_FORMAT.ELEVEN);
        
        let totalFBMTDFSParticipant = await commonFunction.checkDFSCurrentParticipantCount(startDate, endDate, constants.CONTEST_TYPE.REGULAR, constants.TEAM_FORMAT.THREE);
        
        let totalFBHEDFSParticipant = await commonFunction.checkDFSCurrentParticipantCount(startDate, endDate, constants.CONTEST_TYPE.H2H, constants.TEAM_FORMAT.ELEVEN);

        let totalFBHTDFSParticipant = await commonFunction.checkDFSCurrentParticipantCount(startDate, endDate, constants.CONTEST_TYPE.H2H, constants.TEAM_FORMAT.THREE);
        
        let totalFBMELeagueParticipant = await commonFunction.checkLeagueCurrentParticipantCount(startDate, endDate, constants.CONTEST_TYPE.REGULAR, constants.TEAM_FORMAT.ELEVEN);
        
        let totalFBMTLeagueParticipant = await commonFunction.checkLeagueCurrentParticipantCount(startDate, endDate, constants.CONTEST_TYPE.REGULAR, constants.TEAM_FORMAT.THREE);

        let totalFBHELeagueParticipant = await commonFunction.checkLeagueCurrentParticipantCount(startDate, endDate, constants.CONTEST_TYPE.H2H, constants.TEAM_FORMAT.ELEVEN);

        let totalFBHTLeagueParticipant = await commonFunction.checkLeagueCurrentParticipantCount(startDate, endDate, constants.CONTEST_TYPE.H2H, constants.TEAM_FORMAT.THREE);
        
        const participatedContestData = {
            trivia: totalTriviaParticipant,
            footBallMegaElevenDFS: totalFBMEDFSParticipant,
            footBallMegaThreeDFS: totalFBMTDFSParticipant,
            footBallH2HElevenDFS: totalFBHEDFSParticipant,
            footBallH2HThreeDFS: totalFBHTDFSParticipant,
            footBallMegaElevenLeague: totalFBMELeagueParticipant,
            footBallMegaThreeDFSLeague: totalFBMTLeagueParticipant,
            footBallH2HElevenLeague: totalFBHELeagueParticipant,
            footBallH2HThreeLeague: totalFBHTLeagueParticipant,
          };
          
        const top3ParticipatedContests = await commonFunction.sortObject(participatedContestData).slice(0, 3);

        const monthStart = parseInt(dateFormat.setCurrentMonthStartTimeStamp());
        const monthEnd = parseInt(dateFormat.setCurrentMonthEndTimeStamp());

        // const totalMonthlyParticipantAmount = await commonFunction.participatedAmountSum(monthStart, monthEnd);
        // const totalMonthlyRefundedAmount = await commonFunction.refundedAmountSum(monthStart, monthEnd);
        // const totalMonthlyWinningAmount = await commonFunction.winningAmountSum(monthStart, monthEnd);
        // const totalMonthlyRevenue = (totalMonthlyParticipantAmount - (totalMonthlyRefundedAmount + totalMonthlyWinningAmount));

        const totalMonthlyDepositAmount = await commonFunction.depositAmountSum(monthStart, monthEnd);
        const totalMonthlywithdrawalAmount = await commonFunction.withdrawalAmountSum(monthStart, monthEnd);
        const totalMonthlyRevenue = (totalMonthlyDepositAmount - totalMonthlywithdrawalAmount);
        /********** */

        const yearStart = parseInt(dateFormat.setCurrentYearStartTimeStamp());
        const yearEnd = parseInt(dateFormat.setCurrentYearEndTimeStamp());

        // const totalYearlyParticipantAmount = await commonFunction.participatedAmountSum(yearStart, yearEnd);
        // const totalYearlyRefundedAmount = await commonFunction.refundedAmountSum(yearStart, endDate);
        // const totalYearlyWinningAmount = await commonFunction.winningAmountSum(yearStart, endDate);

        // const totalYearlyRevenue = (totalYearlyParticipantAmount - (totalYearlyRefundedAmount + totalYearlyWinningAmount));

        const totalYearlyDepositAmount = await commonFunction.depositAmountSum(yearStart, yearEnd);
        const totalYearlywithdrawalAmount = await commonFunction.withdrawalAmountSum(yearStart, yearEnd);
        const totalYearlyRevenue = (totalYearlyDepositAmount - totalYearlywithdrawalAmount);

        /************ */
        // const totalParticipantAmount = await commonFunction.participatedAmountSum(startDate, endDate);
        // const totalRefundedAmount = await commonFunction.refundedAmountSum(startDate, endDate);
        // const totalWinningAmount = await commonFunction.winningAmountSum(startDate, endDate);

        // const totalRevenue = (totalParticipantAmount - (totalRefundedAmount + totalWinningAmount));

        const totalDepositAmount = await commonFunction.depositAmountSum(startDate, endDate);
        const totalwithdrawalAmount = await commonFunction.withdrawalAmountSum(startDate, endDate);
        const totalRevenue = (totalDepositAmount - totalwithdrawalAmount);
        /************** */
        const previousMonthStartDate = parseInt(dateFormat.setPreviousMonthStartTimeStamp());
        const previousMonthEndDate = parseInt(dateFormat.setPreviousMonthEndTimeStamp());

        // const totalPreviousMonthParticipatedAmount = await commonFunction.participatedAmountSum(previousMonthStartDate, previousMonthEndDate);
        // const totalPreviousMonthRefundedAmount = await commonFunction.refundedAmountSum(previousMonthStartDate, previousMonthEndDate);
        // const totalPreviousMonthWinningAmount = await commonFunction.winningAmountSum(previousMonthStartDate, previousMonthEndDate);

        // const totalPreviousMonthRevenue = (totalPreviousMonthParticipatedAmount - (totalPreviousMonthRefundedAmount + totalPreviousMonthWinningAmount));

        const totalPreviousMonthDepositAmount = await commonFunction.depositAmountSum(previousMonthStartDate, previousMonthEndDate);
        const totalPreviousMonthwithdrawalAmount = await commonFunction.withdrawalAmountSum(previousMonthStartDate, previousMonthEndDate);
        const totalPreviousMonthRevenue = (totalPreviousMonthDepositAmount - totalPreviousMonthwithdrawalAmount);
        const monthlyGrowth = (((totalMonthlyRevenue - totalPreviousMonthRevenue)/totalPreviousMonthRevenue) * 100).toFixed(2) ;

        /**************** */
        const previousYearStartDate = parseInt(dateFormat.setPreviousYearStartTimeStamp());
        const previousYearEndDate = parseInt(dateFormat.setPreviousYearEndTimeStamp());

        // const totalPreviousYearParticipatedAmount = await commonFunction.participatedAmountSum(previousYearStartDate, previousYearEndDate);
        // const totalPreviousYearRefundedAmount = await commonFunction.refundedAmountSum(previousYearStartDate, previousYearEndDate);
        // const totalPreviousYearWinningAmount = await commonFunction.winningAmountSum(previousYearStartDate, previousYearEndDate);
        // const totalPreviousYearRevenue = (totalPreviousYearParticipatedAmount - (totalPreviousYearRefundedAmount + totalPreviousYearWinningAmount));
        
        const totalPreviousYearDepositAmount = await commonFunction.depositAmountSum(previousYearStartDate, previousYearEndDate);
        const totalPreviousYearwithdrawalAmount = await commonFunction.withdrawalAmountSum(previousYearStartDate, previousYearEndDate);
        const totalPreviousYearRevenue = (totalPreviousYearDepositAmount - totalPreviousYearwithdrawalAmount);
        const yearlyGrowth = (((totalYearlyRevenue - totalPreviousYearRevenue)/totalPreviousYearRevenue) * 100).toFixed(2);

        /*************** */

        data.userCount = userCount;
        data.botCount = botCount;
        data.totalDeposit = totalDepositAmount;
        data.totalTriviaContest = totalTriviaContest;
        data.totalFootBallDFSContest = totalFootBallDFSContest;
        data.totalFootBallLeagueContest = totalFootBallLeagueContest;
        data.totalActiveTriviaContest = totalActiveTriviaContest;
        data.totalActiveFootBallDFSContest = totalActiveFootBallDFSContest;
        data.totalActiveFootBallLeagueContest = totalActiveFootBallLeagueContest;
        data.activeUsersCount = activeUsersCount;
        data.inactiveUsersCount = inactiveUsersCount;
        data.iosUsers = iosUsers;
        data.androidUsers = androidUsers;
        data.top3Contests = top3Contests;
        data.top3ParticipatedContests = top3ParticipatedContests;
        data.totalMonthlyRevenue = totalMonthlyRevenue;
        data.totalYearlyRevenue = totalYearlyRevenue;
        data.totalRevenue = totalRevenue;
        data.monthlyGrowth = monthlyGrowth;
        data.yearlyGrowth = yearlyGrowth;

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN.GET_DASHBOARD", req.headers.lang),
            error: false,
            data : data
        });

        // logService.responseData(req, data);

    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: constants.STATUS_CODE.FAIL,
            // message: error.message,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });

        // logService.responseData(req, error);
    }
}

//check response of csv for transactions
exports.getUserTransactions = async (req, res) => {
    try {
        const currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        let startDate, endDate;
        if(req.query.startDate){
            startDate = parseInt(req.query.startDate)
        }else{
            startDate = 0
        }

        if(req.query.endDate){
            endDate = parseInt(req.query.endDate)
        }else{
            endDate = currentTimeStamp
        }

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

            let query = {
                $and : [
                    {createdAt : {$gte : startDate}}, 
                    {createdAt: {$lte: endDate}},
                    {$or : [
                        {transactionFor : constants.TRANSACTION_FOR.DEPOSIT, transactionType : constants.TRANSACTION_TYPE.PLUS},
                        {transactionFor : constants.TRANSACTION_FOR.WITHDRAWAL, transactionType : constants.TRANSACTION_TYPE.MINUS}
                    ]}
                ]
            }

        const total = await WalletHistory.countDocuments(query)
        const totalTransactions = await WalletHistory.aggregate([
            {
                $match : query
            },
            {
                $lookup:{
                    from: 'users',
                    localField: '_userId',
                    foreignField: '_id',
                    as: 'users',        
                }
            },
            {$unwind : "$users"},
            { $addFields: 
                { 
                    transctionF : { $cond: [ { $eq: [ "$transactionFor", 0 ] }, 'Deposit', 'Withdrawal' ] },
                }
            },  
            {
                $project : {
                    "_id" : 1,
                    "users.userName" : 1,
                    "users.email" : 1,
                    "amount" : 1,
                    "orderId" : 1,
                    "transctionF" : 1,
                    "createdAt" : 1,
                }
            },

        ])
        .sort({[field]:value})
        .skip((pageOptions.page - 1) * pageOptions.limit)
        .limit(pageOptions.limit)
        .collation({ locale: "en" });
        
        if(totalTransactions.length>0){
            for(let i=0;i<totalTransactions.length;i++){
                totalTransactions[i].createdAt = dateFormat.getDateFormatFromTimeStamp(totalTransactions[i].createdAt);
                // totalTransactions[i].updatedAt = dateFormat.getDateFormatFromTimeStamp(totalTransactions[i].updatedAt);
            }
        }
        var page = pageOptions.page ;
        var limit = pageOptions.limit;
        // if(totalTransactions.length>0){
        //     for(let i=0;i<totalTransactions.length;i++){
        //         totalTransactions[i].createdAt = dateFormat.getDateFormatFromTimeStamp(totalTransactions[i].createdAt);
        //         totalTransactions[i].updatedAt = dateFormat.getDateFormatFromTimeStamp(totalTransactions[i].updatedAt);
        //     }
        //     var currentDate = dateFormat.setTodayDate();
        //     var fileName = currentDate+'totalTransactions.csv';
        //     const fields = [
        //         { label: 'transactionId', value: 'orderId' }, { label: 'User Name', value: 'users.userName' }, { label: 'Email', value: 'users.email' }, { label: 'amount', value: 'amount' }, { label: 'transactionFor', value: 'transctionF' },
        //         { label: 'createdAt', value: 'createdAt' }];
        //     const json2csvParser = new Json2csvParser({ fields });
        //     const csv = json2csvParser.parse(totalTransactions);
        //     fs.writeFile('./' + fileName, csv, function (err) {
        //         if (err) throw err;
        //     });
        //     // function myFunc() {
        //     //     res.download('./' + fileName);
        //     // }
        //     // setTimeout(myFunc, 1000);
        // }else{
        //     res.status(400).send({ message: "No Data Found!", status: false })
        // }

        // fs.readFile('./' + fileName, async function (err, data) {
        //     try {
        //         // var email = 'yogeshbarot07@gmail.com';
                // var email = 'palakbhalgami@gmail.com';
        //         var files = [{
        //             content: data.toString('base64'),
        //             filename: fileName,
        //             // path : './'+fileName
        //         }]
               
        //         // await sendMailWithAttachment(email, 'Your CSV', `<h1>Hello there, <p>Below is your csv file attachment.</h1>`, files);
        //         await sendEmail(email, 'Your CSV', `<h1>Hello there, <p>Below is your csv file attachment.</h1>`, files);
        //         console.log('email send');
            
        //     } catch (error) {
        //         console.log(error);
        //     }
        // });
        
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN.TRANSACTION_RETRIEVED_SUCCESS", req.headers.lang),
            error: false,
            data : {totalTransactions, page, limit, total}
        });

        // logService.responseData(req, {totalTransactions, page, limit, total});

    } catch (error) {
        console.log(error);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });

        // logService.responseData(req, error);
    }
}
//Generate csv for transactions
exports.generateCsvForTransactions = async (req, res) => {
    try {
        const currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        let startDate, endDate;
        if(req.query.startDate){
            startDate = parseInt(req.query.startDate)
        }else{
            startDate = 0
        }

        if(req.query.endDate){
            endDate = parseInt(req.query.endDate)
        }else{
            endDate = currentTimeStamp
        }

        let query = {
            $and : [
                {createdAt : {$gte : startDate}}, 
                {createdAt: {$lte: endDate}},
                {$or : [
                    {transactionFor : constants.TRANSACTION_FOR.DEPOSIT, transactionType : constants.TRANSACTION_TYPE.PLUS},
                    {transactionFor : constants.TRANSACTION_FOR.WITHDRAWAL, transactionType : constants.TRANSACTION_TYPE.MINUS}
                ]}
            ]
        }

        const totalTransactions = await WalletHistory.aggregate([
            {
                $match : query
            },
            {
                $lookup:{
                    from: 'users',
                    localField: '_userId',
                    foreignField: '_id',
                    as: 'users',
                }
            },
            {$unwind : "$users"},
            { $addFields: 
                { 
                    transctionF : { $cond: [ { $eq: [ "$transactionFor", 0 ] }, 'Deposit', 'Withdrawal' ] },
                    // transctionT : { $cond: [ { $eq: [ "$transactionType", 0 ] }, 'Plus', 'Minus' ] },
                }
            },  
            {
                $project : {
                    "_id" : 1,
                    "_userId" : 1,
                    "users.userName" : 1,
                    "users.email" : 1,
                    "amount" : 1,
                    "orderId" : 1,
                    "transctionF" : 1,
                    "createdAt" : 1,
                }
            },

        ])
        
        if(totalTransactions.length>0){
            for(let i=0;i<totalTransactions.length;i++){
                totalTransactions[i].createdAt = dateFormat.getDateFormatFromTimeStamp(totalTransactions[i].createdAt);
                // totalTransactions[i].updatedAt = dateFormat.getDateFormatFromTimeStamp(totalTransactions[i].updatedAt);
            }
            var currentDate = dateFormat.setTodayDate();
            var fileName = currentDate+'totalTransactions.csv';
            const fields = [
                { label: 'Transaction Id', value: 'orderId' }, { label: 'Transaction Time', value: 'createdAt' }, { label: 'User Name', value: 'users.userName' }, { label: 'Amount', value: 'amount' }, { label: 'Transaction For', value: 'transctionF' }, { label: 'Email', value: 'users.email' }];
            const json2csvParser = new Json2csvParser({ fields });
            const csv = json2csvParser.parse(totalTransactions);
            fs.writeFile('./public/files/' + fileName, csv, function (err) {
                if (err) throw err;
            });
            function myFunc() {
                res.download('./public/files/' + fileName);
            }
            setTimeout(myFunc, 1000);
        }else{
            res.status(400).send({ message: "No Data Found!", status: false })
        }

        // fs.readFile('./' + fileName, async function (err, data) {
        //     try {
        //         // var email = 'yogeshbarot07@gmail.com';
                // var email = 'palakbhalgami@gmail.com';
        //         var files = [{
        //             content: data.toString('base64'),
        //             filename: fileName,
        //             // path : './'+fileName
        //         }]
               
        //         // await sendMailWithAttachment(email, 'Your CSV', `<h1>Hello there, <p>Below is your csv file attachment.</h1>`, files);
        //         await sendEmail(email, 'Your CSV', `<h1>Hello there, <p>Below is your csv file attachment.</h1>`, files);
        //         console.log('email send');
            
        //     } catch (error) {
        //         console.log(error);
        //     }
        // });
        
        // res.status(200).send({
        //     status: constants.STATUS_CODE.SUCCESS,
        //     message: Lang.responseIn("ADMIN.TRANSACTION_RETRIEVED_SUCCESS", req.headers.lang),
        //     error: false,
        //     data : totalTransactions
        // });

        // logService.responseData(req, totalTransactions);

    } catch (error) {
        console.log(error);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });

        // logService.responseData(req, error);
    }
}

//User count by their country
exports.getUserStatByCountry = async (req, res) => {
    try {
        const currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        let startDate, endDate;
        if(req.query.startDate){
            startDate = parseInt(req.query.startDate)
        }else{
            startDate = 0
        }

        if(req.query.endDate){
            endDate = parseInt(req.query.endDate)
        }else{
            endDate = currentTimeStamp
        }
        const users = await User.aggregate([
            {
                $match : {$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {userType : constants.USER_TYPE.USER}]}
            },
            {
                $group: {
                    _id : {
                        country: "$country",
                    },
                    userCount: { $sum: 1 }
                }
            }
        ])
        
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN.USER_STAT_BY_LOCATIONS", req.headers.lang),
            error: false,
            data : users
        });

        // logService.responseData(req, users);

    } catch (error) {
        console.log(error);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });

        // logService.responseData(req, error);
    }
}

//User count by their specific country's state
exports.getUserStatByState = async (req, res) => {
    try {
        const currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        const country = req.params.country
        let startDate, endDate;
        if(req.query.startDate){
            startDate = parseInt(req.query.startDate)
        }else{
            startDate = 0
        }

        if(req.query.endDate){
            endDate = parseInt(req.query.endDate)
        }else{
            endDate = currentTimeStamp
        }

        const users = await User.aggregate([
            {
                $match : {$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}},{country : country},{userType : constants.USER_TYPE.USER}]}
            },
            {
                $group: {
                    _id : {
                        country: "$country",
                        state: "$state"
                    },
                    userCount: { $sum: 1 }
                }
            }
        ])
        
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN.USER_STAT_BY_LOCATIONS", req.headers.lang),
            error: false,
            data : users
        });

        // logService.responseData(req, users);

    } catch (error) {
        console.log(error);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });

        // logService.responseData(req, error);
    }
}

//User count by their specific country's state's city
exports.getUserStatByCity = async (req, res) => {
    try {
        const currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        const country = req.params.country;
        const state = req.params.state;
        let startDate, endDate;
        if(req.query.startDate){
            startDate = parseInt(req.query.startDate)
        }else{
            startDate = 0
        }

        if(req.query.endDate){
            endDate = parseInt(req.query.endDate)
        }else{
            endDate = currentTimeStamp
        }

        const users = await User.aggregate([
            {
                $match : {$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}},{country : country},{state : state}, {userType : constants.USER_TYPE.USER}]}
            },
            {
                $group: {
                    _id : {
                        country: "$country",
                        state: "$state",
                        city: "$city"
                    },
                    userCount: { $sum: 1 }
                }
            },
        ])
        
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN.USER_STAT_BY_LOCATIONS", req.headers.lang),
            error: false,
            data : users
        });

        // logService.responseData(req, users);

    } catch (error) {
        console.log(error);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });

        // logService.responseData(req, error);
    }
}

//user stat by age
exports.getUserStatByAge = async (req, res) => {
    try {
        const data = {}
        const currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
        let startDate, endDate;
        if(req.query.startDate){
            startDate = parseInt(req.query.startDate)
        }else{
            startDate = 0
        }

        if(req.query.endDate){
            endDate = parseInt(req.query.endDate)
        }else{
            endDate = currentTimeStamp
        }

        const users = await User.aggregate([
            {
                $match : {$and : [{createdAt : {$gte : startDate}}, {createdAt: {$lte: endDate}}, {userType : constants.USER_TYPE.USER}]}
            },
            {
                $project : {
                    "dob" : 1 
                }
            }
        ])
        let ten = twenty = thirty = fourty = fifty = sixty = seventy = eighty = ninety = hundred = 0;
        let c1 = c2 = c3 = c4 = c5 = c6 = c7 = c8 = c9 = c10 = 0;
        for(let i=0;i<users.length;i++){
           let age = dateFormat.getUserAge(users[i].dob);
            if(age > 10 && age <= 20 ){
                c1++;
                ten = c1;
            }else if(age > 20 && age <= 30 ){
                c2++;
                twenty = c2;
            }else if(age >30 && age <= 40 ){
                c3++;
                thirty = c3;
            }else if(age >40 && age <= 50 ){
                c4++;
                fourty = c4;
            }else if(age >50 && age <= 60 ){
                c5++;
                fifty = c5;
            }else if(age >60 && age <= 70 ){
                c6++;
                sixty = c6;
            }else if(age >70 && age <= 80 ){
                c7++;
                seventy = c7;
            }else if(age > 80 && age <= 90 ){
                c8++;
                eighty = c8;
            }else if(age > 90 && age <= 100 ){
                c9++;
                ninety = c9;
            }else if(age > 100 ){
                c10++;
                hundred = c10;
            }
        }
        data.ten = ten;
        data.twenty = twenty;
        data.thirty = thirty;
        data.fourty = fourty;
        data.fifty = fifty;
        data.sixty = sixty;
        data.seventy = seventy;
        data.eighty = eighty;
        data.ninety = ninety;
        data.hundred = hundred;

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("ADMIN.USER_STAT_BY_AGE", req.headers.lang),
            error: false,
            data : data
        });

        // logService.responseData(req, data);

    } catch (error) {
        console.log(error);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });

        // logService.responseData(req, error);
    }
}

//user stat by age
exports.addBotUserToPlatformViaAdmin = async (req, res) => {
    try {
        let botCount = parseInt(req.body.botCount);
        status = await BotController.addBotUserToPlatform(botCount);

        if(!status){
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
                error: false,
                data : {}
            });
        }else{
            return res.status(200).send({
                status: constants.STATUS_CODE.SUCCESS,
                message: Lang.responseIn("BOT.NEW_BOT_CREATED", req.headers.lang),
                error: false,
                data : {}
            });
        }
    }catch (error) {
        console.log(error);
        res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {},
        });
    }
}

/**
 *  Upload APK file
 */ 
exports.uploadAPKFile = async (req, res) => {
    try {
        if(!req.file){
            return res.status(400).send({
                status: constants.STATUS_CODE.SUCCESS,
                message: Lang.responseIn("ADMIN.NO_APK_FILE", req.headers.lang),
                error: false,
                data: {}
            });            
        }
        console.log(req.file);
      res.status(200).send({
        status: constants.STATUS_CODE.SUCCESS,
        message: Lang.responseIn("ADMIN.APK_UPLOAD_SUCCESS", req.headers.lang),
        error: false,
        data: {}
      });
  
    } catch (error) {
      console.log(error);
  
      console.log(req.file);
  
      res.status(400).send({
        status: constants.STATUS_CODE.FAIL,
        message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
        error: true,
        data: {}
      });
    }
};