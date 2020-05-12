const sgMail = require('@sendgrid/mail');

const constants=require('../config/constants');
const keys = require('../keys/development.keys')
const emailTemplate = require('../models/emailTemplate.model');
const commonFunction = require('../helper/commonFunction.helper');
const dynamicTemplate = require('../services/emailTemplate/dynamicContent');
const GlobalGeneralSettings = require('../models/globalGeneralSettings.model');

sgMail.setApiKey(keys.SEND_GRID_API_KEY);

//Set up email service
const sendMail = async (req, data) => {
    try {
        if(!data){
          return false;
          console.log('passed data to send email have not value');
        }

        var templateSlug = data.templateSlug;

        let template = await emailTemplate.findOne({'slug': templateSlug});

        if(!template){
          return false;
          console.log('template not found from the database');
        }
        var replaceObjData = data.data;
        var templateData = template.body;

        let globalGeneralSettings = await GlobalGeneralSettings.findOne();
        console.log();
        let welcomeEmail = globalGeneralSettings.welcomeEmail;
        var body = await commonFunction.replaceStringWithObjectData(templateData, replaceObjData);
        
        var mailContent = dynamicTemplate(req, body);
    
        const msg = {
          to: data.to,
          from: welcomeEmail,
          subject: template.subject,
          html:mailContent
        }

        await sgMail.send(msg);
        return true;
    }
    catch (err) {
        console.log(err);
        
        throw new Error('Email could not be send.');
    }
}

module.exports = sendMail;