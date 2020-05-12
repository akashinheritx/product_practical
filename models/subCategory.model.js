const subCategorySchema = new mongoose.Schema({
    subCategoryName: {
        type: String,
        required: true,
    },
    _categoryId : {
        type: mongoose.Schema.Types.ObjectId,
		ref: 'categories',
		default: null,
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

module.exports = mongoose.model('subcategories', subCategorySchema);
