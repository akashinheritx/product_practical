const multer = require('multer');
const path = require('path');

const constants = require('../../config/constants');
const Lang = require('../../helper/response.helper');

var fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if(file.fieldname == constants.MULTER_FILE_PATH_FIELD.KIT_IMAGE){
            fileImgPath = constants.PATH.KIT_IMAGE_PATH;
        }
     cb(null, fileImgPath)
    },
     filename: (req, file, cb) => {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/i)){
           return cb(new Error(Lang.responseIn("USER.VALID_IMAGE_FILE", req.headers.lang)));
        }
        var ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + Date.now()+ext)
    },
    limits: {
        fileSize: 1000000
    }
});
// var profileUpload = multer({storage: profileStorage}).single('profilePic');
var imageUpload = multer({storage: fileStorage}).fields(
    [{ 
        name: constants.MULTER_FILE_PATH_FIELD.KIT_IMAGE,
        maxCount: 1
    }])
module.exports = imageUpload