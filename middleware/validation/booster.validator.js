const { body } = require('express-validator');

exports.boosterPurchaseValidator = [
    body('boosterType')
        .not()
        .isEmpty()
        .withMessage('BOOSTER_PURCHASE.BOOSTER_TYPE')
        .trim()
        .matches(/^[0-5]*$/)
        .withMessage('BOOSTER_PURCHASE.BOOSTER_TYPE_NUMERIC'),
    body('boosterQty')
        .not()
        .isEmpty()
        .withMessage('BOOSTER_PURCHASE.BOOSTER_QTY')
        .trim()
        .matches(/^[1-9][0-9]*$/)
        .withMessage('BOOSTER_PURCHASE.BOOSTER_QTY_NUMERIC')
];

exports.appleBoosterPurchaseValidator = [
    body('transactionId')
        .not()
        .isEmpty()
        .withMessage('BOOSTER_PURCHASE.TRANSACTION_ID')
        .trim(),
    body('receiptData')
        .not()
        .isEmpty()
        .withMessage('BOOSTER_PURCHASE.RECEIPT_DATA')
        .trim()
];