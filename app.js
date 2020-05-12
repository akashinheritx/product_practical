global.express = require('express');

const app = express();

const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const bodyParser = require('body-parser');
const moment = require('moment');

mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const constants = require('./config/constants');
const keys = require('./keys/keys');
const commonFunction = require('./helper/commonFunction.helper');
const Lang = require('./helper/response.helper');

const port = process.env.PORT || keys.PORT || 2020; // setting port
const env = process.env.ENV || 'development'; //setting environment
const httpsAllow = process.env.HTTPS_ALLOW || keys.HTTPS_ALLOW; //setting https or http server
require('./database/mongoose.js'); // for database connection

//make default folders and copy files to relative folder
require('./services/makeFolders/makeFolders.service');

app.use(cors()); // for allow all request
app.use(bodyParser.urlencoded({ extended: true })); // to support URL-encoded bodies and to remove deprecation warnings
app.use(bodyParser.json()); // to parse body in json
app.use(express.static(path.join(__dirname, 'public'))); // to set public path
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(morgan('dev'));

//BASE_URL configuration
// app.locals.base_url = keys.BASE_URL + ':' + keys.PORT;

//Global BASE_URL
// global.app_base_url = keys.BASE_URL + ':' + keys.PORT;

// version 1
app.use('/api/v1/product', require('./v1/routes/product.route'));
app.get('/', (req, res) => {
  res.send(`
  <html>
  </head>
  <title> Test API </title>
  </head>
  <body>
  <h1 align="center">It works!</h1>
  <p align="center">Welcome to Test Project</p>
  <p align="center">This is the default web page for this server.</p>
  </body>
  </html>
  `)
})

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