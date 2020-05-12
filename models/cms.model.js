const cmsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    slug: {
        type: String
    },
    content: {
        type: String
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

module.exports = mongoose.model('cms', cmsSchema);