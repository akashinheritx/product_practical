const FAQ = require('../../models/faq.model');
const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const notificationService = require('../../services/notification');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');

// CREATE FAQ
exports.createFAQ = async (req, res) => {
  try {
    let reqdata = req.body;

    const newFaq = new FAQ({
      question: reqdata.question,
      answer: reqdata.answer,
      createdAt: dateFormat.setCurrentTimestamp(),
      updatedAt: dateFormat.setCurrentTimestamp()
    });

    await newFaq.save();

    res.status(201).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("FAQ.FAQ_CREATED_SUCCESS", req.headers.lang),
      error: false,
      data: newFaq
    });

    logService.responseData(req, newFaq);
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

// DELETE FAQ
exports.deleteFAQ = async (req, res) => {
  try {
    const faqID = req.params.id;
    const deletedFAQ = await FAQ.findOneAndDelete({ _id: faqID });

    res.status(201).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("FAQ.FAQ_DELETED_SUCCESS", req.headers.lang),
      error: false,
      data: deletedFAQ
    });

    logService.responseData(req, deletedFAQ);
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

// GET ONE FAQ
exports.getFAQ = async (req, res) => {
  try {
    const faqID = req.params.id;

    const faq = await FAQ.findOne({ _id: faqID });

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("FAQ.FAQ_GET_SUCCESS", req.headers.lang),
      error: false,
      data: faq
    });

    // logService.responseData(req, faq);
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

// EDIT FAQ
exports.editFAQ = async (req, res) => {
  try {
    const faqID = req.params.id;

    const editedFAQ = await FAQ.findOneAndUpdate(
      { _id: faqID },
      { $set: req.body, updatedAt: dateFormat.setCurrentTimestamp() },
      { new: true }
    );

    res.status(201).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("FAQ.FAQ_DELETED_SUCCESS", req.headers.lang),
      error: false,
      data: editedFAQ
    });

    logService.responseData(req, editedFAQ);
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

// GET ALL FAQs
exports.getAllFAQs = async (req, res) => {
  try {
    const sort = {};
    const search = req.query.q ? req.query.q : ''; // for searching

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

    var query = {
      deletedAt: { $eq: null }
    };

    if (search) {
      query.$or = [
        { question: new RegExp(search, 'i') }
        // { 'isActive': new RegExp(search, 'i') }
      ];
    }
    
    const total = await FAQ.countDocuments(query);
    const allFAQs = await FAQ.find(query)
      .sort({[field]: value})
      .skip((pageOptions.page - 1) * pageOptions.limit)
      .limit(pageOptions.limit)
      .collation({ locale: 'en' })

      var page = pageOptions.page;
      var limit = pageOptions.limit;

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("FAQ.FAQ_GET_ALL_SUCCESS", req.headers.lang),
      error: false,
      data: allFAQs, page, limit, total
    });

    // logService.responseData(req, allFAQs);
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
