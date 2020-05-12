const request = require('request');
const keys = require('../../keys/keys');
const User = require('../../models/user.model');
const BankAccountDetails = require('../../models/bankAccountDetails.model');
const WalletHistory = require('../../models/walletHistory.model');
const TransactionHistory = require('../../models/transactionHistory.model');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const commonMessage = require('../../helper/commonMessage.helper');
const dateFormat = require('../../helper/dateFormate.helper');
const Message = commonMessage.MESSAGE;
const Lang = require('../../helper/response.helper');
const logService = require('../../services/log.service');
const GlobalGeneralSettings = require('../../models/globalGeneralSettings.model');
const notificationFunction = require('../../helper/notificationFunction.helper');

//Generate token from cashfree credentials
exports.generateToken = async (req, res) => {

    request.post({
        headers: {
            'X-Client-Id': keys.CASHFREE_CLIENT_ID,
            'X-Client-Secret' : keys.CASHFREE_CLIENT_SECRET
        },
        url:`${keys.CASHFREE_PAYOUT_URL}/payout/v1/authorize`,
        json: true,
    }, function(error, response, body){
          console.log(body.data.token);        
        res.send(body);
        logService.responseData(req, body);
      });
}

const cashFreeAuthorizeToken = async () => {

    let token = await new Promise((resolve, reject) => {
        request.post({
            headers: {
                'X-Client-Id': keys.CASHFREE_CLIENT_ID,
                'X-Client-Secret' : keys.CASHFREE_CLIENT_SECRET
            },
            url:`${keys.CASHFREE_PAYOUT_URL}/payout/v1/authorize`,
            json: true,
        }, function(error, response, body){
            console.log(body);
            if(error){
                reject(error)
            }
            resolve(body.data.token);
          });       
    })
    return token;
}

//Add Beneficiary
exports.addBeneficiary = async (req, res) => {

    try {

            let reqdata = req.body, address2;
            if(reqdata.address2){
                address2 = reqdata.address2;
            }else{
                address2 = null;
            }

            let beneId = dateFormat.setTodayDate()+'T'+dateFormat.setCurrentTimestamp();
            let cashFreeToken = await cashFreeAuthorizeToken();
            let beneficiaryBody = {
                'beneId': beneId,
                'name' : reqdata.name,
                'email' : reqdata.email,
                'phone' : reqdata.phone,
                'bankAccount' : reqdata.bankAccount,
                'ifsc' : reqdata.ifsc,
                'address1' : reqdata.address1,
                'address2' : address2,
                'city' : reqdata.city,
                'state' : reqdata.state,
                'pincode' : reqdata.pincode,
            }
            request.post({
                headers: {
                    'Authorization' : 'Bearer ' + cashFreeToken,
                    'Content-Type': 'application/json'
                },
                url:`${keys.CASHFREE_PAYOUT_URL}/payout/v1/addBeneficiary`,
                body : beneficiaryBody,
                json: true,
            }, async function(error, response, body){
                console.log(body, 'body');
                if(body.status == "SUCCESS"){

                    let bankAccountSavedData, message;
                    let isUserExist = await BankAccountDetails.findOne({_userId: req.user._id});

                    if(isUserExist){
                        isUserExist.beneId = beneId;
                        isUserExist.fullName = reqdata.name;
                        isUserExist.email = reqdata.email;
                        isUserExist.phone = reqdata.phone;
                        isUserExist.bankAccount = reqdata.bankAccount;
                        isUserExist.ifsc = reqdata.ifsc;
                        isUserExist.address1 = reqdata.address1;
                        isUserExist.address2 = address2;
                        isUserExist.city = reqdata.city;
                        isUserExist.state = reqdata.state;
                        isUserExist.pincode = reqdata.pincode;
                        isUserExist.updatedAt = dateFormat.setCurrentTimestamp();
                        bankAccountSavedData = await isUserExist.save();

                        message = Lang.responseIn("CASHFREE.BENEFICIARY_UPDATED_SUCCESSFULLY", req.headers.lang);

                    }else{
                        bankAccountDetailsData = new BankAccountDetails({
                            '_userId' : req.user._id,
                            'beneId': beneId,
                            'fullName' : reqdata.name,
                            'email' : reqdata.email,
                            'phone' : reqdata.phone,
                            'bankAccount' : reqdata.bankAccount,
                            'ifsc' : reqdata.ifsc,
                            'address1' : reqdata.address1,
                            'address2' : address2,
                            'city' : reqdata.city,
                            'state' : reqdata.state,
                            'pincode' : reqdata.pincode,
                            'createdAt' : dateFormat.setCurrentTimestamp(),
                            'updatedAt' : dateFormat.setCurrentTimestamp(),
                        })
                        bankAccountSavedData = await bankAccountDetailsData.save();

                        message = Lang.responseIn("CASHFREE.BENEFICIARY_ADDED_SUCCESSFULLY", req.headers.lang);

                    }
                    
                    return res.status(200).send({
                        status : constants.STATUS_CODE.SUCCESS,
                        // message: Message.BENEFICIARY_ADDED_SUCCESSFULLY,
                        message,
                        error: false,
                        data: bankAccountSavedData
                    });
                }else if(body.message == "Entered bank Account is already registered"){

                    let bankAccountSavedData, message;
                    let existBeneId = await BankAccountDetails.findOne({bankAccount: reqdata.bankAccount, ifsc : reqdata.ifsc});
                    let beneId;
                    if(!existBeneId){
                        console.log('comes here in request in add beneficiary');

                        beneId = await new Promise(async (resolve, reject) => {
                                                                
                            request({
                                headers: {
                                    'Authorization' : 'Bearer ' + cashFreeToken,
                                },
                                url:`${keys.CASHFREE_PAYOUT_URL}/payout/v1/getBeneId?bankAccount=${reqdata.bankAccount}&ifsc=${reqdata.ifsc}`,
                                json: true,
                            }, function(error, response, body){

                                if(error){
                                    reject(error);
                                }
                                resolve(body.data.beneId)
                            });
                        })
                        

                    }else{
                        console.log('comes here in else');
                        beneId = existBeneId.beneId;
                    }
                    let isUserExist = await BankAccountDetails.findOne({_userId: req.user._id});

                    if(isUserExist){
                        isUserExist.fullName = reqdata.name;
                        isUserExist.email = reqdata.email;
                        isUserExist.phone = reqdata.phone;
                        isUserExist.beneId = beneId;
                        isUserExist.bankAccount = reqdata.bankAccount;
                        isUserExist.ifsc = reqdata.ifsc;
                        isUserExist.address1 = reqdata.address1;
                        isUserExist.address2 = address2;
                        isUserExist.city = reqdata.city;
                        isUserExist.state = reqdata.state;
                        isUserExist.pincode = reqdata.pincode;
                        isUserExist.updatedAt = dateFormat.setCurrentTimestamp();
                        bankAccountSavedData = await isUserExist.save();

                        message = Lang.responseIn("CASHFREE.BENEFICIARY_UPDATED_SUCCESSFULLY", req.headers.lang);

                    }else{
                        bankAccountDetailsData = new BankAccountDetails({
                            '_userId' : req.user._id,
                            'beneId': beneId,
                            'fullName' : reqdata.name,
                            'email' : reqdata.email,
                            'phone' : reqdata.phone,
                            'bankAccount' : reqdata.bankAccount,
                            'ifsc' : reqdata.ifsc,
                            'address1' : reqdata.address1,
                            'address2' : address2,
                            'city' : reqdata.city,
                            'state' : reqdata.state,
                            'pincode' : reqdata.pincode,
                            'createdAt' : dateFormat.setCurrentTimestamp(),
                            'updatedAt' : dateFormat.setCurrentTimestamp(),
                        })
                        bankAccountSavedData = await bankAccountDetailsData.save();

                        message = Lang.responseIn("CASHFREE.BENEFICIARY_ADDED_SUCCESSFULLY", req.headers.lang);

                    }
                    
                    return res.status(200).send({
                        status : constants.STATUS_CODE.SUCCESS,
                        message,
                        error: false,
                        data: bankAccountSavedData
                    });
                }else{

                    res.status(400).send({
                        status : constants.STATUS_CODE.FAIL,
                        message: body.message,
                        // message: Lang.responseIn("CASHFREE.BENEFICIARY_ALREADY_ADDED", req.headers.lang),
                        error: true,
                        data: {}
                    });
                }
                // res.status(200).send(body);
            });
        
    } catch (error) {
        console.log(error);
        res.status(400).send({
            status : constants.STATUS_CODE.FAIL,
            // message: Message.BENEFICIARY_ALREADY_ADDED,
            message: Lang.responseIn("CASHFREE.BENEFICIARY_ALREADY_ADDED", req.headers.lang),
            error: true,
            data: {}
        });
        
    }    
    
}

//Get beneficiary
exports.getBeneficiary = async (req, res) => {
    try {

        let userBankDetails = await BankAccountDetails.findOne({_userId: req.user._id});
        
        if(!userBankDetails){
            return res.status(404).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("CASHFREE.BENEFICIARY_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        res.status(200).send({
            status : constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("CASHFREE.BENEFICIARY_RETRIEVE_SUCCESS", req.headers.lang),
            error: false,
            data: userBankDetails
        });

    } catch (error) {

        console.log(error);

        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
    }

}

//Get All Beneficiary
exports.getAllBeneficiaries = async (req, res) => {

    request({
        headers: {
            'Authorization' : 'Bearer ' + await cashFreeAuthorizeToken(),
        },
        url:`${keys.CASHFREE_PAYOUT_URL}/payout/v1/getBeneficiaries`,
        json: true,
    }, function(error, response, body){
        res.status(200).send(body);
        logService.responseData(req, body);
    });
}

//Get All Beneficiary
exports.getBeneficiaryById = async (req, res) => {

    request({
        headers: {
            'Authorization' : 'Bearer ' + await cashFreeAuthorizeToken(),
        },
        url:`${keys.CASHFREE_PAYOUT_URL}/payout/v1/getBeneficiary/${req.params.beneId}`,
        json: true,
    }, function(error, response, body){
        res.status(200).send(body);
        logService.responseData(req, body);
    });
      
}

//Get Beneficiary by account number and IFSC code
exports.getBeneficiaryByAccountAndIFSCCode = async (req, res) => {

    request({
        headers: {
            'Authorization' : 'Bearer ' + await cashFreeAuthorizeToken(),
        },
        url:`${keys.CASHFREE_PAYOUT_URL}/payout/v1/getBeneId?bankAccount=${req.query.bankAccount}&ifsc=${req.query.ifsc}`,
        json: true,
    }, function(error, response, body){
        res.status(200).send(body);
        logService.responseData(req, body);
    });

}

//Validate BankAccount
exports.validateBankAccountAndIFSCCode = async (req, res) => {

    request({
        headers: {
            'Authorization' : 'Bearer ' + await cashFreeAuthorizeToken(),
        },
        url:`${keys.CASHFREE_PAYOUT_URL}/payout/v1/validation/bankDetails?name=${req.query.name}&phone=${req.query.phoneNumber}&bankAccount=${req.query.bankAccount}&ifsc=${req.query.ifsc}`,
        json: true,
    }, function(error, response, body){
        res.status(200).send(body);
        logService.responseData(req, body);
    });

}

//Remove Beneficiary from database and cashfree
exports.removeBeneficiary = async (req, res) => {
    
    let beneId = req.body.beneId;
    let bankAccountDetails = await BankAccountDetails.findOne({beneId, _userId : req.user._id});
    if(!bankAccountDetails){
        return res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("CASHFREE.BENEFICIARY_NOT_FOUND", req.headers.lang),
            error:true,
            data:{}
        })
    }

    request.post({
        headers: {
            'Authorization' : 'Bearer ' + await cashFreeAuthorizeToken(),
        },
        body:{
            'beneId' : beneId
        },
        url:`${keys.CASHFREE_PAYOUT_URL}/payout/v1/removeBeneficiary`,
        json: true,
    }, async function(error, response, body){
        console.log(error);
        if(body.status == 'SUCCESS'){
            removeAccountData = await BankAccountDetails.findOneAndDelete({beneId});
            res.status(200).send({
                status: constants.STATUS_CODE.SUCCESS,
                // message: Message.BENEFICIARY_REMOVED_SUCCESSFULLY,
                message: Lang.responseIn("CASHFREE.BENEFICIARY_REMOVED_SUCCESSFULLY", req.headers.lang),
                error: false,
                data:removeAccountData
            })
            logService.responseData(req, removeAccountData);
        }else{
            res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                // message:Message.GENERAL_CATCH_MESSAGE,
                message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
                error: true,
                data:{}
            })
        }
        // res.status(200).send(body);
    });

}

//Remove user beneficiary from database
exports.removeUserBeneficiary = async (req, res) => {
    try {
        let bankAccountDetails = await BankAccountDetails.findOneAndDelete({_userId : req.user._id});
        if(!bankAccountDetails){
            return res.status(500).send({
                status:constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("CASHFREE.BENEFICIARY_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }
        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            // message: Message.BENEFICIARY_REMOVED_SUCCESSFULLY,
            message: Lang.responseIn("CASHFREE.BENEFICIARY_REMOVED_SUCCESSFULLY", req.headers.lang),
            error: false,
            data:bankAccountDetails
        })
        
        logService.responseData(req, bankAccountDetails);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status:constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error:true,
            data:{}
        })
        logService.responseData(req, error);
    }

}

//Request Transfer
exports.requestTransfer = async (req, res) => {

    try {
        let reqdata = req.body;
        let globalGeneralSettings = await GlobalGeneralSettings.findOne();

        let isPayOutFunctinalityAvailable = globalGeneralSettings.isPayOutFunctinalityAvailable;

        if(isPayOutFunctinalityAvailable != constants.STATUS.ACTIVE){
            return res.status(400).send({
                status : constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("GENERAL.SERVICE_UNAVAILABLE", req.headers.lang),
                error: false,
                data: {}
            });
        }
        let bankAccountDetails = await BankAccountDetails.findOne({_userId : req.user._id, beneId: reqdata.beneId});

        if(!bankAccountDetails){
            return res.status(404).send({
                status : constants.STATUS_CODE.FAIL,
                // message: Message.BENEFICIARY_ALREADY_ADDED,
                message: Lang.responseIn("CASHFREE.BENEFICIARY_NOT_FOUND", req.headers.lang),
                error: true,
                data: {}
            });
        }
        if(req.user.isPanVerified !== constants.USER.VERIFY){
            return res.status(400).send({
                status : constants.STATUS_CODE.FAIL,
                // message: Message.BENEFICIARY_ALREADY_ADDED,
                message: Lang.responseIn("CASHFREE.PAN_NOT_VERIFIED", req.headers.lang),
                error: true,
                data: {}
            });
        }
        let amount = reqdata.amount;
        let remarks = reqdata.remarks;

        let keepAmountInUserWinningWallet = globalGeneralSettings.keepAmountInUserWinningWallet;
        
        let userWinningWallet = req.user.winningBalance - keepAmountInUserWinningWallet;

        if(userWinningWallet < amount){

            return res.status(400).send({
                status : constants.STATUS_CODE.FAIL,
                // message: Message.BENEFICIARY_ALREADY_ADDED,
                message: Lang.responseIn("CASHFREE.MINIMUM_BALANCE", req.headers.lang),
                error: true,
                data: {}
            });
        }
        let transferId = dateFormat.setTodayDate()+'T'+dateFormat.setCurrentTimestamp();

        updatedUserData = await User.updateOne({_id: req.user._id},
            {
                $inc : {winningBalance : -(amount)}
            });

        let transHist = new TransactionHistory({
            _userId : req.user._id,
            orderId: transferId,
            orderAmount: amount,
            orderNote: remarks,
            source : 'cashfree',
            customerEmail : req.user.email,
            customerName : req.user.userName,
            // customerPhone : req.user.mobileNumber,
            transactionFor : constants.REAL_TRANSACTION_FOR.WITHDRAWAL,
            createdAt : dateFormat.setCurrentTimestamp(),
            updatedAt : dateFormat.setCurrentTimestamp()
        })
        let transData = await transHist.save();

        let walletHistory = new WalletHistory({
            _userId: transData._userId,
            orderId: transData.orderId,
            amount: transData.orderAmount,
            winningWallet : transData.orderAmount,
            transactionType:constants.TRANSACTION_TYPE.PENDING,
            transactionFor:constants.TRANSACTION_FOR.WITHDRAWAL,
            createdAt:dateFormat.setCurrentTimestamp(),
            updatedAt:dateFormat.setCurrentTimestamp(),
        })
        let walletData =  await walletHistory.save();
            
        request.post({
            headers: {
                'Authorization' : 'Bearer ' + await cashFreeAuthorizeToken(),
            },
            body:{
                'beneId' : reqdata.beneId,
                'amount' : amount,
                'transferId' : transferId,
                'transferMode' : reqdata.transferMode,
                'remarks' : remarks,  
            },
            url:`${keys.CASHFREE_PAYOUT_URL}/payout/v1/requestTransfer`,
            json: true,
        }, async function(error, response, body){

            console.log(body, 'body');

            if(body.status == "SUCCESS"){
                let data = body.data;
                let isTransaction = await TransactionHistory.findOne({orderId : transferId})
                isTransaction.referenceId = data.referenceId;
                isTransaction.acknowledged = data.acknowledged;
                isTransaction.utr = data.utr;
                let updatedTransaction = await isTransaction.save();

                let isWalletExist = await WalletHistory.updateOne({_userId :updatedTransaction._userId, orderId : updatedTransaction.orderId, transactionType:constants.TRANSACTION_TYPE.PENDING},{
                    $set : {
                        transactionType:constants.TRANSACTION_TYPE.MINUS,
                        updatedAt:dateFormat.setCurrentTimestamp(),
                    }
                })
                console.log(isWalletExist, 'isWalletExist from API');
                let userWallets = await commonFunction.getUserLatestBalance(req.user._id)

                res.status(200).send({
                    status : constants.STATUS_CODE.SUCCESS,
                    message: Lang.responseIn("CASHFREE.TRANSFER_SUCCESSFUL", req.headers.lang),
                    error: false,
                    data: {userWallets}
                });

                logService.responseData(req, body);

            }else if(body.message === 'Not enough available balance in the account'){
                let isTransaction = await TransactionHistory.updateOne({orderId : transData.orderId},{
                    $set : {
                        txStatus: 'FAILED',
                        txMsg : "Not enough available balance in the account",
                        updatedAt:dateFormat.setCurrentTimestamp(),
                    }
                })
                
                let isWalletExist = await WalletHistory.updateOne({_userId :transData._userId, orderId : transData.orderId, $or : [{transactionType:constants.TRANSACTION_TYPE.PENDING}]},{
                    $set : {
                        transactionType:constants.TRANSACTION_TYPE.FAILED,
                        updatedAt:dateFormat.setCurrentTimestamp(),
                    }
                })

                if(isWalletExist.nModified === 1){
                    console.log('transaction failed');
                
                    updatedUserData = await User.updateOne({_id: transData._userId},
                        {
                            $inc : {winningBalance : amount}
                        });
                }
                return res.status(400).send({
                    status : constants.STATUS_CODE.FAIL,
                    // message: Message.BENEFICIARY_ALREADY_ADDED,
                    message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
                    error: true,
                    data: {}
                });

            }else if(body.status === 'PENDING'){

                let userWallets = await commonFunction.getUserLatestBalance(req.user._id)
                
                return res.status(201).send({
                    status : constants.STATUS_CODE.SUCCESS,
                    message: body.message,
                    error: true,
                    data: {userWallets}
                });

            }else if(body.message === 'Beneficiary does not exist'){

                return res.status(404).send({
                    status : constants.STATUS_CODE.FAIL,
                    // message: Message.BENEFICIARY_ALREADY_ADDED,
                    message: Lang.responseIn("CASHFREE.BENEFICIARY_NOT_FOUND", req.headers.lang),
                    error: true,
                    data: {}
                });

            }else{
                return res.status(500).send({
                    status : constants.STATUS_CODE.FAIL,
                    message: body.message,
                    // message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
                    error: true,
                    data: {}
                });
            }
        });
        
    } catch (error) {

        console.log(error);

        res.status(500).send({
            status : constants.STATUS_CODE.FAIL,
            // message: Message.BENEFICIARY_ALREADY_ADDED,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {}
        });
        
    }    
}

//Get Balance
exports.getBalance = async (req, res) => {

    request({
        headers: {
            'Authorization' : 'Bearer ' + await cashFreeAuthorizeToken(),
        },
        url:`${keys.CASHFREE_PAYOUT_URL}/payout/v1/getBalance`,
        json: true,
    }, function(error, response, body){
        res.status(200).send(body);
        logService.responseData(req, body);
    });

}

//Notify transaction details
exports.notifyTransactionDetails = async (req, res) => {
    try {
        let currentTimestamp = +await dateFormat.setCurrentTimestamp();
        let globalGeneralSettings = await GlobalGeneralSettings.findOne();
        let minuteInMilisec = globalGeneralSettings.minuteInMilisec;
        let notifyTime = globalGeneralSettings.payOutNotifyTime;
        console.log(notifyTime, 'notifyTime');
        let reqdata = req.body;

        let event = reqdata.event;
        let referenceId = reqdata.referenceId;
        let orderId = reqdata.transferId;
        let signature = reqdata.signature;

        let acknowledged, utr, reason
        if(reqdata.acknowledged){
            acknowledged = reqdata.acknowledged;
        }
        if(reqdata.utr){
            utr = reqdata.utr;
        }
        if(reqdata.reason){
            reason = reqdata.reason;
        }

        if(event === 'TRANSFER_SUCCESS'){
        
            console.log(reqdata, 'reqdata in success');

            let isTransaction = await TransactionHistory.findOne({orderId})
            if(!isTransaction){
                console.log('check the issue in code');
            }else{
                
                let _userId = isTransaction._userId;
                let trxTime = isTransaction.createdAt;
                let timeDiff = (currentTimestamp - trxTime) / minuteInMilisec;
                console.log(timeDiff, 'time diff');

                if(timeDiff >= notifyTime){
                    notificationFunction.sendUserNotificationForTransaction(_userId, orderId, constants.NOTIFICATION_STATUS.TRANSFER_SUCCESS)
                }

                isTransaction.referenceId = referenceId;
                isTransaction.signature = signature;
                isTransaction.acknowledged = acknowledged;
                isTransaction.utr = utr;
                let updatedTransaction = await isTransaction.save();

                let isWalletExist = await WalletHistory.updateOne({_userId, orderId, transactionType:constants.TRANSACTION_TYPE.PENDING},{
                    $set : {
                        transactionType:constants.TRANSACTION_TYPE.MINUS,
                        updatedAt:dateFormat.setCurrentTimestamp(),
                    }
                })
                console.log(isWalletExist, 'isWalletExist');
                
            }

        }else if(event === 'TRANSFER_FAILED'){

            console.log(reqdata, 'reqdata in failed');

            let isTransaction = await TransactionHistory.findOne({orderId})
            if(!isTransaction){
                console.log('check the issue in code');
            }else{
                
                let _userId = isTransaction._userId;
                let amount = isTransaction.orderAmount;
                let trxTime = isTransaction.createdAt;
                let timeDiff = (currentTimestamp - trxTime) / minuteInMilisec;
                console.log(timeDiff, 'time diff');

                if(timeDiff >= notifyTime){
                    notificationFunction.sendUserNotificationForTransaction(_userId, orderId, constants.NOTIFICATION_STATUS.TRANSFER_FAIL, reason)
                }

                isTransaction.referenceId = referenceId;
                isTransaction.signature = signature;
                isTransaction.reason = reason;
                let updatedTransaction = await isTransaction.save();

                let isWalletExist = await WalletHistory.updateOne({_userId, orderId, $or : [{transactionType:constants.TRANSACTION_TYPE.PENDING},{transactionType:constants.TRANSACTION_TYPE.MINUS}]},{
                    $set : {
                        transactionType:constants.TRANSACTION_TYPE.FAILED,
                        updatedAt:dateFormat.setCurrentTimestamp(),
                    }
                })

                if(isWalletExist.nModified === 1){
                    console.log('transaction failed');
                
                    updatedUserData = await User.updateOne({_id: _userId},
                        {
                            $inc : {winningBalance : amount}
                        });
                }

            }
            
        }else if(event === 'TRANSFER_REVERSED'){

            console.log(reqdata, 'reqdata in reversed');

            let isTransaction = await TransactionHistory.findOne({orderId})
            if(!isTransaction){
                console.log('check the issue in code');
            }else{
                
                let _userId = isTransaction._userId;
                let amount = isTransaction.orderAmount;
                let trxTime = isTransaction.createdAt;
                let timeDiff = (currentTimestamp - trxTime) / minuteInMilisec;
                console.log(timeDiff, 'time diff');

                if(timeDiff >= notifyTime){
                    notificationFunction.sendUserNotificationForTransaction(_userId, orderId, constants.NOTIFICATION_STATUS.TRANSFER_REVERSED, reason)
                }

                isTransaction.referenceId = referenceId;
                isTransaction.signature = signature;
                isTransaction.reason = reason;
                let updatedTransaction = await isTransaction.save();

                let isWalletExist = await WalletHistory.updateOne({_userId, orderId, $or : [{transactionType:constants.TRANSACTION_TYPE.PENDING},{transactionType:constants.TRANSACTION_TYPE.MINUS}]},{
                    $set : {
                        transactionType:constants.TRANSACTION_TYPE.REVERSED,
                        updatedAt:dateFormat.setCurrentTimestamp(),
                    }
                })

                if(isWalletExist.nModified === 1){
                    console.log('transaction failed');
                
                    updatedUserData = await User.updateOne({_id: _userId},
                        {
                            $inc : {winningBalance : amount}
                        });
                }

            }
            
        }else if(event === 'TRANSFER_ACKNOWLEDGED'){

            console.log(reqdata, 'reqdata in transfer acknowledge');

            let isTransaction = await TransactionHistory.findOne({orderId})
            if(!isTransaction){
                console.log('check the issue in code');
            }else{
                
                let _userId = isTransaction._userId;
                let amount = isTransaction.orderAmount;
                let trxTime = isTransaction.createdAt;
                let timeDiff = (currentTimestamp - trxTime) / minuteInMilisec;
                console.log(timeDiff, 'time diff');

                if(timeDiff >= notifyTime){
                    notificationFunction.sendUserNotificationForTransaction(_userId, orderId, constants.NOTIFICATION_STATUS.TRANSFER_ACKNOWLEDGE)
                }

                isTransaction.referenceId = referenceId;
                isTransaction.acknowledged = acknowledged;
                isTransaction.signature = signature;
                let updatedTransaction = await isTransaction.save();

                let isWalletExist = await WalletHistory.updateOne({_userId, orderId, $or : [{transactionType:constants.TRANSACTION_TYPE.PENDING},{transactionType:constants.TRANSACTION_TYPE.MINUS}]},{
                    $set : {
                        transactionType:constants.TRANSACTION_TYPE.MINUS,
                        updatedAt:dateFormat.setCurrentTimestamp(),
                    }
                })

            }
            
        }else if(event === 'INVALID_BENEFICIARY_ACCOUNT'){

            console.log(reqdata, 'reqdata in INVALID_BENEFICIARY_ACCOUNT');

            let isTransaction = await TransactionHistory.findOne({orderId})
            if(!isTransaction){
                console.log('check the issue in code');
            }else{
                
                let _userId = isTransaction._userId;
                let amount = isTransaction.orderAmount;
                let trxTime = isTransaction.createdAt;
                let timeDiff = (currentTimestamp - trxTime) / minuteInMilisec;
                console.log(timeDiff, 'time diff');

                if(timeDiff >= notifyTime){
                    notificationFunction.sendUserNotificationForTransaction(_userId, orderId, constants.NOTIFICATION_STATUS.TRANSFER_FAIL)
                }

                // isTransaction.referenceId = referenceId;
                // isTransaction.acknowledged = acknowledged;
                isTransaction.signature = signature;
                let updatedTransaction = await isTransaction.save();

                let isWalletExist = await WalletHistory.updateOne({_userId, orderId, $or : [{transactionType:constants.TRANSACTION_TYPE.PENDING},{transactionType:constants.TRANSACTION_TYPE.MINUS}]},{
                    $set : {
                        transactionType:constants.TRANSACTION_TYPE.FAILED,
                        updatedAt:dateFormat.setCurrentTimestamp(),
                    }
                })

                if(isWalletExist.nModified === 1){
                    console.log('transaction failed');
                
                    updatedUserData = await User.updateOne({_id: _userId},
                        {
                            $inc : {winningBalance : amount}
                        });
                }

            }
            
        }else if(event === 'LOW_BALANCE_ALERT'){

            console.log(reqdata, 'reqdata in LOW_BALANCE_ALERT');
            
        }

        res.status(200).send({
            status : constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("GENERAL.FETCH_SUCCESS", req.headers.lang),
            error: false,
            data: {}
        })
    } catch (error) {
        console.log(error, 'error');
    }
}