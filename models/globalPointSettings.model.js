const globalPointSettingsSchema = new mongoose.Schema({
    actionName:{
        type: String
    },
    actionPoint:{
        type: Number
    },
    actionCount:{
        type: Number
    },
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

module.exports = mongoose.model('globalPointSettings', globalPointSettingsSchema);