FCM = require('fcm-node');
const Notification = require('../models/notification.model');
const dateFormat = require('../helper/dateFormate.helper');
const keys = require('../keys/keys');

// var SERVER_API_KEY = 'AAAAvmffE78:APA91bEM26lzg-PbJ7GMYZwxQhvAA7cZfvpMq-_s_N7JZRFSTjWlkMnBe0QlzbDtBHWLbZ85yUiB-8PF01geeLkvuiaCosj6YQSHuCu8xroKPdkeQ8gHatRQUdq_TtpEZM9tAY4a3BeA';//put your api key here
var SERVER_API_KEY = keys.FCM_SERVER_KEY;//put your api key here
var fcmCli = new FCM(SERVER_API_KEY);

exports.sendNotification = async function (_userId, message, title, token, deviceType, notificationType, _contestId, contestName, _teamId) {
try {
    if(token){
        // Create Payload to send Notification
            var notificationPayload = {
                to: token,
                priority: 'high',
                content_available: true,
                notification: { //notification object
                    title: title, body: message, sound: "default"/*, badge: notificationCount*/
                },
                data: {
                  _userId,
                  deviceType,
                  notificationType,
                  _contestId,
                  contestName,
                  _teamId,
                }
            };

            fcmCli.send(notificationPayload, function(err, response){
                if (err) {
                    console.log(err);
                    console.log("Something has gone wrong!")
                } else {
                    console.log("Successfully sent with response: ", response)
                }
            })
    }
            
} catch (error) {
    throw Error(error);
}
}