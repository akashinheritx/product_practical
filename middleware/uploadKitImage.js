const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');
const multer = require('multer');
const path = require('path');

const constants = require('../config/constants');
const keys = require('../keys/keys');
const Lang = require('../helper/response.helper');

// //store for profile image

// var kitImageStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     kitImgPath = constants.PATH.KIT_IMAGE_PATH;
//     cb(null, kitImgPath);
//   },
//   filename: (req, file, cb) => {
//     if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
//       return cb(new Error(Lang.responseIn("USER.VALID_IMAGE_FILE", req.headers.lang)));
//     }
//     var ext = path.extname(file.originalname);
//     cb(null, file.fieldname + '-' + Date.now() + ext);
//   },
//   limits: {
//     fileSize: 1000000
//   }
// });
// var kitImageUpload = multer({ storage: kitImageStorage }).fields([
//   { name: 'kitFrontImage', maxCount: 1 },
//   { name: 'kitBackImage', maxCount: 1 }
// ]);
// module.exports = kitImageUpload;


// upload image to s3 bucket
var s3 = new AWS.S3({
  accessKeyId: keys.AWS_ACCESS_KEY_ID,
  secretAccessKey: keys.AWS_SECRET_ACCESS_KEY_ID,
  region: keys.AWS_REGION 
});


var upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: keys.AWS_BUCKET,
      acl: 'public-read',
      metadata: function (req, file, cb) {
        cb(null, {fieldName: file.fieldname});
      },
      key: function (req, file, cb) {
          if(!file.originalname.match(/\.(jpg|jpeg|png)$/i)){
             return cb(new Error(Lang.responseIn("USER.VALID_IMAGE_FILE", req.headers.lang)))
        }
        cb(null,`${constants.URL.KIT_IMG_URL}/${file.fieldname}-${Date.now().toString()}${path.extname(file.originalname)}`)
        // cb(null,'images/profilePic/'+file.fieldname+'-'+Date.now().toString()+path.extname(file.originalname))
      }
    })
  })

  var kitImageUpload = multer(upload).fields([{ name: 'kitFrontImage', maxCount: 1 }, { name: 'kitBackImage', maxCount: 1 }])

module.exports = kitImageUpload;