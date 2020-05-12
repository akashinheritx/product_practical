const gameSchema = new mongoose.Schema({
    gameName: {
        type: String,
        required: true,
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

module.exports = mongoose.model('games', gameSchema);