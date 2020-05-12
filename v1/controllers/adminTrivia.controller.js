const Trivia = require('../../models/trivia.model');
const PrizeBreakDown = require('../../models/prizeBreakDown.model');
const Question = require('../../models/question.model');
const TriviaAnswer = require('../../models/triviaAnswer.model');
const TriviaWinnerListWithPrizeAmount = require('../../models/triviaWinnerListwithPrizeAmounts.model');
const GlobalGeneralSettings = require('../../models/globalGeneralSettings.model');
const User = require('../../models/user.model');
const EnrollTrivia = require('../../models/enrollTrivia.model');
const WalletHistory = require('../../models/walletHistory.model');

const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const notificationFunction = require('../../helper/notificationFunction.helper');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');

/**
 * Create trivia
 * @function
 * @param {ObjectId} _adminId - .
 * @param {String} title - Title which we want to give to our trivia.
 * @param {Array} questions - It will contain an array of question and it's four answers array.
 * @param {String} startTime - Start time when you want to start your trivia.
 * @param {String} enrollStartTime - Enroll start time when you want to start enrollment for that trivia.
 * @param {String} enrollEndTime - Enroll end time when you want to end enrollment for that trivia. It will be from global general settings. Right now it's set to 1 hour milisec before trivia starttime.
 * @param {Number} entryFee - Entry fee which you want to deduct from your user wallets.
 * @param {Number} maxParticipants - Maximum participant limit of how many users can participant.
 * @param {Number} minParticipants - Minimum participant limit of users participants, So if we have mimimum users for particular trivia we can start that trivia.
 * @param {Number} totalPrize - Total prize that we want distribute among participated users according their ranks.
 * @param {Number} createdAt - Timestamp of trivia creation.
 * @param {Number} updatedAt - Timestamp of trivia update else will set creation time.
 * @param {Array} prizeBreakDown - Prize break down for trivia.
 * @param {Number} from - From which rank.
 * @param {Number} to - To which rank.
 * @param {Number} amount - We want to give an amount between those ranks.
 * @returns {Object} data - Returns trivia data.
 * Will create trivia contest with prize breakdown and question and answers.
 */
exports.createTrivia = async (req, res, next) => {
  try {

    const _adminId = req.user._id
    var currentTimeStamp = parseInt(dateFormat.setCurrentTimestamp());
    var reqdata = req.body

    var questions = req.body.questions;

    var title = (reqdata.title).trim()
        
    var regex = new RegExp('^' + title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
        
    var isTitleExist = await Trivia.findOne({title: {$regex : regex}});

    if(isTitleExist){
      return res.status(400).send({
          status:constants.STATUS_CODE.FAIL,
          message: Lang.responseIn("TRIVIA.TRIVIA_EXSITS", req.headers.lang),
          error:true,
          data:{}
      })
    }

    let diffInDays = (-1 * dateFormat.getDaysDifference(reqdata.startTime));
    var diffInTime = (-1 * dateFormat.getDifferenceInTime(reqdata.startTime, 'hours'));

    console.log(diffInTime, 'diffInTime');
    
    var globalGeneralSettings = await GlobalGeneralSettings.findOne();
        if(!globalGeneralSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message:Lang.responseIn("ADMIN_GENERAL.GLOBAL_GENERAL_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

    var questionCount = questions.length * globalGeneralSettings.triviaAnswerTiming;

    // if(diffInDays>globalGeneralSettings.triviaMaxStartDay || diffInDays<globalGeneralSettings.triviaMinStartDay){
    //     return   res.status(400).send({
    //       status: constants.STATUS_CODE.VALIDATION,
    //       message: Lang.responseIn("TRIVIA.TRIVIA_CREATE_TIME_ERROR", req.headers.lang),
    //       error: true,
    //       data: {},
    //     });
    // }

    if(diffInDays > globalGeneralSettings.triviaMaxStartDay || diffInTime < globalGeneralSettings.triviaMinStartHours){
        return   res.status(400).send({
          status: constants.STATUS_CODE.VALIDATION,
          message: Lang.responseIn("TRIVIA.TRIVIA_CREATE_TIME_ERROR", req.headers.lang),
          error: true,
          data: {},
        });
    }

    var startTime = dateFormat.setDateFormatToTimeStamp(reqdata.startTime);
    var endTime = dateFormat.addSecondsAndSetDateToTimestamp(reqdata.startTime, questionCount);
    
    var enrollStartTime;
    if(reqdata.enrollStartTime){
      enrollStartTime = dateFormat.setDateFormatToTimeStamp(reqdata.enrollStartTime);
          if(startTime < enrollStartTime){
            return   res.status(400).send({
              status: constants.STATUS_CODE.VALIDATION,
              message: Lang.responseIn("TRIVIA.TRIVIA_ENROLL_TIME_ERROR", req.headers.lang),
              error: true,
              data: {},
            });
          }
  
        // var daysLeft = (startTime - enrollStartTime) / constants.ONE_DAY_MILISEC
        var daysLeft = (startTime - enrollStartTime) / globalGeneralSettings.dayInMilisec;
        let hoursLeft = (startTime - enrollStartTime) / globalGeneralSettings.hourInMilisec;
        
        console.log(hoursLeft, 'hoursLeft');
        
        // if(daysLeft>globalGeneralSettings.triviaMaxEnrollStartDay || daysLeft<globalGeneralSettings.triviaMinEnrollStartDay){
      if(daysLeft > globalGeneralSettings.triviaMaxEnrollStartDay || hoursLeft < globalGeneralSettings.triviaMinEnrollStartHours){
          return   res.status(400).send({
            status: constants.STATUS_CODE.VALIDATION,
            message: Lang.responseIn("TRIVIA.TRIVIA_ENROLL_START_TIME_ERROR", req.headers.lang),
            error: true,
            data: {},
          });
      }else if(enrollStartTime < currentTimeStamp){
        return res.status(400).send({
            status: constants.STATUS_CODE.VALIDATION,
            message: Lang.responseIn("TRIVIA.ENROLL_START_TIME_ERROR", req.headers.lang),
            error: true,
            data: {},
      })
    }
    }else{
      enrollStartTime = dateFormat.setCurrentTimestamp();
    }

    if(startTime > endTime){
      return res.status(400).send({
        status: constants.STATUS_CODE.VALIDATION,
        message: Lang.responseIn("TRIVIA.TRIVIA_END_TIME_ERROR", req.headers.lang),
        error: true,
        data: {},
      });
    }
    
    // var totalAssumeCollection = req.body.entryFee * req.body.maxParticipants;
    // var totalPrize = totalAssumeCollection - (totalAssumeCollection * (globalGeneralSettings.triviaAdminCut / 100));

    const newTrivia = new Trivia({
      _adminId,
      title: title,
      startTime : startTime,
      endTime : endTime,
      entryFee: reqdata.entryFee,
      maxParticipants: reqdata.maxParticipants,
      minParticipants: reqdata.minParticipants,
      totalQuestions: questions.length,
      totalPrize: reqdata.totalPrize,
      enrollStartTime : enrollStartTime,
      createdAt: dateFormat.setCurrentTimestamp(),
      updatedAt: dateFormat.setCurrentTimestamp()
    });
    
    // newTrivia.enrollEndTime = dateFormat.subtractHourAndSetDateToTimestamp(reqdata.startTime, globalGeneralSettings.triviaEnrollEndTime);
    newTrivia.enrollEndTime = startTime - globalGeneralSettings.triviaEnrollEndTime;
  
    var triviaData = await newTrivia.save();

    var prizeBreakDown = req.body.prizeBreakDowns;
    for(let k=0;k<prizeBreakDown.length;k++){
      var prizeData = new PrizeBreakDown({
        _triviaId: triviaData._id,
        from:prizeBreakDown[k].from,
        to:prizeBreakDown[k].to,
        amount:prizeBreakDown[k].amount,
        createdAt: dateFormat.setCurrentTimestamp(),
        updatedAt: dateFormat.setCurrentTimestamp()
      })
      var prizeSavedData = await prizeData.save();
    }

    for(let i=0; i<questions.length;i++){
        const newQuestion = new Question({
        _triviaId: triviaData._id,
        question: questions[i].question,
        createdAt: await dateFormat.setCurrentTimestamp(),
        updatedAt: await dateFormat.setCurrentTimestamp()
        })
        var questionData = await newQuestion.save()
        if(questionData){
          var answers = questions[i].answers
          for(let j=0;j<answers.length;j++){
              const triviaAnswer = new TriviaAnswer({
                _triviaId: triviaData._id,
                _questionId: questionData._id,
                answer: answers[j].answer,
                isCorrectAnswer: answers[j].isCorrectAnswer,
                createdAt: await dateFormat.setCurrentTimestamp(),
                updatedAt: await dateFormat.setCurrentTimestamp()
              })

              var triviaAnswerData = await triviaAnswer.save();
          }
        }
    }

      var resData = await Trivia.aggregate([
        { $match : {_id : triviaData._id}},
        {
          $lookup : {
              from: "prizebreakdowns",
              localField: "_id",
              foreignField: "_triviaId",
              as: "prizeBreakDowns"
          }
        },
        {
          $lookup:
              {
                  from: "questions",
                  localField: "_id",
                  foreignField: "_triviaId",
                  as: "questions"
              },
          },
          {  
              $unwind:"$questions"
          },
        {
          $lookup:
              {
                  from: "triviaanswers",
                  localField: "questions._id",
                  foreignField: "_questionId",
                  as: "questions.answers"
              },
          },
          {
              $group : {
                  _id:{
  
                          _id : "$_id",
                          title:"$title",
                          currentParticipants : "$currentParticipants",
                          status : "$status",
                          deletedAt : "$deletedAt",
                          _adminId : "$_adminId",
                          startTime : "$startTime",
                          endTime : "$endTime",
                          entryFee : "$entryFee",
                          maxParticipants : "$maxParticipants",
                          minParticipants : "$minParticipants",
                          totalQuestions : "$totalQuestions",
                          totalPrize : "$totalPrize",
                          createdAt : "$createdAt",
                          updatedAt : "$updatedAt",
                          enrollStartTime : "$enrollStartTime",
                          enrollEndTime : "$enrollEndTime",
                          prizeBreakDowns : "$prizeBreakDowns",
                        
                      },
                      questions: { "$push": {
                              question:"$questions.question",
                              answers :"$questions.answers" }
                              }
                          }
          },
          
      ])
      var data = {}
      data._id = resData[0]._id._id;
      data.title = resData[0]._id.title;
      data.currentParticipants = resData[0]._id.currentParticipants;
      data.status = resData[0]._id.status;
      data.deletedAt = resData[0]._id.deletedAt;
      data._adminId = resData[0]._id._adminId;
      data.startTime = resData[0]._id.startTime;
      data.endTime = resData[0]._id.endTime;
      data.entryFee = resData[0]._id.entryFee;
      data.maxParticipants = resData[0]._id.maxParticipants;
      data.minParticipants = resData[0]._id.minParticipants;
      data.totalQuestions = resData[0]._id.totalQuestions;
      data.totalPrize = resData[0]._id.totalPrize;
      data.createdAt = resData[0]._id.createdAt;
      data.updatedAt = resData[0]._id.updatedAt;
      data.enrollStartTime = resData[0]._id.enrollStartTime;
      data.enrollEndTime = resData[0]._id.enrollEndTime;
      data.prizeBreakDowns = resData[0]._id.prizeBreakDowns;
      data.questions = resData[0].questions;
      
    res.status(201).send({
    status:constants.STATUS_CODE.SUCCESS,
    message: Lang.responseIn("TRIVIA.TRIVIA_CREATE_SUCCESS", req.headers.lang),
    error: false,
    data : data
  });
  logService.responseData(req, data);
  } catch (error) {
    console.log(error);
    res.status(400).send({
      status: constants.STATUS_CODE.FAIL,
      message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
      error: true,
      data: {},
    });
    logService.responseData(req, error);
  }
}

/**
 * Get all trivias
 * @function
 * @returns {Array} allTrivias - Returns all the trivia with pagination.
 */
exports.getAllTrivias = async (req, res, next) => {
  try {
        var field, value; 
        const search = req.query.q ? req.query.q : ''; // for searching
      if (req.query.sortBy) {
          const parts = req.query.sortBy.split(':');
          field = parts[0];
          parts[1] ==='desc' ? value=-1 : value= 1;
      }else{
        field = "startTime",
        value = -1;
      }
      const pageOptions = {
        page: parseInt(req.query.page) || constants.PAGE,
        limit: parseInt(req.query.limit) || constants.LIMIT
      }
      var query = {
        deletedAt: { $eq: null }
      }
      if (search) {
        query.$or = [
              { 'title': new RegExp(search, 'i') }
          ]
      }
      var total = await Trivia.countDocuments(query);
      const allTrivias = await Trivia.aggregate([
       {$match:query},       
      //  {
      //    $lookup:{
      //      from: 'prizebreakdowns',
      //      localField: '_id',
      //      foreignField: '_triviaId',
      //      as: 'prizeBreakDowns',
      //     }
      //   },
        { $addFields: 
          { 
            currentTimeStamp: {$toDouble : dateFormat.setCurrentTimestamp()},
          }
        },
        {$sort:{[field]: value, createdAt : value}},
      ])
      .skip((pageOptions.page - 1) * pageOptions.limit)
      .limit(pageOptions.limit)
      .collation({ locale: "en" });

      var page = pageOptions.page;
      var limit = pageOptions.limit;

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("TRIVIA.TRIVIA_FOUND", req.headers.lang),
      error: false,
      data: allTrivias, page, limit, total
    });
    // logService.responseData(req, allTrivias);
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

/**
 * Get single trivias
 * @function
 * @returns {Object} data - Returns single trivia with prizebreak down and quesions and answers
 */
exports.getTrivia = async (req, res, next) => {
  try {
    const _triviaId = req.params._triviaId;
    const trivia = await Trivia.find({ _id: _triviaId, deletedAt: null });

    if(!trivia){
      return res.status(400).send({
              status: constants.STATUS_CODE.FAIL,
              message: Lang.responseIn("TRIVIA.TRIVIA_NOT_FOUND", req.headers.lang),
              error: true,
              data: {}
            });
    }

    // const questions = await Question.aggregate([
    //   { $match : { _triviaId : mongoose.Types.ObjectId(_triviaId) }  },
    //   {
    //     $lookup:{
    //         from: 'triviaanswers',
    //         localField: '_id',
    //         foreignField: '_questionId',
    //         as: 'answers',        
    //     }
    //   }
    // ])
    
    // data.trivia = trivia;
    // data.questions = questions;

    var resData = await Trivia.aggregate([
      { $match : {_id : mongoose.Types.ObjectId(_triviaId)}},
      {
        $lookup : {
            from: "prizebreakdowns",
            localField: "_id",
            foreignField: "_triviaId",
            as: "prizeBreakDowns"
        }
      },
      {
        $lookup:
            {
                from: "questions",
                localField: "_id",
                foreignField: "_triviaId",
                as: "questions"
            },
        },
        {  
            $unwind:"$questions"
        },
      {
        $lookup:
            {
                from: "triviaanswers",
                localField: "questions._id",
                foreignField: "_questionId",
                as: "questions.answers"
            },
        },
        {
            $group : {
                _id:{

                        _id : "$_id",
                        title:"$title",
                        currentParticipants : "$currentParticipants",
                        status : "$status",
                        deletedAt : "$deletedAt",
                        _adminId : "$_adminId",
                        startTime : "$startTime",
                        endTime : "$endTime",
                        entryFee : "$entryFee",
                        maxParticipants : "$maxParticipants",
                        minParticipants : "$minParticipants",
                        totalQuestions : "$totalQuestions",
                        totalPrize : "$totalPrize",
                        createdAt : "$createdAt",
                        updatedAt : "$updatedAt",
                        enrollStartTime : "$enrollStartTime",
                        enrollEndTime : "$enrollEndTime",
                        prizeBreakDowns : "$prizeBreakDowns",
                      
                    },
                    questions: { "$push": {
                            question:"$questions.question",
                            answers :"$questions.answers" }
                            }
                        }
        },
        
    ])
    var data = {}
    data._id = resData[0]._id._id;
    data.title = resData[0]._id.title;
    data.currentParticipants = resData[0]._id.currentParticipants;
    data.status = resData[0]._id.status;
    data.deletedAt = resData[0]._id.deletedAt;
    data._adminId = resData[0]._id._adminId;
    data.startTime = resData[0]._id.startTime;
    data.endTime = resData[0]._id.endTime;
    data.entryFee = resData[0]._id.entryFee;
    data.maxParticipants = resData[0]._id.maxParticipants;
    data.minParticipants = resData[0]._id.minParticipants;
    data.totalQuestions = resData[0]._id.totalQuestions;
    data.totalPrize = resData[0]._id.totalPrize;
    data.createdAt = resData[0]._id.createdAt;
    data.updatedAt = resData[0]._id.updatedAt;
    data.enrollStartTime = resData[0]._id.enrollStartTime;
    data.enrollEndTime = resData[0]._id.enrollEndTime;
    data.prizeBreakDowns = resData[0]._id.prizeBreakDowns;
    data.questions = resData[0].questions;

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("TRIVIA.TRIVIA_FOUND", req.headers.lang),
      error: false,
      data: data
    });
    // logService.responseData(req, data);
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

/**
 * Update trivia
 * @function
 * @param {ObjectId} _triviaId - .
 * @param {Array} questions - .
 * @param {Array} answers - .
 * @returns {Object} data - Returns trivia data with edited questions and answers.
 * Will remove old questions and answers.
 * Will add new questions and answers.
 */
exports.editTrivia = async (req, res, next) => {
  try {

        var oldQuestions = [];
        var oldAnswers = [];

        const _triviaId = req.params.id;
        var questions = req.body.questions;

        var triviaData = await Trivia.findById(_triviaId)
        if(!triviaData){
            return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("TRIVIA.TRIVIA_NOT_FOUND", req.headers.lang),
                    error: true,
                    data: {}
                  });
        }

        var currentTimeStamp = dateFormat.setCurrentTimestamp();

        if(currentTimeStamp >= triviaData.enrollEndTime){
            return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("TRIVIA.TRIVIA_EDIT_TIME_DONE", req.headers.lang),
                    error: true,
                    data: {}
                  });
        }

        if(triviaData){
          var oldQuestionsData = await Question.find({_triviaId: _triviaId},{_id:1})
          for(let i=0;i<oldQuestionsData.length;i++){
            oldQuestions.push(oldQuestionsData[i]._id)
          }
          var oldAnswersData = await TriviaAnswer.find({_triviaId: _triviaId},{_id:1})
          for(let j=0;j<oldAnswersData.length;j++){
            oldAnswers.push(oldAnswersData[j]._id)
          }
        }

        var globalGeneralSettings = await GlobalGeneralSettings.findOne();

        if(!globalGeneralSettings){
            return res.status(400).send({
                status:constants.STATUS_CODE.FAIL,
                message:Lang.responseIn("ADMIN_GENERAL.GLOBAL_GENERAL_SETTINGS_NOT_FOUND", req.headers.lang),
                error:true,
                data:{}
            })
        }

        triviaData.totalQuestions = questions.length;

        var questionCount = questions.length * globalGeneralSettings.triviaAnswerTiming;
        
        triviaData.endTime = triviaData.startTime + (questionCount * 1000);

        for(let i=0; i<questions.length;i++){
          const newQuestion = new Question({
            _triviaId: triviaData._id,
          question: questions[i].question
          })
          var questionData = await newQuestion.save()
          if(questionData){
            var answers = questions[i].answers
            for(let j=0;j<answers.length;j++){
                const triviaAnswer = new TriviaAnswer({
                  _triviaId: triviaData._id,
                  _questionId: questionData._id,
                  answer: answers[j].answer,
                  isCorrectAnswer: answers[j].isCorrectAnswer
                })

                var triviaAnswerData = await triviaAnswer.save();
            }
          }
      }

        oldQuestionsDeletedData = await Question.deleteMany({_id:{$in:oldQuestions}})
        oldAnswersDeletedData = await TriviaAnswer.deleteMany({_id:{$in:oldAnswers}})
        var editedTriviaData = await triviaData.save();

        var resData = await Trivia.aggregate([
          { $match : {_id : mongoose.Types.ObjectId(_triviaId)}},
          {
            $lookup : {
                from: "prizebreakdowns",
                localField: "_id",
                foreignField: "_triviaId",
                as: "prizeBreakDowns"
            }
          },
          {
            $lookup:
                {
                    from: "questions",
                    localField: "_id",
                    foreignField: "_triviaId",
                    as: "questions"
                },
            },
            {  
                $unwind:"$questions"
            },
          {
            $lookup:
                {
                    from: "triviaanswers",
                    localField: "questions._id",
                    foreignField: "_questionId",
                    as: "questions.answers"
                },
            },
            {
                $group : {
                    _id:{

                            _id : "$_id",
                            title:"$title",
                            currentParticipants : "$currentParticipants",
                            status : "$status",
                            deletedAt : "$deletedAt",
                            _adminId : "$_adminId",
                            startTime : "$startTime",
                            endTime : "$endTime",
                            entryFee : "$entryFee",
                            maxParticipants : "$maxParticipants",
                            minParticipants : "$minParticipants",
                            totalQuestions : "$totalQuestions",
                            totalPrize : "$totalPrize",
                            createdAt : "$createdAt",
                            updatedAt : "$updatedAt",
                            enrollStartTime : "$enrollStartTime",
                            enrollEndTime : "$enrollEndTime",
                            prizeBreakDowns : "$prizeBreakDowns",
                          
                        },
                        questions: { "$push": {
                                question:"$questions.question",
                                answers :"$questions.answers" }
                                }
                            }
            },
            
        ])
        var data = {}
        data._id = resData[0]._id._id;
        data.title = resData[0]._id.title;
        data.currentParticipants = resData[0]._id.currentParticipants;
        data.status = resData[0]._id.status;
        data.deletedAt = resData[0]._id.deletedAt;
        data._adminId = resData[0]._id._adminId;
        data.startTime = resData[0]._id.startTime;
        data.endTime = resData[0]._id.endTime;
        data.entryFee = resData[0]._id.entryFee;
        data.maxParticipants = resData[0]._id.maxParticipants;
        data.minParticipants = resData[0]._id.minParticipants;
        data.totalQuestions = resData[0]._id.totalQuestions;
        data.totalPrize = resData[0]._id.totalPrize;
        data.createdAt = resData[0]._id.createdAt;
        data.updatedAt = resData[0]._id.updatedAt;
        data.enrollStartTime = resData[0]._id.enrollStartTime;
        data.enrollEndTime = resData[0]._id.enrollEndTime;
        data.prizeBreakDowns = resData[0]._id.prizeBreakDowns;
        data.questions = resData[0].questions;

        res.status(200).send({
          status: constants.STATUS_CODE.SUCCESS,
          message: Lang.responseIn("TRIVIA.TRIVIA_UPDATE", req.headers.lang),
          error: false,
          // data: { trivia, questions }
          data: data
        });
        logService.responseData(req, data);
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

/**
 * Get single trivia winner list
 * @function
 * @param {ObjectId} _triviaId - .
 * @returns {Array} triviaWinnerListWithPrizeAmountData - Returns triviaWinnerListWithPrizeAmountData with pagination.
 * Will retrieve winner list for mentioned trivia _id.
 */
exports.getSingleTriviaWinnerList =  async (req, res) => {
  try {
      var _triviaId = req.params._triviaId;
      
      var triviaData = await Trivia.findById(_triviaId)
        if(!triviaData){
            return res.status(400).send({
                    status: constants.STATUS_CODE.FAIL,
                    message: Lang.responseIn("TRIVIA.TRIVIA_NOT_FOUND", req.headers.lang),
                    error: true,
                    data: {}
                  });
        }
      var field, value; 
      const search = req.query.q ? req.query.q : ''; // for searching
      if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        field = parts[0];
        parts[1] ==='desc' ? value=-1 : value= 1;
      }else{
            field = "hasValue",
            value = 1;
      }
      const pageOptions = {
          page: parseInt(req.query.page) || constants.PAGE,
          limit: parseInt(req.query.limit) || constants.LIMIT
      }
      var query = {
          _triviaId: mongoose.Types.ObjectId(_triviaId),
      }
      if (search) {
          query.$or = [
              { 'userName': new RegExp(search, 'i') }
          ]
      }
      let total = await TriviaWinnerListWithPrizeAmount.countDocuments(query);
      let triviaWinnerListWithPrizeAmountData = await TriviaWinnerListWithPrizeAmount.aggregate([
          {$match : query},
          { $addFields: 
              { 
                  hasValue : { $cond: [ { $eq: [ "$rank", null ] }, 2, 1 ] },
              }
          },
      ])
      .sort({[field] : value, rank : value, userName: value})
      .skip((pageOptions.page - 1) * pageOptions.limit)
      .limit(pageOptions.limit)
      .collation({ locale: "en" });
      var page = pageOptions.page ;
      var limit = pageOptions.limit;
      res.status(200).send({
          status: constants.STATUS_CODE.SUCCESS,
          message: Lang.responseIn("GENERAL.WINNER_LIST", req.headers.lang),
          error: false,
          data: {triviaWinnerListWithPrizeAmountData, page, limit, total}
      })
      // logService.responseData(req, {triviaWinnerListWithPrizeAmountData, page, limit, total});
  } catch (error) {
      console.log(error);
      res.status(500).send({
          status:constants.STATUS_CODE.FAIL,
          message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
          error:true,
          data:{}
      })
      // logService.responseData(req, error);
  }
}

/**
 * Cancel trivia
 * @function
 * @param {ObjectId} _triviaId - .
 * @returns {Object} .
 * Will cancel trivia and refund money to users who have participated in it.
 */
exports.cancelTrivia = async (req, res) => {
  try {
    
    let _triviaId = req.params._triviaId;

    let triviaData = await Trivia.findOne({_id : _triviaId, status: {$in : [constants.TRIVIA_STATUS.ENROLL, constants.TRIVIA_STATUS.CONFIRMED]}});

    if(!triviaData){
        return res.status(400).send({
          status: constants.STATUS_CODE.FAIL,
          message: Lang.responseIn("TRIVIA.TRIVIA_NOT_FOUND", req.headers.lang),
          error: true,
          data: {}
        });
    }
    
    let triviaName = triviaData.title;
    let entryFee = triviaData.entryFee;

    let enrollUserData = await EnrollTrivia.find({_triviaId:_triviaId})
    
    for(let l=0;l<enrollUserData.length;l++){
      let userData = await User.findOne({_id: enrollUserData[l]._userId})
    
          //Notification
          if(entryFee > 0){
            await notificationFunction.sendTriviaStatusNotification(userData._id, _triviaId, triviaName, constants.NOTIFICATION_STATUS.CANCELLED_VIA_ADMIN);
            // console.log('notification send for paid trivia');
          }else{
            await notificationFunction.sendTriviaStatusNotification(userData._id, _triviaId, triviaName, constants.NOTIFICATION_STATUS.FREE_CANCELLED_VIA_ADMIN);
            // console.log('notification send for free trivia');
          }

        if(entryFee>0){
          var walletHistoryData = await WalletHistory.findOne({_userId:userData._id, _triviaId: _triviaId})
        
              userData.depositBalance += walletHistoryData.depositWallet;
              userData.referralBalance += walletHistoryData.referralWallet;
              userData.winningBalance += walletHistoryData.winningWallet;

              var updatedData = await userData.save();

              if(updatedData){
                var walletHistoryObj = new WalletHistory({
                  _userId : updatedData._id,
                  _triviaId : _triviaId,
                  triviaName : walletHistoryData.triviaName,
                  depositWallet : walletHistoryData.depositWallet,
                  referralWallet: walletHistoryData.referralWallet,
                  winningWallet: walletHistoryData.winningWallet,
                  amount: walletHistoryData.amount,
                  competitionType : constants.COMPETITION_TYPE.TRIVIA,
                  transactionType : constants.TRANSACTION_TYPE.PLUS,
                  transactionFor : constants.TRANSACTION_FOR.REFUND,
                  createdAt : dateFormat.setCurrentTimestamp(),
                  updatedAt : dateFormat.setCurrentTimestamp()
                })

                await walletHistoryObj.save();
              }
        }
    }
    triviaData.status = constants.TRIVIA_STATUS.CANCELLED;
    await triviaData.save();

    res.status(200).send({
      status: constants.STATUS_CODE.SUCCESS,
      message: Lang.responseIn("TRIVIA.TRIVIA_CANCEL_VIA_ADMIN", req.headers.lang),
      error: false,
      data: triviaData
    });

  } catch (error) {
    console.log(error);
      res.status(500).send({
          status:constants.STATUS_CODE.FAIL,
          message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
          error:true,
          data:{}
      })
  }

}