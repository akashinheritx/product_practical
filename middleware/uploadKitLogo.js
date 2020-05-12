const multer = require('multer');
const path = require('path');

const constants = require('../config/constants');
const Lang = require('../helper/response.helper');

//store for profile image

var kitLogoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
    kitLogoPath = constants.PATH.KIT_LOGO_PATH;
     cb(null, kitLogoPath)
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
var kitLogoUpload = multer({storage: kitLogoStorage}).single('logoImage');
module.exports = kitLogoUpload