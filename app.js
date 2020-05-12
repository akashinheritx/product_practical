global.express = require('express');

const app = express();

const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const bodyParser = require('body-parser');
var flash = require('connect-flash');
var cookie = require('cookie-session');
const moment = require('moment');

mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const constants = require('./config/constants');
const globalSettings = require('./config/global');
const keys = require('./keys/keys');
const commonMessage = require('./helper/commonMessage.helper');
const commonFunction = require('./helper/commonFunction.helper');
const Lang = require('./helper/response.helper');
const Message = commonMessage.MESSAGE;

const User = require('./models/user.model');
const GlobalPointSettings = require('./models/globalPointSettings.model');
const GlobalGeneralSettings = require('./models/globalGeneralSettings.model');
const GlobalBoosterSettings = require('./models/globalBoosterSettings.model');
const GlobalTeamSettings = require('./models/globalTeamSettings.model');
const Badge = require('./models/badge.model');
const EmailFormat = require('./models/emailTemplate.model');
const Cms = require('./models/cms.model');
const Color = require('./models/color.model');
const FootBallFormation = require('./models/footBallFormation.model');

const UsedPromosBySameDevices = require('./models/usedPromosBySameDevice.model');
const WalletHistory = require('./models/walletHistory.model');
const EnrollTrivia = require('./models/enrollTrivia.model');
const SubmitTriviaAnswer = require('./models/submitTriviaAnswers.model');

const FootBallDFSContest = require('./models/footBallDFSContest.model');
const FootBallPrizeBreakDowns = require('./models/footBallPrizeBreakDown.model');
const UserFootBallTeam = require('./models/userFootBallTeam.model');
const SelectFootBallTeamPlayer = require('./models/selectFootBallTeamPlayer.model');
const EnrollFootBallDFSContest = require('./models/enrollFootBallDFSContest.model');

const FootBallLeagueContest = require('./models/footBallLeagueContest.model');
const FootBallLeaguePrizeBreakDowns = require('./models/footBallLeaguePrizeBreakDown.model');
const UserLeagueFootBallTeam = require('./models/userLeagueFootBallTeam.model');
const SelectLeagueFootBallTeamPlayer = require('./models/selectLeagueFootBallTeamPlayer.model');
const EnrollFootBallLeagueContest = require('./models/enrollFootBallLeagueContest.model');

let globalPoint = async function () {
  let user = await User.findOne({});
  if(!user){
    await User.insertMany(globalSettings.USER);
  }
  let globalPointSettings = await GlobalPointSettings.findOne({});
  if(!globalPointSettings){
    await GlobalPointSettings.insertMany(globalSettings.GLOBAL_POINT_SETTING);
  }
  let globalGeneralSettings = await GlobalGeneralSettings.findOne({});
  if(!globalGeneralSettings){
    await GlobalGeneralSettings.insertMany(globalSettings.GLOBAL_GENERAL_SETTING);
  }
  let globalBoosterSettings = await GlobalBoosterSettings.findOne({});
  if(!globalBoosterSettings){
    await GlobalBoosterSettings.insertMany(globalSettings.GLOBAL_BOOSTER_SETTING);
  }
  let globalTeamSettings = await GlobalTeamSettings.findOne({});
  if(!globalTeamSettings){
    await GlobalTeamSettings.insertMany(globalSettings.GLOBAL_TEAM_SETTINGS);
  }
  let badge = await Badge.findOne({});
  if(!badge){
    await Badge.insertMany(globalSettings.DEFAULT_BADGE);
  }
  let emailTemplates = await EmailFormat.findOne({});
  if(!emailTemplates){
    await EmailFormat.insertMany(globalSettings.EMAIL_TEMPLATES);
  }
  let cmsTemplates = await Cms.findOne({});
  if(!cmsTemplates){
    await Cms.insertMany(globalSettings.CMS_TEMPLATES);
  }
  let colors = await Color.findOne({});
  if(!colors){
    await Color.insertMany(globalSettings.COLORS);
  }
  let footBallFormations = await FootBallFormation.findOne({});
  if(!footBallFormations){
    await FootBallFormation.insertMany(globalSettings.FOOTBALL_FORMATION);
  }

  //Create blank collection in order to use transactions
  await UsedPromosBySameDevices.createCollection();
  await WalletHistory.createCollection();
  await EnrollTrivia.createCollection();
  await SubmitTriviaAnswer.createCollection();

  await FootBallDFSContest.createCollection();
  await FootBallPrizeBreakDowns.createCollection();
  await UserFootBallTeam.createCollection();
  await SelectFootBallTeamPlayer.createCollection();
  await EnrollFootBallDFSContest.createCollection();

  await FootBallLeagueContest.createCollection();
  await FootBallLeaguePrizeBreakDowns.createCollection();
  await UserLeagueFootBallTeam.createCollection();
  await SelectLeagueFootBallTeamPlayer.createCollection();
  await EnrollFootBallLeagueContest.createCollection();
  
}

globalPoint();

const port = process.env.PORT || keys.PORT || 2020; // setting port
const env = process.env.ENV || 'development'; //setting environment
const httpsAllow = process.env.HTTPS_ALLOW || keys.HTTPS_ALLOW; //setting https or http server
const db = require('./database/mongoose.js'); // for database connection

//Cron job start
/*require('./cronJob/triviaStatus.cronJob');
require('./cronJob/generateTriviaWinnerList.cronJob');
require('./cronJob/demo.cronJob');
require('./cronJob/sqaudTeam.cronJob');
require('./cronJob/generateFootBallLeagueSchedule.cronJob');
require('./cronJob/generateISLLeagueSchedule.cronJob');
require('./cronJob/geneateUEFALeagueSchedule.cronJob');
require('./cronJob/dfsStatus.cronJob');
require('./cronJob/dfsH2HClone.cronJob');
require('./cronJob/generateDFSWinnerList.cronJob');
require('./cronJob/matchStatus.cronJob');
// require('./cronJob/leagueStatus.cronJob');
// require('./cronJob/leagueContestStatus.cronJob');
// require('./cronJob/generateWeeklyLeaderBoard.cronJob');
// require('./cronJob/generateLeagueWinnerList.cronJob');
// require('./cronJob/leagueWeekStatus.cronJob');
require('./cronJob/checkTransactionsStatus.cronJob');*/


//make default folders and copy files to relative folder
require('./services/makeFolders/makeFolders.service');

//call function to copy badge image to s3
// commonFunction.copyFilesToBadgeImageInAWSS3();

//call function to copy notification image to s3
// commonFunction.copyFilesToNotificationImageInAWSS3();


app.use(cors()); // for allow all request
app.use(bodyParser.urlencoded({ extended: true })); // to support URL-encoded bodies and to remove deprecation warnings
app.use(bodyParser.json()); // to parse body in json
app.use(express.static(path.join(__dirname, 'public'))); // to set public path
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(morgan('dev'));
app.use(flash());

app.use(
  cookie({
    // Cookie config, take a look at the docs...
    secret: 'I Love India...',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  })
);

//BASE_URL configuration
// app.locals.base_url = keys.BASE_URL + ':' + keys.PORT;

//Global BASE_URL
// global.app_base_url = keys.BASE_URL + ':' + keys.PORT;

// version 1
app.use('/api/v1/admin', require('./v1/routes/admin.route'));
app.use('/api/v1/sub-admin', require('./v1/routes/subAdmin.route'));
app.use('/api/v1/accountant', require('./v1/routes/accountant.route'));
app.use('/api/v1/user', require('./v1/routes/user.route'));
app.use('/api/v1/demo', require('./v1/routes/demo.route'));
app.use('/api/v1/email', require('./v1/routes/emailTemplate.route'));
app.use('/api/v1/sms', require('./v1/routes/smsTemplate.route'));
app.use('/api/v1/social', require('./v1/routes/social.route'));
app.use('/api/v1/version', require('./v1/routes/version.route'));
app.use('/api/v1/cashfree', require('./v1/routes/cashFreePayOut.route'));
app.use('/api/v1/kit', require('./v1/routes/kit.route'));
app.use('/api/v1/faq', require('./v1/routes/faq.route'));
app.use('/api/v1/country-code', require('./services/countryCode.service'));
app.use('/api/v1/state', require('./services/stateNames.service'));
app.use('/api/v1/colors', require('./v1/routes/color.route'));
app.use('/api/v1/soccer', require('./v1/routes/soccer.route'));
app.get('/', (req, res) => {
  res.send(`
  <html>
  </head>
  <title> Twelfthman Sports </title>
  </head>
  <body>
  <h1 align="center">It works!</h1>
  <p align="center">Welcome to TwelfthMan Sports</p>
  <p align="center">This is the default web page for this server.</p>
  </body>
  </html>
  `)
})

// Version 2
// app.use('/api/v2/admin', require('./v2/routes/admin.route'));
// app.use('/api/v2/sub-admin', require('./v2/routes/subAdmin.route'));
// app.use('/api/v2/accountant', require('./v2/routes/accountant.route'));
// app.use('/api/v2/user', require('./v2/routes/user.route'));
// app.use('/api/v2/demo', require('./v2/routes/demo.route'));
// app.use('/api/v2/email', require('./v2/routes/emailTemplate.route'));
// app.use('/api/v2/sms', require('./v2/routes/smsTemplate.route'));
// app.use('/api/v2/social', require('./v2/routes/social.route'));
// app.use('/api/v2/version', require('./v2/routes/version.route'));
// app.use('/api/v2/cashfree', require('./v2/routes/cashFreePayOut.route'));
// app.use('/api/v2/kit', require('./v2/routes/kit.route'));
// app.use('/api/v2/faq', require('./v2/routes/faq.route'));
// app.use('/api/v2/country-code', require('./services/countryCode.service'));
// app.use('/api/v2/state', require('./services/stateNames.service'));
// app.use('/api/v2/colors', require('./v2/routes/color.route'));
// app.use('/api/v2/soccer', require('./v2/routes/soccer.route'));

//catch 404 and forward to error handler
app.use(function(req, res, next) {
  // console.log(req.header.lang);
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

//setting for error message in environment
if (env == 'development') {
  app.use((err, req, res, next) => {
    console.log(err);
    res.status(err.status || 500).send({
      status:constants.STATUS_CODE.FAIL,
      message: err.message,
      error: true,
      e: err
    });
  });
} else {
  // production error handler
  // no stacktraces leaked to user
  app.use((err, req, res, next) => {
    console.log(err);
    res.status(err.status || 500).send({
      message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
      error: true,
      e: null
    });
  });
}

if (httpsAllow) {
    
    //Global BASE_URL
    global.app_base_url = keys.BASE_URL;
    http.createServer(app).listen(port, () => {
      console.log(
        `Server started with https on ${env} envrionment on port ${port}`
      );
    });
} else {
    //Global BASE_URL
    global.app_base_url = keys.BASE_URL + ':' + keys.PORT;
    http.createServer(app).listen(port, () => {
      console.log(
        `Server started with http on ${env} envrionment on port ${port}`
      );
    });

  /*app.listen(port,()=>{
        console.log(`Server is listening on port ${port} with ${env} environment`);
    });*/
}

exports = module.exports = app;