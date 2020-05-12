const twilio = require('twilio');
const keys = require('../keys/keys')

const sendSMS = (number, content) => {

    try{
        isCredentialExist = credentialExist()

        if(!isCredentialExist){
            throw new Error('SMS API Keys is missing');
        }

        var client = new twilio(keys.SMS.TWILIO.ACCOUNT_SID, keys.SMS.TWILIO.AUTH_TOKEN);

        return client.messages.create({
            body: content,
            to: number,  // Text this number
            from: keys.SMS.TWILIO.CALLER_NUMBER // From a valid Twilio number
        })

    }catch(error){
        throw new Error(error);
    }
}

const credentialExist = () => {
    if(!('TWILIO' in keys.SMS)){
        return false
    }

    if(!('ACCOUNT_SID' in keys.SMS.TWILIO) || !('AUTH_TOKEN' in keys.SMS.TWILIO) || !('CALLER_NUMBER' in keys.SMS.TWILIO)){
        return false
    }

    return true
}

module.exports = sendSMS