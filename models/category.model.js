const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Number
    },
    updatedAt: {
        type: Number
    },
    deletedAt: {
        type: Number,
        default: null
    }
});

module.exports = mongoose.model('categories', categorySchema);
