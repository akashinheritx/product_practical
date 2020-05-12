const multer = require('multer');
const path = require('path');

const constants = require('../../config/constants');
const Lang = require('../../helper/response.helper');

//store for profile image

var productStorage = multer.diskStorage({
    destination: (req, file, cb) => {
    productImgPath = constants.PATH.PRODUCT_IMG_PATH;
     cb(null, productImgPath)
    },
     filename: (req, file, cb) => {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/i)){
           return cb(new Error(Lang.responseIn("PRODUCT.VALID_IMAGE_FILE", req.headers.lang)));
        }
        var ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + Date.now()+ext)
    },
    limits: {
        fileSize: 1000000
    }
});

var productUpload = multer({storage: productStorage}).single('productImage');
module.exports = productUpload