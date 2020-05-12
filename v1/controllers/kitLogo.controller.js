const KitLogo = require('../../models/kitLogo.model');
const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');


//create kit images
exports.addKitLogo = async (req, res) => {
  try {
    const { logoName, logoDescription } = req.body;
    let kitLogo = null;

    // if(req.files['kitImage']){
    //     kitImage = req.files['kitImage'][0].filename
    //     imgPath = await commonFunction.generatePath(constants.PATH.KIT_IMAGE_PATH,req.files['kitImage'][0].filename)
    //     await commonFunction.resizeImage(imgPath);
    // }
    let kitLogoData = await KitLogo.create({
      logoName,
      logoDescription,
      logoImage: req.file.filename,
      createdBy: req.user._id,
      createdAt: dateFormat.setCurrentTimestamp(),
      updatedAt: dateFormat.setCurrentTimestamp()
    });

    res.status(201).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("KIT.KIT_LOGO_CREATED_SUCCESS", req.headers.lang),
      error: false,
      data: kitLogoData
    });

    logService.responseData(req, kitLogoData);
  } catch (error) {
    console.log(error);

    if (req.files['kitLogo']) {
      imgPath = await commonFunction.generatePath(
        constants.PATH.KIT_LOGO_PATH,
        req.files['kitLogo'][0].filename
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
exports.getAllKitLogo = async (req, res) => {
  try {

    const pageOptions = {
      page: parseInt(req.query.page) || constants.PAGE,
      limit: parseInt(req.query.limit) || constants.LIMIT
    }
    
    var total = await KitLogo.countDocuments({});
    var kitLogo = await KitLogo.find({})
      .skip((pageOptions.page - 1) * pageOptions.limit)
      .limit(pageOptions.limit)
      .collation({ locale: "en" });

    let page = pageOptions.page;
    let limit = pageOptions.limit;

    if (!kitLogo.length > 0) {
      return res.status(400).send({
        status: constants.STATUS_CODE.FAIL,
        message: Lang.responseIn("KIT.KIT_LOGO_NOT_FOUND", req.headers.lang),
        error: true,
        data: {}
      });
    }

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("KIT.KIT_LOGO_RETRIVE", req.headers.lang),
      error: false,
      data: kitLogo, page, limit, total
    });

    // logService.responseData(req, kitLogo);
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
exports.getKitLogoById = async (req, res) => {
  try {
    var kitLogo = await KitLogo.findById(req.params.id);

    if (!kitLogo) {
      return res.status(400).send({
        status: constants.STATUS_CODE.FAIL,
        message: Lang.responseIn("KIT.KIT_LOGO_NOT_FOUND", req.headers.lang),
        error: true,
        data: {}
      });
    }

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("KIT.KIT_LOGO_RETRIVE", req.headers.lang),
      error: false,
      data: kitLogo
    });

    // logService.responseData(req, kitLogo);
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
exports.deleteKitLogo = async (req, res) => {
  try {
    let kitLogoData = await KitLogo.findByIdAndDelete(req.params.id);

    if (!kitLogoData) {
      return res.status(400).send({
        status: constants.STATUS_CODE.FAIL,
        message: Lang.responseIn("KIT.KIT_LOGO_NOT_FOUND", req.headers.lang),
        error: true,
        data: {}
      });
    }

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("KIT.KIT_LOGO_DELETE_SUCCESS", req.headers.lang),
      error: false,
      data: kitLogoData
    });

    logService.responseData(req, kitLogoData);
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
