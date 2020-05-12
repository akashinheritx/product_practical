const moment = require('moment');

//return current timestamp in milli seconds
exports.setCurrentTimestamp = function(){
    return moment().format("x");
}