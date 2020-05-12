var smsSchema = new mongoose.Schema({
    id:{
        type: Number,
    },
    title: {
        type: String,
        default: null,
        trim: true,
    },
    keys:{
        type: String,
        default: null,
        trim: true,
    },
    subject: {
        type: String,
        default: null,
        trim: true,
    },
    body: {
        type: String,
        default: null,
        trim: true,
    },
    status:{
        type:Number,
        default:null
    },
    createdAt: {
        type: Number,
    },
    updatedAt: {
        type: Number,
    },
});
module.exports = mongoose.model('smsTemplates', smsSchema);