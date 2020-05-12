const request = require('request');
const keys = require('../../keys/keys');
const BankAccountDetails = require('../../models/bankAccountDetails.model');
const User = require('../../models/user.model');
const TransactionHistory = require('../../models/transactionHistory.model');
const GlobalBoosterSettings = require('../../models/globalBoosterSettings.model');
const GlobalGeneralSettings = require('../../models/globalGeneralSettings.model');
const WalletHistory = require('../../models/walletHistory.model');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const commonMessage = require('../../helper/commonMessage.helper');
const requestHelper = require('../../helper/requestHelper.helper');
const dateFormat = require('../../helper/dateFormate.helper');
const Message = commonMessage.MESSAGE;
const Lang = require('../../helper/response.helper');
const logService = require('../../services/log.service');

//https://test.cashfree.com/api/v2/cftoken/order

//Deposit Balance
exports.depositBalance = async (req, res) => {
    try {
        let globalGeneralSettings = await GlobalGeneralSettings.findOne();

        let isDepositFunctinalityAvailable = globalGeneralSettings.isDepositFunctinalityAvailable;

        if(isDepositFunctinalityAvailable != constants.STATUS.ACTIVE){
            return res.status(400).send({
                status : constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("GENERAL.SERVICE_UNAVAILABLE", req.headers.lang),
                error: false,
                data: {}
            });
        }
        
        if(!req.user.mobileNumber){
            return res.status(400).send({
                status : constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.MOBILE_NUMBER", req.headers.lang),
                error: false,
                data: {}
            });
        }
        
        if(req.user.isMobileVerified !== constants.STATUS.ACTIVE){
            return res.status(400).send({
                status : constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.MOBILE_NUMBER_NOT_VERIFIED", req.headers.lang),
                error: false,
                data: {}
            });
        }
        
        let reqdata = req.body, note;
        if(reqdata.orderNote){
            note = reqdata.orderNote;
        }else{
            note = '';
        }
    orderData = {
        'orderId' : dateFormat.setTodayDate()+'T'+dateFormat.setCurrentTimestamp(),
        'orderAmount' : reqdata.orderAmount,
        'orderCurrency' : constants.CURRENCY.INR,
    }
    request.post({
        headers: {
            'X-Client-Id': keys.CASHFREE_APP_ID,
            'X-Client-Secret' : keys.CASHFREE_PG_SECRET_KEY
        },
        url:`${keys.CASHFREE_URL}/api/v2/cftoken/order`,
        body: orderData,
        json: true,
    }, async function(error, response, body){
        if(body.status == 'OK'){
            let createOrder = {
                'appId': keys.CASHFREE_APP_ID,
                // 'secretKey' : keys.CASHFREE_PG_SECRET_KEY,
                'orderId' : orderData.orderId,
                'orderAmount' : orderData.orderAmount,
                'orderCurrency' : orderData.orderCurrency,
                'orderNote' : note,
                'source' : "reactsdk",
                'customerEmail' : req.user.email,
                'customerName' : req.user.userName,
                'customerPhone' : req.user.mobileNumber,
                // 'returnUrl' : app_base_url+'/api/v1/user/notify-deposit-balance',
                // 'notifyUrl' : app_base_url+'/api/v1/user/notify-deposit-balance',
                'notifyUrl' : app_base_url + '/api/v1/user/notify-deposit-balance',
                'env' : keys.CASHFREE_ENV,
                'tokenData' : body.cftoken,    
            }

            console.log(createOrder, 'createOrder');

            let transHist = new TransactionHistory({
                _userId : req.user._id,
                orderId: createOrder.orderId,
                orderAmount: createOrder.orderAmount,
                orderCurrency : createOrder.orderCurrency,
                orderNote: createOrder.orderNote,
                source : createOrder.source,
                customerEmail : createOrder.customerEmail,
                customerName : createOrder.customerName,
                customerPhone : createOrder.customerPhone,
                tokenData : createOrder.cftoken,
                transactionFor : constants.REAL_TRANSACTION_FOR.DEPOSIT,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })
            let transData = await transHist.save();
            let walletHistory = new WalletHistory({
                _userId: transData._userId,
                orderId: createOrder.orderId,
                amount: createOrder.orderAmount,
                transactionType:constants.TRANSACTION_TYPE.PENDING,
                transactionFor:constants.TRANSACTION_FOR.DEPOSIT,
                createdAt:dateFormat.setCurrentTimestamp(),
                updatedAt:dateFormat.setCurrentTimestamp(),
            })
            walletData =  await walletHistory.save()
                res.status(200).send({
                    status : constants.STATUS_CODE.SUCCESS,
                    // message: Message.ORDER_CREATED,
                    message: Lang.responseIn("CASHFREE.ORDER_CREATED", req.headers.lang),
                    error: false,
                    data: createOrder
                });
                logService.responseData(req, createOrder);
        }else{
                res.status(400).send({
                    status : constants.STATUS_CODE.FAIL,
                    // message: Message.GENERAL_CATCH_MESSAGE,
                    message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
                    error: true,
                    data: {}
                });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({
            status : constants.STATUS_CODE.FAIL,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {}
        });
        logService.responseData(req, error);
    }
};

exports.notifyDepositBalance = async (req, res) => {
  try {
      console.log('comes in notify url');
        let reqData = req.body;
        console.log(reqData,'reqData');
    //     // console.log(res,'response');
    let transData = await TransactionHistory.findOne({orderId : reqData.orderId})
    transData.referenceId = reqData.referenceId,
    transData.orderAmount = reqData.orderAmount,
    transData.txStatus = reqData.txStatus,
    transData.txMsg = reqData.txMsg,
    transData.txTime = reqData.txTime,
    transData.paymentMode = reqData.paymentMode,
    transData.signature = reqData.signature,
    transData.updatedAt = dateFormat.setCurrentTimestamp()

    let updatedTransData = await transData.save();
    if(updatedTransData.txStatus == 'SUCCESS'){
        if(updatedTransData.transactionFor == constants.REAL_TRANSACTION_FOR.DEPOSIT){
            console.log('comes in DEPOSIT');
            let updateWalletData = await WalletHistory.updateOne({orderId : reqData.orderId, transactionType : {$ne : constants.TRANSACTION_TYPE.PLUS}},
                {$set : {
                    transactionType : constants.TRANSACTION_TYPE.PLUS,
                    updatedAt : dateFormat.setCurrentTimestamp()
                }}
                )

            console.log(updateWalletData, 'updateWalletData');
            if(updateWalletData.nModified === 1){

                let user = await User.findOne({_id : updatedTransData._userId})
                   
                user.depositBalance = user.depositBalance + parseInt(reqData.orderAmount);
                user.updatedAt = dateFormat.setCurrentTimestamp();
   
                let userData = await user.save();
               
            }else{
                console.log('data already exists');
            }
           
        }else{
            console.log(updatedTransData.transactionFor, 'updatedTransData.transactionFor');
        }

    }else{
        console.log('no data has been added.');
    }         
    res.status(200).send({
        status : constants.STATUS_CODE.SUCCESS,
        // message: Message.GENERAL_CATCH_MESSAGE,
        message: Lang.responseIn("GENERAL.FETCH_SUCCESS", req.headers.lang),
        error: false,
        data: updatedTransData
    });
    logService.responseData(req, {updatedTransData});
} catch (error) {
  console.log(error);
  res.status(400).send({
    status : constants.STATUS_CODE.FAIL,
    message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
    error: true,
    data: {}
});
logService.responseData(req, error);
}
};


exports.verifyTransactionStatus = async (req, res) => {
    try {
        let orderData = {
            'appId' : keys.CASHFREE_APP_ID,
            'secretKey' : keys.CASHFREE_PG_SECRET_KEY,
            'orderId' : req.body.orderId,
        }
        request.post({
            headers: {
                "cache-control": "no-cache",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            url:`${keys.CASHFREE_URL}/api/v1/order/info/status`,
            form: orderData,
            json: true,
        }, async function(error, response, body){
            console.log(body, 'body');
            let reqData = body, updatedTransData, transData, message;
            // console.log(req.body, 'req body');
            // console.log(reqData,'reqData');
            // console.log(res,'response');
            if((body.txStatus == undefined || body.txStatus == '') && body.txStatus != 'SUCCESS' && body.txStatus != 'FAILED' && body.txStatus != 'PENDING' && body.txStatus != 'FLAGGED' && body.txStatus != 'CANCELLED'){
                transData = await TransactionHistory.findOne({orderId : req.body.orderId})
                //   console.log(transData);
                    // transData.referenceId = req.body.referenceId,
                    // transData.orderAmount = req.body.orderAmount,
                    transData.txStatus = 'CANCELLED',
                    // transData.txMsg = req.body.txMsg,
                    // transData.txTime = req.body.txTime,
                    // transData.paymentMode = req.body.paymentMode,
                    // transData.signature = req.body.paymentMode,
                    transData.updatedAt = dateFormat.setCurrentTimestamp()
           
                    updatedTransData = await transData.save();    
            }else{
                transData = await TransactionHistory.findOne({orderId : req.body.orderId})
              //   console.log(transData);
                  transData.referenceId = reqData.referenceId,
                  transData.orderAmount = reqData.orderAmount,
                  transData.txStatus = reqData.txStatus,
                  transData.txMsg = reqData.txMsg,
                  transData.txTime = reqData.txTime,
                  transData.paymentMode = reqData.paymentMode,
                  transData.signature = reqData.signature,
                  transData.updatedAt = dateFormat.setCurrentTimestamp()
         
                  updatedTransData = await transData.save();
            }
            logService.responseData(req, updatedTransData);
        let updateWalletData;
        if(updatedTransData.txStatus == 'SUCCESS'){
       
            updateWalletData = await WalletHistory.updateOne({orderId : req.body.orderId, transactionType : {$ne : constants.TRANSACTION_TYPE.PLUS}},
                {$set : {
                    transactionType : constants.TRANSACTION_TYPE.PLUS,
                    updatedAt : dateFormat.setCurrentTimestamp()
                }}
                )
  
            console.log(updateWalletData, 'updateWalletData');
            if(updateWalletData.nModified === 1){
  
                let user = await User.findOne({_id : updatedTransData._userId})
                   
                user.depositBalance = user.depositBalance + parseInt(reqData.orderAmount);
                user.updatedAt = dateFormat.setCurrentTimestamp();
                let userData = await user.save();
               
            }else{
                console.log('data already exists');
            }
           message = Lang.responseIn("CASHFREE.SUCCESS_TRANSACTION", req.headers.lang);
        }else if(updatedTransData.txStatus == 'FAILED'){
            updateWalletData = await WalletHistory.updateOne({orderId : req.body.orderId},
                {$set : {
                    transactionType : constants.TRANSACTION_TYPE.FAILED,
                    updatedAt : dateFormat.setCurrentTimestamp()
                }}
                )
            message = Lang.responseIn("CASHFREE.FAIL_TRANSACTION", req.headers.lang);
        }else if(updatedTransData.txStatus == 'PENDING'){
            updateWalletData = await WalletHistory.updateOne({orderId : req.body.orderId},
                {$set : {
                    transactionType : constants.TRANSACTION_TYPE.PENDING,
                    updatedAt : dateFormat.setCurrentTimestamp()
                }}
                )
            message = Lang.responseIn("CASHFREE.PENDING_TRANSACTION", req.headers.lang);
        }else if(updatedTransData.txStatus == 'FLAGGED'){
            updateWalletData = await WalletHistory.updateOne({orderId : req.body.orderId},
                {$set : {
                    transactionType : constants.TRANSACTION_TYPE.FLAGGED,
                    updatedAt : dateFormat.setCurrentTimestamp()
                }}
                )
           message = Lang.responseIn("CASHFREE.FLAGGED_TRANSACTION", req.headers.lang);
        }else if(updatedTransData.txStatus == 'CANCELLED'){
            updateWalletData = await WalletHistory.updateOne({orderId : req.body.orderId},
                {$set : {
                    transactionType : constants.TRANSACTION_TYPE.CANCELLED,
                    updatedAt : dateFormat.setCurrentTimestamp()
                }}
                )
            message = Lang.responseIn("CASHFREE.CANCELLED_TRANSACTION", req.headers.lang);
        }else{
            console.log('no data has been added.');
        }
        console.log(updateWalletData, 'updateWalletData');
        let userWallets = await commonFunction.getUserLatestBalance(req.user._id)
        res.status(200).send({
            status : constants.STATUS_CODE.SUCCESS,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: message,
            error: false,
            data: {body, userWallets}
        });
        logService.responseData(req, {updatedTransData, userWallets});
    })
    } catch (error) {
        console.log(error, 'error');
        res.status(400).send({
            status : constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {}
        });
        logService.responseData(req, error);
    }
};
 

//generate order for booster purchase
exports.boosterPurchase = async (req, res) => {
    try {
        
        let globalGeneralSettings = await GlobalGeneralSettings.findOne();

        let isDepositFunctinalityAvailable = globalGeneralSettings.isDepositFunctinalityAvailable;

        if(isDepositFunctinalityAvailable != constants.STATUS.ACTIVE){
            return res.status(400).send({
                status : constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("GENERAL.SERVICE_UNAVAILABLE", req.headers.lang),
                error: false,
                data: {}
            });
        }

        if(!req.user.mobileNumber){
            return res.status(400).send({
                status : constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.MOBILE_NUMBER", req.headers.lang),
                error: false,
                data: {}
            });
        }

        if(req.user.isMobileVerified !== constants.STATUS.ACTIVE){
            return res.status(400).send({
                status : constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("USER.MOBILE_NUMBER_NOT_VERIFIED", req.headers.lang),
                error: false,
                data: {}
            });
        }

        let note = (req.body.orderNote) ? req.body.orderNote : '';
        let boosterType = req.body.boosterType;
        let boosterQty = req.body.boosterQty;

        let booster = await GlobalBoosterSettings.findOne(
            {
                boosterType
            },{
                "boosterName": 1,
                "boosterType": 1,
                "boosterCount": 1,
                "boosterPrice": 1,
            });

        if(!booster){
            return res.status(400).send({
                status : constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
                error: true,
                data: {}
            });
        }

        let amount = booster.boosterPrice * boosterQty;

        let orderData = {
            'orderId' : dateFormat.setTodayDate()+'T'+dateFormat.setCurrentTimestamp(),
            'orderAmount' : amount,
            'orderCurrency' : constants.CURRENCY.INR,
        }
        console.log(keys.CASHFREE_URL, 'keys.CASHFREE_URL');
        request.post({
            headers: {
                'X-Client-Id': keys.CASHFREE_APP_ID,
                'X-Client-Secret' : keys.CASHFREE_PG_SECRET_KEY
            },
            url:`${keys.CASHFREE_URL}/api/v2/cftoken/order`,
            body: orderData,
            json: true,
        }, async function(error, response, body){
            console.log(body, 'body');
            if(body.status != 'OK'){
                return res.status(400).send({
                    status : constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
                    error: true,
                    data: {}
                });
            }

            let createOrder = {
                'appId': keys.CASHFREE_APP_ID,
                // 'secretKey' : keys.CASHFREE_PG_SECRET_KEY,
                'orderId' : orderData.orderId,
                'orderAmount' : orderData.orderAmount,
                'orderCurrency' : orderData.orderCurrency,
                'orderNote' : note,
                'source' : "reactsdk",
                'customerEmail' : req.user.email,
                'customerName' : req.user.userName,
                'customerPhone' : req.user.mobileNumber,
                // 'returnUrl' : keys.BASE_URL+':'+keys.PORT+'/api/v1/user/notify-booster-balance',
                // 'notifyUrl' : keys.BASE_URL+':'+keys.PORT+'/api/v1/user/notify-booster-balance',
                'notifyUrl' : app_base_url+'/api/v1/user/notify-booster-balance',
                'env' : keys.CASHFREE_ENV,
                'tokenData' : body.cftoken,    
            }

            let transHist = new TransactionHistory({
                _userId : req.user._id,
                orderId: createOrder.orderId,
                orderAmount: createOrder.orderAmount,
                orderCurrency : createOrder.orderCurrency,
                orderNote: createOrder.orderNote,
                source : createOrder.source,
                customerEmail : createOrder.customerEmail,
                customerName : createOrder.customerName,
                customerPhone : createOrder.customerPhone,
                tokenData : createOrder.cftoken,
                transactionFor : constants.REAL_TRANSACTION_FOR.BOOSTER_PURCHASE,
                createdAt : dateFormat.setCurrentTimestamp(),
                updatedAt : dateFormat.setCurrentTimestamp()
            })

            transHist.boosters = transHist.boosters.concat({_boosterId: booster._id, boosterType, boosterQty, boosterPrice : booster.boosterPrice});

            let transData = await transHist.save();
            
            let walletHistory = new WalletHistory({
                _userId: transData._userId,
                orderId: createOrder.orderId,
                amount: createOrder.orderAmount,
                transactionType:constants.TRANSACTION_TYPE.PENDING,
                transactionFor:constants.TRANSACTION_FOR.BOOSTER_PURCHASE,
                createdAt:dateFormat.setCurrentTimestamp(),
                updatedAt:dateFormat.setCurrentTimestamp(),
            })
            walletData =  await walletHistory.save()

            res.status(200).send({
                status : constants.STATUS_CODE.SUCCESS,
                message: Lang.responseIn("CASHFREE.BOOSTER_PURCHASE_ORDER_CREATED", req.headers.lang),
                error: false,
                data: createOrder
            });
            logService.responseData(req, createOrder);
            });
    } catch (error) {
        console.log(error);
        res.status(400).send({
            status : constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {}
        });
        logService.responseData(req, error);
    }
};

exports.notifyBoosterBalance = async (req, res) => {
    try {
        console.log('comes in notify url');
          let reqData = req.body;
          console.log(reqData,'reqData');
      //     // console.log(res,'response');
      let transData = await TransactionHistory.findOne({orderId : reqData.orderId})
      transData.referenceId = reqData.referenceId,
      transData.orderAmount = reqData.orderAmount,
      transData.txStatus = reqData.txStatus,
      transData.txMsg = reqData.txMsg,
      transData.txTime = reqData.txTime,
      transData.paymentMode = reqData.paymentMode,
      transData.signature = reqData.signature,
      transData.updatedAt = dateFormat.setCurrentTimestamp()
  
      let updatedTransData = await transData.save();
      let updateWalletData, userData;
      if(updatedTransData.txStatus == 'SUCCESS'){
          if(updatedTransData.transactionFor == constants.REAL_TRANSACTION_FOR.BOOSTER_PURCHASE){
              console.log('comes in BOOSTER_PURCHASE');
              updateWalletData = await WalletHistory.updateOne({orderId : reqData.orderId, transactionFor:constants.TRANSACTION_FOR.BOOSTER_PURCHASE, transactionType : {$ne : constants.TRANSACTION_TYPE.PLUS}},
                  {$set : {
                      transactionType : constants.TRANSACTION_TYPE.PLUS,
                      updatedAt : dateFormat.setCurrentTimestamp()
                  }}
                  )
  
              console.log(updateWalletData, 'updateWalletData in notify url');
  
              if(updateWalletData.nModified === 1){
  
                  let _boosterId = updatedTransData.boosters[0]._boosterId;
                  let boosterType = updatedTransData.boosters[0].boosterType;
                  let boosterQty = updatedTransData.boosters[0].boosterQty;
     
                  console.log(_boosterId, '_boosterId');
                  console.log(boosterType, 'boosterType');
                  console.log(boosterQty, 'boosterQty');
  
                  let user = await User.findOne({_id : updatedTransData._userId })
                  let userBoosterExist = await User.findOne({_id : updatedTransData._userId, 'boosters.boosterType' : boosterType })
     
                  if(userBoosterExist){
                     
                      let boosters = user.boosters;
                      for(let i=0;i<boosters.length;i++){
                          if(boosterType === boosters[i].boosterType){
                              boosters[i].boosterQty += boosterQty
                              user.updatedAt = dateFormat.setCurrentTimestamp();
                              userData = await user.save();
                          }
                      }
     
                  }else{
                     
                      user.boosters = user.boosters.concat({_boosterId, boosterType, boosterQty});
                      user.updatedAt = dateFormat.setCurrentTimestamp();
                      userData = await user.save();
     
                  }
  
                 
              }else{
                  console.log('data already exists');
              }
          }else{
              console.log(updatedTransData.transactionFor, 'updatedTransData.transactionFor');
          }
  
      }else{
          console.log('no data has been added.');
      }         
      res.status(200).send({
          status : constants.STATUS_CODE.SUCCESS,
          // message: Message.GENERAL_CATCH_MESSAGE,
          message: Lang.responseIn("GENERAL.FETCH_SUCCESS", req.headers.lang),
          error: false,
          data: updatedTransData
        });
    logService.responseData(req, {updatedTransData, updateWalletData});
  } catch (error) {
    console.log(error);
    res.status(400).send({
        status : constants.STATUS_CODE.FAIL,
        message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
        error: true,
        data: {}
    });
    logService.responseData(req, error);
  }
};

// Booster purchase verification flow
exports.verifyBoosterTransactionStatus = async (req, res) => {
    try {
        orderData = {
            'appId' : keys.CASHFREE_APP_ID,
            'secretKey' : keys.CASHFREE_PG_SECRET_KEY,
            'orderId' : req.body.orderId,
        }
        request.post({
            headers: {
                "cache-control": "no-cache",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            url:`${keys.CASHFREE_URL}/api/v1/order/info/status`,
            form: orderData,
            json: true,
        }, async function(error, response, body){
            let reqData = body, updatedTransData, transData, message;
            // console.log(req.body, 'req body');
            // console.log(reqData,'reqData');
            // console.log(res,'response');
            if((body.txStatus == undefined || body.txStatus == '') && body.txStatus != 'SUCCESS' && body.txStatus != 'FAILED' && body.txStatus != 'PENDING' && body.txStatus != 'FLAGGED' && body.txStatus != 'CANCELLED'){
                transData = await TransactionHistory.findOne({orderId : req.body.orderId})
                //   console.log(transData);
                    // transData.referenceId = req.body.referenceId,
                    // transData.orderAmount = req.body.orderAmount,
                    transData.txStatus = 'CANCELLED',
                    // transData.txMsg = req.body.txMsg,
                    // transData.txTime = req.body.txTime,
                    // transData.paymentMode = req.body.paymentMode,
                    // transData.signature = req.body.paymentMode,
                    transData.updatedAt = dateFormat.setCurrentTimestamp()
           
                    updatedTransData = await transData.save();    
            }else{
                transData = await TransactionHistory.findOne({orderId : req.body.orderId})
              //   console.log(transData);
                  transData.referenceId = reqData.referenceId,
                  transData.orderAmount = reqData.orderAmount,
                  transData.txStatus = reqData.txStatus,
                  transData.txMsg = reqData.txMsg,
                  transData.txTime = reqData.txTime,
                  transData.paymentMode = reqData.paymentMode,
                  transData.signature = reqData.signature,
                  transData.updatedAt = dateFormat.setCurrentTimestamp()
         
                  updatedTransData = await transData.save();
            }
            logService.responseData(req, updatedTransData);
            let updateWalletData, userData;
        if(updatedTransData.txStatus == 'SUCCESS'){

            updateWalletData = await WalletHistory.updateOne({orderId : reqData.orderId, transactionFor:constants.TRANSACTION_FOR.BOOSTER_PURCHASE, transactionType : {$ne : constants.TRANSACTION_TYPE.PLUS}},
                {$set : {
                    transactionType : constants.TRANSACTION_TYPE.PLUS,
                    updatedAt : dateFormat.setCurrentTimestamp()
                }}
                )

            // console.log(updateWalletData, 'updateWalletData from success');

            if(updateWalletData.nModified === 1){

                let _boosterId = updatedTransData.boosters[0]._boosterId;
                let boosterType = updatedTransData.boosters[0].boosterType;
                let boosterQty = updatedTransData.boosters[0].boosterQty;
   
                console.log(_boosterId, '_boosterId');
                console.log(boosterType, 'boosterType');
                console.log(boosterQty, 'boosterQty');

                let user = await User.findOne({_id : updatedTransData._userId })
                let userBoosterExist = await User.findOne({_id : updatedTransData._userId, 'boosters.boosterType' : boosterType })
   
                if(userBoosterExist){
                   
                    let boosters = user.boosters;
                    for(let i=0;i<boosters.length;i++){
                        if(boosterType === boosters[i].boosterType){
                            boosters[i].boosterQty += boosterQty
                            user.updatedAt = dateFormat.setCurrentTimestamp();
                            userData = await user.save();
                        }
                    }
   
                }else{
                   
                    user.boosters = user.boosters.concat({_boosterId, boosterType, boosterQty});
                    user.updatedAt = dateFormat.setCurrentTimestamp();
                    userData = await user.save();
   
                }

               
            }else{
                console.log('data already exists');
            }
           message = Lang.responseIn("CASHFREE.SUCCESS_TRANSACTION", req.headers.lang);
        }else if(updatedTransData.txStatus == 'FAILED'){
            updateWalletData = await WalletHistory.updateOne({orderId : req.body.orderId},
                {$set : {
                    transactionType : constants.TRANSACTION_TYPE.FAILED,
                    updatedAt : dateFormat.setCurrentTimestamp()
                }}
                )
            message = Lang.responseIn("CASHFREE.FAIL_TRANSACTION", req.headers.lang);
        }else if(updatedTransData.txStatus == 'PENDING'){
            updateWalletData = await WalletHistory.updateOne({orderId : req.body.orderId},
                {$set : {
                    transactionType : constants.TRANSACTION_TYPE.PENDING,
                    updatedAt : dateFormat.setCurrentTimestamp()
                }}
                )
            message = Lang.responseIn("CASHFREE.PENDING_TRANSACTION", req.headers.lang);
        }else if(updatedTransData.txStatus == 'FLAGGED'){
            updateWalletData = await WalletHistory.updateOne({orderId : req.body.orderId},
                {$set : {
                    transactionType : constants.TRANSACTION_TYPE.FLAGGED,
                    updatedAt : dateFormat.setCurrentTimestamp()
                }}
                )
           message = Lang.responseIn("CASHFREE.FLAGGED_TRANSACTION", req.headers.lang);
        }else if(updatedTransData.txStatus == 'CANCELLED'){
            updateWalletData = await WalletHistory.updateOne({orderId : req.body.orderId},
                {$set : {
                    transactionType : constants.TRANSACTION_TYPE.CANCELLED,
                    updatedAt : dateFormat.setCurrentTimestamp()
                }}
                )
            message = Lang.responseIn("CASHFREE.CANCELLED_TRANSACTION", req.headers.lang);
        }else{
            console.log('no data has been added.');
        }
        console.log(updateWalletData, 'updateWalletData in verify');
        let userBoosters = await commonFunction.getUserLatestBoosters(req.user._id)
        res.status(200).send({
            status : constants.STATUS_CODE.SUCCESS,
            // message: Message.GENERAL_CATCH_MESSAGE,
            message: message,
            error: false,
            data: {body, userBoosters}
        });
        logService.responseData(req, {updatedTransData, userBoosters});
    })
    } catch (error) {
        console.log(error, 'error');
        res.status(400).send({
            status : constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
            error: true,
            data: {}
        });
        logService.responseData(req, error);
    }
};

//verify inapp booster receipt
exports.verifyAppStoreReceipt = async (req, res) => {
    let productionURL = constants.APPLE.APP_STORE_VERIFIY_RECEIPT.URL.PRODUCTION;
    let sandboxURL = constants.APPLE.APP_STORE_VERIFIY_RECEIPT.URL.SANDBOX;
    let requestData = {"receipt-data" : req.body["receiptData"]}
    let env = (process.env.ENV == 'production') ? 'production' : 'development';
    let productionResult = await requestHelper.callPostApi(productionURL, requestData);
    let transactionId = req.body.transactionId;
    let userData;
    //return back if error to connecting server
    if(productionResult.statusCode != 200){
        return res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("APPLE.UNABLE_TO_CONNECT_SERVER", req.headers.lang),
            error: true,
            data: {},
        });
    }

    let productionResultBody = productionResult.body;
    let errorMessage = "";

    if(env == 'production'){
        if(productionResultBody.status == 21007){
            errorMessage = Lang.responseIn("APPLE.RECEIPT_GENERATED_FROM_SANDBOX", req.headers.lang);
        }else if(productionResultBody.status != 0){
            errorMessage = Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang);
        }

        //return with error message
        if(errorMessage){
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: errorMessage,
                error: true,
                data: {},
            });
        }

        //store data in transaction history and wallet history
        let in_appProduction = productionResultBody["receipt"]["in_app"];
        in_appProduction = in_appProduction.filter((obj) => obj.transaction_id === transactionId);

        if(in_appProduction.length == 0){
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("APPLE.NO_RECEIPT_CONTENT_FOUND", req.headers.lang),
                error: true,
                data: {},
            });
        }

        //
        let boosterQty = (in_appProduction[0]["quantity"]) ? parseInt(in_appProduction[0]["quantity"]) : 0;

        let boosterSettings = await GlobalBoosterSettings.findOne({"inAppBoosterKey": in_appProduction[0]["product_id"]},{"boosterPrice": 1, "inAppBoosterKey": 1,"boosterType": 1});
        if(!boosterSettings){
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_SETTINGS_NOT_FOUND", req.headers.lang),
                error: true,
                data: {},
            });
        }
        
        let ammount = boosterQty * boosterSettings.boosterPrice;
        let boosterType = boosterSettings.boosterType;
        let _boosterId = boosterSettings._id;

        let user = await User.findOne({_id: mongoose.Types.ObjectId(req.user._id)})
        let userBoosterExist = await User.findOne({_id : user._id, 'boosters.boosterType' : boosterType })
        
        //store data in transaction history and wallet history
        let isExistEntry = await TransactionHistory.findOne({"orderId": in_appProduction[0]["original_transaction_id"]});

        if(isExistEntry){
            let userBoosters = await commonFunction.getUserLatestBoosters(req.user._id);
            return res.status(200).send({
                status: constants.STATUS_CODE.SUCCESS,
                message: Lang.responseIn("CASHFREE.SUCCESS_TRANSACTION", req.headers.lang),
                error: false,
                data : {userBoosters}
            });
        }

        let insertObj = {};
        insertObj.transactionFor = constants.REAL_TRANSACTION_FOR.BOOSTER_PURCHASE;
        insertObj.transactionVia = constants.TRANSACTION_VIA.CASH_FREE;
        insertObj._userId = req.user._id;
        insertObj.orderId = in_appProduction[0].original_transaction_id;
        insertObj.orderAmount = ammount;
        insertObj.orderNote = "Booster purchase through InApp";
        insertObj.customerEmail = req.user.email;
        insertObj.customerName = req.user.userName;
        insertObj.customerPhone = req.user.mobileNumber;
        insertObj.createdAt = dateFormat.setCurrentTimestamp();
        insertObj.updatedAt = dateFormat.setCurrentTimestamp();
        insertObj.boosters = [{
            _boosterId: boosterSettings._id,
            boosterType: boosterSettings.boosterType,
            boosterQty: boosterQty,
            boosterPrice: boosterSettings.boosterPrice
        }];

        let transctionHistory = new TransactionHistory(insertObj);
        let saveHistory = await  transctionHistory.save();

        if(saveHistory){
            let walletHistory = new WalletHistory({
                "_userId" : req.user._id,
                "amount" : ammount,
                "orderId" : in_appProduction[0].original_transaction_id,
                "transactionType" : constants.TRANSACTION_TYPE.PLUS,
                "transactionFor" : constants.TRANSACTION_FOR.BOOSTER_PURCHASE,
                "createdAt" : dateFormat.setCurrentTimestamp(),
                "updatedAt" : dateFormat.setCurrentTimestamp(),
            });

            await walletHistory.save();
            
            //if booster exists then update Qty else add booster
            if(userBoosterExist){
                let boosters = user.boosters;
                for(let i=0;i<boosters.length;i++){
                    if(boosterType === boosters[i].boosterType){
                        boosters[i].boosterQty += boosterQty
                        userData = await user.save();
                    }
                }
            }else{
                user.boosters = user.boosters.concat({_boosterId, boosterType, boosterQty});
                userData = await user.save();
            }
        }

        let userBoosters = await commonFunction.getUserLatestBoosters(req.user._id)

        return res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("CASHFREE.SUCCESS_TRANSACTION", req.headers.lang),
            error: false,
            data : {userBoosters}
        });
    }else{
        if(productionResultBody.status == 21007){
            let sandboxResult = await requestHelper.callPostApi(sandboxURL, requestData);

            //return back if error to connecting server
            if(sandboxResult.statusCode != 200){
                return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("APPLE.UNABLE_TO_CONNECT_SERVER", req.headers.lang),
                    error: true,
                    data: {},
                });
            }

            let sandboxResultBody = sandboxResult.body;

            //return back if error
            if(sandboxResultBody.status != 0){
                res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
                    error: true,
                    data: {}
                });
            }

            let in_appSandbox = sandboxResultBody["receipt"]["in_app"];
            in_appSandbox = in_appSandbox.filter((obj) => obj.transaction_id === transactionId);

            if(in_appSandbox.length == 0){
                return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("APPLE.NO_RECEIPT_CONTENT_FOUND", req.headers.lang),
                    error: true,
                    data: {},
                });
            }

            //
            let boosterQty = (in_appSandbox[0]["quantity"]) ? parseInt(in_appSandbox[0]["quantity"]) : 0;
        
            let boosterSettings = await GlobalBoosterSettings.findOne({"inAppBoosterKey": in_appSandbox[0]["product_id"]},{"boosterPrice": 1, "inAppBoosterKey": 1,"boosterType": 1});
            if(!boosterSettings){
                return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("ADMIN_GENERAL.GLOBAL_BOOSTER_SETTINGS_NOT_FOUND", req.headers.lang),
                    error: true,
                    data: {},
                });
            }

            let ammount = boosterQty * boosterSettings.boosterPrice;
            let boosterType = boosterSettings.boosterType;
            let _boosterId = boosterSettings._id;

            let user = await User.findOne({_id: mongoose.Types.ObjectId(req.user._id)})
            let userBoosterExist = await User.findOne({_id : user._id, 'boosters.boosterType' : boosterType })
            
            //store data in transaction history and wallet history
            let isExistEntry = await TransactionHistory.findOne({"orderId": in_appSandbox[0]["original_transaction_id"]});

            if(isExistEntry){
                let userBoosters = await commonFunction.getUserLatestBoosters(req.user._id)
                return res.status(200).send({
                    status: constants.STATUS_CODE.SUCCESS,
                    message: Lang.responseIn("CASHFREE.SUCCESS_TRANSACTION", req.headers.lang),
                    error: false,
                    data : {userBoosters}
                });
            }

            let insertObj = {};
            insertObj.transactionFor = constants.REAL_TRANSACTION_FOR.BOOSTER_PURCHASE;
            insertObj.transactionVia = constants.TRANSACTION_VIA.CASH_FREE;
            insertObj._userId = req.user._id;
            insertObj.orderId = in_appSandbox[0].original_transaction_id;
            insertObj.orderAmount = ammount;
            insertObj.orderNote = "Booster purchase through InApp";
            insertObj.customerEmail = req.user.email;
            insertObj.customerName = req.user.userName;
            insertObj.customerPhone = req.user.mobileNumber;
            insertObj.createdAt = dateFormat.setCurrentTimestamp();
            insertObj.updatedAt = dateFormat.setCurrentTimestamp();
            insertObj.boosters = [{
                _boosterId: boosterSettings._id,
                boosterType: boosterSettings.boosterType,
                boosterQty: boosterQty,
                boosterPrice: boosterSettings.boosterPrice
            }];

            let transctionHistory = new TransactionHistory(insertObj);
            let saveHistory = await  transctionHistory.save();

            if(saveHistory){
                let walletHistory = new WalletHistory({
                    "_userId" : req.user._id,
                    "amount" : ammount,
                    "orderId" : in_appSandbox[0].original_transaction_id,
                    "transactionType" : constants.TRANSACTION_TYPE.PLUS,
                    "transactionFor" : constants.TRANSACTION_FOR.BOOSTER_PURCHASE,
                    "createdAt" : dateFormat.setCurrentTimestamp(),
                    "updatedAt" : dateFormat.setCurrentTimestamp(),
                });

                await walletHistory.save();

                //if booster exists then update Qty else add booster
                if(userBoosterExist){
                    let boosters = user.boosters;
                    for(let i=0;i<boosters.length;i++){
                        if(boosterType === boosters[i].boosterType){
                            boosters[i].boosterQty += boosterQty
                            userData = await user.save();
                        }
                    }
                }else{
                    user.boosters = user.boosters.concat({_boosterId, boosterType, boosterQty});
                    userData = await user.save();
                }
            }

            let userBoosters = await commonFunction.getUserLatestBoosters(req.user._id)

            return res.status(200).send({
                status: constants.STATUS_CODE.SUCCESS,
                message: Lang.responseIn("CASHFREE.SUCCESS_TRANSACTION", req.headers.lang),
                error: false,
                data : {userBoosters}
            });
        }else{
            return res.status(400).send({
                status: constants.STATUS_CODE.FAIL,
                message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
                error: true,
                data: {},
            });
        }
    }
}