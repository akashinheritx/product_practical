var http = require('http');
var urlencode = require('urlencode');
const keys = require('../keys/keys');
// var msg = urlencode('hello js');

var username = keys.TEXTLOCAL_USER_NAME; //username is required to register with textlocal

var hash = keys.TEXTLOCAL_HASH_KEY; // you will get a hashcode from textlocal

var sender = keys.TEXTLOCAL_SENDER; //sender is required to register with textlocal
// username=info@businessecosys.com&hash=f4da7aee3f3df520b531ea800f2813c186045acfcb6a7c953721dd051072461b&sender=DRCOWS&numbers=8154993956&message=Dear%20Mooer%2C%20Your%20DearCows%20message%20Dear%20Mooer%2C%20Your%20account%20has%20been%20inactivated.%20Call%20on%201800-300-283-07%20for%20more%20information.
exports.sendMessage = function (toNumber, message) {
   
      try {
        var msg = urlencode(message);
        
        var data = 'username=' + username + '&hash=' + hash + '&sender=' + sender + '&numbers=' + toNumber + '&message=' + msg;
        var options = {
            host: 'api.textlocal.in', path: '/send?' + data
        };
        return new Promise((resolve, reject) => {
            return http.request(options, function (response) {
                var str = '';//another chunk of data has been recieved, so append it to `str`
                response.on('data', function (chunk) {
                    str += chunk;
                });//the whole response has been recieved, so we just print it out here
                response.on('end', function () {
                    let data = JSON.parse(str);

                    if (data.errors) {
                        reject(data);
                    }
                    else {
                        resolve(data);
                    }
                    // return str;
                });
                response.on('error', function () {
                    reject(str);
                    // return str;
                });
            }).end();
        })

    } catch (err) {
        throw Error(err);
    }
}


callback = function (response) {

    var str = '';//another chunk of data has been recieved, so append it to `str`
    response.on('data', function (chunk) {
        str += chunk;
    });//the whole response has been recieved, so we just print it out here
    response.on('end', function () {
        console.log(str);
        return str;
    });
}//console.log('hello js'))
// http.request(options, callback).end();//url encode instalation need to use $ npm install urlencode