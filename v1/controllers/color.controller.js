const Color = require('../../models/color.model');
const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');


exports.addColor = async (req, res, next) => {
  try {
    const reqdata = req.body;

    const newColor = new Color({
      colorName: reqdata.colorName,
      hexCode: reqdata.hexCode,
      createdAt: dateFormat.setCurrentTimestamp(),
      updatedAt: dateFormat.setCurrentTimestamp()
    });

    let colorData = await newColor.save();

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("COLOR.COLOR_ADDED", req.headers.lang),
      error: false,
      data: colorData
    });
    logService.responseData(req, colorData);
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

exports.getColors = async (req, res, next) => {
  try {
      var field, value; 
      if (req.query.sortBy) {
          const parts = req.query.sortBy.split(':');
          field = parts[0];
          parts[1] ==='desc' ? value=-1 : value= 1;
      }else{
        field = "createdAt",
        value = 1;
      }
      const pageOptions = {
      page: parseInt(req.query.page) || constants.PAGE,
      limit: parseInt(req.query.limit) || constants.LIMIT
      };

      const total = await Color.countDocuments();
      const allColors = await Color.find()
        .sort({[field]: value})
        .skip((pageOptions.page - 1) * pageOptions.limit)
        .limit(pageOptions.limit)
        .collation({ locale: 'en' });

      var page = pageOptions.page;
      var limit = pageOptions.limit;

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("COLOR.COLORS_RETRIVE", req.headers.lang),
      error: false,
      data: allColors, page, limit, total
    });
    // logService.responseData(req, allColors);
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
