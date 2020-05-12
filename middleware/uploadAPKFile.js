const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');
const multer = require('multer');
const path = require('path');

const constants = require('../config/constants');
const keys = require('../keys/keys');
const Lang = require('../helper/response.helper');

//store for profile image

// var profileStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//     profileImgPath = constants.PATH.APK_PATH;
//      cb(null, profileImgPath)
//     },
//      filename: (req, file, cb) => {
//         if(!file.originalname.match(/\.(apk)$/i)){
//            return cb(new Error(Lang.responseIn("ADMIN.NO_APK_FILE", req.headers.lang)));
//         }
//         var ext = path.extname(file.originalname);
//       cb(null, file.fieldname + ext)
//     },
//     limits: {
//         fileSize: 1000000
//     }
// });
// // var apkUpload = multer({storage: profileStorage}).single('apkFile');
// var apkUpload = multer({storage: profileStorage}).fields([{ name: 'apkFile', maxCount: 1 }])
// module.exports = apkUpload

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
          if(!file.originalname.match(/\.(apk)$/i)){
             return cb(new Error(Lang.responseIn("ADMIN.NO_APK_FILE", req.headers.lang)))
        }
        cb(null,`${constants.URL.APK_URL}/${keys.APK_KEY}${path.extname(file.originalname)}`)
        // cb(null,'files/apk/'+file.fieldname+path.extname(file.originalname))
      }
    })
  })

  var apkUpload = multer(upload).single('apkFile');
  // var apkUpload = multer(upload).fields([{ name: 'apkFile', maxCount: 1 }])

module.exports = apkUpload;