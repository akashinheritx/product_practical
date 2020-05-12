const constants = require('../config/constants');

/**
 * Message response files.
 * @function
 * @param {String} message - Message combined with object and it's key
 * @param {String} lang - Preferred Language
 * @returns {String} response - Return message as per preferred language
 * 1. It will check preferred language and will open that file.
 * 2. It will return message as per set value.
 */
exports.responseIn = function(message, lang='en'){
    appLanguageList = constants.APP_LANGUAGE;
    messages = ((appLanguageList.indexOf(lang) != -1)) ? require(`../lang/${lang}/message`) : require('../lang/en/message');

    var obj = message.split(".");
    keyName = obj[0];
    subKey = obj[1];

    return messages[keyName][subKey];
}

/**
 * SMS message response files.
 * @function
 * @param {String} message - Message combined with object and it's key
 * @param {String} lang - Preferred Language
 * @returns {String} response - Return message as per preferred language
 * 1. It will check preferred language and will open that file.
 * 2. It will return message as per set value.
 */
exports.smsResponseIn = function(message, lang='en'){
    appLanguageList = constants.APP_LANGUAGE;
    messages = ((appLanguageList.indexOf(lang) != -1)) ? require(`../lang/${lang}/sms`) : require('../lang/en/sms');

    var obj = message.split(".");
    keyName = obj[0];
    subKey = obj[1];

    return messages[keyName][subKey];
}

/**
 * Push message response files.
 * @function
 * @param {String} message - Message combined with object and it's key
 * @param {String} lang - Preferred Language
 * @returns {String} response - Return message as per preferred language
 * 1. It will check preferred language and will open that file.
 * 2. It will return message as per set value.
 */
exports.pushResponseIn = function(message, lang='en'){
    appLanguageList = constants.APP_LANGUAGE;
    messages = ((appLanguageList.indexOf(lang) != -1)) ? require(`../lang/${lang}/pushMessage`) : require('../lang/en/pushMessage');

    var obj = message.split(".");
    keyName = obj[0];
    subKey = obj[1];

    return messages[keyName][subKey];
}

/**
 * Validation message response files.
 * @function
 * @param {String} message - Message combined with object and it's key
 * @param {String} lang - Preferred Language
 * @returns {String} response - Return message as per preferred language
 * 1. It will check preferred language and will open that file.
 * 2. It will return message as per set value.
 */
exports.validationResponseIn = function(message, lang='en'){
    appLanguageList = constants.APP_LANGUAGE;
    messages = ((appLanguageList.indexOf(lang) != -1)) ? require(`../lang/${lang}/validationMessage`) : require('../lang/en/validationMessage');

    var obj = message.split(".");
    keyName = obj[0];
    subKey = obj[1];

    return messages[keyName][subKey];
}