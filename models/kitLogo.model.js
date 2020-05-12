const kitLogoSchema = new mongoose.Schema({
    logoName: {
        type: String,
        default: null
    },
    logoImage: {
        type: String,
        required: true,
    },
    logoDescription: {
        type: String,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
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

module.exports = mongoose.model('kitlogos', kitLogoSchema);