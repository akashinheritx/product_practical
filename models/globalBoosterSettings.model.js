const globalBoosterSettingsSchema = new mongoose.Schema({
    boosterName: {
        type: String,
    },
    inAppBoosterKey:{
        type: String,
        default: null
    },
    boosterType:{
        type: Number,
    },
    boosterCount:{
        type: Number,
    },
    boosterPrice: {
        type: Number,
    },
    boosterPoint: {
        type: Number,
    },
    requiredIds : {
        type: Number,
    },
    boosetrDetail:{
        type : String,
    },
    boosetrValidity:[
    ],
    createdAt: {
        type: Number
    },
    updatedAt: {
        type: Number
    },
    syncAt: {
        type: Number
    },
    deletedAt: {
        type: Number,
        default: null
    }
});

module.exports = mongoose.model('globalBoosterSettings', globalBoosterSettingsSchema);