const KitImage = require('../../models/kitImage.model');
const Follower = require('../../models/follower.model');
const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const logService = require('../../services/log.service');
const UserKit = require('../../models/userKit.model');
const Lang = require('../../helper/response.helper');
const notificationFunction = require('../../helper/notificationFunction.helper');


//create kit images
exports.addKitImage = async (req, res) => {
  try {
    let reqdata = req.body;
    let kitImage = null;

    // if (req.files['kitImage']) {
    //   kitImage = req.files['kitImage'][0].filename;
    //   imgPath = await commonFunction.generatePath(
    //     constants.PATH.KIT_IMAGE_PATH,
    //     req.files['kitImage'][0].filename
    //   );
    //   await commonFunction.resizeImage(imgPath);
    // }
    let kitImageData = await KitImage.create({
      kitName: reqdata.kitName,
      kitFrontImage: req.files.kitFrontImage[0].filename,
      kitBackImage: req.files.kitBackImage[0].filename,
      kitDescription: reqdata.kitDescription,
      createdBy: req.user._id,
      createdAt: dateFormat.setCurrentTimestamp(),
      updatedAt: dateFormat.setCurrentTimestamp()
    });

    res.status(201).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("KIT.KIT_IMAGE_CREATED_SUCCESS", req.headers.lang),
      error: false,
      data: kitImageData
    });

    logService.responseData(req, kitImageData);
  } catch (error) {
    console.log(error);

    if (req.files['kitImage']) {
      imgPath = await commonFunction.generatePath(
        constants.PATH.KIT_IMAGE_PATH,
        req.files['kitImage'][0].filename
      );
      await commonFunction.removeFile(imgPath);
    }

    res.status(400).send({
      status: constants.STATUS_CODE.FAIL,
      message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
      error: true,
      data: {}
    });

    logService.responseData(req, error);
  }
};

//Get All kit images
exports.getAllKitImages = async (req, res) => {
  try {
  
    const pageOptions = {
      page: parseInt(req.query.page) || constants.PAGE,
      limit: parseInt(req.query.limit) || constants.LIMIT
    }
    var total = await KitImage.countDocuments({});
    var kitImages = await KitImage.find({})
      .skip((pageOptions.page - 1) * pageOptions.limit)
      .limit(pageOptions.limit)
      .collation({ locale: "en" });

    let page = pageOptions.page;
    let limit = pageOptions.limit;

    if (!kitImages.length > 0) {
      return res.status(400).send({
        status: constants.STATUS_CODE.FAIL,
        message: Lang.responseIn("KIT.KIT_IMAGE_NOT_FOUND", req.headers.lang),
        error: true,
        data: {}
      });
    }

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("KIT.KIT_IMAGES_RETRIVE", req.headers.lang),
      error: false,
      data: kitImages, page, limit, total
    });

    // logService.responseData(req, kitImages);
  } catch (error) {
    console.log(error);

    res.status(400).send({
      status: constants.STATUS_CODE.FAIL,
      message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
      error: true,
      data: {}
    });

    // logService.responseData(req, error);
  }
};

//Get kit image
exports.getKitImageById = async (req, res) => {
  try {
    var kitImage = await KitImage.findById(req.params.id);

    if (!kitImage) {
      return res.status(400).send({
        status: constants.STATUS_CODE.FAIL,
        message: Lang.responseIn("KIT.KIT_IMAGE_NOT_FOUND", req.headers.lang),
        error: true,
        data: {}
      });
    }

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("KIT.KIT_IMAGES_RETRIVE", req.headers.lang),
      error: false,
      data: kitImage
    });

    // logService.responseData(req, kitImage);
  } catch (error) {
    console.log(error);

    res.status(400).send({
      status: constants.STATUS_CODE.FAIL,
      message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
      error: true,
      data: {}
    });

    // logService.responseData(req, error);
  }
};

//Delete Kit Image
exports.deleteKitImage = async (req, res) => {
  try {
    let kitImageData = await KitImage.findByIdAndDelete(req.params.id);

    if (!kitImageData) {
      return res.status(400).send({
        status: constants.STATUS_CODE.FAIL,
        message: Lang.responseIn("KIT.KIT_IMAGE_NOT_FOUND", req.headers.lang),
        error: true,
        data: {}
      });
    }

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("KIT.KIT_IMAGES_DELETE_SUCCESS", req.headers.lang),
      error: false,
      data: kitImageData
    });

    logService.responseData(req, kitImageData);
  } catch (error) {
    console.log(error);

    res.status(400).send({
      status: constants.STATUS_CODE.FAIL,
      message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
      error: true,
      data: {}
    });

    logService.responseData(req, error);
  }
};

// CREATE USER KIT
exports.addUserKit = async (req, res) => {
  let kitFrontKey, kitFrontImage, kitBackKey, kitBackImage;
  try {
    let reqdata = req.body;

    if(req.files['kitFrontImage']){
      kitFrontKey = req.files['kitFrontImage'][0].key;
      let fileName = kitFrontKey.split('/');
      kitFrontImage = fileName[fileName.length-1];
    }
    if(req.files['kitBackImage']){
      kitBackKey = req.files['kitBackImage'][0].key;
      let fileName = kitBackKey.split('/');
      kitBackImage = fileName[fileName.length-1];
    }
    
    let userKitExist =  await UserKit.findOne({_userId : req.user._id})
    if(userKitExist){
          if(req.files['kitFrontImage']){
            // let kitFrontImage = await commonFunction.generatePath(constants.PATH.KIT_IMAGE_PATH,req.files['kitFrontImage'][0].filename)
            // await commonFunction.removeFile(kitFrontImage);

            //Remove profile image from s3
            await commonFunction.destroyS3Image(kitFrontKey);
          }
          if(req.files['kitBackImage']){
            // let kitBackImage = await commonFunction.generatePath(constants.PATH.KIT_IMAGE_PATH,req.files['kitBackImage'][0].filename)
            // await commonFunction.removeFile(kitBackImage);

            //Remove profile image from s3
            await commonFunction.destroyS3Image(kitBackKey);
          }

        return res.status(400).send({
          status: constants.STATUS_CODE.FAIL,
          message: Lang.responseIn("USER_KIT.USER_KIT_ALREADY_EXIST", req.headers.lang),
          error: true,
          data: {}
        });
    }

    let userKitData = await UserKit.create({
      kitUserName: reqdata.kitUserName,
      kitLogoPosition : reqdata.kitLogoPosition,
      kitColor: reqdata.kitColor,
      kitFrontImage: kitFrontImage,
      kitBackImage: kitBackImage,
      _userId: req.user._id,
      createdAt: dateFormat.setCurrentTimestamp(),
      updatedAt: dateFormat.setCurrentTimestamp()
    });

    await commonFunction.sendNotificationToFollower(req.user, constants.NOTIFICATION_STATUS.KIT_ADDED)

    // await commonFunction.checkKitImageExist(req, userKitData)
    await commonFunction.generateAWSKitImageURL(userKitData)

    res.status(201).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("USER_KIT.USER_KIT_CREATED_SUCCESS", req.headers.lang),
      error: false,
      data: userKitData
    });



    logService.responseData(req, userKitData);
  } catch (error) {
    console.log(error);

      if(req.files['kitFrontImage']){
        // let kitFrontImage = await commonFunction.generatePath(constants.PATH.KIT_IMAGE_PATH,req.files['kitFrontImage'][0].filename)
        // await commonFunction.removeFile(kitFrontImage);

        //Remove profile image from s3
        await commonFunction.destroyS3Image(kitFrontKey);
      }
      if(req.files['kitBackImage']){
        // let kitBackImage = await commonFunction.generatePath(constants.PATH.KIT_IMAGE_PATH,req.files['kitBackImage'][0].filename)
        // await commonFunction.removeFile(kitBackImage);

        //Remove profile image from s3
        await commonFunction.destroyS3Image(kitBackKey);
      }

    res.status(400).send({
      status: constants.STATUS_CODE.FAIL,
      message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
      error: true,
      data: {}
    });

    logService.responseData(req, error);
  }
};

//Get user kit
exports.getUserKit = async (req, res) => {
  try {
    
    var userKitData = await UserKit.findOne({_userId: req.user._id});

    if (!userKitData) {
      return res.status(400).send({
        status: constants.STATUS_CODE.FAIL,
        message: Lang.responseIn("USER_KIT.USER_KIT_NOT_FOUND", req.headers.lang),
        error: true,
        data: {}
      });
    }

    if(userKitData){
      // await commonFunction.checkKitImageExist(req, userKitData)
      await commonFunction.generateAWSKitImageURL(userKitData)
    }

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("USER_KIT.USER_KIT_RETRIVE", req.headers.lang),
      error: false,
      data: userKitData
    });

    // logService.responseData(req, userKitData);
  } catch (error) {
    console.log(error);

    res.status(400).send({
      status: constants.STATUS_CODE.FAIL,
      message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
      error: true,
      data: {}
    });

    // logService.responseData(req, error);
  }
};

//Update user kit
exports.updateUserKit = async (req, res) => {
  let kitFrontKey, kitFrontImage, kitBackKey, kitBackImage;
  try {
    let reqdata = req.body;
    if(req.files['kitFrontImage']){
      kitFrontKey = req.files['kitFrontImage'][0].key;
      let fileName = kitFrontKey.split('/');
      kitFrontImage = fileName[fileName.length-1];
    }
    if(req.files['kitBackImage']){
      kitBackKey = req.files['kitBackImage'][0].key;
      let fileName = kitBackKey.split('/');
      kitBackImage = fileName[fileName.length-1];
    }
    
    var userKitData = await UserKit.findOne({_userId: req.user._id});

    if (!userKitData) {
      if(req.files['kitFrontImage']){
        // let kitFrontImage = await commonFunction.generatePath(constants.PATH.KIT_IMAGE_PATH,req.files.kitFrontImage[0].filename)
        // await commonFunction.removeFile(kitFrontImage);
  
        //Remove profile image from s3
        await commonFunction.destroyS3Image(kitFrontKey);
      }
      if(req.files['kitBackImage']){
        // let kitBackImage = await commonFunction.generatePath(constants.PATH.KIT_IMAGE_PATH,req.files.kitBackImage[0].filename)
        // await commonFunction.removeFile(kitBackImage);
  
        //Remove profile image from s3
        await commonFunction.destroyS3Image(kitBackKey);
      }
      return res.status(400).send({
        status: constants.STATUS_CODE.FAIL,
        message: Lang.responseIn("USER_KIT.USER_KIT_NOT_FOUND", req.headers.lang),
        error: true,
        data: {}
      });
    }

    let oldKitFrontImage = userKitData.kitFrontImage;
    let oldKitBackImage = userKitData.kitBackImage;


    if(req.files['kitFrontImage']){
      userKitData.kitFrontImage = kitFrontImage;
      // userKitData.kitFrontImage = req.files.kitFrontImage[0].filename;
      // let kitFrontImage = await commonFunction.generatePath(constants.PATH.KIT_IMAGE_PATH,oldKitFrontImage)
      // await commonFunction.removeFile(kitFrontImage);

      //aws s3 image remove function
      let profileImgPath = constants.URL.KIT_IMG_URL+'/'+oldKitFrontImage;
      await commonFunction.destroyS3Image(profileImgPath);
    }
    if(req.files['kitBackImage']){
      userKitData.kitBackImage = kitBackImage;
      // userKitData.kitBackImage = req.files.kitBackImage[0].filename;
      // let kitBackImage = await commonFunction.generatePath(constants.PATH.KIT_IMAGE_PATH,oldKitBackImage)
      // await commonFunction.removeFile(kitBackImage);

      //aws s3 image remove function
      let profileImgPath = constants.URL.KIT_IMG_URL+'/'+oldKitBackImage;
      await commonFunction.destroyS3Image(profileImgPath);
    }

    if(reqdata.kitUserName){
      userKitData.kitUserName = reqdata.kitUserName;
    }

    if(reqdata.kitLogoPosition){
      userKitData.kitLogoPosition = reqdata.kitLogoPosition;
    }

    if(reqdata.kitColor){
      userKitData.kitColor = reqdata.kitColor;
    }
    
    await userKitData.save();

    if(userKitData){
      // await commonFunction.checkKitImageExist(req, userKitData)
      await commonFunction.generateAWSKitImageURL(userKitData)
    }
    await commonFunction.sendNotificationToFollower(req.user, constants.NOTIFICATION_STATUS.KIT_UPDATED)

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("USER_KIT.USER_KIT_UPDATED_SUCCESS", req.headers.lang),
      error: false,
      data: userKitData
    });

    logService.responseData(req, userKitData);
  } catch (error) {
    console.log(error);
    if(req.files['kitFrontImage']){
      // let kitFrontImage = await commonFunction.generatePath(constants.PATH.KIT_IMAGE_PATH,req.files.kitFrontImage[0].filename)
      // await commonFunction.removeFile(kitFrontImage);

      //Remove profile image from s3
      await commonFunction.destroyS3Image(kitFrontKey);
    }
    if(req.files['kitBackImage']){
      // let kitBackImage = await commonFunction.generatePath(constants.PATH.KIT_IMAGE_PATH,req.files.kitBackImage[0].filename)
      // await commonFunction.removeFile(kitBackImage);

      //Remove profile image from s3
      await commonFunction.destroyS3Image(kitBackKey);
    }

    res.status(400).send({
      status: constants.STATUS_CODE.FAIL,
      message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
      error: true,
      data: {}
    });

    logService.responseData(req, error);
  }
};
