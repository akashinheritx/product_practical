const { google } = require('googleapis');
const request = require('request');

var fcmAdmin = require('firebase-admin');

var serviceAccount = require('../keys/fcmCreds.json');
var token = '';

function getAccessToken() {
  return new Promise(function(resolve, reject) {
    var key = serviceAccount;
    var jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      'https://www.googleapis.com/auth/firebase.messaging'
    );
    jwtClient.authorize(function(err, tokens) {
      if (err) {
        reject(err);
        return;
      }
      // console.log(tokens);
      resolve(tokens.access_token);
    });
  });
}

const sendNotification = async () => {
  try {
    token = await getAccessToken();
    console.log(token);
    await request(
      {
        method: 'POST',
        uri:
          'https://fcm.googleapis.com/v1/projects/day-care-b1955/messages:send',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${token}`,
          'apns-priority': 'high',
          content_available: true
        },
        body: {
          message: {
            token:
              'fFjKvqg-j4w:APA91bETIrFapjlWpmASYV6F3DjGdTVruw_jgfKFAsqEx4pNR_0FAEEi7IEAKdB4VOVqC6tUJY2Q6GgzVhYlLA5nn3KFr5um8wadPp3jfo-ZaH6ulgb6-wWfwYCWdUmP8ACUGiraGV2m',
            notification: {
              body: 'This is an FCM notification message!',
              title: 'FCM Title'
            },
            android: {
              notification: {
                sound: 'default'
              }
            }
          }
        },
        json: true
      },
      async function(error, response, body) {
        if (error) {
          console.log(error);
        }
        console.log(body);
      }
    );
  } catch (error) {
    console.log(errors);
  }
};

sendNotification();
