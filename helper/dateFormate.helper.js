const moment = require('moment');

//return current timestamp in milli seconds
exports.setCurrentTimestamp = function(){
    return moment().format("x");
}

//return current timestamp in seconds
exports.setCurrentTimestampInSeconds = function(){
    return moment().format("X");
}

exports.getDateFormatFromTimeStamp = function(dt){
    return moment.unix(dt/1000).format("MM/DD/YYYY HH:mm:ss")    
}

//add time to current timestamp
exports.addTimeToCurrentTimestamp = function(number,timeformat){
    return moment().add(number,timeformat).format("x");
}

//check age whether is 18 or not
exports.getUserAge = function(dob){
    return moment().diff(moment.utc(dob, 'MM/DD/YYYY'), 'years');
}

//set date format to timestamp
exports.setDateFormatToTimeStamp = function(dt){
    return moment(dt,"MM-DD-YYYY h:mm:ss").format("x");
}

//subtract hours from date and convert it to timestamp
exports.subtractHourAndSetDateToTimestamp = function(dt, time){
    return moment(dt,"MM-DD-YYYY h:mm:ss").subtract(time, 'hours').format("x");
}

//Add seconds to date and convert it to timestamp
exports.addSecondsAndSetDateToTimestamp = function(dt, time){
    return moment(dt,"MM-DD-YYYY h:mm:ss").add(time, 'seconds').format("x");
}

//subtract days from date and convert it to timestamp
exports.subtractDaysAndSetDateToTimestamp = function(dt, day){
    return moment(dt,"MM-DD-YYYY h:mm:ss").subtract(day, 'days').format("x");
}

//subtract from date and convert it to timestamp
exports.subtractAndSetDateToTimestamp = function(dt, time, unit){
    return moment(dt,"MM-DD-YYYY h:mm:ss").subtract(time, unit).format("x");
}

// //check Difference between date
// exports.getDaysDifference = function(dt){
//     return moment().diff(moment.utc(dt, "MM-DD-YYYY h:mm:ss", 'UTC'), 'days');
// }

// //check Difference between date
exports.getDaysDifference = function(dt){
    return moment().add(5,'hours').add(30,'minutes').diff(moment.utc(dt, "MM-DD-YYYY h:mm:ss"), 'days');
}

// //check Difference between date in time
exports.getDifferenceInTime = function(dt, time){
    return moment().add(5,'hours').add(30,'minutes').diff(moment.utc(dt, "MM-DD-YYYY h:mm:ss"), time);
}

//check Difference between date
// exports.getSecsDifference = function(dt){
//     return moment().add(5,'hours').add(30,'minutes').diff(moment.utc(dt, "MM-DD-YYYY h:mm:ss"), 'seconds');
// }

//return current timestamp in milli seconds
exports.setTodayDate = function(){
    return moment().format('YYYYMMDD');
}

//return API date and time in to timestamp in milli seconds
exports.setMatchDate = function(dt){
    return moment(dt,"DD.MM.YYYY HH:mm").add(5, 'h').add(30, 'm').format("x");
}

//return todays start time stamp
exports.setTodayStartTimeStamp = function(){
    return moment('00:00:00', 'HH:mm:ss').format("x");
}

//return todays end time stamp
exports.setTodayEndTimeStamp = function(){
    return moment('23:59:59', 'HH:mm:ss').format("x");
}

//return current month start time stamp
exports.setCurrentMonthStartTimeStamp = function(){
    return moment().startOf('month').format("x");
}

//return current month end time stamp
exports.setCurrentMonthEndTimeStamp = function(){
    return moment().endOf('month').format("x");
}

//return current year start time stamp
exports.setCurrentYearStartTimeStamp = function(){
    return moment().startOf('year').format("x");
}

//return current year end time stamp
exports.setCurrentYearEndTimeStamp = function(){
    return moment().endOf('year').format("x");
}


//return previous month start time stamp
exports.setPreviousMonthStartTimeStamp = function(){
    return moment().subtract(1, 'months').startOf('month').format("x");
}

//return previous month end time stamp
exports.setPreviousMonthEndTimeStamp = function(){
    return moment().subtract(1, 'months').endOf('month').format("x");
}

//return previous year start time stamp
exports.setPreviousYearStartTimeStamp = function(){
    return moment().subtract(1, 'years').startOf('year').format("x");
}

//return previous year end time stamp
exports.setPreviousYearEndTimeStamp = function(){
    return moment().subtract(1, 'years').endOf('year').format("x");
}

//set previous 15 days time stamp
exports.setPrevious15DaysTimeStamp = function(){
    return moment().subtract(15, 'days').format("x");
}

