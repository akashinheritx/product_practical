// global.mongoose = require('mongoose');
// mongoose.Promise = global.Promise;

const keys = require('../keys/keys');

//database configuration
mongoose.connect(keys.MONGODB_URI, {useNewUrlParser: true,useCreateIndex: true, useFindAndModify: false});

mongoose.connection.on('connected', function(){
    console.log('Database Connection Established.');
});

mongoose.connection.on('error', function(err){
    console.log('Mongodb connection failed. '+err);
    mongoose.disconnect();
});

mongoose.connection.once('open', function() {
	console.log('MongoDB connection opened!');
});

mongoose.connection.on('reconnected', function () {
	console.log('MongoDB reconnected!');
});

mongoose.connection.on('disconnected', function() {
	console.log('MongoDB disconnected!');
	mongoose.connect(keys.MONGODB_URI, {useNewUrlParser: true,useCreateIndex: true, useFindAndModify: false},/*{server:{auto_reconnect:true}}*/);
});

module.export = mongoose;