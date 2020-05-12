const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
    },
    productDescription: {
        type: String,
        required: true,
    },
    productPrice: {
        type: Number,
        required: true,
    },
    _tagId : {
		type: Number,
    },
    _subCategoryId : {
        type: mongoose.Schema.Types.ObjectId,
		ref: 'subcategories',
		default: null,
	},
    slug: {
        type: String,
        required: true,
    },
    productImage: {
        type: String,
        default : null
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

module.exports = mongoose.model('products', productSchema);
