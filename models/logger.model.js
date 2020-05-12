var loggerSchema = new mongoose.Schema({
    url: {
        type: String,
        default: null
    },
    orginalUrl: {
        type: String,
        default: null
    },
    method: {
        type: String,
        default: null
    },
    body: {
        type: Object,
        default: null
    },
    response:{
        type:Object,
        default:null
    },
    createdAt: {
        type: Number,
    },
    loggedInUser: {
        type: String,
        default: null
    }
});
module.exports  = mongoose.model('loggers', loggerSchema);