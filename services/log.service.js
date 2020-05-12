var Logger = require('../models/logger.model');
const dateFormat = require('../helper/dateFormat.helper');

exports.responseData = async (req,res) => {
    try {
        var log = new Logger({
            url: req.url,
            orginalUrl: req.originalUrl,
            method: req.method,
            body: req.body,
            createdAt: await dateFormat.setCurrentTimestamp(),
            loggedInUser: (req.user) ? req.user._id : null,
            response: res
        });
        await log.save();
    }
    catch (err) {
        console.log(err);
        throw new Error('Something wrong in fetching response');
    }
}